import { jest } from "@jest/globals";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

describe("Email & Tracking Module Integration Tests", () => {
  jest.setTimeout(30000);

  let ownerUser, strangerUser;
  let ownerToken, strangerToken;
  let organization;
  let workspace;
  let template;
  let credential;

  beforeAll(async () => {
    const testEmails = [
      "email_test_owner@example.com",
      "email_test_stranger@example.com",
    ];

    // Clean up database entries
    await prisma.credentialEvent.deleteMany({});
    await prisma.emailLog.deleteMany({});
    await prisma.credential.deleteMany({});
    await prisma.membership.deleteMany({
      where: { user: { email: { in: testEmails } } },
    });
    await prisma.certificateTemplate.deleteMany({
      where: { createdBy: { email: { in: testEmails } } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: testEmails } },
    });
    await prisma.organization.deleteMany({
      where: { slug: { startsWith: "email-test-org-" } },
    });

    // Create Users
    ownerUser = await prisma.user.create({
      data: { email: "email_test_owner@example.com", firstName: "Owner", lastName: "User" },
    });
    strangerUser = await prisma.user.create({
      data: { email: "email_test_stranger@example.com", firstName: "Stranger", lastName: "User" },
    });

    // Sign JWT Tokens
    const secret = process.env.JWT_SECRET || "your_jwt_secret_key";
    ownerToken = `Bearer ${jwt.sign({ userId: ownerUser.id, email: ownerUser.email }, secret)}`;
    strangerToken = `Bearer ${jwt.sign({ userId: strangerUser.id, email: strangerUser.email }, secret)}`;

    // Create Organization
    const suffix = Date.now();
    organization = await prisma.organization.create({
      data: { name: "Email Test Org", slug: `email-test-org-${suffix}` },
    });

    // Create Workspace
    workspace = await prisma.workspace.create({
      data: { name: "Email Test Workspace", organizationId: organization.id, slug: `email-test-ws-${suffix}` },
    });

    // Create Membership
    await prisma.membership.create({
      data: { userId: ownerUser.id, organizationId: organization.id, workspaceId: workspace.id, role: "OWNER" },
    });

    // Create Template
    template = await prisma.certificateTemplate.create({
      data: {
        name: "Email Course Template",
        htmlTemplate: "<div>Congratulations {{recipientName}} on completing {{courseName}}! <a href='https://eswarlabs.com/certs'>View Cert</a></div>",
        schemaDefinition: [
          { key: "courseName", label: "Course Name", type: "text", required: true },
        ],
        workspaceId: workspace.id,
        createdById: ownerUser.id,
      },
    });

    // Create Credential
    credential = await prisma.credential.create({
      data: {
        workspaceId: workspace.id,
        organizationId: organization.id,
        templateId: template.id,
        recipientName: "Bob Tester",
        recipientEmail: "bob@example.com",
        credentialData: { courseName: "Backend Node.js" },
        verificationCode: "EMAIL-TEST-CODE-123",
        status: "issued",
        createdById: ownerUser.id,
      },
    });
  }, 30000);

  afterAll(async () => {
    const testEmails = [
      "email_test_owner@example.com",
      "email_test_stranger@example.com",
    ];

    await prisma.credentialEvent.deleteMany({});
    await prisma.emailLog.deleteMany({});
    await prisma.credential.deleteMany({});
    await prisma.membership.deleteMany({
      where: { user: { email: { in: testEmails } } },
    });
    await prisma.certificateTemplate.deleteMany({
      where: { createdBy: { email: { in: testEmails } } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: testEmails } },
    });
    await prisma.organization.deleteMany({
      where: { slug: { startsWith: "email-test-org-" } },
    });

    await prisma.$disconnect();
  }, 30000);

  describe("Email Delivery, Logs, and Tracking", () => {
    let emailLogId;

    it("should deny unauthorized users from sending verification emails", async () => {
      const response = await request(app)
        .post("/api/email/send-verification")
        .set("Authorization", strangerToken)
        .send({ credentialId: credential.id });

      expect(response.status).toBe(403);
    });

    it("should allow workspace owner to send verification email for an issued credential", async () => {
      const response = await request(app)
        .post("/api/email/send-verification")
        .set("Authorization", ownerToken)
        .send({ credentialId: credential.id });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.logId).toBeDefined();

      emailLogId = response.body.logId;

      // Verify log status in DB
      const logInDb = await prisma.emailLog.findUnique({
        where: { id: emailLogId },
      });
      expect(logInDb).toBeDefined();
      expect(logInDb.status).toBe("sent");
      expect(logInDb.recipientEmail).toBe("bob@example.com");
    });

    it("should fetch email logs in workspace for workspace members", async () => {
      const response = await request(app)
        .get(`/api/organizations/${organization.id}/workspaces/${workspace.id}/emails`)
        .set("Authorization", ownerToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.logs.length).toBeGreaterThan(0);
      expect(response.body.logs[0].id).toBe(emailLogId);
    });

    it("should deny strangers from listing email logs", async () => {
      const response = await request(app)
        .get(`/api/organizations/${organization.id}/workspaces/${workspace.id}/emails`)
        .set("Authorization", strangerToken);

      expect(response.status).toBe(403);
    });

    it("should track email open public requests and serve 1x1 transparent pixel", async () => {
      const response = await request(app)
        .get(`/api/email/track/open/${emailLogId}`);

      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toBe("image/gif");

      // Verify email log state update
      const updatedLog = await prisma.emailLog.findUnique({
        where: { id: emailLogId },
      });
      expect(updatedLog.status).toBe("opened");
      expect(updatedLog.openedAt).toBeDefined();

      // Verify event logged
      const openEvent = await prisma.credentialEvent.findFirst({
        where: {
          credentialId: credential.id,
          eventType: "email_open",
        },
      });
      expect(openEvent).toBeDefined();
    });

    it("should track email click public requests and redirect to target URL", async () => {
      const targetUrl = "https://eswarlabs.com/verify-details";
      const response = await request(app)
        .get(`/api/email/track/click/${emailLogId}`)
        .query({ url: encodeURIComponent(targetUrl) });

      // Expect redirect
      expect(response.status).toBe(302);
      expect(response.headers.location).toBe(targetUrl);

      // Verify log state update
      const updatedLog = await prisma.emailLog.findUnique({
        where: { id: emailLogId },
      });
      expect(updatedLog.clickedAt).toBeDefined();

      // Verify event logged
      const clickEvent = await prisma.credentialEvent.findFirst({
        where: {
          credentialId: credential.id,
          eventType: "email_click",
        },
      });
      expect(clickEvent).toBeDefined();
    });
  });
});
