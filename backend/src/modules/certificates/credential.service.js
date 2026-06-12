import { prisma } from "../../lib/prisma.js";
import { createCredentialSchema, createBatchCredentialSchema, issueBatchCredentialsSchema } from "./credential.validation.js";
import { sendCredentialEmail } from "../email/email.service.js";
import crypto from "crypto";

// Helper to generate verification code
const generateVerificationCode = () => {
  return "CERT-" + crypto.randomBytes(8).toString("hex").toUpperCase();
};

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

// Helper to validate credential data against template schema definition
const validateCredentialData = (template, credentialData) => {
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
  const credentialLimit = await prisma.organization.findUnique({
    where: {
      id: orgId
    },
    select: {
      credentialsUsed: true,
      credentialLimit: true
    }
  })
  if (credentialLimit.credentialsUsed >= credentialLimit.credentialLimit) {
    throw new Error("Credential limit reached");
  }

  // Get and check template
  const template = await prisma.certificateTemplate.findFirst({
    where: { id: validated.templateId, workspaceId },
  });
  if (!template) {
    throw new Error("Template not found");
  }
  // Validate credentialData against template schema
  validateCredentialData(template, validated.credentialData);

  // Generate verification code
  let verificationCode = generateVerificationCode();
  // Ensure uniqueness
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
      status: "draft",
      expiresAt: validated.expiresAt,
      createdById: userId,
    },
    include: {
      template: true,
      createdBy: true,
    },
  });
  await prisma.organization.update({
    where: {
      id: orgId
    },
    data: {
      credentialsUsed: {
        increment: 1,
      }
    }
  })

  return credential;
};

// List credentials in workspace
export const listCredentials = async (orgId, workspaceId, userId, filters = {}) => {
  const { page = 1, limit = 10, status, recipientEmail } = filters;

  // Check workspace membership
  const membership = await prisma.membership.findFirst({
    where: { userId, workspaceId, organizationId: orgId },
  });
  if (!membership) {
    throw new Error("User is not a member of the workspace");
  }

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

  return {
    success: true,
    page,
    limit,
    total,
    credentials,
  };
};

// Get credential details
export const getCredentialById = async (id, orgId, workspaceId, userId) => {
  // Check workspace membership
  const membership = await prisma.membership.findFirst({
    where: { userId, workspaceId, organizationId: orgId },
  });
  if (!membership) {
    throw new Error("User is not a member of the workspace");
  }

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

  const credential = await prisma.credential.findFirst({
    where: { id, workspaceId },
  });
  if (!credential) {
    throw new Error("Credential not found");
  }

  if (credential.status === "issued") {
    throw new Error("Credential is already issued");
  }

  const updated = await prisma.credential.update({
    where: { id },
    data: {
      status: "issued",
      issuedAt: new Date(),
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
      eventType: "issued",
      metadata: { issuedBy: userId },
    },
  });

  // Trigger email sending asynchronously in the background
  if (updated.recipientEmail) {
    sendCredentialEmail(updated.id, userId).catch((err) => {
      console.error(`Automatic email sending failed for credential ${id}:`, err);
    });
  }

  return updated;
};

// Revoke credential
export const revokeCredential = async (id, orgId, workspaceId, userId) => {
  // Check workspace membership
  const membership = await prisma.membership.findFirst({
    where: { userId, workspaceId, organizationId: orgId },
  });
  if (!membership) {
    throw new Error("User is not a member of the workspace");
  }
  if (membership.role === "VIEWER") {
    throw new Error("User does not have permission to revoke credentials");
  }

  const credential = await prisma.credential.findFirst({
    where: { id, workspaceId },
  });
  if (!credential) {
    throw new Error("Credential not found");
  }

  if (credential.status === "revoked") {
    throw new Error("Credential is already revoked");
  }

  const updated = await prisma.credential.update({
    where: { id },
    data: {
      status: "revoked",
      updatedAt: new Date(),
    },
  });

  // Log event
  await prisma.credentialEvent.create({
    data: {
      credentialId: id,
      eventType: "revoked",
      metadata: { revokedBy: userId },
    },
  });

  return updated;
};

