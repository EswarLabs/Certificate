import {
  createCredential,
  createBatchCredentials,
  listCredentials,
  getCredentialById,
  issueCredential,
  revokeCredential,
  issueBatchCredentials,
} from "./credential.service.js";

export const createCredentialController = async (req, res, next) => {
  try {
    const orgId = req.params.organizationId;
    const workspaceId = req.params.workspaceId;
    const userId = req.user.userId;
    const credential = await createCredential(req.body, orgId, workspaceId, userId);
    res.status(201).json(credential);
  } catch (error) {
    next(error);
  }
};

export const createBatchCredentialsController = async (req, res, next) => {
  try {
    const orgId = req.params.organizationId;
    const workspaceId = req.params.workspaceId;
    const userId = req.user.userId;
    const job = await createBatchCredentials(req.body, orgId, workspaceId, userId);
    res.status(202).json({
      success: true,
      message: "Batch credential processing started",
      job,
    });
  } catch (error) {
    next(error);
  }
};

export const listCredentialsController = async (req, res, next) => {
  try {
    const orgId = req.params.organizationId;
    const workspaceId = req.params.workspaceId;
    const userId = req.user.userId;
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const status = req.query.status;
    const recipientEmail = req.query.recipientEmail;

    const result = await listCredentials(orgId, workspaceId, userId, {
      page,
      limit,
      status,
      recipientEmail,
    });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getCredentialByIdController = async (req, res, next) => {
  try {
    const orgId = req.params.organizationId;
    const workspaceId = req.params.workspaceId;
    const userId = req.user.userId;
    const credId = req.params.id;

    const credential = await getCredentialById(credId, orgId, workspaceId, userId);
    res.status(200).json(credential);
  } catch (error) {
    next(error);
  }
};

export const issueCredentialController = async (req, res, next) => {
  try {
    const orgId = req.params.organizationId;
    const workspaceId = req.params.workspaceId;
    const userId = req.user.userId;
    const credId = req.params.id;

    const credential = await issueCredential(credId, orgId, workspaceId, userId);
    res.status(200).json(credential);
  } catch (error) {
    next(error);
  }
};

export const revokeCredentialController = async (req, res, next) => {
  try {
    const orgId = req.params.organizationId;
    const workspaceId = req.params.workspaceId;
    const userId = req.user.userId;
    const credId = req.params.id;

    const credential = await revokeCredential(credId, orgId, workspaceId, userId);
    res.status(200).json(credential);
  } catch (error) {
    next(error);
  }
};

export const issueBatchCredentialsController = async (req, res, next) => {
  try {
    const orgId = req.params.organizationId;
    const workspaceId = req.params.workspaceId;
    const userId = req.user.userId;
    const job = await issueBatchCredentials(req.body, orgId, workspaceId, userId);
    res.status(202).json({
      success: true,
      message: "Bulk issuance job started",
      job,
    });
  } catch (error) {
    next(error);
  }
};
