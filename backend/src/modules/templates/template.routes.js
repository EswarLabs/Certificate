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
import { roleGuard } from "../../middlewares/roleGuard.middleware.js";

const router = express.Router({ mergeParams: true });

// NOTE: authMiddleware, orgMiddleware, workspaceMiddleware are applied at
// the app.js level for all workspace-scoped routes.

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
 *               schemaDefinition:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: Template created successfully
 *       400:
 *         description: Validation failed
 *       403:
 *         description: Forbidden
 */
router.post("/", roleGuard("OWNER", "ADMIN", "EDITOR"), createTemplateController);

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
router.get("/", getAllTemplatesController);

/**
 * @openapi
 * /api/organizations/{organizationId}/workspaces/{workspaceId}/templates/my-templates:
 *   get:
 *     summary: Get templates created by the current user
 *     tags:
 *       - Certificate Templates
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's templates
 */
router.get("/my-templates", getMyTemplatesController);

/**
 * @openapi
 * /api/organizations/{organizationId}/workspaces/{workspaceId}/templates/{id}:
 *   get:
 *     summary: Get template by ID
 *     tags:
 *       - Certificate Templates
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Template details
 *       404:
 *         description: Not found
 */
router.get("/:id", getTemplateByIdController);

/**
 * @openapi
 * /api/organizations/{organizationId}/workspaces/{workspaceId}/templates/{id}:
 *   put:
 *     summary: Update template by ID (auto-increments templateVersion)
 *     tags:
 *       - Certificate Templates
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Template updated
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 */
router.put("/:id", roleGuard("OWNER", "ADMIN", "EDITOR"), updateTemplateController);

/**
 * @openapi
 * /api/organizations/{organizationId}/workspaces/{workspaceId}/templates/{id}/publish:
 *   post:
 *     summary: Publish a template
 *     tags:
 *       - Certificate Templates
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Template published
 *       403:
 *         description: Forbidden
 */
router.post("/:id/publish", roleGuard("OWNER", "ADMIN"), publishTemplateController);

/**
 * @openapi
 * /api/organizations/{organizationId}/workspaces/{workspaceId}/templates/{id}/unpublish:
 *   post:
 *     summary: Unpublish a template
 *     tags:
 *       - Certificate Templates
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Template unpublished
 *       403:
 *         description: Forbidden
 */
router.post("/:id/unpublish", roleGuard("OWNER", "ADMIN"), unpublishTemplateController);

/**
 * @openapi
 * /api/organizations/{organizationId}/workspaces/{workspaceId}/templates/{id}:
 *   delete:
 *     summary: Delete template by ID
 *     tags:
 *       - Certificate Templates
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: Template deleted
 *       403:
 *         description: Forbidden
 */
router.delete("/:id", roleGuard("OWNER", "ADMIN"), deleteTemplateController);

export default router;