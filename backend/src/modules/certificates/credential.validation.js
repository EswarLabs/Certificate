import { z } from "zod";

export const createCredentialSchema = z.object({
  templateId: z.string().trim().min(1, "Template ID is required"),
  recipientName: z.string().trim().min(1, "Recipient name is required"),
  recipientEmail: z.string().trim().email("Invalid recipient email").optional().nullable(),
  credentialData: z.record(z.any()).optional(),
  data: z.record(z.any()).optional(),
  expiresAt: z.preprocess((val) => (val ? new Date(val) : undefined), z.date().optional()),
}).transform((val) => {
  return {
    ...val,
    credentialData: val.credentialData || val.data || {},
  };
});

export const createBatchCredentialSchema = z.object({
  templateId: z.string().trim().min(1, "Template ID is required"),
  fileId: z.string().trim().min(1, "File ID is required"),
  recipientNameColumn: z.string().trim().min(1, "Recipient name column mapping is required"),
  recipientEmailColumn: z.string().trim().min(1, "Recipient email column mapping is required").optional().nullable(),
  dataMapping: z.record(z.string()).default({}),
  expiresAt: z.preprocess((val) => (val ? new Date(val) : undefined), z.date().optional()),
});

export const issueBatchCredentialsSchema = z.object({
  credentialIds: z.array(z.string()).min(1, "At least one credential ID is required"),
});
