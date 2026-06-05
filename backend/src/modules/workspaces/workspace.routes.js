import express from "express";

import {
    createWorkspaceController,
    deleteWorkspaceController,
    listWorkspaceByIdController,
    listWorkspacesController,
    updateWorkspaceController,
    uploadFileController,
} from "./workspace.controller.js";

import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { fileUploadMiddleware } from "../upload/upload.validation.js";

const router = express.Router({ mergeParams: true });

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
 *       401:
 *         description: Unauthorized
 */
router.post("/", authMiddleware, createWorkspaceController);

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
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of workspaces
 *       401:
 *         description: Unauthorized
 */
router.get("/", authMiddleware, listWorkspacesController);

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
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Workspace details
 *       404:
 *         description: Workspace not found
 */
router.get("/:id", authMiddleware, listWorkspaceByIdController);

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
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Workspace updated
 *       404:
 *         description: Workspace not found
 */
router.put("/:id", authMiddleware, updateWorkspaceController);

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
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Workspace deleted
 *       404:
 *         description: Workspace not found
 */
router.delete("/:id", authMiddleware, deleteWorkspaceController);

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
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: File uploaded successfully
 */
router.post("/:id/upload", authMiddleware, fileUploadMiddleware.single("file"), uploadFileController);
export default router;