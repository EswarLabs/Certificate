import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import helmet from "helmet";

import authRoutes from "./modules/auth/auth.routes.js";
import orgRoutes from "./modules/organization/org.routes.js";
import uploadRoutes from "./modules/upload/upload.routes.js";
import workspaceRoutes from "./modules/workspaces/workspace.routes.js";
import membershipRoutes from "./modules/memberships/membership.routes.js";
import templateRoutes from "./modules/templates/template.routes.js";
import credentialRoutes from "./modules/certificates/credential.routes.js";
import verificationRoutes from "./modules/verification/verification.routes.js";
import emailRoutes from "./modules/email/email.routes.js";
import userRoutes from "./modules/users/user.routes.js";
import jobRoutes from "./modules/jobs/jobs.routes.js";
import fileRoutes from "./modules/files/files.routes.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import { authMiddleware } from "./middlewares/auth.middleware.js";
import { orgMiddleware } from "./middlewares/org.middleware.js";
import { workspaceMiddleware } from "./middlewares/workspace.middleware.js";
import {
  loginLimiter,
  apiLimiter,
  publicLimiter,
  uploadLimiter,
} from "./middlewares/rateLimit.middleware.js";

dotenv.config();

// Global BigInt serializer helper for JSON responses
BigInt.prototype.toJSON = function () {
  return Number(this);
};

const app = express();

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : ["http://localhost:5173", "http://localhost:5174", "http://localhost:8000"];

// ---------- Global Middleware ----------

// Security headers (X-Frame-Options, X-Content-Type-Options, CSP, HSTS, etc.)
app.use(helmet());

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.set("trust proxy", 1);

// ---------- Swagger (dev/staging only) ----------
if (process.env.NODE_ENV !== "production") {
  const { swaggerUi, specs } = await import("./swagger.js");
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));
}

// ---------- Health Check (no rate limit) ----------
app.use("/api/health", (req, res) => {
  res.json({ message: "Health check" });
});

// ---------- Public routes (IP-based rate limiting) ----------
app.use("/api/auth", publicLimiter, loginLimiter, authRoutes);
app.use("/api", publicLimiter, verificationRoutes);

// ---------- Authenticated routes (user-based rate limiting) ----------
// apiLimiter keys by userId — corporate networks with shared IPs won't be penalized
app.use("/api/organizations", apiLimiter, authMiddleware, orgRoutes);
app.use("/api/upload", apiLimiter, uploadLimiter, authMiddleware, uploadRoutes);
app.use("/api/users", apiLimiter, authMiddleware, userRoutes);
app.use("/api", apiLimiter, authMiddleware, emailRoutes);

// ---------- Org-scoped routes (auth → org middleware) ----------
app.use(
  "/api/organizations/:organizationId/workspaces",
  apiLimiter, authMiddleware, orgMiddleware,
  workspaceRoutes,
);

// ---------- Workspace-scoped routes (auth → org → workspace middleware) ----------
// Membership, templates, credentials, jobs, files all require full tenant context
app.use(
  "/api/organizations/:organizationId/workspaces/:workspaceId/members",
  apiLimiter, authMiddleware, orgMiddleware, workspaceMiddleware,
  membershipRoutes,
);
app.use(
  "/api/organizations/:organizationId/workspaces/:workspaceId/templates",
  apiLimiter, authMiddleware, orgMiddleware, workspaceMiddleware,
  templateRoutes,
);
app.use(
  "/api/organizations/:organizationId/workspaces/:workspaceId/credentials",
  apiLimiter, authMiddleware, orgMiddleware, workspaceMiddleware,
  credentialRoutes,
);
app.use(
  "/api/organizations/:organizationId/workspaces/:workspaceId/jobs",
  apiLimiter, authMiddleware, orgMiddleware, workspaceMiddleware,
  jobRoutes,
);
app.use(
  "/api/organizations/:organizationId/workspaces/:workspaceId/files",
  apiLimiter, authMiddleware, orgMiddleware, workspaceMiddleware,
  fileRoutes,
);

// ---------- Centralized error handler ----------
app.use(errorHandler);

export default app;
