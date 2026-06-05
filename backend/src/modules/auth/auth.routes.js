import express from "express";
import { 
  googleAuthController, 
  logoutController, 
  getCurrentUserController 
} from "./auth.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * @openapi
 * /api/auth/google:
 *   post:
 *     summary: Google OAuth Authentication
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - credential
 *             properties:
 *               credential:
 *                 type: string
 *                 description: Google OAuth ID token (accepts `credential` or `token` fields)
 *     responses:
 *       200:
 *         description: Authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                 token:
 *                   type: string
 *       400:
 *         description: Invalid token
 */
router.post("/google", googleAuthController);

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     summary: User Logout
 *     tags:
 *       - Authentication
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post("/logout", logoutController);

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     summary: Get Current User
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User details retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 email:
 *                   type: string
 *                 name:
 *                   type: string
 *       401:
 *         description: Unauthorized
 */
router.get("/me", authMiddleware, getCurrentUserController);

export default router;
