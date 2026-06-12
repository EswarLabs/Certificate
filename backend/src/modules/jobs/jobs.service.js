import { prisma } from "../../lib/prisma.js";

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

// Get job status details
export const getJobStatus = async (orgId, workspaceId, jobId, userId) => {
  await checkWorkspaceMembership(orgId, workspaceId, userId);

  const job = await prisma.job.findFirst({
    where: { id: jobId, workspaceId },
  });

  if (!job) {
    throw new Error("Job not found");
  }

  return job;
};

// List jobs in a workspace
export const listJobs = async (orgId, workspaceId, userId, filters = {}) => {
  await checkWorkspaceMembership(orgId, workspaceId, userId);

  const { page = 1, limit = 10, status, type } = filters;
  const skip = (page - 1) * limit;

  const whereClause = {
    workspaceId,
    ...(status && { status }),
    ...(type && { type }),
  };

  const jobs = await prisma.job.findMany({
    where: whereClause,
    skip,
    take: limit,
    orderBy: { createdAt: "desc" },
  });

  const total = await prisma.job.count({ where: whereClause });

  return {
    success: true,
    page,
    limit,
    total,
    jobs,
  };
};
