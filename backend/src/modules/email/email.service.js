import { Resend } from "resend";
import nodemailer from "nodemailer";
import dns from "dns";
import { prisma } from "../../lib/prisma.js";
import { renderEditorDataToHtml } from "../../utils/renderEditorData.js";
import { emailQueue } from "../../queues/email.queue.js";

// ─── Shared Helper: Send Email with Selected Provider ─────────────────────────

export const sendMailWithProvider = async ({ provider = "resend", apiKey, fromEmail, to, subject, html }) => {
  if (!to || !apiKey || !fromEmail) {
    throw new Error("Missing required email configuration fields (apiKey, fromEmail, or recipient)");
  }

  const fromString = `"EswarLabs Certificates" <${fromEmail}>`;

  if (provider === "resend") {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: fromString,
      to,
      subject,
      html,
    });
    if (error) throw new Error(error.message || "Resend API error");
    return { providerMessageId: data?.id || "resend-msg-id" };
  }

  // Gmail, Zoho, Outlook — use nodemailer SMTP
  if (["gmail", "zoho", "outlook"].includes(provider)) {
    const smtpConfigs = {
      gmail:   { host: "smtp.gmail.com",      port: 587, secure: false },
      zoho:    { host: "smtp.zoho.com",       port: 587, secure: false },
      outlook: { host: "smtp.office365.com",  port: 587, secure: false },
    };
    const cfg = smtpConfigs[provider];
    const transporter = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      auth: { user: fromEmail, pass: apiKey },
    });
    const info = await transporter.sendMail({
      from: fromString,
      to,
      subject,
      html,
    });
    return { providerMessageId: info.messageId || "smtp-msg-id" };
  }

  // SendGrid — use nodemailer with SendGrid SMTP relay
  if (provider === "sendgrid") {
    const transporter = nodemailer.createTransport({
      host: "smtp.sendgrid.net",
      port: 587,
      secure: false,
      auth: { user: "apikey", pass: apiKey },
    });
    const info = await transporter.sendMail({
      from: fromString,
      to,
      subject,
      html,
    });
    return { providerMessageId: info.messageId || "sendgrid-msg-id" };
  }

  // Amazon SES — use nodemailer with SES SMTP
  if (provider === "ses") {
    const transporter = nodemailer.createTransport({
      host: "email-smtp.us-east-1.amazonaws.com",
      port: 587,
      secure: false,
      auth: { user: fromEmail, pass: apiKey },
    });
    const info = await transporter.sendMail({
      from: fromString,
      to,
      subject,
      html,
    });
    return { providerMessageId: info.messageId || "ses-msg-id" };
  }

  throw new Error(`Unsupported provider: ${provider}`);
};

// ─── Send Test Email ─────────────────────────────────────────────────────────

export const sendTestEmail = async (workspaceId, userId, { to, provider, apiKey, fromEmail }) => {
  // Auth check
  const membership = await prisma.membership.findFirst({
    where: { workspaceId, userId },
  });
  if (!membership) throw new Error("Access denied");
  if (membership.role === "VIEWER") throw new Error("Viewers cannot send test emails");

  if (!to || !apiKey || !fromEmail || !provider) {
    throw new Error("Missing required fields: to, provider, apiKey, fromEmail");
  }

  const subject = "✅ Test Email from EswarLabs Certificates";
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; background: #10b981; color: white; width: 48px; height: 48px; border-radius: 50%; line-height: 48px; font-size: 24px;">✓</div>
      </div>
      <h2 style="text-align: center; color: #111; margin: 0 0 8px;">Email Configuration Working!</h2>
      <p style="text-align: center; color: #666; font-size: 14px; margin: 0 0 24px;">
        Your <strong>${provider}</strong> email setup is correctly configured.
      </p>
      <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; font-size: 13px; color: #555;">
        <p style="margin: 0 0 6px;"><strong>From:</strong> ${fromEmail}</p>
        <p style="margin: 0 0 6px;"><strong>Provider:</strong> ${provider}</p>
        <p style="margin: 0;"><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
      </div>
      <p style="text-align: center; color: #999; font-size: 12px; margin-top: 24px;">
        This is a test email from EswarLabs Certificates.
      </p>
    </div>
  `;

  try {
    const { providerMessageId } = await sendMailWithProvider({
      provider,
      apiKey,
      fromEmail,
      to,
      subject,
      html,
    });
    return { success: true, messageId: providerMessageId };
  } catch (error) {
    console.error(`[TEST EMAIL] Failed for provider=${provider}:`, error.message);
    throw error;
  }
};

// ─── Factory: get Resend Client (Backwards compatibility) ─────────────────────

export const getResendClient = async (workspaceId) => {
  if (process.env.NODE_ENV === "test") {
    return { resend: null, fromEmail: "test@mock.com" };
  }

  const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });

  if (workspace?.smtpEnabled && workspace?.smtpSettings) {
    const s = workspace.smtpSettings;
    const apiKey = s.apiKey;
    
    if (!apiKey) {
      const err = new Error("Email Key is missing in Workspace Settings.");
      err.code = "SMTP_NOT_CONFIGURED";
      throw err;
    }

    const resend = new Resend(apiKey);
    let fromEmail = s.fromEmail || "no-reply@eswarlabs.com";
    return { resend, fromEmail };
  }

  if (process.env.NODE_ENV !== "test") {
    const err = new Error(
      "Workspace Email settings are not configured."
    );
    err.code = "SMTP_NOT_CONFIGURED";
    throw err;
  }

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
    const workspace = await prisma.workspace.findUnique({
      where: { id: credential.workspaceId },
    });

    let providerMessageId = "mock-msg-id";

    if (!workspace?.smtpEnabled || !workspace?.smtpSettings) {
      if (process.env.NODE_ENV === "test") {
        console.warn("No Email settings configured (TEST MODE)");
      } else {
        const err = new Error(
          "Workspace Email settings are not configured. You must configure Email settings in Workspace Settings before sending emails."
        );
        err.code = "SMTP_NOT_CONFIGURED";
        throw err;
      }
    } else {
      const s = workspace.smtpSettings;
      const apiKey = s.apiKey;
      const fromEmail = s.fromEmail;
      const provider = s.provider || "resend";

      if (!apiKey || !fromEmail) {
        const err = new Error("Email configuration is incomplete (missing API Key / Password or From Email).");
        err.code = "SMTP_NOT_CONFIGURED";
        throw err;
      }

      const subjectTitle = courseTitle ? `your certificate for ${courseTitle}` : "your certificate";
      const subject = `${credential.recipientName}, ${subjectTitle} is ready`;

      console.log(`[EMAIL] Sending credential email via provider=${provider} to ${credential.recipientEmail}`);

      const sendRes = await sendMailWithProvider({
        provider,
        apiKey,
        fromEmail,
        to: credential.recipientEmail,
        subject,
        html: fullHtml,
      });

      providerMessageId = sendRes.providerMessageId;
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