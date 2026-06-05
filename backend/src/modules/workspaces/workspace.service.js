import { prisma } from "../../lib/prisma.js";
import { slugify } from "../../utils/slugify.js";
import { uploadFile as uploadServiceFile } from "../upload/upload.service.js";

export const createWorkspace = async (name, organizationId, userId) => {
  const slug = slugify(name, organizationId);
  const result = await prisma.$transaction(
    async (tx) => {
      const workspace = await tx.workspace.create({
        data: {
          name,
          organizationId,
          slug,
        },
      });
      const membership = await tx.membership.create({
        data: {
          userId,
          organizationId,
          workspaceId: workspace.id,
          role: "OWNER",
        },
      });
      return { workspace, membership };
    },
    {
      maxWait: 10000, // max 10s to wait to acquire transaction
      timeout: 20000, // transaction times out after 20s
    },
  );
  return result;
};

export const listWorkspaces = async (organizationId, userId, query = {}) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;
  const workspaces = await prisma.workspace.findMany({
    skip,
    take: limit,
    where: {
      organizationId,
      memberships: {
        some: { userId },
      },
    },
    orderBy: { name: "asc" },
  });
  return workspaces;
};

export const listWorkspaceById = async (workspaceId, userId) => {
  const workspace = await prisma.workspace.findFirst({
    where: {
      id: workspaceId,
      memberships: {
        some: { userId },
      },
    },
  });
  return workspace;
};

export const updateWorkspace = async (workspaceId, userId, data) => {
  // ensure user is a member of the workspace
  const membership = await prisma.membership.findFirst({
    where: { workspaceId, userId },
  });
  if (!membership) {
    throw new Error("Workspace not found or access denied");
  }

  const updated = await prisma.workspace.update({
    where: { id: workspaceId },
    data: {
      name: data.name || undefined,
      slug: data.name ? slugify(data.name, workspaceId) : undefined,
      brandingSettings: data.brandingSettings || undefined,
      customDomain: data.customDomain || undefined,
      smtpEnabled: typeof data.smtpEnabled === 'boolean' ? data.smtpEnabled : undefined,
      smtpSettings: data.smtpSettings || undefined,
      updatedAt: new Date(),
    },
  });
  return updated;
};

export const deleteWorkspace = async (workspaceId, userId) => {
  // Only allow owners to delete a workspace
  const membership = await prisma.membership.findFirst({
    where: { workspaceId, userId, role: "OWNER" },
  });
  if (!membership) {
    throw new Error("Workspace not found or access denied");
  }
  const workspace = await prisma.workspace.delete({ where: { id: workspaceId } });
  return workspace;
};

export const uploadFile = async (workspaceId, userId, file) => {
  // ensure user is a member of the workspace
  const membership = await prisma.membership.findFirst({
    where: { workspaceId, userId },
  });
  if (!membership) {
    throw new Error("Workspace not found or access denied");
  }

  const result = await uploadServiceFile(file);

  const created = await prisma.file.create({
    data: {
      workspaceId,
      uploadedById: userId,
      fileName: file.originalname,
      mimeType: file.mimetype,
      fileSize: BigInt(file.size || 0),
      storageKey: result.public_id,
      publicUrl: result.secure_url,
    },
  });
  return created;
};