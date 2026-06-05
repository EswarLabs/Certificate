import express from "express";
import {
  addMemberController,
  listMembersController,
  getMemberController,
  updateMemberRoleController,
  removeMemberController,
} from "./membership.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = express.Router({ mergeParams: true });

/**
 * @openapi
 * /api/organizations/{organizationId}/members:
 *   post:
 *     summary: Add member to organization
 *     tags:
 *       - Memberships
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
 *               - newUserId
 *               - workspaceId
 *             properties:
 *               newUserId:
 *                 type: string
 *                 description: ID of user to add
 *               workspaceId:
 *                 type: string
 *                 description: Workspace ID
 *               role:
 *                 type: string
 *                 enum: [OWNER, ADMIN, MEMBER, VIEWER]
 *                 default: MEMBER
 *     responses:
 *       201:
 *         description: Member added successfully
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Forbidden - only owners can add members
 */
router.post("/", authMiddleware, addMemberController);

/**
 * @openapi
 * /api/organizations/{organizationId}/members:
 *   get:
 *     summary: List organization members
 *     tags:
 *       - Memberships
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
 *         description: List of members
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 total:
 *                   type: integer
 *                 members:
 *                   type: array
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 */
router.get("/", authMiddleware, listMembersController);

/**
 * @openapi
 * /api/organizations/{organizationId}/members/{memberId}:
 *   get:
 *     summary: Get member details
 *     tags:
 *       - Memberships
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Member details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Member not found
 */
router.get("/:memberId", authMiddleware, getMemberController);

/**
 * @openapi
 * /api/organizations/{organizationId}/members/{memberId}:
 *   patch:
 *     summary: Update member role
 *     tags:
 *       - Memberships
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: memberId
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
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [OWNER, ADMIN, MEMBER, VIEWER]
 *     responses:
 *       200:
 *         description: Role updated successfully
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Forbidden - only owners can update roles
 */
router.patch("/:memberId", authMiddleware, updateMemberRoleController);

/**
 * @openapi
 * /api/organizations/{organizationId}/members/{memberId}:
 *   delete:
 *     summary: Remove member from organization
 *     tags:
 *       - Memberships
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Member removed successfully
 *       403:
 *         description: Forbidden - only owners can remove members
 *       404:
 *         description: Member not found
 */
router.delete("/:memberId", authMiddleware, removeMemberController);

export default router;
