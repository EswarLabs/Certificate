import { prisma } from "../../lib/prisma.js";
import { createTemplateSchema, updateTemplateSchema } from "./template.validation.js";

export const createTemplate = async (data, orgId, workspaceId, userId) => {
    const validatedData = createTemplateSchema.parse(data);
    if (!validatedData) {
        throw new Error("Invalid template data");
    }
    const membership = await prisma.membership.findFirst({
        where: {
            userId: userId,
            organizationId: orgId,
            workspaceId
        }
    });
    if (!membership) {
        throw new Error("User is not a member of the organization or workspace");
    }
    const { name, schemaDefinition, ...rest } = validatedData;
    const template = await prisma.certificateTemplate.create({
        data: {
            name,
            schemaDefinition,
            workspaceId,
            createdById: userId,
            ...rest
        }
    });
    return template;
}

export const getAllTemplates = async (userId, orgId, workspaceId, { page = 1, limit = 10 }) => {
    const membership = await prisma.membership.findFirst({
        where: {
            userId: userId,
            organizationId: orgId,
            workspaceId
        }
    });
    if (!membership) {
        throw new Error("User is not a member of the organization or workspace");
    }
    const templates = await prisma.certificateTemplate.findMany({
        where: {
            workspaceId
        },
        skip: (page - 1) * limit,
        take: limit
    });
    const total = await prisma.certificateTemplate.count({
        where: {
            workspaceId
        }
    });
    return {success: true, page, limit, total, templates};
}

export const getMyTemplates = async (userId, orgId, workspaceId, { page = 1, limit = 10 }) => {
    const membership = await prisma.membership.findFirst({
        where: {
            userId: userId,
            organizationId: orgId,
            workspaceId
        }
    });
    if (!membership) {
        throw new Error("User is not a member of the organization or workspace");
    }
    const templates = await prisma.certificateTemplate.findMany({
        where: {
            createdById: userId,
            workspaceId
        },
        skip: (page - 1) * limit,
        take: limit
    });
    const total = await prisma.certificateTemplate.count({
        where: {
            createdById: userId,
            workspaceId
        }
    });
    return {success: true, page, limit, total, templates};
}

export const getTemplateById = async (templateId, userId, orgId, workspaceId) => {
    const membership = await prisma.membership.findFirst({
        where: {
            userId: userId,
            organizationId: orgId,
            workspaceId
        }
    });
    if (!membership) {
        throw new Error("User is not a member of the organization or workspace");
    }
    const template = await prisma.certificateTemplate.findUnique({
        where: {
            id: templateId
        }
    });
    return template;
}

export const updateTemplate = async (templateId, data, orgId, workspaceId, userId) => {
    const validatedData = updateTemplateSchema.parse(data);
    if (!validatedData) {
        throw new Error("Invalid template data");
    }
    const membership = await prisma.membership.findFirst({
        where: {
            userId,
            workspaceId,
        }
    });
    if (!membership) {
        throw new Error("User is not a member of the workspace");
    }
    const template = await prisma.certificateTemplate.findFirst({
        where: {
            id: templateId,
            workspaceId
        }
    });
    if (!template) {
        throw new Error("Template not found");
    }
    
    // Check permission: Creator or Workspace OWNER/ADMIN
    const isCreator = template.createdById === userId;
    const isAdminOrOwner = ["OWNER", "ADMIN"].includes(membership.role);
    if (!isCreator && !isAdminOrOwner) {
        throw new Error("User does not have permission to update the template");
    }
    const updatedTemplate = await prisma.certificateTemplate.update({
        where: {
            id: templateId,
        },
        data: {
            ...validatedData,
            updatedAt: new Date(),
        }
    });
    return updatedTemplate;
}

export const deleteTemplate = async (templateId, orgId, workspaceId, userId) => {
    const template = await prisma.certificateTemplate.findFirst({
        where: {
            id: templateId,
            workspaceId
        }   
     });
    if (!template) {
        throw new Error("Template not found");
    }
    const credentialCount = await prisma.credential.count({
        where: {
            templateId
        }
    });
    if (credentialCount > 0) {
        throw new Error("Template is already in use");
    }
    const membership = await prisma.membership.findFirst({
        where: {
            userId,
            workspaceId,
        }
    });
    if (!membership) {
        throw new Error("User is not a member of the workspace");
    }

    // Check permission: Creator or Workspace OWNER/ADMIN
    const isCreator = template.createdById === userId;
    const isAdminOrOwner = ["OWNER", "ADMIN"].includes(membership.role);
    if (!isCreator && !isAdminOrOwner) {
        throw new Error("User does not have permission to delete the template");
    }

    await prisma.certificateTemplate.delete({
        where: {
            id: templateId
        }
    });
}