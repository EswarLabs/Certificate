import { jest } from "@jest/globals";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

describe("Credentials & Verification Module Integration Tests", () => {
  jest.setTimeout(30000);

  let ownerUser, adminUser, viewerUser, strangerUser;
  let ownerToken, adminToken, viewerToken, strangerToken;
  let organization;
  let workspace;
  let template;
  let testFile;

  beforeAll(async () => {
    const testEmails = [
      "cred_owner@example.com",
      "cred_admin@example.com",
      "cred_viewer@example.com",
      "cred_stranger@example.com",
    ];

    // Clean up database entries
    await prisma.credentialEvent.deleteMany({});
    await prisma.emailLog.deleteMany({});
    await prisma.credential.deleteMany({});
    await prisma.job.deleteMany({});
    await prisma.membership.deleteMany({
      where: { user: { email: { in: testEmails } } },
    });
    await prisma.file.deleteMany({
      where: { uploadedBy: { email: { in: testEmails } } },
    });
    await prisma.certificateTemplate.deleteMany({
      where: { createdBy: { email: { in: testEmails } } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: testEmails } },
    });
    await prisma.organization.deleteMany({
      where: { slug: { startsWith: "cred-test-org-" } },
    });

    // Create Users
    ownerUser = await prisma.user.create({
      data: { email: "cred_owner@example.com", firstName: "Owner", lastName: "User" },
    });
    adminUser = await prisma.user.create({
      data: { email: "cred_admin@example.com", firstName: "Admin", lastName: "User" },
    });
    viewerUser = await prisma.user.create({
      data: { email: "cred_viewer@example.com", firstName: "Viewer", lastName: "User" },
    });
    strangerUser = await prisma.user.create({
      data: { email: "cred_stranger@example.com", firstName: "Stranger", lastName: "User" },
    });

    // Sign JWT Tokens
    const secret = process.env.JWT_SECRET || "your_jwt_secret_key";
    ownerToken = `Bearer ${jwt.sign({ userId: ownerUser.id, email: ownerUser.email }, secret)}`;
    adminToken = `Bearer ${jwt.sign({ userId: adminUser.id, email: adminUser.email }, secret)}`;
    viewerToken = `Bearer ${jwt.sign({ userId: viewerUser.id, email: viewerUser.email }, secret)}`;
    strangerToken = `Bearer ${jwt.sign({ userId: strangerUser.id, email: strangerUser.email }, secret)}`;

    // Create Organization
    const suffix = Date.now();
    organization = await prisma.organization.create({
      data: { name: "Cred Test Org", slug: `cred-test-org-${suffix}` },
    });

    // Create Workspace
    workspace = await prisma.workspace.create({
      data: { name: "Cred Test Workspace", organizationId: organization.id, slug: `cred-test-ws-${suffix}` },
    });

    // Create Memberships
    await prisma.membership.create({
      data: { userId: ownerUser.id, organizationId: organization.id, workspaceId: workspace.id, role: "OWNER" },
    });
    await prisma.membership.create({
      data: { userId: adminUser.id, organizationId: organization.id, workspaceId: workspace.id, role: "ADMIN" },
    });
    await prisma.membership.create({
      data: { userId: viewerUser.id, organizationId: organization.id, workspaceId: workspace.id, role: "VIEWER" },
    });

    // Create Template
    template = await prisma.certificateTemplate.create({
      data: {
        name: "Test Course Template",
        htmlTemplate: "<div>Welcome {{name}}, Grade {{grade}}</div>",
        schemaDefinition: [
          { key: "grade", label: "Grade Obtained", type: "text", required: true },
          { key: "score", label: "Final Score", type: "number", required: false },
        ],
        workspaceId: workspace.id,
        createdById: ownerUser.id,
      },
    });

    // Create Mock CSV File in Database for Batch tests
    testFile = await prisma.file.create({
      data: {
        workspaceId: workspace.id,
        uploadedById: ownerUser.id,
        fileName: "test_batch.csv",
        mimeType: "text/csv",
        fileSize: 150n,
        storageKey: "mock-storage-key",
        metadata: {
          testCsvContent: `fullName,emailAddr,courseGrade,points\n"Alice Smith","alice@example.com","A+",98\n"Bob Jones","bob@example.com","B",82`,
        },
      },
    });
  }, 30000);

  afterAll(async () => {
    const testEmails = [
      "cred_owner@example.com",
      "cred_admin@example.com",
      "cred_viewer@example.com",
      "cred_stranger@example.com",
    ];

    await prisma.credentialEvent.deleteMany({});
    await prisma.emailLog.deleteMany({});
    await prisma.credential.deleteMany({});
    await prisma.job.deleteMany({});
    await prisma.membership.deleteMany({
      where: { user: { email: { in: testEmails } } },
    });
    await prisma.file.deleteMany({
      where: { uploadedBy: { email: { in: testEmails } } },
    });
    await prisma.certificateTemplate.deleteMany({
      where: { createdBy: { email: { in: testEmails } } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: testEmails } },
    });
    await prisma.organization.deleteMany({
      where: { slug: { startsWith: "cred-test-org-" } },
    });

    await prisma.$disconnect();
  }, 30000);

  describe("Single Credential Lifecycle", () => {
    let credId;
    let verificationCode;

    it("should deny standard VIEWER from creating a credential", async () => {
      const response = await request(app)
        .post(`/api/organizations/${organization.id}/workspaces/${workspace.id}/credentials`)
        .set("Authorization", viewerToken)
        .send({
          templateId: template.id,
          recipientName: "Test Recipient",
          recipientEmail: "recipient@example.com",
          credentialData: { grade: "A", score: 95 },
        });

      expect(response.status).toBe(403);
    });

    it("should deny strangers from creating a credential", async () => {
      const response = await request(app)
        .post(`/api/organizations/${organization.id}/workspaces/${workspace.id}/credentials`)
        .set("Authorization", strangerToken)
        .send({
          templateId: template.id,
          recipientName: "Test Recipient",
          recipientEmail: "recipient@example.com",
          credentialData: { grade: "A", score: 95 },
        });

      expect(response.status).toBe(403);
    });

    it("should allow workspace OWNER to create a credential as draft", async () => {
      const response = await request(app)
        .post(`/api/organizations/${organization.id}/workspaces/${workspace.id}/credentials`)
        .set("Authorization", ownerToken)
        .send({
          templateId: template.id,
          recipientName: "Test Recipient",
          recipientEmail: "recipient@example.com",
          credentialData: { grade: "A", score: 95 },
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe("draft");
      expect(response.body.verificationCode).toBeDefined();
      credId = response.body.id;
      verificationCode = response.body.verificationCode;
    });

    it("should allow workspace OWNER to create a credential draft using 'data' field instead of 'credentialData'", async () => {
      const response = await request(app)
        .post(`/api/organizations/${organization.id}/workspaces/${workspace.id}/credentials`)
        .set("Authorization", ownerToken)
        .send({
          templateId: template.id,
          recipientName: "Test Recipient Data",
          recipientEmail: "recipient-data@example.com",
          data: { grade: "B", score: 85 },
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe("draft");
      expect(response.body.credentialData.grade).toBe("B");
    });

    it("should validate required fields inside credentialData", async () => {
      // "grade" is required in template schemaDefinition
      const response = await request(app)
        .post(`/api/organizations/${organization.id}/workspaces/${workspace.id}/credentials`)
        .set("Authorization", ownerToken)
        .send({
          templateId: template.id,
          recipientName: "Test Recipient",
          recipientEmail: "recipient@example.com",
          credentialData: { score: 95 }, // Missing grade
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("Validation failed");
    });

    it("should fail public verification of draft credentials (returns 404)", async () => {
      const response = await request(app).get(`/api/verify/${verificationCode}`);
      expect(response.status).toBe(404);
    });

    it("should allow workspace ADMIN to issue a credential and automatically send email", async () => {
      const response = await request(app)
        .patch(`/api/organizations/${organization.id}/workspaces/${workspace.id}/credentials/${credId}/issue`)
        .set("Authorization", adminToken);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("issued");
      expect(response.body.issuedAt).toBeDefined();

      // Verify email log in database was automatically created and marked "sent" by polling
      let emailLog;
      for (let attempts = 0; attempts < 20; attempts++) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        emailLog = await prisma.emailLog.findFirst({
          where: { credentialId: credId },
        });
        if (emailLog && emailLog.status === "sent") break;
      }
      expect(emailLog).toBeDefined();
      expect(emailLog.status).toBe("sent");
    });

    it("should succeed public verification of issued credentials", async () => {
      const response = await request(app).get(`/api/verify/${verificationCode}`);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.status).toBe("issued");
      expect(response.body.credential.recipientName).toBe("Test Recipient");
      expect(response.body.credential.template.name).toBe("Test Course Template");
      expect(response.body.credential.workspace.name).toBe("Cred Test Workspace");
    });

    it("should track events for a credential publicly", async () => {
      const response = await request(app)
        .post(`/api/credentials/${credId}/events`)
        .send({
          eventType: "view",
          ipAddress: "127.0.0.1",
          userAgent: "Mozilla/5.0 Test",
          metadata: { note: "test event tracking" },
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.event.eventType).toBe("view");
    });

    it("should retrieve credential details with tracked events for members", async () => {
      const response = await request(app)
        .get(`/api/organizations/${organization.id}/workspaces/${workspace.id}/credentials/${credId}`)
        .set("Authorization", ownerToken);

      expect(response.status).toBe(200);
      expect(response.body.events.length).toBeGreaterThan(0);
    });

    it("should allow workspace OWNER to revoke a credential", async () => {
      const response = await request(app)
        .patch(`/api/organizations/${organization.id}/workspaces/${workspace.id}/credentials/${credId}/revoke`)
        .set("Authorization", ownerToken);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("revoked");
    });

    it("should return revoked status when publicly verifying a revoked credential", async () => {
      const response = await request(app).get(`/api/verify/${verificationCode}`);
      expect(response.status).toBe(200);
      expect(response.body.status).toBe("revoked");
    });
  });

  describe("Batch Credentials Job", () => {
    it("should start a batch job and process CSV records asynchronously", async () => {
      const response = await request(app)
        .post(`/api/organizations/${organization.id}/workspaces/${workspace.id}/credentials/batch`)
        .set("Authorization", ownerToken)
        .send({
          templateId: template.id,
          fileId: testFile.id,
          recipientNameColumn: "fullName",
          recipientEmailColumn: "emailAddr",
          dataMapping: {
            grade: "courseGrade",
            score: "points",
          },
        });

      expect(response.status).toBe(202);
      expect(response.body.success).toBe(true);
      expect(response.body.job.status).toBe("pending");

      const jobId = response.body.job.id;

            // Wait for background execution to complete by polling
      let jobRecord;
      for (let attempts = 0; attempts < 30; attempts++) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        jobRecord = await prisma.job.findUnique({
          where: { id: jobId },
        });
        if (jobRecord.status === "completed" || jobRecord.status === "failed") {
          break;
        }
      }
      expect(jobRecord).toBeDefined();
      expect(jobRecord.status).toBe("completed");
      expect(jobRecord.progress).toBe(100);
      expect(jobRecord.result.totalProcessed).toBe(2);
      expect(jobRecord.result.createdCount).toBe(2);

      // Verify credentials created in DB
      const createdCreds = await prisma.credential.findMany({
        where: {
          workspaceId: workspace.id,
          recipientEmail: { in: ["alice@example.com", "bob@example.com"] },
        },
      });

      expect(createdCreds.length).toBe(2);
      expect(createdCreds.map((c) => c.recipientName)).toContain("Alice Smith");
      expect(createdCreds.map((c) => c.recipientName)).toContain("Bob Jones");
    });
  });

  describe("Bulk Issuance Job", () => {
    it("should start a bulk-issue job and process multiple draft credentials asynchronously", async () => {
      // 1. Create two new draft credentials
      const draft1 = await prisma.credential.create({
        data: {
          workspaceId: workspace.id,
          organizationId: organization.id,
          templateId: template.id,
          recipientName: "Bulk Issue User 1",
          recipientEmail: "issue1@example.com",
          credentialData: { grade: "A" },
          verificationCode: "BULK-ISSUE-1",
          status: "draft",
          createdById: ownerUser.id,
        },
      });

      const draft2 = await prisma.credential.create({
        data: {
          workspaceId: workspace.id,
          organizationId: organization.id,
          templateId: template.id,
          recipientName: "Bulk Issue User 2",
          recipientEmail: "issue2@example.com",
          credentialData: { grade: "B" },
          verificationCode: "BULK-ISSUE-2",
          status: "draft",
          createdById: ownerUser.id,
        },
      });

      // 2. Trigger bulk issue API
      const response = await request(app)
        .post(`/api/organizations/${organization.id}/workspaces/${workspace.id}/credentials/issue-batch`)
        .set("Authorization", ownerToken)
        .send({
          credentialIds: [draft1.id, draft2.id],
        });

      expect(response.status).toBe(202);
      expect(response.body.success).toBe(true);
      expect(response.body.job.type).toBe("bulk_issue");
      expect(response.body.job.status).toBe("pending");

      const jobId = response.body.job.id;

      // 3. Poll for background completion
      let jobRecord;
      for (let attempts = 0; attempts < 30; attempts++) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        jobRecord = await prisma.job.findUnique({
          where: { id: jobId },
        });
        if (jobRecord.status === "completed" || jobRecord.status === "failed") {
          break;
        }
      }

      expect(jobRecord).toBeDefined();
      expect(jobRecord.status).toBe("completed");
      expect(jobRecord.progress).toBe(100);
      expect(jobRecord.result.totalRequested).toBe(2);
      expect(jobRecord.result.issuedCount).toBe(2);

      // 4. Verify status updated to "issued" and emails sent
      const updated1 = await prisma.credential.findUnique({ where: { id: draft1.id } });
      const updated2 = await prisma.credential.findUnique({ where: { id: draft2.id } });
      expect(updated1.status).toBe("issued");
      expect(updated2.status).toBe("issued");

      const log1 = await prisma.emailLog.findFirst({ where: { credentialId: draft1.id } });
      const log2 = await prisma.emailLog.findFirst({ where: { credentialId: draft2.id } });
      expect(log1).toBeDefined();
      expect(log1.status).toBe("sent");
      expect(log2).toBeDefined();
      expect(log2.status).toBe("sent");
    });
  });
});
