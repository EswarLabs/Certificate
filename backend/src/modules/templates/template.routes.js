import express from "express";
import { createTemplateController, deleteTemplateController, getAllTemplatesController, getMyTemplatesController, getTemplateByIdController, updateTemplateController } from "./template.controller.js";
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
 *         description: Organization ID
 *       - in: path
 *         name: workspaceId
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
 *             required:
 *               - name
 *               - htmlTemplate
 *               - schemaDefinition
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *                 description: Template name
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 description: Template description
 *               htmlTemplate:
 *                 type: string
 *                 maxLength: 10000
 *                 description: HTML content of the template
 *               cssStyles:
 *                 type: string
 *                 maxLength: 1000
 *                 description: CSS stylesheet for the template
 *               orientation:
 *                 type: string
 *                 enum: [landscape, portrait]
 *                 default: landscape
 *                 description: Page layout orientation
 *               schemaDefinition:
 *                 type: array
 *                 description: Dynamic fields required for the certificate template
 *                 items:
 *                   type: object
 *                   required:
 *                     - key
 *                     - label
 *                     - type
 *                   properties:
 *                     key:
 *                       type: string
 *                       description: The identifier key for the field
 *                     label:
 *                       type: string
 *                       description: The human-readable label
 *                     type:
 *                       type: string
 *                       enum: [text, date, number, email, url]
 *                       description: Field type for validation
 *                     required:
 *                       type: boolean
 *                       default: false
 *                       description: Whether the field must be supplied
 *     responses:
 *       201:
 *         description: Template created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 description:
 *                   type: string
 *                   nullable: true
 *                 htmlTemplate:
 *                   type: string
 *                 cssStyles:
 *                   type: string
 *                   nullable: true
 *                 orientation:
 *                   type: string
 *                 schemaDefinition:
 *                   type: array
 *                   items:
 *                     type: object
 *                 workspaceId:
 *                   type: string
 *                 createdById:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid input or validation failed
 *       403:
 *         description: Forbidden - User is not a member of organization/workspace
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
 *         description: Number of templates to return per page
 *     responses:
 *       200:
 *         description: List of templates retrieved successfully
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
 *                 templates:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                         nullable: true
 *                       htmlTemplate:
 *                         type: string
 *                       cssStyles:
 *                         type: string
 *                         nullable: true
 *                       orientation:
 *                         type: string
 *                       schemaDefinition:
 *                         type: array
 *                         items:
 *                           type: object
 *                       workspaceId:
 *                         type: string
 *                       createdById:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *       403:
 *         description: Forbidden - Access denied
 */
router.get("/", authMiddleware, getAllTemplatesController);

/**
 * @openapi
 * /api/organizations/{organizationId}/workspaces/{workspaceId}/templates/my-templates:
 *   get:
 *     summary: Get templates created by current user in workspace
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
 *         description: Number of templates to return per page
 *     responses:
 *       200:
 *         description: List of user's templates retrieved successfully
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
 *                 templates:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                         nullable: true
 *                       htmlTemplate:
 *                         type: string
 *                       cssStyles:
 *                         type: string
 *                         nullable: true
 *                       orientation:
 *                         type: string
 *                       schemaDefinition:
 *                         type: array
 *                         items:
 *                           type: object
 *                       workspaceId:
 *                         type: string
 *                       createdById:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *       403:
 *         description: Forbidden - Access denied
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
 *         description: Organization ID
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Workspace ID
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Template ID
 *     responses:
 *       200:
 *         description: Template details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 description:
 *                   type: string
 *                   nullable: true
 *                 htmlTemplate:
 *                   type: string
 *                 cssStyles:
 *                   type: string
 *                   nullable: true
 *                 orientation:
 *                   type: string
 *                 schemaDefinition:
 *                   type: array
 *                   items:
 *                     type: object
 *                 workspaceId:
 *                   type: string
 *                 createdById:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       403:
 *         description: Forbidden - Access denied
 *       404:
 *         description: Template not found
 */
router.get("/:id", authMiddleware, getTemplateByIdController);

/**
 * @openapi
 * /api/organizations/{organizationId}/workspaces/{workspaceId}/templates/{id}:
 *   put:
 *     summary: Update template by ID
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
 *         description: Organization ID
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Workspace ID
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Template ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *                 description: Template name
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 description: Template description
 *               htmlTemplate:
 *                 type: string
 *                 maxLength: 10000
 *                 description: HTML content
 *               cssStyles:
 *                 type: string
 *                 maxLength: 1000
 *                 description: CSS content
 *               orientation:
 *                 type: string
 *                 enum: [landscape, portrait]
 *                 description: Page orientation
 *               schemaDefinition:
 *                 type: array
 *                 description: Dynamic fields
 *                 items:
 *                   type: object
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
 *     responses:
 *       200:
 *         description: Template updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 description:
 *                   type: string
 *                   nullable: true
 *                 htmlTemplate:
 *                   type: string
 *                 cssStyles:
 *                   type: string
 *                   nullable: true
 *                 orientation:
 *                   type: string
 *                 schemaDefinition:
 *                   type: array
 *                   items:
 *                     type: object
 *                 workspaceId:
 *                   type: string
 *                 createdById:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid input or validation failed
 *       403:
 *         description: Forbidden - User is not creator or admin
 *       404:
 *         description: Template not found
 */
router.put("/:id", authMiddleware, updateTemplateController);

/**
 * @openapi
 * /api/organizations/{organizationId}/workspaces/{workspaceId}/templates/{id}:
 *   delete:
 *     summary: Delete template by ID
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
 *         description: Organization ID
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Workspace ID
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Template ID
 *     responses:
 *       204:
 *         description: Template deleted successfully (No Content)
 *       403:
 *         description: Forbidden - User is not creator or admin
 *       404:
 *         description: Template not found
 */
router.delete("/:id", authMiddleware, deleteTemplateController);

export default router;