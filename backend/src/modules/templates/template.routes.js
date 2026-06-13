import express from "express";
import {
    createTemplateController,
    deleteTemplateController,
    getAllTemplatesController,
    getMyTemplatesController,
    getTemplateByIdController,
    updateTemplateController,
    publishTemplateController,
    unpublishTemplateController,
} from "./template.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = express.Router({ mergeParams: true });

/**
 * @openapi
 * /api/organizations/{organizationId}/workspaces/{workspaceId}/templates:
 *   post:
 *     summary: Create a new certificate template
 *     tags:
 *       - Certificate Templates
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - editorData
 *               - schemaDefinition
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 maxLength: 500
 *               orientation:
 *                 type: string
 *                 enum: [LANDSCAPE, PORTRAIT]
 *                 default: LANDSCAPE
 *               editorData:
 *                 type: object
 *                 description: Konva canvas JSON (version, width, height, background, elements[])
 *               schemaDefinition:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [key, label, type]
 *                   properties:
 *                     key:
 *                       type: string
 *                     label:
 *                       type: string
 *                     type:
 *                       type: string
 *                       enum: [text, date, number, email, url]
 *                     required:
 *                       type: boolean
 *                       default: false
 *     responses:
 *       201:
 *         description: Template created successfully
 *       400:
 *         description: Validation failed
 *       403:
 *         description: Forbidden
 */
router.post("/", authMiddleware, createTemplateController);

/**
 * @openapi
 * /api/organizations/{organizationId}/workspaces/{workspaceId}/templates:
 *   get:
 *     summary: Get all templates in a workspace
 *     tags:
 *       - Certificate Templates
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
 *         description: List of templates
 *       403:
 *         description: Forbidden
 */
router.get("/", authMiddleware, getAllTemplatesController);

/**
 * @openapi
 * /api/organizations/{organizationId}/workspaces/{workspaceId}/templates/my-templates:
 *   get:
 *     summary: Get templates created by the current user
 *     tags:
 *       - Certificate Templates
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
 *         description: List of user's templates
 *       403:
 *         description: Forbidden
 */
router.get("/my-templates", authMiddleware, getMyTemplatesController);

/**
 * @openapi
 * /api/organizations/{organizationId}/workspaces/{workspaceId}/templates/{id}:
 *   get:
 *     summary: Get template by ID
 *     tags:
 *       - Certificate Templates
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
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Template details
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 */
router.get("/:id", authMiddleware, getTemplateByIdController);

/**
 * @openapi
 * /api/organizations/{organizationId}/workspaces/{workspaceId}/templates/{id}:
 *   put:
 *     summary: Update template by ID (auto-increments templateVersion)
 *     tags:
 *       - Certificate Templates
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
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               orientation:
 *                 type: string
 *                 enum: [LANDSCAPE, PORTRAIT]
 *               editorData:
 *                 type: object
 *               schemaDefinition:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Template updated
 *       400:
 *         description: Validation failed
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 */
router.put("/:id", authMiddleware, updateTemplateController);

/**
 * @openapi
 * /api/organizations/{organizationId}/workspaces/{workspaceId}/templates/{id}/publish:
 *   post:
 *     summary: Publish a template (makes it available for credential issuance)
 *     tags:
 *       - Certificate Templates
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
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Template published
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 */
router.post("/:id/publish", authMiddleware, publishTemplateController);

/**
 * @openapi
 * /api/organizations/{organizationId}/workspaces/{workspaceId}/templates/{id}/unpublish:
 *   post:
 *     summary: Unpublish a template
 *     tags:
 *       - Certificate Templates
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
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Template unpublished
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 */
router.post("/:id/unpublish", authMiddleware, unpublishTemplateController);

/**
 * @openapi
 * /api/organizations/{organizationId}/workspaces/{workspaceId}/templates/{id}:
 *   delete:
 *     summary: Delete template by ID (only if no credentials exist)
 *     tags:
 *       - Certificate Templates
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
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Template deleted
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 */
router.delete("/:id", authMiddleware, deleteTemplateController);

export default router;