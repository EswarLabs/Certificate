import { listFiles, getFileDetails, deleteFile } from "./files.service.js";

export const listFilesController = async (req, res, next) => {
  try {
    const orgId = req.params.organizationId;
    const workspaceId = req.params.workspaceId;
    const userId = req.user.userId;
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;

    const result = await listFiles(orgId, workspaceId, userId, { limit, page });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getFileDetailsController = async (req, res, next) => {
  try {
    const orgId = req.params.organizationId;
    const workspaceId = req.params.workspaceId;
    const fileId = req.params.fileId;
    const userId = req.user.userId;

    const file = await getFileDetails(orgId, workspaceId, fileId, userId);
    res.status(200).json(file);
  } catch (error) {
    next(error);
  }
};

export const deleteFileController = async (req, res, next) => {
  try {
    const orgId = req.params.organizationId;
    const workspaceId = req.params.workspaceId;
    const fileId = req.params.fileId;
    const userId = req.user.userId;

    const result = await deleteFile(orgId, workspaceId, fileId, userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
