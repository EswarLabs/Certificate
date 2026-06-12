import { jest } from "@jest/globals";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import cloudinary from "../src/lib/cloudinary.js";

describe("Multi-User, Multi-Org, Multi-Workspace Integration Scenarios", () => {
  jest.setTimeout(30000);

  let userA, userB, userC, userD;
  let tokenA, tokenB, tokenC, tokenD;
  let orgA, orgB;
  let workspaceA1, workspaceA2, workspaceB1;
  let templateT1, templateT2;

  beforeAll(async () => {
    // Mock Cloudinary upload
    jest.spyOn(cloudinary.uploader, "upload").mockImplementation((filePath, options) => {
      return Promise.resolve({
        secure_url: `https://res.cloudinary.com/demo/image/upload/v12345/${options?.folder || "files"}/mock-file`,
        public_id: `mock-public-id-${Date.now()}`,
      });
    });
    // 1. Clean up any existing test accounts to keep test idempotent
    const testEmails = [
      "test_owner_a@example.com",
      "test_admin_b@example.com",
      "test_member_c@example.com",
      "test_stranger_d@example.com",
    ];

    await prisma.membership.deleteMany({
      where: {
        user: {
          email: { in: testEmails },
        },
      },
    });

    await prisma.file.deleteMany({
      where: {
        uploadedBy: {
          email: { in: testEmails },
        },
      },
    });

    await prisma.certificateTemplate.deleteMany({
      where: {
        createdBy: {
          email: { in: testEmails },
        },
      },
    });

    await prisma.user.deleteMany({
      where: {
        email: { in: testEmails },
      },
    });

    await prisma.organization.deleteMany({
      where: {
        slug: { startsWith: "test-org-" },
      },
    });

    // 2. Create Users
    userA = await prisma.user.create({
      data: {
        email: "test_owner_a@example.com",
        firstName: "Owner",
        lastName: "A",
      },
    });

    userB = await prisma.user.create({
      data: {
        email: "test_admin_b@example.com",
        firstName: "Admin",
        lastName: "B",
      },
    });

    userC = await prisma.user.create({
      data: {
        email: "test_member_c@example.com",
        firstName: "Member",
        lastName: "C",
      },
    });

    userD = await prisma.user.create({
      data: {
        email: "test_stranger_d@example.com",
        firstName: "Stranger",
        lastName: "D",
      },
    });

    // 3. Generate JWT Tokens
    const secret = process.env.JWT_SECRET || "your_jwt_secret_key";
    tokenA = `Bearer ${jwt.sign({ userId: userA.id, email: userA.email }, secret)}`;
    tokenB = `Bearer ${jwt.sign({ userId: userB.id, email: userB.email }, secret)}`;
    tokenC = `Bearer ${jwt.sign({ userId: userC.id, email: userC.email }, secret)}`;
    tokenD = `Bearer ${jwt.sign({ userId: userD.id, email: userD.email }, secret)}`;

    // 4. Create Organizations
    const suffix = Date.now();
    orgA = await prisma.organization.create({
      data: {
        name: "Test Org A",
        slug: `test-org-a-${suffix}`,
      },
    });

    orgB = await prisma.organization.create({
      data: {
        name: "Test Org B",
        slug: `test-org-b-${suffix}`,
      },
    });

    // 5. Create Workspaces
    workspaceA1 = await prisma.workspace.create({
      data: {
        name: "Workspace A1",
        organizationId: orgA.id,
        slug: `workspace-a1-${suffix}`,
      },
    });

    workspaceA2 = await prisma.workspace.create({
      data: {
        name: "Workspace A2",
        organizationId: orgA.id,
        slug: `workspace-a2-${suffix}`,
      },
    });

    workspaceB1 = await prisma.workspace.create({
      data: {
        name: "Workspace B1",
        organizationId: orgB.id,
        slug: `workspace-b1-${suffix}`,
      },
    });

    // 6. Create Memberships
    // User A is OWNER of Workspace A1 & A2 in Org A
    await prisma.membership.create({
      data: {
        userId: userA.id,
        organizationId: orgA.id,
        workspaceId: workspaceA1.id,
        role: "OWNER",
      },
    });

    await prisma.membership.create({
      data: {
        userId: userA.id,
        organizationId: orgA.id,
        workspaceId: workspaceA2.id,
        role: "OWNER",
      },
    });

    // User B is ADMIN of Workspace A1 in Org A
    await prisma.membership.create({
      data: {
        userId: userB.id,
        organizationId: orgA.id,
        workspaceId: workspaceA1.id,
        role: "ADMIN",
      },
    });

    // User C is MEMBER of Workspace A1 in Org A
    await prisma.membership.create({
      data: {
        userId: userC.id,
        organizationId: orgA.id,
        workspaceId: workspaceA1.id,
        role: "MEMBER",
      },
    });

    // User D is OWNER of Workspace B1 in Org B
    await prisma.membership.create({
      data: {
        userId: userD.id,
        organizationId: orgB.id,
        workspaceId: workspaceB1.id,
        role: "OWNER",
      },
    });

    // 7. Create Certificate Templates
    templateT1 = await prisma.certificateTemplate.create({
      data: {
        name: "Template T1",
        description: "Template T1 description",
        htmlTemplate: "<div>Test Template T1</div>",
        cssStyles: ".title { color: red; }",
        orientation: "landscape",
        schemaDefinition: [
          { key: "recipientName", label: "Recipient Name", type: "text", required: true }
        ],
        workspaceId: workspaceA1.id,
        createdById: userA.id,
      }
    });

    templateT2 = await prisma.certificateTemplate.create({
      data: {
        name: "Template T2",
        description: "Template T2 description",
        htmlTemplate: "<div>Test Template T2</div>",
        cssStyles: ".title { color: blue; }",
        orientation: "landscape",
        schemaDefinition: [
          { key: "recipientName", label: "Recipient Name", type: "text", required: true }
        ],
        workspaceId: workspaceA1.id,
        createdById: userB.id,
      }
    });
  }, 30000);

  afterAll(async () => {
    // Cleanup databases entries created during test
    const testEmails = [
      "test_owner_a@example.com",
      "test_admin_b@example.com",
      "test_member_c@example.com",
      "test_stranger_d@example.com",
    ];

    await prisma.membership.deleteMany({
      where: {
        user: {
          email: { in: testEmails },
        },
      },
    });

    await prisma.file.deleteMany({
      where: {
        uploadedBy: {
          email: { in: testEmails },
        },
      },
    });

    await prisma.certificateTemplate.deleteMany({
      where: {
        createdBy: {
          email: { in: testEmails },
        },
      },
    });

    await prisma.user.deleteMany({
      where: {
        email: { in: testEmails },
      },
    });

    await prisma.organization.deleteMany({
      where: {
        slug: { startsWith: "test-org-" },
      },
    });

    await prisma.$disconnect();
  }, 30000);

  describe("User Access Control and Profile Updates", () => {
    it("should allow a user to update their own profile", async () => {
      const response = await request(app)
        .put(`/api/users/${userA.id}`)
        .set("Authorization", tokenA)
        .send({
          firstName: "NewOwnerName",
          lastName: "A",
        });

      expect(response.status).toBe(200);
      expect(response.body.firstName).toBe("NewOwnerName");
    });

    it("should deny updating another user's profile", async () => {
      const response = await request(app)
        .put(`/api/users/${userB.id}`)
        .set("Authorization", tokenA)
        .send({
          firstName: "Hacked",
        });

      expect(response.status).toBe(403);
    });
  });

  describe("Workspace Creation Authorization (Multi-Org / Roles)", () => {
    it("should allow Org OWNER to create a workspace", async () => {
      const response = await request(app)
        .post(`/api/organizations/${orgA.id}/workspaces`)
        .set("Authorization", tokenA)
        .send({
          name: "Owner Workspace",
        });

      expect(response.status).toBe(201);
      expect(response.body.workspace.name).toBe("Owner Workspace");
    });

    it("should allow Org ADMIN to create a workspace", async () => {
      const response = await request(app)
        .post(`/api/organizations/${orgA.id}/workspaces`)
        .set("Authorization", tokenB)
        .send({
          name: "Admin Workspace",
        });

      expect(response.status).toBe(201);
      expect(response.body.workspace.name).toBe("Admin Workspace");
    });

    it("should deny workspace creation to a standard MEMBER", async () => {
      const response = await request(app)
        .post(`/api/organizations/${orgA.id}/workspaces`)
        .set("Authorization", tokenC)
        .send({
          name: "Member Workspace",
        });

      expect(response.status).toBe(403);
    });

    it("should deny workspace creation to a user not part of the organization", async () => {
      const response = await request(app)
        .post(`/api/organizations/${orgA.id}/workspaces`)
        .set("Authorization", tokenD)
        .send({
          name: "Stranger Workspace",
        });

      expect(response.status).toBe(403);
    });
  });

  describe("File Upload Access Control (Multi-Role)", () => {
    it("should allow workspace OWNER to upload a file to their workspace", async () => {
      const response = await request(app)
        .post(`/api/organizations/${orgA.id}/workspaces/${workspaceA1.id}/upload`)
        .set("Authorization", tokenA)
        .attach("file", Buffer.from("dummy data"), "certificate.pdf");

      expect([200, 201]).toContain(response.status);
    });

    it("should allow workspace ADMIN to upload a file to their workspace", async () => {
      const response = await request(app)
        .post(`/api/organizations/${orgA.id}/workspaces/${workspaceA1.id}/upload`)
        .set("Authorization", tokenB)
        .attach("file", Buffer.from("dummy data"), "certificate.pdf");

      expect([200, 201]).toContain(response.status);
    });

    it("should allow workspace MEMBER to upload a file to their workspace", async () => {
      const response = await request(app)
        .post(`/api/organizations/${orgA.id}/workspaces/${workspaceA1.id}/upload`)
        .set("Authorization", tokenC)
        .attach("file", Buffer.from("dummy data"), "certificate.pdf");

      expect([200, 201]).toContain(response.status);
    });

    it("should deny file upload to a user who is not a member of the workspace", async () => {
      const response = await request(app)
        .post(`/api/organizations/${orgA.id}/workspaces/${workspaceA1.id}/upload`)
        .set("Authorization", tokenD)
        .attach("file", Buffer.from("dummy data"), "certificate.pdf");

      expect(response.status).toBe(403);
    });
  });

  describe("Certificate Templates CRUD Access Control", () => {
    it("should allow workspace members (OWNER) to create templates", async () => {
      const response = await request(app)
        .post(`/api/organizations/${orgA.id}/workspaces/${workspaceA1.id}/templates`)
        .set("Authorization", tokenA)
        .send({
          name: "New Template A",
          htmlTemplate: "<div>Template A Content</div>",
          schemaDefinition: [
            { key: "certId", label: "Certificate ID", type: "number", required: true }
          ]
        });

      expect(response.status).toBe(201);
    });

    it("should allow template creator to update their template", async () => {
      const response = await request(app)
        .put(`/api/organizations/${orgA.id}/workspaces/${workspaceA1.id}/templates/${templateT2.id}`)
        .set("Authorization", tokenB)
        .send({
          name: "Updated Template T2 By Creator",
          htmlTemplate: "<div>Updated T2 Content</div>",
          schemaDefinition: [
            { key: "recipientName", label: "Recipient Name", type: "text", required: true }
          ]
        });

      expect(response.status).toBe(200);
    });

    it("should allow workspace OWNER to update another user's template in their workspace", async () => {
      const response = await request(app)
        .put(`/api/organizations/${orgA.id}/workspaces/${workspaceA1.id}/templates/${templateT2.id}`)
        .set("Authorization", tokenA)
        .send({
          name: "Updated Template T2 By Owner",
          htmlTemplate: "<div>Updated T2 Content</div>",
          schemaDefinition: [
            { key: "recipientName", label: "Recipient Name", type: "text", required: true }
          ]
        });

      expect(response.status).toBe(200);
    });

    it("should deny standard MEMBER from updating a template they didn't create", async () => {
      const response = await request(app)
        .put(`/api/organizations/${orgA.id}/workspaces/${workspaceA1.id}/templates/${templateT1.id}`)
        .set("Authorization", tokenC)
        .send({
          name: "Hacked Template",
          htmlTemplate: "<div>Hacked content</div>",
          schemaDefinition: []
        });

      expect(response.status).toBe(403);
    });

    it("should deny standard MEMBER from deleting a template they didn't create", async () => {
      const response = await request(app)
        .delete(`/api/organizations/${orgA.id}/workspaces/${workspaceA1.id}/templates/${templateT1.id}`)
        .set("Authorization", tokenC);

      expect(response.status).toBe(403);
    });

    it("should allow workspace OWNER to delete any template in the workspace", async () => {
      const response = await request(app)
        .delete(`/api/organizations/${orgA.id}/workspaces/${workspaceA1.id}/templates/${templateT1.id}`)
        .set("Authorization", tokenA);

      expect(response.status).toBe(204);
    });
  });
});
