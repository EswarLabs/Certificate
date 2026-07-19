import {
  publishTemplateService,
  listPublicTemplates,
  getPublicTemplateById,
  copyPublicTemplateService,
  toggleLikeService,
  toggleFavoriteService,
  reportTemplateService,
  getCategoriesService,
  getTagsService,
  getCreatorProfileService,
  updateCreatorProfileService,
} from "./marketplace.service.js";
import crypto from "crypto";

// Helper to hash IP address
const getIpHash = (req) => {
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
  return crypto.createHash("sha256").update(ip).digest("hex");
};

export const publishTemplateController = async (req, res, next) => {
  try {
    const { organizationId, workspaceId } = req.body;
    const userId = req.user.userId;
    const result = await publishTemplateService(userId, organizationId, workspaceId, req.body);
    res.status(201).json({ success: true, template: result });
  } catch (error) {
    next(error);
  }
};

export const listPublicTemplatesController = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const { search, category, tag, industry, sort } = req.query;
    const result = await listPublicTemplates({ page, limit, search, category, tag, industry, sort });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getPublicTemplateController = async (req, res, next) => {
  try {
    const id = req.params.id;
    const viewerIpHash = getIpHash(req);
    const userId = req.user?.userId;
    const result = await getPublicTemplateById(id, viewerIpHash, userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const copyPublicTemplateController = async (req, res, next) => {
  try {
    const templateId = req.params.id;
    const userId = req.user.userId;
    const result = await copyPublicTemplateService(templateId, userId, req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const toggleLikeController = async (req, res, next) => {
  try {
    const templateId = req.params.id;
    const userId = req.user.userId;
    const result = await toggleLikeService(templateId, userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const toggleFavoriteController = async (req, res, next) => {
  try {
    const templateId = req.params.id;
    const userId = req.user.userId;
    const result = await toggleFavoriteService(templateId, userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const reportTemplateController = async (req, res, next) => {
  try {
    const templateId = req.params.id;
    const userId = req.user.userId;
    const result = await reportTemplateService(templateId, userId, req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const getCategoriesController = async (req, res, next) => {
  try {
    const result = await getCategoriesService();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getTagsController = async (req, res, next) => {
  try {
    const result = await getTagsService();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getCreatorProfileController = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const result = await getCreatorProfileService(userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const updateCreatorProfileController = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const result = await updateCreatorProfileService(userId, req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
