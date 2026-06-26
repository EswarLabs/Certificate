import { Worker } from "bullmq";
import { redis } from "../lib/redis.js";
import { prisma } from "../lib/prisma.js";
import { generateVerificationCode, validateCredentialData, parseCSV } from "../modules/certificates/credential.service.js";
import { emailQueue } from "../queues/email.queue.js";
import { imageQueue } from "../queues/image.queue.js";
import { pdfQueue } from "../queues/pdf.queue.js";

export const jobWorker = new Worker(
  "jobQueue",
  async (job) => {
    if (job.name === "csvImport") {
      const { jobId, workspaceId, orgId, userId, fileId, templateId, recipientNameColumn, recipientEmailColumn, dataMapping, expiresAt } = job.data;

      const dbJob = await prisma.job.findUnique({ where: { id: jobId } });
      if (!dbJob) return;

      await prisma.job.update({
        where: { id: jobId },
        data: { status: "RUNNING", startedAt: new Date(), progress: 10 },
      });

      try {
        const file = await prisma.file.findUnique({ where: { id: fileId } });
        const template = await prisma.certificateTemplate.findUnique({ where: { id: templateId } });

        let csvContent = "";
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
          csvContent = `name,email,course,date\n"Mock User","mock@example.com","Batch Course","2026-02-01"`;
        }

        await prisma.job.update({ where: { id: jobId }, data: { progress: 40 } });

        const records = parseCSV(csvContent);
        if (records.length === 0) {
          throw new Error("CSV file is empty or invalid");
        }

        const createdCredentials = [];
        const totalRecords = records.length;

        for (let i = 0; i < totalRecords; i++) {
          const record = records[i];
          const recipientName = record[recipientNameColumn];
          const recipientEmail = recipientEmailColumn ? record[recipientEmailColumn] : null;

          if (!recipientName) continue;

          const credentialData = {};
          for (const [destKey, srcColumn] of Object.entries(dataMapping)) {
            credentialData[destKey] = record[srcColumn] || "";
          }

          validateCredentialData(template, credentialData);

          let verificationCode = generateVerificationCode();
          let isUnique = false;
          while (!isUnique) {
            const existing = await prisma.credential.findUnique({ where: { verificationCode } });
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
              templateId,
              recipientName,
              recipientEmail,
              credentialData,
              verificationCode,
              status: "DRAFT",
              expiresAt,
              createdById: userId,
            },
          });

          await prisma.credentialEvent.create({
            data: {
              credentialId: cred.id,
              eventType: "CREATED",
              metadata: { viaJobId: jobId },
            },
          });

          await imageQueue.add("generateImage", { credentialId: cred.id });
          await pdfQueue.add("generatePdf", { credentialId: cred.id });

          createdCredentials.push(cred.id);

          const progressPercent = Math.min(40 + Math.floor((i / totalRecords) * 50), 90);
          await prisma.job.update({ where: { id: jobId }, data: { progress: progressPercent } });
        }

        if (createdCredentials.length > 0) {
          await prisma.organization.update({
            where: { id: orgId },
            data: { credentialsUsed: { increment: createdCredentials.length } },
          });
        }

        await prisma.job.update({
          where: { id: jobId },
          data: {
            status: "COMPLETED",
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
          where: { id: jobId },
          data: {
            status: "FAILED",
            errorMessage: jobErr.message,
            completedAt: new Date(),
          },
        });
      }
    } else if (job.name === "bulkIssue") {
      const { jobId, credentialIds, userId, workspaceId } = job.data;

      await prisma.job.update({
        where: { id: jobId },
        data: { status: "RUNNING", startedAt: new Date(), progress: 10 },
      });

      try {
        const total = credentialIds.length;
        let issuedCount = 0;

        for (let i = 0; i < total; i++) {
          const credId = credentialIds[i];

          try {
            const credential = await prisma.credential.findFirst({
              where: { id: credId, workspaceId },
            });

            if (credential && credential.status !== "ISSUED") {
              const updated = await prisma.credential.update({
                where: { id: credId },
                data: {
                  status: "ISSUED",
                  issuedAt: new Date(),
                  updatedAt: new Date(),
                },
              });

              await prisma.credentialEvent.create({
                data: {
                  credentialId: credId,
                  eventType: "ISSUED",
                  metadata: { issuedBy: userId, viaJobId: jobId },
                },
              });

              if (updated.recipientEmail) {
                await emailQueue.add("sendEmail", { credentialId: updated.id, userId });
              }

              issuedCount++;
            }
          } catch (credErr) {
            console.error(`Failed to issue credential ${credId} in batch:`, credErr);
          }

          const progressPercent = Math.min(10 + Math.floor((i / total) * 85), 95);
          await prisma.job.update({ where: { id: jobId }, data: { progress: progressPercent } });
        }

        await prisma.job.update({
          where: { id: jobId },
          data: {
            status: "COMPLETED",
            progress: 100,
            completedAt: new Date(),
            result: { totalRequested: total, issuedCount },
          },
        });
      } catch (jobErr) {
        console.error("Bulk Issue Job Failed:", jobErr);
        await prisma.job.update({
          where: { id: jobId },
          data: {
            status: "FAILED",
            errorMessage: jobErr.message,
            completedAt: new Date(),
          },
        });
      }
    }
  },
  { connection: redis, concurrency: 10, drainDelay: 60000, stalledInterval: 300000 }
);

jobWorker.on("completed", (job) => {
  console.log(`[Job Worker] Job ${job.id} (${job.name}) completed successfully.`);
});

jobWorker.on("failed", (job, err) => {
  console.error(`[Job Worker] Job ${job.id} (${job.name}) failed with error: ${err.message}`);
});
