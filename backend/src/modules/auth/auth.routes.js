import express from "express";
import { 
  googleAuthController, 
  logoutController, 
  getCurrentUserController 
} from "./auth.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// Public routes
router.post("/google", googleAuthController);
router.post("/logout", logoutController);

// Protected routes
router.get("/me", authMiddleware, getCurrentUserController);

export default router;
