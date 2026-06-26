import express from "express";
import {
  listFilesController,
  getFileDetailsController,
  deleteFileController,
} from "./files.controller.js";
import { roleGuard } from "../../middlewares/roleGuard.middleware.js";

const router = express.Router({ mergeParams: true });

// NOTE: authMiddleware, orgMiddleware, workspaceMiddleware are applied at app.js level.

/**
 * @openapi
 * /api/organizations/{organizationId}/workspaces/{workspaceId}/files:
 *   get:
 *     summary: List all files in a workspace
 *     tags:
 *       - Files
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
 *         description: Number of files to return per page
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *     responses:
 *       200:
 *         description: List of files retrieved successfully
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
 *                 files:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       workspaceId:
 *                         type: string
 *                       uploadedById:
 *                         type: string
 *                       fileName:
 *                         type: string
 *                       mimeType:
 *                         type: string
 *                       fileSize:
 *                         type: integer
 *                       storageKey:
 *                         type: string
 *                       publicUrl:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                       uploadedBy:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           firstName:
 *                             type: string
 *                           lastName:
 *                             type: string
 *                           email:
 *                             type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get("/", listFilesController);

/**
 * @openapi
 * /api/organizations/{organizationId}/workspaces/{workspaceId}/files/{fileId}:
 *   get:
 *     summary: Get details of a specific file
 *     tags:
 *       - Files
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
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *         description: File ID
 *     responses:
 *       200:
 *         description: File details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 workspaceId:
 *                   type: string
 *                 uploadedById:
 *                   type: string
 *                 fileName:
 *                   type: string
 *                 mimeType:
 *                   type: string
 *                 fileSize:
 *                   type: integer
 *                 storageKey:
 *                   type: string
 *                 publicUrl:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                 uploadedBy:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     email:
 *                       type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: File not found
 */
router.get("/:fileId", getFileDetailsController);

/**
 * @openapi
 * /api/organizations/{organizationId}/workspaces/{workspaceId}/files/{fileId}:
 *   delete:
 *     summary: Delete a specific file
 *     tags:
 *       - Files
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
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *         description: File ID
 *     responses:
 *       200:
 *         description: File deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (insufficient permissions)
 *       404:
 *         description: File not found
 */
router.delete("/:fileId", roleGuard("OWNER", "ADMIN"), deleteFileController);

export default router;
