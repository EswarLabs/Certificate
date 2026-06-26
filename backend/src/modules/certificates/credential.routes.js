import express from "express";
import {
  createCredentialController,
  createBatchCredentialsController,
  listCredentialsController,
  getCredentialByIdController,
  issueCredentialController,
  revokeCredentialController,
  issueBatchCredentialsController,
} from "./credential.controller.js";
import { roleGuard } from "../../middlewares/roleGuard.middleware.js";
import { bulkLimiter } from "../../middlewares/rateLimit.middleware.js";

const router = express.Router({ mergeParams: true });

// NOTE: authMiddleware, orgMiddleware, workspaceMiddleware are applied at
// the app.js level for all /api/organizations/:orgId/workspaces/:wsId/credentials routes.
// Only roleGuard and operation-specific limiters are needed here.

/**
 * @openapi
 * /api/organizations/{organizationId}/workspaces/{workspaceId}/credentials:
 *   post:
 *     summary: Create a new credential
 *     tags:
 *       - Credential
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
 *               - templateId
 *               - recipientEmail
 *               - recipientName
 *             properties:
 *               templateId:
 *                 type: string
 *                 description: ID of the template
 *               recipientEmail:
 *                 type: string
 *                 description: Recipient's email address
 *               recipientName:
 *                 type: string
 *                 description: Recipient's name
 *               credentialData:
 *                 type: object
 *                 description: Dynamic data matching template's schema definition
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *                 description: Optional expiry date-time
 *     responses:
 *       201:
 *         description: Credential created successfully
 *       400:
 *         description: Invalid request or validation failed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient role or limit reached
 *       404:
 *         description: Template not found
 */
router.post("/", roleGuard("OWNER", "ADMIN", "EDITOR", "ISSUER"), createCredentialController);

/**
 * @openapi
 * /api/organizations/{organizationId}/workspaces/{workspaceId}/credentials/batch:
 *   post:
 *     summary: Create multiple credentials from CSV file in DB
 *     tags:
 *       - Credential
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
 *               - templateId
 *               - fileId
 *               - recipientNameColumn
 *               - recipientEmailColumn
 *               - dataMapping
 *             properties:
 *               templateId:
 *                 type: string
 *               fileId:
 *                 type: string
 *               recipientNameColumn:
 *                 type: string
 *               recipientEmailColumn:
 *                 type: string
 *               dataMapping:
 *                 type: object
 *     responses:
 *       202:
 *         description: Batch processing started
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post("/batch", roleGuard("OWNER", "ADMIN", "EDITOR"), bulkLimiter, createBatchCredentialsController);

/**
 * @openapi
 * /api/organizations/{organizationId}/workspaces/{workspaceId}/credentials:
 *   get:
 *     summary: Get all credentials in a workspace
 *     tags:
 *       - Credential
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
 *           default: 10
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, issued, revoked]
 *       - in: query
 *         name: recipientEmail
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of credentials
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get("/", listCredentialsController);

/**
 * @openapi
 * /api/organizations/{organizationId}/workspaces/{workspaceId}/credentials/{id}:
 *   get:
 *     summary: Get a credential by ID
 *     tags:
 *       - Credential
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
 *         description: Credential retrieved
 *       404:
 *         description: Not found
 */
router.get("/:id", getCredentialByIdController);

/**
 * @openapi
 * /api/organizations/{organizationId}/workspaces/{workspaceId}/credentials/{id}/issue:
 *   patch:
 *     summary: Issue a credential
 *     tags:
 *       - Credential
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
 *         description: Credential issued
 *       400:
 *         description: Already issued
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 */
router.patch("/:id/issue", roleGuard("OWNER", "ADMIN", "ISSUER"), issueCredentialController);

/**
 * @openapi
 * /api/organizations/{organizationId}/workspaces/{workspaceId}/credentials/{id}/revoke:
 *   patch:
 *     summary: Revoke a credential
 *     tags:
 *       - Credential
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
 *         description: Credential revoked
 *       400:
 *         description: Already revoked
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 */
router.patch("/:id/revoke", roleGuard("OWNER", "ADMIN"), revokeCredentialController);

/**
 * @openapi
 * /api/organizations/{organizationId}/workspaces/{workspaceId}/credentials/issue-batch:
 *   post:
 *     summary: Bulk issue draft credentials
 *     tags:
 *       - Credential
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
 *               - credentialIds
 *             properties:
 *               credentialIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       202:
 *         description: Bulk issuance started
 *       403:
 *         description: Forbidden
 */
router.post("/issue-batch", roleGuard("OWNER", "ADMIN", "ISSUER"), bulkLimiter, issueBatchCredentialsController);

export default router;
