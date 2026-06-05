import { z } from "zod";

export const addMemberSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  role: z.enum(["OWNER", "ADMIN", "MEMBER", "VIEWER"]).default("MEMBER"),
  workspaceId: z.string().min(1, "Workspace ID is required"),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(["OWNER", "ADMIN", "MEMBER", "VIEWER"]),
});
