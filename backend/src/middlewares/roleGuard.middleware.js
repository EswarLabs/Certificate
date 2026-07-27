/**
 * Role Guard Middleware Factory
 * 
 * Returns a middleware that checks if the current user's workspace role
 * (set by workspaceMiddleware) is in the list of allowed roles.
 * 
 * Usage:
 *   router.post("/", roleGuard("OWNER", "ADMIN", "EDITOR"), handler);
 *   router.delete("/:id", roleGuard("OWNER", "ADMIN"), handler);
 * 
 * Must be used AFTER workspaceMiddleware (which sets req.membership.role).
 */
export const roleGuard = (...allowedRoles) => {
  return (req, res, next) => {
    const role = req.membership?.role || req.orgMembership?.role;

    if (!role) {
      return res.status(403).json({
        success: false,
        message: "Membership context is missing — ensure org or workspace middleware runs first",
      });
    }

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({
        success: false,
        message: `Insufficient permissions. This action requires one of: ${allowedRoles.join(", ")}`,
      });
    }

    next();
  };
};
