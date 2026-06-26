import express from "express";
import { verifyCredentialController, trackEventController } from "./verification.controller.js";
import { publicLimiter, eventTrackingLimiter } from "../../middlewares/rateLimit.middleware.js";

const router = express.Router();

// NOTE: These are PUBLIC routes — no authMiddleware.
// Rate limiting is applied per-route.

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
 *       404:
 *         description: Credential not found
 *       400:
 *         description: Invalid verification code format
 */
router.get("/verify/:verificationCode", publicLimiter, verifyCredentialController);

/**
 * @openapi
 * /api/credentials/{credId}/events:
 *   post:
 *     summary: Track an event for a credential (rate-limited, restricted event types)
 *     tags:
 *       - Verification
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
 *                 enum: [OPENED, VERIFIED]
 *                 description: Only OPENED and VERIFIED events can be tracked from public
 *     responses:
 *       201:
 *         description: Event tracked successfully
 *       400:
 *         description: Invalid event data
 *       404:
 *         description: Credential not found
 *       429:
 *         description: Rate limit exceeded
 */
router.post("/credentials/:credId/events", eventTrackingLimiter, trackEventController);

export default router;
