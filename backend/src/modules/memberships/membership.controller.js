import {
  addMemberToOrganization,
  listWorkspaceMembers,
  updateMemberRole,
  removeMember,
  getMemberById,
} from "./membership.service.js";
import { addMemberSchema, updateMemberRoleSchema } from "./membership.validation.js";

export const addMemberController = async (req, res, next) => {
  try {
    const { organizationId, workspaceId } = req.params;
    const userId = req.user.userId;
    const { newUserId, role } = req.body;

    // Validate input
    const parsed = addMemberSchema.safeParse({
      userId: newUserId,
      role: role || "MEMBER",
      workspaceId,
    });

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid input",
        details: parsed.error.issues,
      });
    }

    const membership = await addMemberToOrganization(
      organizationId,
      userId,
      newUserId,
      workspaceId,
      role || "MEMBER"
    );

    return res.status(201).json({
      success: true,
      message: "Member added successfully",
      membership,
    });
  } catch (error) {
    next(error);
  }
};

export const listMembersController = async (req, res, next) => {
  try {
    const { organizationId, workspaceId } = req.params;
    const userId = req.user.userId;
    const query = req.query;

    const result = await listWorkspaceMembers(
      organizationId,
      workspaceId,
      userId,
      query
    );

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getMemberController = async (req, res, next) => {
  try {
    const { organizationId, workspaceId, memberId } = req.params;
    const userId = req.user.userId;

    const membership = await getMemberById(
      organizationId,
      workspaceId,
      memberId,
      userId
    );

    return res.status(200).json({
      success: true,
      membership,
    });
  } catch (error) {
    next(error);
  }
};

export const updateMemberRoleController = async (req, res, next) => {
  try {
    const { organizationId, memberId, workspaceId } = req.params;
    const userId = req.user.userId;
    const { role } = req.body;

    // Validate input
    const parsed = updateMemberRoleSchema.safeParse({ role });

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid input",
        details: parsed.error.issues,
      });
    }
    const membership = await getMemberById(organizationId, workspaceId, memberId, userId);
    if (!membership) {
      return res.status(404).json({
        success: false,
        error: "Member not found",
      });
    }
    if (membership.userId === memberId) {
      return res.status(403).json({
        success: false,
        error: "Cannot update your own role",
      });
    }

    if (membership.role === "OWNER" && req.user.userId !== memberId) {
      return res.status(403).json({
        success: false,
        error: "Cannot update the role of an organization owner",
      });
    }
    const updated = await updateMemberRole(
      organizationId,
      workspaceId,
      memberId,
      userId,
      role
    );

    return res.status(200).json({
      success: true,
      message: "Member role updated successfully",
      membership: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const removeMemberController = async (req, res, next) => {
  try {
    const { organizationId, memberId, workspaceId } = req.params;
    const userId = req.user.userId;

    const result = await removeMember(organizationId, workspaceId, memberId, userId);

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
