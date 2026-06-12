import nodemailer from "nodemailer";
import { prisma } from "../../lib/prisma.js";

// Factory to get Nodemailer transporter
export const getTransporter = async (workspaceId) => {
  // If running in test environment, use JSON transport for mocking
  if (process.env.NODE_ENV === "test") {
    return nodemailer.createTransport({ jsonTransport: true });
  }

  // Fetch workspace SMTP settings
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  });

  if (workspace && workspace.smtpEnabled && workspace.smtpSettings) {
    const settings = workspace.smtpSettings;
    const secure = settings.port === 465 || settings.secure === true;
    return nodemailer.createTransport({
      host: settings.host,
      port: parseInt(settings.port) || 587,
      secure,
      auth: {
        user: settings.username || settings.user,
        pass: settings.password || settings.pass,
      },
    });
  }

  // Fallback to system-wide default SMTP
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT) || 587;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (smtpHost && smtpUser && smtpPass) {
    return nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
  }

  // Fallback to mock transport if no configuration is present
  console.warn("No SMTP settings configured, using mock jsonTransport fallback");
  return nodemailer.createTransport({ jsonTransport: true });
};

// Send certificate notification email
export const sendCredentialEmail = async (credentialId, userId) => {
  // Fetch credential details
  const credential = await prisma.credential.findUnique({
    where: { id: credentialId },
    include: {
      template: true,
      workspace: true,
    },
  });

  if (!credential) {
    throw new Error("Credential not found");
  }

  // Check workspace membership
  const membership = await prisma.membership.findFirst({
    where: {
      userId,
      workspaceId: credential.workspaceId,
      organizationId: credential.organizationId,
    },
  });
  if (!membership) {
    throw new Error("User is not a member of the workspace");
  }
  if (membership.role === "VIEWER") {
    throw new Error("User does not have permission to send emails");
  }

  if (!credential.recipientEmail) {
    throw new Error("Credential recipient has no email address configured");
  }

  // Generate Email Log as "pending"
  const emailLog = await prisma.emailLog.create({
    data: {
      credentialId: credential.id,
      recipientEmail: credential.recipientEmail,
      status: "pending",
    },
  });

  const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

  // Build the email template content
  let emailHtml = credential.template.htmlTemplate || "<div class='certificate'>Certificate of Achievement</div>";
  const cssStyles = credential.template.cssStyles || "";

  // Combine HTML and CSS into a email body
  let fullHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        ${cssStyles}
        body { font-family: sans-serif; margin: 0; padding: 20px; }
        .verification-info { margin-top: 30px; padding: 15px; border-top: 1px solid #eee; font-size: 14px; }
      </style>
    </head>
    <body>
      ${emailHtml}
      
      <div class="verification-info">
        <p>This certificate is cryptographically verifiable.</p>
        <p>Verification Link: <a class="verify-link" href="${frontendUrl}/verify/${credential.verificationCode}">Verify Authenticity</a></p>
        <p>Verification Code: <strong>${credential.verificationCode}</strong></p>
      </div>
    </body>
    </html>
  `;

  // Dynamic variable replacement (recipientName, recipientEmail, verificationCode, and credentialData keys)
  const replacements = {
    recipientName: credential.recipientName,
    recipientEmail: credential.recipientEmail,
    verificationCode: credential.verificationCode,
    ...(typeof credential.credentialData === "object" ? credential.credentialData : {}),
  };

  for (const [key, value] of Object.entries(replacements)) {
    const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "g");
    fullHtml = fullHtml.replace(regex, value !== null && value !== undefined ? String(value) : "");
  }

  // Click Tracking link rewriting
  const rewriteUrl = (originalUrl) => {
    if (originalUrl.startsWith("http://") || originalUrl.startsWith("https://")) {
      return `${backendUrl}/api/email/track/click/${emailLog.id}?url=${encodeURIComponent(originalUrl)}`;
    }
    return originalUrl;
  };
  fullHtml = fullHtml.replace(/href="([^"]+)"/g, (match, p1) => `href="${rewriteUrl(p1)}"`);

  // Open Tracking Pixel injection (1x1 transparent image)
  const trackingPixel = `<img src="${backendUrl}/api/email/track/open/${emailLog.id}" width="1" height="1" alt="" style="display:none;" />`;
  fullHtml += trackingPixel;

  try {
    const transporter = await getTransporter(credential.workspaceId);

    // Determine the sender address (from)
    let fromEmail = "no-reply@eswarlabs.com";
    const workspace = await prisma.workspace.findUnique({
      where: { id: credential.workspaceId },
    });
    if (workspace && workspace.smtpEnabled && workspace.smtpSettings) {
      const settings = workspace.smtpSettings;
      if (settings.from) {
        fromEmail = settings.from;
      } else if (settings.username && settings.username.includes("@")) {
        fromEmail = settings.username;
      } else if (settings.user && settings.user.includes("@")) {
        fromEmail = settings.user;
      }
    } else {
      if (process.env.SMTP_FROM) {
        fromEmail = process.env.SMTP_FROM;
      } else if (process.env.SMTP_USER && process.env.SMTP_USER.includes("@")) {
        fromEmail = process.env.SMTP_USER;
      }
    }

    const mailOptions = {
      from: `"EswarLabs Certificates" <${fromEmail}>`,
      to: credential.recipientEmail,
      subject: `Your Certificate of Achievement - ${credential.recipientName}`,
      html: fullHtml,
    };

    const info = await transporter.sendMail(mailOptions);

    // Update log
    const providerMessageId = info.messageId || (info.message && info.message.messageId) || "mock-msg-id";
    await prisma.emailLog.update({
      where: { id: emailLog.id },
      data: {
        status: "sent",
        providerMessageId,
      },
    });

    // Log Event
    await prisma.credentialEvent.create({
      data: {
        credentialId: credential.id,
        eventType: "email_sent",
        metadata: { emailLogId: emailLog.id },
      },
    });

    return { success: true, emailLogId: emailLog.id };
  } catch (error) {
    console.error("Failed to send credential email:", error);
    await prisma.emailLog.update({
      where: { id: emailLog.id },
      data: {
        status: "failed",
        bounceReason: error.message,
      },
    });
    throw error;
  }
};

// Track Open Event
export const trackOpen = async (logId) => {
  const log = await prisma.emailLog.findUnique({
    where: { id: logId },
  });

  if (!log) return;

  if (!log.openedAt) {
    await prisma.emailLog.update({
      where: { id: logId },
      data: {
        status: "opened",
        openedAt: new Date(),
      },
    });

    // Log Event
    await prisma.credentialEvent.create({
      data: {
        credentialId: log.credentialId,
        eventType: "email_open",
        metadata: { emailLogId: logId },
      },
    });
  }
};

// Track Click Event
export const trackClick = async (logId) => {
  const log = await prisma.emailLog.findUnique({
    where: { id: logId },
  });

  if (!log) return;

  if (!log.clickedAt) {
    await prisma.emailLog.update({
      where: { id: logId },
      data: {
        clickedAt: new Date(),
      },
    });

    // Log Event
    await prisma.credentialEvent.create({
      data: {
        credentialId: log.credentialId,
        eventType: "email_click",
        metadata: { emailLogId: logId },
      },
    });
  }
};

// Get Email Logs for Workspace
export const getEmailLogs = async (orgId, workspaceId, userId, filters = {}) => {
  const { page = 1, limit = 10 } = filters;

  // Check workspace membership
  const membership = await prisma.membership.findFirst({
    where: { userId, workspaceId, organizationId: orgId },
  });
  if (!membership) {
    throw new Error("User is not a member of the workspace");
  }

  const logs = await prisma.emailLog.findMany({
    where: {
      credential: {
        workspaceId,
      },
    },
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      credential: {
        select: {
          recipientName: true,
          verificationCode: true,
        },
      },
    },
  });

  const total = await prisma.emailLog.count({
    where: {
      credential: {
        workspaceId,
      },
    },
  });

  return {
    success: true,
    page,
    limit,
    total,
    logs,
  };
};
