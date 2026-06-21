import { Resend } from "resend";
import dns from "dns";
import { prisma } from "../../lib/prisma.js";
import { renderEditorDataToHtml } from "../../utils/renderEditorData.js";
import { emailQueue } from "../../queues/email.queue.js";

// ─── Factory: get Resend Client ──────────────────────────────────────────────

export const getResendClient = async (workspaceId) => {
  if (process.env.NODE_ENV === "test") {
    return { resend: null, fromEmail: "test@mock.com" };
  }

  const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });

  // Workspace-level custom SMTP (now Resend API)
  if (workspace?.smtpEnabled && workspace?.smtpSettings) {
    const s = workspace.smtpSettings;
    const apiKey = s.apiKey;
    
    if (!apiKey) {
      throw new Error("Resend API Key is missing in Workspace Settings");
    }

    const resend = new Resend(apiKey);

    // Resolve fromEmail from workspace settings
    let fromEmail = s.fromEmail || "no-reply@eswarlabs.com";

    return { resend, fromEmail };
  }

  if (process.env.NODE_ENV !== "test") {
    throw new Error("Workspace Email settings are not configured. You must configure Resend API settings in your Workspace Settings before sending emails.");
  }

  // Mock fallback for tests
  console.warn("No Email settings configured (TEST MODE)");
  return {
    resend: null,
    fromEmail: "no-reply@eswarlabs.com",
  };
};

// ─── Send certificate notification email ─────────────────────────────────────

export const sendCredentialEmail = async (credentialId, userId) => {
  // ✅ FIX: Auth check before fetching sensitive credential data
  const credentialMeta = await prisma.credential.findUnique({
    where: { id: credentialId },
    select: { workspaceId: true, organizationId: true },
  });

  if (!credentialMeta) throw new Error("Credential not found");

  const membership = await prisma.membership.findFirst({
    where: {
      userId,
      workspaceId: credentialMeta.workspaceId,
      organizationId: credentialMeta.organizationId,
    },
  });

  if (!membership) throw new Error("User is not a member of the workspace");
  if (membership.role === "VIEWER") throw new Error("User does not have permission to send emails");

  // Now safe to fetch full credential
  const credential = await prisma.credential.findUnique({
    where: { id: credentialId },
    include: { template: true, workspace: true },
  });

  if (!credential.recipientEmail) {
    throw new Error("Credential recipient has no email address configured");
  }

  // ✅ FIX: Guard against missing template or editorData
  if (!credential.template) {
    throw new Error("No template associated with this credential");
  }
  if (!credential.template.editorData) {
    throw new Error("Template has no editor data to render");
  }

  // Create email log as QUEUED
  const emailLog = await prisma.emailLog.create({
    data: {
      credentialId: credential.id,
      recipientEmail: credential.recipientEmail,
      status: "QUEUED",
    },
  });

  const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const verificationUrl = `${frontendUrl}/verify/${credential.verificationCode}`;

  const issuedDateStr = credential.issuedAt
    ? new Date(credential.issuedAt).toLocaleDateString()
    : "";

  const replacements = {
    recipientName: credential.recipientName,
    recipient_name: credential.recipientName,
    recipientEmail: credential.recipientEmail,
    recipient_email: credential.recipientEmail,
    verificationCode: credential.verificationCode,
    verification_code: credential.verificationCode,
    verificationUrl,
    verification_url: verificationUrl,
    issuedAt: issuedDateStr,
    issuedDate: issuedDateStr,
    issued_date: issuedDateStr,
    "issued date": issuedDateStr,
    ...(typeof credential.credentialData === "object" ? credential.credentialData : {}),
  };

  // Render certificate HTML
  renderEditorDataToHtml(credential.template.editorData, replacements);

  // Ensure courseTitle is correctly null if empty, undefined, or 'undefined'
  let courseTitle = replacements.courseTitle || replacements["course title"] || null;
  if (courseTitle === "undefined" || courseTitle === "null" || (typeof courseTitle === 'string' && courseTitle.trim() === "")) {
    courseTitle = null;
  }

  const fullHtml = buildEmailHtml({
    credential,
    replacements,
    verificationUrl,
    backendUrl,
    emailLogId: emailLog.id,
    courseTitle,
  });

  try {
    const { resend, fromEmail } = await getResendClient(credential.workspaceId);

    const subjectTitle = courseTitle ? `your certificate for ${courseTitle}` : "your certificate";

    const mailOptions = {
      from: `"EswarLabs Certificates" <${fromEmail}>`,
      to: credential.recipientEmail,
      subject: `${credential.recipientName}, ${subjectTitle} is ready`,
      html: fullHtml,
    };

    console.log(`[RESEND] Attempting to send email via Resend API to ${credential.recipientEmail}`);

    let providerMessageId = "mock-msg-id";

    if (resend) {
      const { data, error } = await resend.emails.send(mailOptions);
      if (error) {
        throw new Error(error.message || "Failed to send email via Resend API");
      }
      providerMessageId = data.id;
    }

    await prisma.emailLog.update({
      where: { id: emailLog.id },
      data: { status: "SENT", providerMessageId },
    });

    await prisma.credentialEvent.create({
      data: {
        credentialId: credential.id,
        eventType: "EMAILED",
        metadata: { emailLogId: emailLog.id },
      },
    });

    return { success: true, emailLogId: emailLog.id };
  } catch (error) {
    console.error("Failed to send credential email:", error);
    await prisma.emailLog.update({
      where: { id: emailLog.id },
      data: { status: "FAILED", bounceReason: error.message },
    });
    throw error;
  }
};

