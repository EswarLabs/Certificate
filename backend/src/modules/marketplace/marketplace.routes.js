import express from "express";
import jwt from "jsonwebtoken";
import {
  publishTemplateController,
  listPublicTemplatesController,
  getPublicTemplateController,
  copyPublicTemplateController,
  toggleLikeController,
  toggleFavoriteController,
  reportTemplateController,
  getCategoriesController,
  getTagsController,
  getCreatorProfileController,
  updateCreatorProfileController,
} from "./marketplace.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { publicLimiter, apiLimiter } from "../../middlewares/rateLimit.middleware.js";

const router = express.Router();

const optionalAuth = (req, res, next) => {
  try {
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    } else {
      token = req.cookies?.accessToken;
    }
    if (token && process.env.JWT_SECRET) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    }
  } catch (err) {
    // Ignore invalid/expired token on public reads
  }
  next();
};

// Public read endpoints
router.get("/templates", publicLimiter, optionalAuth, listPublicTemplatesController);
router.get("/templates/:id", publicLimiter, optionalAuth, getPublicTemplateController);
router.get("/categories", publicLimiter, getCategoriesController);
router.get("/tags", publicLimiter, getTagsController);

// Authenticated action endpoints
router.post("/templates", apiLimiter, authMiddleware, publishTemplateController);
router.post("/templates/:id/copy", apiLimiter, authMiddleware, copyPublicTemplateController);
router.post("/templates/:id/like", apiLimiter, authMiddleware, toggleLikeController);
router.post("/templates/:id/favorite", apiLimiter, authMiddleware, toggleFavoriteController);
router.post("/templates/:id/report", apiLimiter, authMiddleware, reportTemplateController);

// Creator Profile endpoints
router.get("/profile", apiLimiter, authMiddleware, getCreatorProfileController);
router.put("/profile", apiLimiter, authMiddleware, updateCreatorProfileController);

export default router;
