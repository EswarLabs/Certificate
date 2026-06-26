import { prisma } from "../../lib/prisma.js";
import { createCredentialSchema, createBatchCredentialSchema, issueBatchCredentialsSchema } from "./credential.validation.js";
import { emailQueue } from "../../queues/email.queue.js";
import { jobQueue } from "../../queues/job.queue.js";
import { imageQueue } from "../../queues/image.queue.js";
import { pdfQueue } from "../../queues/pdf.queue.js";
import crypto from "crypto";

// Helper to generate verification code
export const generateVerificationCode = () => {
  return "CERT-" + crypto.randomBytes(8).toString("hex").toUpperCase();
};

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

// Helper to validate credential data against template schema definition
export const validateCredentialData = (template, credentialData) => {
  const schema = template.schemaDefinition;
  if (!schema || !Array.isArray(schema)) return;

  for (const field of schema) {
    const val = credentialData[field.key];

    // Check if required
    if (field.required && (val === undefined || val === null || val === "")) {
      throw new ValidationError(`Validation failed: Field "${field.key}" is required`);
    }

    // Type checking
    if (val !== undefined && val !== null && val !== "") {
      if (field.type === "number" && isNaN(Number(val))) {
        throw new ValidationError(`Validation failed: Field "${field.key}" must be a number`);
      }
      if (field.type === "email" && !/^\S+@\S+\.\S+$/.test(String(val))) {
        throw new ValidationError(`Validation failed: Field "${field.key}" must be a valid email`);
      }
      if (field.type === "url" && !/^https?:\/\/\S+$/.test(String(val))) {
        throw new ValidationError(`Validation failed: Field "${field.key}" must be a valid URL`);
      }
    }
  }
};

// Create a single credential
export const createCredential = async (data, orgId, workspaceId, userId) => {
  const validated = createCredentialSchema.parse(data);

  // NOTE: Membership and role checks are now handled by middleware
  // (orgMiddleware + workspaceMiddleware + roleGuard in app.js / routes).

  // --- Atomic credential limit check + increment ---
  // Uses a single conditional UPDATE to avoid race conditions.
  // If credentialsUsed >= credentialLimit, zero rows are updated → limit reached.
  const updateResult = await prisma.$executeRaw`
    UPDATE "Organization"
    SET "credentialsUsed" = "credentialsUsed" + 1,
        "updatedAt" = NOW()
    WHERE id = ${orgId}
    AND "credentialsUsed" < "credentialLimit"
  `;
  if (updateResult === 0) {
    throw new Error("Credential limit reached for this organization. Please upgrade your plan.");
  }

  // Get and check template
  const template = await prisma.certificateTemplate.findFirst({
    where: { id: validated.templateId, workspaceId },
  });
  if (!template) {
    // Rollback the increment since we won't create the credential
    await prisma.organization.update({
      where: { id: orgId },
      data: { credentialsUsed: { decrement: 1 } },
    });
    throw new Error("Template not found");
  }
  // Validate credentialData against template schema
  validateCredentialData(template, validated.credentialData);

  // Generate verification code
  let verificationCode = generateVerificationCode();
  let isUnique = false;
  while (!isUnique) {
    const existing = await prisma.credential.findUnique({
      where: { verificationCode },
    });
    if (!existing) {
      isUnique = true;
    } else {
      verificationCode = generateVerificationCode();
    }
  }

  const credential = await prisma.credential.create({
    data: {
      workspaceId,
      organizationId: orgId,
      templateId: validated.templateId,
      recipientName: validated.recipientName,
      recipientEmail: validated.recipientEmail,
      credentialData: validated.credentialData,
      verificationCode,
      status: "DRAFT",
      expiresAt: validated.expiresAt,
      createdById: userId,
    },
    include: {
      template: true,
      createdBy: true,
    },
  });

  // Log CREATED event
  await prisma.credentialEvent.create({
    data: {
      credentialId: credential.id,
      eventType: "CREATED",
      metadata: { createdBy: userId },
    },
  });

  const activeJobs = await imageQueue.getJobCounts();
  if (activeJobs.waiting > 1000) {
    throw new Error("Queue is busy. Please try later.");
  }
  const activeJobs1 = await pdfQueue.getJobCounts();
  if (activeJobs1.waiting > 1000) {
    throw new Error("Queue is busy. Please try later.");
  }

  // Trigger image and pdf generation
  await imageQueue.add("generateImage", { credentialId: credential.id });
  await pdfQueue.add("generatePdf", { credentialId: credential.id });

  return credential;
};

