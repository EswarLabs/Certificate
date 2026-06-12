import { z } from "zod";
import sanitizeHtml from "sanitize-html";

const allowedHtmlTags = [
  ...sanitizeHtml.defaults.allowedTags,
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "div",
  "span",
  "img",
  "br",
  "hr",
  "p",
  "a",
];

const allowedHtmlAttributes = {
  ...sanitizeHtml.defaults.allowedAttributes,
  "*": ["class", "style", "id"],
  img: ["src", "alt", "width", "height"],
};

const templateFieldSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(["text", "date", "number", "email", "url"]),
  required: z.boolean().default(false),
});

export const createTemplateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  description: z.string().trim().max(500).optional(),
  htmlTemplate: z
    .string()
    .min(1, "HTML Template is required")
    .max(10000)
    .transform((html) => {
      return sanitizeHtml(html, {
        allowedTags: allowedHtmlTags,
        allowedAttributes: allowedHtmlAttributes,
      });
    }),
  cssStyles: z
    .string()
    .max(1000)
    .optional()
    .transform((css) => {
      // Basic JS injection prevention for CSS
      if (!css) return css;
      const sanitizedCss = css
        .replace(/expression\([^)]*\)/gi, "")
        .replace(/javascript:/gi, "")
        .replace(/<script[^>]*>.*<\/script>/gi, "");
      return sanitizedCss;
    }),
  orientation: z.enum(["landscape", "portrait"]).default("landscape"),
  schemaDefinition: z.array(templateFieldSchema).superRefine((fields, ctx) => {
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

export const updateTemplateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100).optional(),
  description: z.string().trim().max(500).optional(),
  htmlTemplate: z.string().transform((html) => {
    return sanitizeHtml(html, {
      allowedTags: allowedHtmlTags,
      allowedAttributes: allowedHtmlAttributes,
    });
  }).optional(),
  cssStyles: z
    .string()
    .max(1000)
    .optional()
    .transform((css) => {
      // Basic JS injection prevention for CSS
      if (!css) return css;
      const sanitizedCss = css
        .replace(/expression\([^)]*\)/gi, "")
        .replace(/javascript:/gi, "")
        .replace(/<script[^>]*>.*<\/script>/gi, "");
      return sanitizedCss;
    }),
  orientation: z.enum(["landscape", "portrait"]).default("landscape").optional(),
  schemaDefinition: z.array(templateFieldSchema).optional(),
});