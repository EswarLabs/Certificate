import { z } from "zod";

export const publishTemplateSchema = z.object({
  templateId: z.string().min(1, "Source template ID is required"),
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(100),
  description: z.string().trim().min(10, "Description must be at least 10 characters").max(2000),
  coverImageUrl: z.string().url().optional().nullable(),
  thumbnailUrl: z.string().url().optional().nullable(),
  visibility: z.enum(["PUBLIC", "UNLISTED", "PRIVATE"]).default("PUBLIC"),
  difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).default("BEGINNER"),
  industry: z.string().trim().default("General"),
  language: z.string().trim().default("en"),
  license: z.string().trim().default("CC-BY-4.0"),
  categories: z.array(z.string().trim().min(1)).max(5).default([]),
  tags: z.array(z.string().trim().min(1)).max(15).default([]),
});

export const updatePublicTemplateSchema = z.object({
  title: z.string().trim().min(3).max(100).optional(),
  description: z.string().trim().min(10).max(2000).optional(),
  coverImageUrl: z.string().url().optional().nullable(),
  thumbnailUrl: z.string().url().optional().nullable(),
  visibility: z.enum(["PUBLIC", "UNLISTED", "PRIVATE"]).optional(),
  difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional(),
  industry: z.string().trim().optional(),
  language: z.string().trim().optional(),
  license: z.string().trim().optional(),
  categories: z.array(z.string().trim().min(1)).max(5).optional(),
  tags: z.array(z.string().trim().min(1)).max(15).optional(),
  changelog: z.string().trim().max(1000).optional(),
  updateFromTemplateId: z.string().optional(),
});

export const copyTemplateSchema = z.object({
  organizationId: z.string().min(1, "Organization ID is required"),
  workspaceId: z.string().min(1, "Workspace ID is required"),
});

export const reportTemplateSchema = z.object({
  reason: z.enum(["SPAM", "COPYRIGHT", "INAPPROPRIATE", "OTHER"]),
  details: z.string().trim().max(1000).optional(),
});
