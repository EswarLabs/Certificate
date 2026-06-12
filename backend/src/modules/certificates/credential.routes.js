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
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = express.Router({ mergeParams: true });

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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 workspaceId:
 *                   type: string
 *                 organizationId:
 *                   type: string
 *                 templateId:
 *                   type: string
 *                 recipientName:
 *                   type: string
 *                 recipientEmail:
 *                   type: string
 *                 credentialData:
 *                   type: object
 *                 verificationCode:
 *                   type: string
 *                 status:
 *                   type: string
 *                 expiresAt:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                 issuedAt:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                 createdById:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                 template:
 *                   type: object
 *                 createdBy:
 *                   type: object
 *       400:
 *         description: Invalid request or validation failed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - User is not a member of the workspace or limit reached
 *       404:
 *         description: Template not found
 */

router.post("/", authMiddleware, createCredentialController);

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
 *                 description: ID of template to use
 *               fileId:
 *                 type: string
 *                 description: ID of uploaded file containing CSV
 *               recipientNameColumn:
 *                 type: string
 *                 description: Column name for recipient name in CSV
 *               recipientEmailColumn:
 *                 type: string
 *                 description: Column name for recipient email in CSV
 *               dataMapping:
 *                 type: object
 *                 description: Key-value map mapping template fields to CSV columns
 *     responses:
 *       202:
 *         description: Batch processing started
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 job:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     workspaceId:
 *                       type: string
 *                     type:
 *                       type: string
 *                     status:
 *                       type: string
 *                     progress:
 *                       type: integer
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */

router.post("/batch", authMiddleware, createBatchCredentialsController);

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
 *         description: Organization ID
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Workspace ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of credentials to return per page
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, issued, revoked]
 *         description: Credential status
 *       - in: query
 *         name: recipientEmail
 *         schema:
 *           type: string
 *         description: Filter by recipient email
 *     responses:
 *       200:
 *         description: List of credentials retrieved successfully
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
 *                 credentials:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       workspaceId:
 *                         type: string
 *                       organizationId:
 *                         type: string
 *                       templateId:
 *                         type: string
 *                       recipientName:
 *                         type: string
 *                       recipientEmail:
 *                         type: string
 *                       credentialData:
 *                         type: object
 *                       verificationCode:
 *                         type: string
 *                       status:
 *                         type: string
 *                       expiresAt:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                       issuedAt:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                       createdById:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                       template:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */

router.get("/", authMiddleware, listCredentialsController);

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
 *         description: Credential ID
 *     responses:
 *       200:
 *         description: Credential retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 workspaceId:
 *                   type: string
 *                 organizationId:
 *                   type: string
 *                 templateId:
 *                   type: string
 *                 recipientName:
 *                   type: string
 *                 recipientEmail:
 *                   type: string
 *                 credentialData:
 *                   type: object
 *                 verificationCode:
 *                   type: string
 *                 status:
 *                   type: string
 *                 expiresAt:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                 issuedAt:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                 createdById:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                 template:
 *                   type: object
 *                 createdBy:
 *                   type: object
 *                 events:
 *                   type: array
 *                   items:
 *                     type: object
 *                 emailLogs:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Credential not found
 */

router.get("/:id", authMiddleware, getCredentialByIdController);

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
 *         description: Credential ID
 *     responses:
 *       200:
 *         description: Credential issued successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 workspaceId:
 *                   type: string
 *                 organizationId:
 *                   type: string
 *                 templateId:
 *                   type: string
 *                 recipientName:
 *                   type: string
 *                 recipientEmail:
 *                   type: string
 *                 credentialData:
 *                   type: object
 *                 verificationCode:
 *                   type: string
 *                 status:
 *                   type: string
 *                 expiresAt:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                 issuedAt:
 *                   type: string
 *                   format: date-time
 *                 createdById:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                 template:
 *                   type: object
 *       400:
 *         description: Invalid request or already issued
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Credential not found
 */

router.patch("/:id/issue", authMiddleware, issueCredentialController);

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
 *         description: Credential ID
 *     responses:
 *       200:
 *         description: Credential revoked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 workspaceId:
 *                   type: string
 *                 organizationId:
 *                   type: string
 *                 templateId:
 *                   type: string
 *                 recipientName:
 *                   type: string
 *                 recipientEmail:
 *                   type: string
 *                 credentialData:
 *                   type: object
 *                 verificationCode:
 *                   type: string
 *                 status:
 *                   type: string
 *                 expiresAt:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                 issuedAt:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                 createdById:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid request or already revoked
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Credential not found
 */

router.patch("/:id/revoke", authMiddleware, revokeCredentialController);

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
 *               - credentialIds
 *             properties:
 *               credentialIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of credential IDs to issue
 *     responses:
 *       202:
 *         description: Bulk issuance job started successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 job:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     workspaceId:
 *                       type: string
 *                     type:
 *                       type: string
 *                     status:
 *                       type: string
 *                     progress:
 *                       type: integer
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post("/issue-batch", authMiddleware, issueBatchCredentialsController);

export default router;
