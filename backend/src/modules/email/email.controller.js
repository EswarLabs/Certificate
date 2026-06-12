import {
  sendCredentialEmail,
  getEmailLogs,
  trackOpen,
  trackClick,
} from "./email.service.js";

// Serve transparent 1x1 GIF for open tracking
const TRANSPARENT_GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

export const sendVerificationEmailController = async (req, res, next) => {
  try {
    const { credentialId } = req.body;
    const userId = req.user.userId;

    if (!credentialId) {
      return res.status(400).json({
        success: false,
        message: "Credential ID is required",
      });
    }

    const result = await sendCredentialEmail(credentialId, userId);
    res.status(200).json({
      success: true,
      message: "Verification email sent successfully",
      logId: result.emailLogId,
    });
  } catch (error) {
    next(error);
  }
};

export const getEmailLogsController = async (req, res, next) => {
  try {
    const orgId = req.params.organizationId;
    const workspaceId = req.params.workspaceId;
    const userId = req.user.userId;
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;

    const result = await getEmailLogs(orgId, workspaceId, userId, { limit, page });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const trackOpenController = async (req, res, next) => {
  try {
    const { logId } = req.params;
    await trackOpen(logId);

    res.writeHead(200, {
      "Content-Type": "image/gif",
      "Content-Length": TRANSPARENT_GIF.length,
      "Cache-Control": "no-store, no-cache, must-revalidate, private, max-age=0",
      "Pragma": "no-cache",
      "Expires": "0",
    });
    res.end(TRANSPARENT_GIF);
  } catch (error) {
    console.error("Open tracking error:", error);
    // Even if tracking fails, serve the transparent pixel so mail client behaves normally
    res.writeHead(200, {
      "Content-Type": "image/gif",
      "Content-Length": TRANSPARENT_GIF.length,
    });
    res.end(TRANSPARENT_GIF);
  }
};

export const trackClickController = async (req, res, next) => {
  try {
    const { logId } = req.params;
    const { url } = req.query;

    await trackClick(logId);

    if (url) {
      const decodedUrl = decodeURIComponent(url);
      try {
        const parsedUrl = new URL(decodedUrl);
        const allowedOrigins = [
          process.env.FRONTEND_URL,
          process.env.BACKEND_URL,
        ].filter(Boolean).map(u => new URL(u).origin);

        if (allowedOrigins.includes(parsedUrl.origin) || process.env.NODE_ENV === "test") {
          return res.redirect(decodedUrl);
        }
      } catch {
        // URL parsing failed — fall through to default redirect
      }
    }

    // Default fallback redirect
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(frontendUrl);
  } catch (error) {
    console.error("Click tracking error:", error);
    // On error, redirect to safe fallback only
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(frontendUrl);
  }
};
