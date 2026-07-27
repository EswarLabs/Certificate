import { prisma } from "../lib/prisma.js";

/**
 * Workspace Middleware
 * 
 * Validates that:
 * 1. The specified workspace exists and belongs to the organization (req.org).
 * 2. The authenticated user has a membership in this specific workspace.
 * 
 * Sets req.workspace and req.membership (workspace-scoped membership with role).
 * 
 * Must be used AFTER authMiddleware AND orgMiddleware.
 * Expects req.params.workspaceId and req.org to be present.
 */
export const workspaceMiddleware = async (req, res, next) => {
  try {
    const workspaceId = req.params.workspaceId || req.params.id;
    const orgId = req.org?.id || req.params.organizationId;
    const userId = req.user?.userId;

    if (!workspaceId) {
      return res.status(400).json({
        success: false,
        message: "Workspace ID is required",
      });
    }

    if (!orgId) {
      return res.status(500).json({
        success: false,
        message: "Organization context is missing — ensure orgMiddleware runs first",
      });
    }

    // Verify workspace belongs to the organization
    const workspace = await prisma.workspace.findFirst({
      where: { id: workspaceId, organizationId: orgId },
    });

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: "Workspace not found in this organization",
      });
    }

    // Verify the user has a membership scoped to this workspace
    let membership = await prisma.membership.findFirst({
      where: { userId, workspaceId, organizationId: orgId },
    });

    // Fallback to org-level membership if available
    if (!membership && req.orgMembership) {
      membership = req.orgMembership;
    }

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: "Access denied — you are not a member of this workspace",
      });
    }

    // Attach workspace context and workspace-scoped role to the request
    req.workspace = workspace;
    req.membership = membership;

    next();
  } catch (error) {
    next(error);
  }
};
