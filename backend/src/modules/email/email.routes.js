import express from "express";
import {
  sendVerificationEmailController,
  getEmailLogsController,
  trackOpenController,
  trackClickController,
} from "./email.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * @openapi
 * /api/email/send-verification:
 *   post:
 *     summary: Manually send certificate notification email
 *     tags:
 *       - Email
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - credentialId
 *             properties:
 *               credentialId:
 *                 type: string
 *                 description: The ID of the credential to send the email for
 *     responses:
 *       200:
 *         description: Email sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 logId:
 *                   type: string
 *       400:
 *         description: Invalid request or missing credential ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - User is not a member of the workspace or is a viewer
 *       404:
 *         description: Credential not found
 */
router.post("/email/send-verification", authMiddleware, sendVerificationEmailController);

/**
 * @openapi
 * /api/organizations/{organizationId}/workspaces/{workspaceId}/emails:
 *   get:
 *     summary: Retrieve email delivery logs for a workspace
 *     tags:
 *       - Email
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
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of logs to return per page
 *     responses:
 *       200:
 *         description: List of email logs retrieved successfully
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
 *                 logs:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       credentialId:
 *                         type: string
 *                       status:
 *                         type: string
 *                       providerMessageId:
 *                         type: string
 *                         nullable: true
 *                       bounceReason:
 *                         type: string
 *                         nullable: true
 *                       openedAt:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                       clickedAt:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                       credential:
 *                         type: object
 *                         properties:
 *                           recipientName:
 *                             type: string
 *                           verificationCode:
 *                             type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Access denied
 */
router.get(
  "/organizations/:organizationId/workspaces/:workspaceId/emails",
  authMiddleware,
  getEmailLogsController
);

/**
 * @openapi
 * /api/email/track/open/{logId}:
 *   get:
 *     summary: Track email open event (1x1 tracking pixel)
 *     tags:
 *       - Email Tracking
 *     parameters:
 *       - in: path
 *         name: logId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the email log
 *     responses:
 *       200:
 *         description: Serves 1x1 transparent GIF image
 *         content:
 *           image/gif:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get("/email/track/open/:logId", trackOpenController);

/**
 * @openapi
 * /api/email/track/click/{logId}:
 *   get:
 *     summary: Track link click event and redirect
 *     tags:
 *       - Email Tracking
 *     parameters:
 *       - in: path
 *         name: logId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the email log
 *       - in: query
 *         name: url
 *         required: true
 *         schema:
 *           type: string
 *         description: The URL-encoded target destination to redirect to
 *     responses:
 *       302:
 *         description: Redirects to target destination URL
 */
router.get("/email/track/click/:logId", trackClickController);

export default router;
