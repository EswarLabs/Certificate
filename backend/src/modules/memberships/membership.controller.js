import {
  addMemberToOrganization,
  listOrganizationMembers,
  updateMemberRole,
  removeMember,
  getMemberById,
} from "./membership.service.js";
import { addMemberSchema, updateMemberRoleSchema } from "./membership.validation.js";

export const addMemberController = async (req, res) => {
  try {
    const { organizationId } = req.params;
    const userId = req.user.userId;
    const { newUserId, workspaceId, role } = req.body;

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
    console.error("Error adding member:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
};

export const listMembersController = async (req, res) => {
  try {
    const { organizationId } = req.params;
    const userId = req.user.userId;
    const query = req.query;

    const result = await listOrganizationMembers(
      organizationId,
      userId,
      query
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error listing members:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
};

export const getMemberController = async (req, res) => {
  try {
    const { organizationId, memberId } = req.params;
    const userId = req.user.userId;

    const membership = await getMemberById(
      organizationId,
      memberId,
      userId
    );

    return res.status(200).json({
      success: true,
      membership,
    });
  } catch (error) {
    console.error("Error fetching member:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
};

export const updateMemberRoleController = async (req, res) => {
  try {
    const { organizationId, memberId } = req.params;
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

    const updated = await updateMemberRole(
      organizationId,
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
    console.error("Error updating member role:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
};

export const removeMemberController = async (req, res) => {
  try {
    const { organizationId, memberId } = req.params;
    const userId = req.user.userId;

    const result = await removeMember(organizationId, memberId, userId);

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error removing member:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
};
