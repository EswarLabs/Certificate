import express from "express";
import { verifyCredentialController, trackEventController } from "./verification.controller.js";
import {authMiddleware} from '../../middlewares/auth.middleware.js';
const router = express.Router();

/**
 * @openapi
 * /api/verify/{verificationCode}:
 *   get:
 *     summary: Verify a credential
 *     tags:
 *       - Verification
 *     parameters:
 *       - in: path
 *         name: verificationCode
 *         required: true
 *         schema:
 *           type: string
 *         description: The verification code of the credential
 *     responses:
 *       200:
 *         description: Credential verification successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 status:
 *                   type: string
 *                 credential:
 *                   type: object
 *       404:
 *         description: Credential not found
 *       400:
 *         description: Invalid verification code format
 */

router.get("/verify/:verificationCode", verifyCredentialController);

/**
 * @openapi
 * /api/credentials/{credId}/events:
 *   post:
 *     summary: Track an event for a credential
 *     tags:
 *       - Verification
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: credId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the credential
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eventType
 *             properties:
 *               eventType:
 *                 type: string
 *                 description: Type of the event (e.g., "viewed", "downloaded", "shared")
 *               ipAddress:
 *                 type: string
 *                 description: Optional IP address
 *               userAgent:
 *                 type: string
 *                 description: Optional user agent string
 *               metadata:
 *                 type: object
 *                 description: Optional key-value metadata object
 *     responses:
 *       201:
 *         description: Event tracked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 event:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     credentialId:
 *                       type: string
 *                     eventType:
 *                       type: string
 *                     ipAddress:
 *                       type: string
 *                       nullable: true
 *                     userAgent:
 *                       type: string
 *                       nullable: true
 *                     metadata:
 *                       type: object
 *                       nullable: true
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: Credential not found
 *       400:
 *         description: Invalid event data
 */

router.post("/credentials/:credId/events", trackEventController);

export default router;