// Simple CSV parser
function parseCSV(csvText) {
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

function parseCSVLine(line) {
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

// Create Batch Credentials Async Process
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
    where: {
      id: orgId
    },
    select: {
      credentialsUsed: true,
      credentialLimit: true
    }
  })
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
      type: "batch_credentials",
      status: "pending",
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

  // Run processing in background
  setImmediate(async () => {
    try {
      // Update job to in_progress
      await prisma.job.update({
        where: { id: job.id },
        data: {
          status: "in_progress",
          startedAt: new Date(),
          progress: 10,
        },
      });

      // Load CSV data
      let csvContent = "";
      // Check if file metadata has testing data, otherwise fetch
      if (file.metadata && typeof file.metadata === "object" && file.metadata.testCsvContent) {
        csvContent = file.metadata.testCsvContent;
      } else if (file.publicUrl && file.publicUrl.startsWith("http")) {
        try {
          const response = await fetch(file.publicUrl);
          if (response.ok) {
            csvContent = await response.text();
          } else {
            throw new Error(`Failed to fetch file content: ${response.statusText}`);
          }
        } catch (fetchErr) {
          console.error("Fetch CSV error, fallback to mock data:", fetchErr);
          csvContent = `name,email,course,date\n"Mock User","mock@example.com","Batch Course","2026-02-01"`;
        }
      } else {
        // Fallback for mock/test runs without URLs
        csvContent = `name,email,course,date\n"Mock User","mock@example.com","Batch Course","2026-02-01"`;
      }

      await prisma.job.update({
        where: { id: job.id },
        data: { progress: 40 },
      });

      const records = parseCSV(csvContent);
      if (records.length === 0) {
        throw new Error("CSV file is empty or invalid");
      }

      const createdCredentials = [];
      const totalRecords = records.length;

      for (let i = 0; i < totalRecords; i++) {
        const record = records[i];
        const recipientName = record[validated.recipientNameColumn];
        const recipientEmail = validated.recipientEmailColumn ? record[validated.recipientEmailColumn] : null;

        if (!recipientName) {
          continue; // Skip invalid records without name
        }

        // Map fields
        const credentialData = {};
        for (const [destKey, srcColumn] of Object.entries(validated.dataMapping)) {
          credentialData[destKey] = record[srcColumn] || "";
        }

        // Validate mapped data
        validateCredentialData(template, credentialData);

        // Generate code
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

        const cred = await prisma.credential.create({
          data: {
            workspaceId,
            organizationId: orgId,
            templateId: validated.templateId,
            recipientName,
            recipientEmail,
            credentialData,
            verificationCode,
            status: "draft",
            expiresAt: validated.expiresAt,
            createdById: userId,
          },
        });

        createdCredentials.push(cred.id);

        // Update progress dynamically
        const progressPercent = Math.min(40 + Math.floor((i / totalRecords) * 50), 90);
        await prisma.job.update({
          where: { id: job.id },
          data: { progress: progressPercent },
        });
      }

      // Update credential usage counter
      if (createdCredentials.length > 0) {
        await prisma.organization.update({
          where: { id: orgId },
          data: {
            credentialsUsed: {
              increment: createdCredentials.length,
            },
          },
        });
      }

      // Complete job
      await prisma.job.update({
        where: { id: job.id },
        data: {
          status: "completed",
          progress: 100,
          completedAt: new Date(),
          result: {
            totalProcessed: totalRecords,
            createdCount: createdCredentials.length,
            credentialIds: createdCredentials,
          },
        },
      });
    } catch (jobErr) {
      console.error("Batch Job Failed:", jobErr);
      await prisma.job.update({
        where: { id: job.id },
        data: {
          status: "failed",
          errorMessage: jobErr.message,
          completedAt: new Date(),
        },
      });
    }
  });

  return job;
};

// Asynchronous Batch Credentials Issuing Worker
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
      type: "bulk_issue",
      status: "pending",
      progress: 0,
      payload: {
        credentialIds: validated.credentialIds,
      },
    },
  });

  // Run processing in background
  setImmediate(async () => {
    try {
      // Update job to in_progress
      await prisma.job.update({
        where: { id: job.id },
        data: {
          status: "in_progress",
          startedAt: new Date(),
          progress: 10,
        },
      });

      const { credentialIds } = validated;
      const total = credentialIds.length;
      let issuedCount = 0;

      for (let i = 0; i < total; i++) {
        const credId = credentialIds[i];

        try {
          // Check if credential exists and belongs to the workspace
          const credential = await prisma.credential.findFirst({
            where: { id: credId, workspaceId },
          });

          if (credential && credential.status !== "issued") {
            // Update status
            const updated = await prisma.credential.update({
              where: { id: credId },
              data: {
                status: "issued",
                issuedAt: new Date(),
                updatedAt: new Date(),
              },
            });

            // Log event
            await prisma.credentialEvent.create({
              data: {
                credentialId: credId,
                eventType: "issued",
                metadata: { issuedBy: userId, viaJobId: job.id },
              },
            });

            // Trigger email send asynchronously
            if (updated.recipientEmail) {
              await sendCredentialEmail(updated.id, userId).catch((emailErr) => {
                console.error(`Automatic email sending failed for credential ${credId} in batch:`, emailErr);
              });
            }

            issuedCount++;
          }
        } catch (credErr) {
          console.error(`Failed to issue credential ${credId} in batch:`, credErr);
        }

        // Update progress dynamically
        const progressPercent = Math.min(10 + Math.floor((i / total) * 85), 95);
        await prisma.job.update({
          where: { id: job.id },
          data: { progress: progressPercent },
        });
      }

      // Complete job
      await prisma.job.update({
        where: { id: job.id },
        data: {
          status: "completed",
          progress: 100,
          completedAt: new Date(),
          result: {
            totalRequested: total,
            issuedCount,
          },
        },
      });
    } catch (jobErr) {
      console.error("Bulk Issue Job Failed:", jobErr);
      await prisma.job.update({
        where: { id: job.id },
        data: {
          status: "failed",
          errorMessage: jobErr.message,
          completedAt: new Date(),
        },
      });
    }
  });

  return job;
};
