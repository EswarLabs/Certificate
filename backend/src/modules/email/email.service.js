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

  const courseTitle = replacements.courseTitle || null;

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

    const mailOptions = {
      from: `"EswarLabs Certificates" <${fromEmail}>`,
      to: credential.recipientEmail,
      subject: `Your Certificate of Achievement - ${credential.recipientName}`,
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
  // ✅ FIX: Only rewrite <a href="..."> tags — not style blocks or src attributes
  const rewriteUrl = (url) => {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return `${backendUrl}/api/email/track/click/${emailLogId}?url=${encodeURIComponent(url)}`;
    }
    return url;
  };

  const trackedVerificationUrl = rewriteUrl(verificationUrl);

  // ✅ FIX: courseTitle block is conditionally rendered, not silently "Completion"
  const courseTitleBlock = courseTitle
    ? `
      <p style="font-size: 15px; line-height: 1.5; color: #475569;">
        We are pleased to inform you that your certificate for <strong>${courseTitle}</strong> has been successfully issued and verified.
      </p>
      <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase; font-weight: bold; letter-spacing: 1px; margin-bottom: 6px;">Course</div>
      <div style="font-size: 16px; font-weight: bold; color: #1e3a8a;">${courseTitle}</div>
    `
    : `
      <p style="font-size: 15px; line-height: 1.5; color: #475569;">
        We are pleased to inform you that your certificate has been successfully issued and verified.
      </p>
    `;

  const certImageBlock = credential.imageUrl
    ? `<img src="${credential.imageUrl}" alt="Certificate Preview" style="max-width: 100%; height: auto; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); margin: 30px 0;" />`
    : `<div class="cert-preview-card">
        <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase; font-weight: bold; letter-spacing: 1px; margin-bottom: 8px;">Certificate Recipient</div>
        <div style="font-size: 22px; font-weight: bold; color: #1e293b; margin-bottom: 20px;">${credential.recipientName}</div>
      </div>`;

  const pdfDownloadBlock = credential.pdfUrl
    ? `<div style="margin-top: 15px;"><a href="${rewriteUrl(credential.pdfUrl)}" target="_blank" style="color: #3b82f6; text-decoration: none; font-weight: bold; font-size: 15px;">📥 Download PDF Certificate</a></div>`
    : '';

  // Open tracking pixel appended at the end (after all href rewrites are already done inline)
  const trackingPixel = `<img src="${backendUrl}/api/email/track/open/${emailLogId}" width="1" height="1" alt="" style="display:none;" />`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 40px 20px; background: #f8fafc; color: #1e293b; }
        .email-container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
        .email-header { background: #1e3a8a; padding: 30px; text-align: center; color: #ffffff; }
        .email-body { padding: 40px 30px; text-align: center; }
        .cert-preview-card { margin: 30px 0; padding: 30px; border: 2px dashed #cbd5e1; border-radius: 8px; background: #f8fafc; text-align: center; }
        .btn-view { display: inline-block; background-color: #3b82f6; color: #ffffff !important; text-decoration: none; padding: 14px 28px; font-weight: bold; border-radius: 6px; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(59,130,246,0.2); }
        .verification-info { background: #f1f5f9; padding: 20px; border-radius: 8px; font-size: 13px; color: #64748b; text-align: left; }
        .info-row { margin: 8px 0; display: flex; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <h2 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 1px;">CERTIFICATE DELIVERED</h2>
        </div>
        <div class="email-body">
          <p style="font-size: 16px; margin-top: 0; color: #475569;">Hello <strong>${credential.recipientName}</strong>,</p>

          ${courseTitleBlock}

          ${certImageBlock}

          <div style="margin: 35px 0;">
            <a class="btn-view" href="${trackedVerificationUrl}" target="_blank">View Certificate &amp; Credentials</a>
            ${pdfDownloadBlock}
          </div>

          <div class="verification-info">
            <h4 style="margin: 0 0 10px 0; color: #334155; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Verification Record</h4>
            <div class="info-row"><strong>Code:</strong> <span style="font-family: monospace; color: #1e293b; font-weight: bold;">${credential.verificationCode}</span></div>
            <div class="info-row"><strong>Issued On:</strong> <span style="color: #1e293b;">${replacements.issuedAt || new Date().toLocaleDateString()}</span></div>
            <div class="info-row"><strong>Status:</strong> <span style="color: #16a34a; font-weight: bold;">VERIFIED</span></div>
          </div>
        </div>
      </div>
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