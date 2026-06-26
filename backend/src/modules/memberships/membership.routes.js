import express from "express";
import {
  addMemberController,
  listMembersController,
  getMemberController,
  updateMemberRoleController,
  removeMemberController,
} from "./membership.controller.js";
import { roleGuard } from "../../middlewares/roleGuard.middleware.js";

const router = express.Router({ mergeParams: true });

// NOTE: authMiddleware, orgMiddleware, workspaceMiddleware are applied at app.js level.

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
 *         description: Organization ID
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
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
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         firstName:
 *                           type: string
 *                         lastName:
 *                           type: string
 *                         email:
 *                           type: string
 *                         avatarUrl:
 *                           type: string
 *                           nullable: true
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Forbidden - only owners can add members
 *       404:
 *         description: Workspace not found
 */
router.post("/", roleGuard("OWNER"), addMemberController);

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
 *         description: Number of members per page
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
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 members:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       userId:
 *                         type: string
 *                       organizationId:
 *                         type: string
 *                       workspaceId:
 *                         type: string
 *                       role:
 *                         type: string
 *                       joinedAt:
 *                         type: string
 *                         format: date-time
 *                       user:
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
 *                           avatarUrl:
 *                             type: string
 *                             nullable: true
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 */
router.get("/", listMembersController);

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
 *         description: Organization ID
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 *         description: Membership ID
 *     responses:
 *       200:
 *         description: Member details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
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
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         firstName:
 *                           type: string
 *                         lastName:
 *                           type: string
 *                         email:
 *                           type: string
 *                         avatarUrl:
 *                           type: string
 *                           nullable: true
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Member not found
 */
router.get("/:memberId", getMemberController);

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
 *         description: Organization ID
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 *         description: Membership ID
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
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
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         firstName:
 *                           type: string
 *                         lastName:
 *                           type: string
 *                         email:
 *                           type: string
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Forbidden - only owners can update roles
 *       404:
 *         description: Member not found
 */
router.patch("/:memberId", roleGuard("OWNER"), updateMemberRoleController);

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
 *         description: Organization ID
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 *         description: Membership ID
 *     responses:
 *       200:
 *         description: Member removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       403:
 *         description: Forbidden - only owners can remove members
 *       404:
 *         description: Member not found
 */
router.delete("/:memberId", roleGuard("OWNER"), removeMemberController);

export default router;
