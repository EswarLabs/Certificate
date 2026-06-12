import { prisma } from "../../lib/prisma.js";
import { slugify } from "../../utils/slugify.js";
import { uploadFile as uploadServiceFile } from "../upload/upload.service.js";
import { createWorkspaceSchema } from "./workspace.validation.js";

export const createWorkspace = async (name, organizationId, userId) => {
  const parsed = createWorkspaceSchema.safeParse({ name });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Invalid workspace name");
  }
  const slug = slugify(name, organizationId);
  const membership = await prisma.membership.findFirst({
    where: {
      userId,
      organizationId,
      role: { in: ["OWNER", "ADMIN"] },
    }
  });
  if (!membership) {
    throw new Error("User is not a member of the organization");
  }
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
      maxWait: 10000, 
      timeout: 20000, 
    },
  );
  return result;
};

export const listWorkspaces = async (organizationId, userId, query = {}) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;
  const where = {
    organizationId,
    memberships: {
      some: { userId },
    },
  };
  const workspaces = await prisma.workspace.findMany({
    skip,
    take: limit,
    where,
    orderBy: { name: "asc" },
  });
  const total = await prisma.workspace.count({ where });
  return {
    success: true,
    page,
    limit,
    total,
    workspaces,
  };
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

  if (data.name !== undefined) {
    const parsed = createWorkspaceSchema.safeParse({ name: data.name });
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message || "Invalid workspace name");
    }
  }

  const updated = await prisma.workspace.update({
    where: { id: workspaceId },
    data: {
      name: data.name !== undefined ? data.name : undefined,
      slug: data.name !== undefined ? slugify(data.name, workspaceId) : undefined,
      brandingSettings: data.brandingSettings !== undefined ? data.brandingSettings : undefined,
      customDomain: data.customDomain !== undefined ? data.customDomain : undefined,
      smtpEnabled: typeof data.smtpEnabled === 'boolean' ? data.smtpEnabled : undefined,
      smtpSettings: data.smtpSettings !== undefined ? data.smtpSettings : undefined,
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
  const workspaceExists = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  });
  if (!workspaceExists) {
    throw new Error("Workspace not found");
  }

  // ensure user is a member of the workspace
  const membership = await prisma.membership.findFirst({
    where: { workspaceId, userId },
  });
  if (!membership) {
    throw new Error("Access denied");
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