import { z } from "zod";

export const updateUserSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "First name must be at least 1 character")
    .max(50, "First name must be at most 50 characters")
    .optional()
    .nullable(),
  lastName: z
    .string()
    .trim()
    .min(1, "Last name must be at least 1 character")
    .max(50, "Last name must be at most 50 characters")
    .optional()
    .nullable(),
  avatarUrl: z
    .string()
    .url("Invalid avatar URL")
    .optional()
    .nullable()
    .or(z.literal("")),
});
