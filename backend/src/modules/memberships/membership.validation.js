import { z } from "zod";

// Roles must match the WorkspaceRole enum in schema.prisma:
// OWNER, ADMIN, EDITOR, ISSUER, VIEWER
// Previously this had "MEMBER" which doesn't exist in the DB schema.

export const addMemberSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  role: z.enum(["ADMIN", "EDITOR", "ISSUER", "VIEWER"]).default("VIEWER"),
  workspaceId: z.string().min(1, "Workspace ID is required"),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(["ADMIN", "EDITOR", "ISSUER", "VIEWER"]),
});
