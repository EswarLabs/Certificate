import express from "express";

import {
    createWorkspaceController,
    deleteWorkspaceController,
    listWorkspaceByIdController,
    listWorkspacesController,
    updateWorkspaceController,
    uploadFileController,
} from "./workspace.controller.js";

import { roleGuard } from "../../middlewares/roleGuard.middleware.js";
import { fileUploadMiddleware } from "../upload/upload.validation.js";

const router = express.Router({ mergeParams: true });

// NOTE: authMiddleware + orgMiddleware are applied at app.js level.

/**
 * @openapi
 * /api/organizations/{organizationId}/workspaces:
 *   post:
 *     summary: Create workspace
 *     tags:
 *       - Workspaces
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Organization ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Workspace created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 workspace:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     slug:
 *                       type: string
 *                     organizationId:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                 membership:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     userId:
 *                       type: string
 *                     organizationId:
 *                       type: string
 *                     workspaceId:
 *                       type: string
 *                     role:
 *                       type: string
 *                     joinedAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized
 */
router.post("/", roleGuard("OWNER", "ADMIN"), createWorkspaceController);

/**
 * @openapi
 * /api/organizations/{organizationId}/workspaces:
 *   get:
 *     summary: List workspaces in organization
 *     tags:
 *       - Workspaces
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Organization ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of workspaces per page
 *     responses:
 *       200:
 *         description: List of workspaces
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
 *                 workspaces:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       slug:
 *                         type: string
 *                       organizationId:
 *                         type: string
 *                       brandingSettings:
 *                         type: object
 *                         nullable: true
 *                       customDomain:
 *                         type: string
 *                         nullable: true
 *                       smtpEnabled:
 *                         type: boolean
 *                       smtpSettings:
 *                         type: object
 *                         nullable: true
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized
 */
router.get("/", listWorkspacesController);

/**
 * @openapi
 * /api/organizations/{organizationId}/workspaces/{id}:
 *   get:
 *     summary: Get workspace by ID
 *     tags:
 *       - Workspaces
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
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Workspace ID
 *     responses:
 *       200:
 *         description: Workspace details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 slug:
 *                   type: string
 *                 organizationId:
 *                   type: string
 *                 brandingSettings:
 *                   type: object
 *                   nullable: true
 *                 customDomain:
 *                   type: string
 *                   nullable: true
 *                 smtpEnabled:
 *                   type: boolean
 *                 smtpSettings:
 *                   type: object
 *                   nullable: true
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Workspace not found
 */
router.get("/:id", listWorkspaceByIdController);

/**
 * @openapi
 * /api/organizations/{organizationId}/workspaces/{id}:
 *   put:
 *     summary: Update workspace
 *     tags:
 *       - Workspaces
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
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Workspace ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               brandingSettings:
 *                 type: object
 *                 nullable: true
 *               customDomain:
 *                 type: string
 *                 nullable: true
 *               smtpEnabled:
 *                 type: boolean
 *               smtpSettings:
 *                 type: object
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Workspace updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 slug:
 *                   type: string
 *                 organizationId:
 *                   type: string
 *                 brandingSettings:
 *                   type: object
 *                   nullable: true
 *                 customDomain:
 *                   type: string
 *                   nullable: true
 *                 smtpEnabled:
 *                   type: boolean
 *                 smtpSettings:
 *                   type: object
 *                   nullable: true
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Workspace not found
 */
router.put("/:id", roleGuard("OWNER", "ADMIN"), updateWorkspaceController);

/**
 * @openapi
 * /api/organizations/{organizationId}/workspaces/{id}:
 *   delete:
 *     summary: Delete workspace
 *     tags:
 *       - Workspaces
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
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Workspace ID
 *     responses:
 *       204:
 *         description: Workspace deleted (No Content)
 *       404:
 *         description: Workspace not found
 */
router.delete("/:id", roleGuard("OWNER"), deleteWorkspaceController);

/**
 * @openapi
 * /api/organizations/{organizationId}/workspaces/{id}/upload:
 *   post:
 *     summary: Upload file to workspace
 *     tags:
 *       - Workspaces
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
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Workspace ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: File to upload (CSV, Image, PDF, etc.)
 *     responses:
 *       200:
 *         description: File uploaded successfully
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
 */
router.post("/:id/upload", roleGuard("OWNER", "ADMIN", "EDITOR", "ISSUER"), fileUploadMiddleware.single("file"), uploadFileController);
export default router;