// ─── Build email HTML (extracted for clarity) ────────────────────────────────

function buildEmailHtml({ credential, replacements, verificationUrl, backendUrl, emailLogId, courseTitle }) {
  const rewriteUrl = (url) => {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return `${backendUrl}/api/email/track/click/${emailLogId}?url=${encodeURIComponent(url)}`;
    }
    return url;
  };

  const trackedVerificationUrl = rewriteUrl(verificationUrl);

  const courseInfo = courseTitle
    ? `your certificate for <strong>${courseTitle}</strong>`
    : `your certificate`;

  const certImageBlock = credential.imageUrl
    ? `<div style="margin: 20px 0;"><img src="${credential.imageUrl}" alt="Certificate Preview" style="max-width: 600px; width: 100%; height: auto; border: 1px solid #ddd; border-radius: 4px;" /></div>`
    : ``;

  // Skip tracking for the PDF URL to prevent download issues on mobile devices (redirects can break downloads)
  const pdfLink = credential.pdfUrl
    ? `<p><a href="${credential.pdfUrl}" target="_blank" style="color: #0056b3; text-decoration: underline;">Download PDF Version</a></p>`
    : '';

  const trackingPixel = `<img src="${backendUrl}/api/email/track/open/${emailLogId}" width="1" height="1" alt="" style="display:none;" />`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;">
      <p>Hi ${credential.recipientName},</p>

      <p>We're writing to let you know that ${courseInfo} has been issued and is now ready for you to view.</p>

      ${certImageBlock}

      <p>To view your official, verifiable certificate, please click the link below:<br>
      <a href="${trackedVerificationUrl}" target="_blank" style="color: #0056b3; font-weight: bold; text-decoration: underline;">View Your Certificate</a></p>

      ${pdfLink}

      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666;">
        <p style="margin: 0 0 10px 0;"><strong>Verification Details:</strong></p>
        <p style="margin: 0;">Code: ${credential.verificationCode}<br>
        Issued On: ${replacements.issuedAt || new Date().toLocaleDateString()}</p>
      </div>

      <p style="margin-top: 30px;">Congratulations!<br>
      The EswarLabs Team</p>

      ${trackingPixel}
    </body>
    </html>
  `;
}

// ─── Track Open Event ─────────────────────────────────────────────────────────

export const trackOpen = async (logId) => {
  const log = await prisma.emailLog.findUnique({ where: { id: logId } });
  if (!log || log.openedAt) return;

  await prisma.emailLog.update({
    where: { id: logId },
    data: { status: "OPENED", openedAt: new Date() },
  });

  await prisma.credentialEvent.create({
    data: {
      credentialId: log.credentialId,
      eventType: "OPENED",
      metadata: { emailLogId: logId },
    },
  });
};

// ─── Track Click Event ────────────────────────────────────────────────────────

export const trackClick = async (logId) => {
  const log = await prisma.emailLog.findUnique({ where: { id: logId } });
  if (!log || log.clickedAt) return;

  await prisma.emailLog.update({
    where: { id: logId },
    data: { clickedAt: new Date() },
  });

  await prisma.credentialEvent.create({
    data: {
      credentialId: log.credentialId,
      eventType: "VERIFIED",
      metadata: { emailLogId: logId },
    },
  });
};

// ─── Get Email Logs for Workspace ─────────────────────────────────────────────

export const getEmailLogs = async (orgId, workspaceId, userId, filters = {}) => {
  const { page = 1, limit = 10 } = filters;

  const membership = await prisma.membership.findFirst({
    where: { userId, workspaceId, organizationId: orgId },
  });
  if (!membership) throw new Error("User is not a member of the workspace");

  const whereClause = {
    credential: {
      workspaceId,
      organizationId: orgId,
    },
  };

  const [logs, total] = await Promise.all([
    prisma.emailLog.findMany({
      where: whereClause,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        credential: {
          select: { recipientName: true, verificationCode: true },
        },
      },
    }),
    prisma.emailLog.count({ where: whereClause }),
  ]);

  return { success: true, page, limit, total, logs };
};