// List credentials in workspace
export const listCredentials = async (orgId, workspaceId, userId, filters = {}) => {
  const { page = 1, limit = 10, status, recipientEmail } = filters;

  // NOTE: Membership checks are handled by middleware.

  const whereClause = {
    workspaceId,
    ...(status && { status }),
    ...(recipientEmail && { recipientEmail: { contains: recipientEmail, mode: "insensitive" } }),
  };

  const credentials = await prisma.credential.findMany({
    where: whereClause,
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      template: {
        select: { name: true },
      },
    },
  });

  const total = await prisma.credential.count({ where: whereClause });

  return { success: true, page, limit, total, credentials };
};

// Get credential details
export const getCredentialById = async (id, orgId, workspaceId, userId) => {
  // NOTE: Membership checks are handled by middleware.

  const credential = await prisma.credential.findFirst({
    where: { id, workspaceId },
    include: {
      template: true,
      createdBy: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      events: true,
      emailLogs: true,
    },
  });

  if (!credential) {
    throw new Error("Credential not found");
  }

  return credential;
};

// Issue credential
export const issueCredential = async (id, orgId, workspaceId, userId) => {
  // NOTE: Membership and role checks are handled by middleware.

  const credential = await prisma.credential.findFirst({
    where: { id, workspaceId },
  });
  if (!credential) {
    throw new Error("Credential not found");
  }

  if (credential.status === "ISSUED") {
    throw new Error("Credential is already issued");
  }

  const issuedAt = new Date();

  // --- Compute content hash for certificate integrity ---
  const contentToHash = JSON.stringify({
    credentialId: credential.id,
    organizationId: orgId,
    templateId: credential.templateId,
    recipientName: credential.recipientName,
    credentialData: credential.credentialData,
    issuedAt: issuedAt.toISOString(),
    verificationCode: credential.verificationCode,
  });
  const contentHash = crypto
    .createHash("sha256")
    .update(contentToHash)
    .digest("hex");

  const updated = await prisma.credential.update({
    where: { id },
    data: {
      status: "ISSUED",
      issuedAt,
      contentHash,
      updatedAt: new Date(),
    },
    include: {
      template: true,
    },
  });

  // Log event
  await prisma.credentialEvent.create({
    data: {
      credentialId: id,
      eventType: "ISSUED",
      metadata: { issuedBy: userId, contentHash },
    },
  });

  // Trigger email sending via BullMQ queue
  if (updated.recipientEmail) {
    const activeJobs = await emailQueue.getJobCounts();
    if (activeJobs.waiting > 1000) {
      throw new Error("Queue is busy. Please try later.");
    }
    await emailQueue.add("sendEmail", {
      credentialId: updated.id,
      userId
    });
  }

  return updated;
};

// Revoke credential
export const revokeCredential = async (id, orgId, workspaceId, userId) => {
  // NOTE: Membership and role checks are handled by middleware.

  const credential = await prisma.credential.findFirst({
    where: { id, workspaceId },
  });
  if (!credential) {
    throw new Error("Credential not found");
  }

  if (credential.status === "REVOKED") {
    throw new Error("Credential is already revoked");
  }

  const updated = await prisma.credential.update({
    where: { id },
    data: {
      status: "REVOKED",
      updatedAt: new Date(),
    },
  });

  // Log event
  await prisma.credentialEvent.create({
    data: {
      credentialId: id,
      eventType: "REVOKED",
      metadata: { revokedBy: userId },
    },
  });

  return updated;
};

