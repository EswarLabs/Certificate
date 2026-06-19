import express from "express";
import { getJobStatusController, listJobsController, getQueueStatsController } from "./jobs.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = express.Router({ mergeParams: true });

router.use(authMiddleware);

/**
 * @openapi
 * /api/organizations/{organizationId}/workspaces/{workspaceId}/jobs:
 *   get:
 *     summary: List all background jobs in a workspace
 *     tags:
 *       - Jobs
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of jobs to return per page
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Job status (pending, in_progress, completed, failed)
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Job type (batch_credentials, bulk_issue, etc.)
 *     responses:
 *       200:
 *         description: List of jobs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 total:
 *                   type: integer
 *                 jobs:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       workspaceId:
 *                         type: string
 *                       type:
 *                         type: string
 *                       status:
 *                         type: string
 *                       progress:
 *                         type: integer
 *                       payload:
 *                         type: object
 *                         nullable: true
 *                       result:
 *                         type: object
 *                         nullable: true
 *                       error:
 *                         type: string
 *                         nullable: true
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get("/", listJobsController);

/**
 * @openapi
 * /api/organizations/{organizationId}/workspaces/{workspaceId}/jobs/queue-stats:
 *   get:
 *     summary: Get current queue load statistics
 *     tags:
 *       - Jobs
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Queue stats retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 queues:
 *                   type: object
 *                 totalWaiting:
 *                   type: integer
 *                 isBusy:
 *                   type: boolean
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get("/queue-stats", getQueueStatsController);

/**
 * @openapi
 * /api/organizations/{organizationId}/workspaces/{workspaceId}/jobs/{jobId}:
 *   get:
 *     summary: Get details and status of a specific job
 *     tags:
 *       - Jobs
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Organization ID
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Workspace ID
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID
 *     responses:
 *       200:
 *         description: Job details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 workspaceId:
 *                   type: string
 *                 type:
 *                   type: string
 *                 status:
 *                   type: string
 *                 progress:
 *                   type: integer
 *                 payload:
 *                   type: object
 *                   nullable: true
 *                 result:
 *                   type: object
 *                   nullable: true
 *                 error:
 *                   type: string
 *                   nullable: true
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Job not found
 */
router.get("/:jobId", getJobStatusController);

export default router;
