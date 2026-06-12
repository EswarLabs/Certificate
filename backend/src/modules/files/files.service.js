import { prisma } from "../../lib/prisma.js";
import cloudinary from "../../lib/cloudinary.js";

// Check workspace membership
const checkWorkspaceMembership = async (orgId, workspaceId, userId) => {
  const membership = await prisma.membership.findFirst({
    where: { userId, workspaceId, organizationId: orgId },
  });
  if (!membership) {
    throw new Error("User is not a member of the workspace");
  }
  return membership;
};

// List files in a workspace
export const listFiles = async (orgId, workspaceId, userId, filters = {}) => {
  await checkWorkspaceMembership(orgId, workspaceId, userId);

  const { page = 1, limit = 10 } = filters;
  const skip = (page - 1) * limit;

  const whereClause = {
    workspaceId,
  };

  const files = await prisma.file.findMany({
    where: whereClause,
    skip,
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      uploadedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  const total = await prisma.file.count({ where: whereClause });

  return {
    success: true,
    page,
    limit,
    total,
    files,
  };
};

// Get details of a single file
export const getFileDetails = async (orgId, workspaceId, fileId, userId) => {
  await checkWorkspaceMembership(orgId, workspaceId, userId);

  const file = await prisma.file.findFirst({
    where: { id: fileId, workspaceId },
    include: {
      uploadedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  if (!file) {
    throw new Error("File not found");
  }

  return file;
};

// Delete a file
export const deleteFile = async (orgId, workspaceId, fileId, userId) => {
  const membership = await checkWorkspaceMembership(orgId, workspaceId, userId);

  if (membership.role === "VIEWER" || membership.role === "MEMBER") {
    throw new Error("User does not have permission to delete files in this workspace");
  }

  const file = await prisma.file.findFirst({
    where: { id: fileId, workspaceId },
  });

  if (!file) {
    throw new Error("File not found");
  }

  // Delete from Cloudinary if key exists
  if (file.storageKey) {
    try {
      await cloudinary.uploader.destroy(file.storageKey);
    } catch (cloudinaryErr) {
      console.error(`Failed to delete file from Cloudinary (${file.storageKey}):`, cloudinaryErr);
    }
  }

  // Delete from Database
  await prisma.file.delete({
    where: { id: fileId },
  });

  return {
    success: true,
    message: "File deleted successfully",
  };
};
