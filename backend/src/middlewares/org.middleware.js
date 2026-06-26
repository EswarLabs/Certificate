import { prisma } from "../lib/prisma.js";

/**
 * Organization Middleware
 * 
 * Validates that the authenticated user is a member of the specified organization.
 * Sets req.org (organization record) and req.orgMembership (first matching membership).
 * 
 * Must be used AFTER authMiddleware.
 * Expects req.params.organizationId to be present.
 */
export const orgMiddleware = async (req, res, next) => {
  try {
    const { organizationId } = req.params;
    const userId = req.user?.userId;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: "Organization ID is required",
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Fetch organization and verify user has at least one membership in it
    const membership = await prisma.membership.findFirst({
      where: { organizationId, userId },
      include: {
        organization: true,
      },
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: "Access denied — you are not a member of this organization",
      });
    }

    // Attach org context to the request for downstream handlers
    req.org = membership.organization;
    req.orgMembership = membership;

    next();
  } catch (error) {
    next(error);
  }
};