// Simple CSV parser
export function parseCSV(csvText) {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim() !== "");
  if (lines.length === 0) return [];

  const headers = parseCSVLine(lines[0]);
  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const record = {};
    headers.forEach((header, index) => {
      record[header] = values[index] !== undefined ? values[index] : "";
    });
    records.push(record);
  }
  return records;
}

export function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim().replace(/^"|"$/g, ""));
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim().replace(/^"|"$/g, ""));
  return result;
}

// Create Batch Credentials — starts a CSV_IMPORT job
export const createBatchCredentials = async (data, orgId, workspaceId, userId) => {
  const validated = createBatchCredentialSchema.parse(data);

  // Check workspace membership
  const membership = await prisma.membership.findFirst({
    where: { userId, workspaceId, organizationId: orgId },
  });
  if (!membership) {
    throw new Error("User is not a member of the workspace");
  }
  if (membership.role === "VIEWER") {
    throw new Error("User does not have permission to create credentials");
  }

  // Get template
  const template = await prisma.certificateTemplate.findFirst({
    where: { id: validated.templateId, workspaceId },
  });
  if (!template) {
    throw new Error("Template not found");
  }
  const credentialLimit = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { credentialsUsed: true, credentialLimit: true }
  });
  if (credentialLimit.credentialsUsed >= credentialLimit.credentialLimit) {
    throw new Error("Credential limit reached");
  }
  // Get file metadata
  const file = await prisma.file.findFirst({
    where: { id: validated.fileId, workspaceId },
  });
  if (!file) {
    throw new Error("File not found");
  }

  // Create Job
  const job = await prisma.job.create({
    data: {
      workspaceId,
      type: "CSV_IMPORT",
      status: "PENDING",
      progress: 0,
      payload: {
        templateId: validated.templateId,
        fileId: validated.fileId,
        recipientNameColumn: validated.recipientNameColumn,
        recipientEmailColumn: validated.recipientEmailColumn,
        dataMapping: validated.dataMapping,
      },
    },
  });

  const activeJobs = await jobQueue.getJobCounts();
  if (activeJobs.waiting > 500) {
    throw new Error("Queue is busy. Please try later.");
  }

  // Queue job in background instead of setImmediate
  await jobQueue.add("csvImport", {
    jobId: job.id,
    workspaceId,
    orgId,
    userId,
    fileId: validated.fileId,
    templateId: validated.templateId,
    recipientNameColumn: validated.recipientNameColumn,
    recipientEmailColumn: validated.recipientEmailColumn,
    dataMapping: validated.dataMapping,
    expiresAt: validated.expiresAt
  });

  return job;
};

// Asynchronous Batch Credentials Issuing — starts a BULK_ISSUE job
export const issueBatchCredentials = async (data, orgId, workspaceId, userId) => {
  const validated = issueBatchCredentialsSchema.parse(data);

  // Check workspace membership
  const membership = await prisma.membership.findFirst({
    where: { userId, workspaceId, organizationId: orgId },
  });
  if (!membership) {
    throw new Error("User is not a member of the workspace");
  }
  if (membership.role === "VIEWER") {
    throw new Error("User does not have permission to issue credentials");
  }

  // Create background Job
  const job = await prisma.job.create({
    data: {
      workspaceId,
      type: "BULK_ISSUE",
      status: "PENDING",
      progress: 0,
      payload: { credentialIds: validated.credentialIds },
    },
  });

  const activeJobs = await jobQueue.getJobCounts();
  if (activeJobs.waiting > 500) {
    throw new Error("Queue is busy. Please try later.");
  }

  // Queue job in background instead of setImmediate
  await jobQueue.add("bulkIssue", {
    jobId: job.id,
    credentialIds: validated.credentialIds,
    userId,
    workspaceId
  });

  return job;
};
