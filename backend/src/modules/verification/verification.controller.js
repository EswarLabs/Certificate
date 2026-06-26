import { prisma } from "../../lib/prisma.js";

export const verifyCredentialController = async (req, res, next) => {
  try {
    const { verificationCode } = req.params;

    const credential = await prisma.credential.findUnique({
      where: { verificationCode },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            description: true,
            editorData: true,
            orientation: true,
          },
        },
        workspace: {
          select: {
            id: true,
            name: true,
            customDomain: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            isVerified: true,
            verifiedDomain: true,
            verifiedAt: true,
          },
        },
      },
    });

    if (!credential || credential.status === "DRAFT") {
      return res.status(404).json({
        success: false,
        message: "Credential not found or not issued yet",
      });
    }

    res.status(200).json({
      success: true,
      status: credential.status,
      credential,
    });
  } catch (error) {
    next(error);
  }
};

// Only OPENED and VERIFIED events can be tracked from the public endpoint.
// CREATED, ISSUED, EMAILED, REVOKED, EXPIRED are server-side only events
// that must never be injectable from the public internet.
const PUBLIC_EVENT_TYPES = ["OPENED", "VERIFIED"];

export const trackEventController = async (req, res, next) => {
  try {
    const credentialId = req.params.credId;
    const { eventType, ipAddress, userAgent, metadata } = req.body;

    if (!eventType) {
      return res.status(400).json({
        success: false,
        message: "Event type is required",
      });
    }

    if (!PUBLIC_EVENT_TYPES.includes(eventType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid event type. Public tracking only allows: ${PUBLIC_EVENT_TYPES.join(", ")}`,
      });
    }

    // Check if credential exists
    const credential = await prisma.credential.findUnique({
      where: { id: credentialId },
    });

    if (!credential) {
      return res.status(404).json({
        success: false,
        message: "Credential not found",
      });
    }

    const event = await prisma.credentialEvent.create({
      data: {
        credentialId,
        eventType,
        ipAddress: ipAddress || req.ip || null,
        userAgent: userAgent || req.headers["user-agent"] || null,
        metadata: metadata || null,
      },
    });

    res.status(201).json({
      success: true,
      event,
    });
  } catch (error) {
    next(error);
  }
};
