import { z } from "zod";

// ──────────────────────────────────────────────────────────────
// Element property schemas (per type)
// ──────────────────────────────────────────────────────────────

const textPropertiesSchema = z.object({
  text: z.string(),
  fontFamily: z.string().optional(),
  fontSize: z.number().positive().optional(),
  fontStyle: z.string().optional(),        // "normal" | "bold" | "italic" | "bold italic"
  fill: z.string().optional(),
  align: z.enum(["left", "center", "right"]).optional(),
  variable: z.string().nullable().optional(), // e.g. "recipientName" for {{recipientName}}
});

const imagePropertiesSchema = z.object({
  src: z.string(),
  objectFit: z.enum(["contain", "cover", "fill"]).optional(),
});

const signaturePropertiesSchema = z.object({
  src: z.string(),
});

const qrcodePropertiesSchema = z.object({
  value: z.string(),
  variable: z.string().nullable().optional(),
});

const shapePropertiesSchema = z.object({
  shapeType: z.enum(["rect", "circle", "ellipse"]),
  fill: z.string().optional(),
  stroke: z.string().optional(),
  strokeWidth: z.number().optional(),
  cornerRadius: z.number().optional(),
});

const linePropertiesSchema = z.object({
  stroke: z.string().optional(),
  strokeWidth: z.number().optional(),
  points: z.array(z.number()).optional(),
});

// ──────────────────────────────────────────────────────────────
// Base element schema with discriminated union on `type`
// ──────────────────────────────────────────────────────────────

const baseElementFields = {
  id: z.string().min(1),
  x: z.number(),
  y: z.number(),
  width: z.number().positive(),
  height: z.number().positive(),
  rotation: z.number().default(0),
  opacity: z.number().min(0).max(1).default(1),
  locked: z.boolean().default(false),
  zIndex: z.number().int().default(0),
};

const editorElementSchema = z.discriminatedUnion("type", [
  z.object({ ...baseElementFields, type: z.literal("text"),      properties: textPropertiesSchema }),
  z.object({ ...baseElementFields, type: z.literal("image"),     properties: imagePropertiesSchema }),
  z.object({ ...baseElementFields, type: z.literal("signature"), properties: signaturePropertiesSchema }),
  z.object({ ...baseElementFields, type: z.literal("qrcode"),    properties: qrcodePropertiesSchema }),
  z.object({ ...baseElementFields, type: z.literal("shape"),     properties: shapePropertiesSchema }),
  z.object({ ...baseElementFields, type: z.literal("line"),      properties: linePropertiesSchema }),
]);

// ──────────────────────────────────────────────────────────────
// Canvas background
// ──────────────────────────────────────────────────────────────

const backgroundSchema = z.object({
  type: z.enum(["color", "image"]).default("color"),
  value: z.string().optional(), // hex color or image URL
});

// ──────────────────────────────────────────────────────────────
// editorData root schema
// ──────────────────────────────────────────────────────────────

export const editorDataSchema = z.object({
  version: z.number().int().default(1),
  width: z.number().positive(),
  height: z.number().positive(),
  background: backgroundSchema.optional(),
  elements: z.array(editorElementSchema).default([]),
});

// ──────────────────────────────────────────────────────────────
// Schema field definition (for credential data injection)
// ──────────────────────────────────────────────────────────────

const templateFieldSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(["text", "date", "number", "email", "url"]),
  required: z.boolean().default(false),
});

// ──────────────────────────────────────────────────────────────
// Create template
// ──────────────────────────────────────────────────────────────

export const createTemplateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  description: z.string().trim().max(500).optional(),
  orientation: z.enum(["LANDSCAPE", "PORTRAIT"]).default("LANDSCAPE"),
  editorData: editorDataSchema,
  thumbnailUrl: z.string().url().or(z.literal("")).optional().nullable(),
  schemaDefinition: z
    .array(templateFieldSchema)
    .superRefine((fields, ctx) => {
      const keys = new Set();
      for (const field of fields) {
        if (keys.has(field.key)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Duplicate field key: ${field.key}`,
          });
        }
        keys.add(field.key);
      }
    }),
});

// ──────────────────────────────────────────────────────────────
// Update template (all fields optional)
// ──────────────────────────────────────────────────────────────

export const updateTemplateSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(500).optional(),
  orientation: z.enum(["LANDSCAPE", "PORTRAIT"]).optional(),
  thumbnailUrl: z.string().url().or(z.literal("")).optional().nullable(),
  editorData: editorDataSchema.optional(),
  schemaDefinition: z
    .array(templateFieldSchema)
    .superRefine((fields, ctx) => {
      const keys = new Set();
      for (const field of fields) {
        if (keys.has(field.key)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Duplicate field key: ${field.key}`,
          });
        }
        keys.add(field.key);
      }
    })
    .optional(),
});