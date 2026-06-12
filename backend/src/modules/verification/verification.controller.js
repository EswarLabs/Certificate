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
          },
        },
      },
    });

    if (!credential || credential.status === "draft") {
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
