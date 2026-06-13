import {
    createTemplate,
    deleteTemplate,
    getAllTemplates,
    getMyTemplates,
    getTemplateById,
    updateTemplate,
    publishTemplate,
    unpublishTemplate,
} from "./template.service.js";

export const createTemplateController = async (req, res, next) => {
    try {
        const orgId = req.params.organizationId;
        const workspaceId = req.params.workspaceId;
        const userId = req.user.userId;
        const template = await createTemplate(req.body, orgId, workspaceId, userId);
        res.status(201).json(template);
    } catch (error) {
        next(error);
    }
}

export const getAllTemplatesController = async (req, res, next) => {
    try {
        const orgId = req.params.organizationId;
        const workspaceId = req.params.workspaceId;
        const userId = req.user.userId;
        const limit = parseInt(req.query.limit) || 10;
        const page = parseInt(req.query.page) || 1;
        const templates = await getAllTemplates(userId, orgId, workspaceId, { limit, page });
        res.status(200).json(templates);
    } catch (error) {
        next(error);
    }
}

export const getMyTemplatesController = async (req, res, next) => {
    try {
        const orgId = req.params.organizationId;
        const workspaceId = req.params.workspaceId;
        const userId = req.user.userId;
        const limit = parseInt(req.query.limit) || 10;
        const page = parseInt(req.query.page) || 1;
        const templates = await getMyTemplates(userId, orgId, workspaceId, { limit, page });
        res.status(200).json(templates);
    } catch (error) {
        next(error);
    }
}

export const getTemplateByIdController = async (req, res, next) => {
    try {
        const templateId = req.params.id;
        const orgId = req.params.organizationId;
        const workspaceId = req.params.workspaceId;
        const userId = req.user.userId;
        const template = await getTemplateById(templateId, userId, orgId, workspaceId);
        if (!template) {
            return res.status(404).json({ error: "Template not found" });
        }
        res.status(200).json(template);
    } catch (error) {
        next(error);
    }
}

export const updateTemplateController = async (req, res, next) => {
    try {
        const templateId = req.params.id;
        const orgId = req.params.organizationId;
        const workspaceId = req.params.workspaceId;
        const userId = req.user.userId;
        const updatedTemplate = await updateTemplate(templateId, req.body, orgId, workspaceId, userId);
        res.status(200).json(updatedTemplate);
    } catch (error) {
        next(error);
    }
}

export const publishTemplateController = async (req, res, next) => {
    try {
        const templateId = req.params.id;
        const orgId = req.params.organizationId;
        const workspaceId = req.params.workspaceId;
        const userId = req.user.userId;
        const template = await publishTemplate(templateId, orgId, workspaceId, userId);
        res.status(200).json(template);
    } catch (error) {
        next(error);
    }
}

export const unpublishTemplateController = async (req, res, next) => {
    try {
        const templateId = req.params.id;
        const orgId = req.params.organizationId;
        const workspaceId = req.params.workspaceId;
        const userId = req.user.userId;
        const template = await unpublishTemplate(templateId, orgId, workspaceId, userId);
        res.status(200).json(template);
    } catch (error) {
        next(error);
    }
}

export const deleteTemplateController = async (req, res, next) => {
    try {
        const templateId = req.params.id;
        const orgId = req.params.organizationId;
        const workspaceId = req.params.workspaceId;
        const userId = req.user.userId;
        await deleteTemplate(templateId, orgId, workspaceId, userId);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
}