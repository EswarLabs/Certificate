import { getJobStatus, listJobs } from "./jobs.service.js";

export const getJobStatusController = async (req, res, next) => {
  try {
    const orgId = req.params.organizationId;
    const workspaceId = req.params.workspaceId;
    const jobId = req.params.jobId;
    const userId = req.user.userId;

    const job = await getJobStatus(orgId, workspaceId, jobId, userId);
    res.status(200).json(job);
  } catch (error) {
    next(error);
  }
};

export const listJobsController = async (req, res, next) => {
  try {
    const orgId = req.params.organizationId;
    const workspaceId = req.params.workspaceId;
    const userId = req.user.userId;
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const status = req.query.status;
    const type = req.query.type;

    const result = await listJobs(orgId, workspaceId, userId, {
      page,
      limit,
      status,
      type,
    });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
