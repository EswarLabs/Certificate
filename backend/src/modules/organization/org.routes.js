import express from 'express';

import {
     createOrgController, 
     listOrgController, 
     getOrgController, 
     updateOrgController, 
     deleteOrgController 
    } from './org.controller.js';

import { authMiddleware } from '../../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * @openapi
 * /api/organizations:
 *   post:
 *     summary: Create a new organization
 *     tags:
 *       - Organizations
 *     security:
 *       - bearerAuth: []
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
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Organization created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post('/', authMiddleware, createOrgController);

/**
 * @openapi
 * /api/organizations:
 *   get:
 *     summary: List all organizations
 *     tags:
 *       - Organizations
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of organizations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       401:
 *         description: Unauthorized
 */
router.get('/', authMiddleware, listOrgController);

/**
 * @openapi
 * /api/organizations/{id}:
 *   get:
 *     summary: Get organization by ID
 *     tags:
 *       - Organizations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Organization details
 *       404:
 *         description: Organization not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id', authMiddleware, getOrgController);

/**
 * @openapi
 * /api/organizations/{id}:
 *   put:
 *     summary: Update organization
 *     tags:
 *       - Organizations
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Organization updated
 *       404:
 *         description: Organization not found
 *       401:
 *         description: Unauthorized
 */
router.put('/:id', authMiddleware, updateOrgController);

/**
 * @openapi
 * /api/organizations/{id}:
 *   delete:
 *     summary: Delete organization
 *     tags:
 *       - Organizations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Organization deleted
 *       404:
 *         description: Organization not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/:id', authMiddleware, deleteOrgController);

export default router;