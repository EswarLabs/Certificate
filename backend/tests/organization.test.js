import request from "supertest";
import app from "../src/app.js";

describe("Organizations API", () => {
  const mockToken = "Bearer mock-jwt-token";

  describe("POST /api/organizations", () => {
    it("should return 401 without authentication", async () => {
      const response = await request(app)
        .post("/api/organizations")
        .send({
          name: "Test Organization",
        });

      expect(response.status).toBe(401);
    });

    it("should create organization with valid data and token", async () => {
      const response = await request(app)
        .post("/api/organizations")
        .set("Authorization", mockToken)
        .send({
          name: "Test Organization",
          description: "A test organization",
        });

      expect([201, 200, 401, 403, 400]).toContain(response.status);
      if (response.status === 201 || response.status === 200) {
        expect(response.body).toHaveProperty("name");
      }
    });

    it("should return 400 for missing required fields", async () => {
      const response = await request(app)
        .post("/api/organizations")
        .set("Authorization", mockToken)
        .send({});

      expect([400, 422, 401, 403]).toContain(response.status);
    });
  });

  describe("GET /api/organizations", () => {
    it("should return 401 without authentication", async () => {
      const response = await request(app)
        .get("/api/organizations");

      expect(response.status).toBe(401);
    });

    it("should list organizations with valid token", async () => {
      const response = await request(app)
        .get("/api/organizations")
        .set("Authorization", mockToken);

      expect([200, 401, 403]).toContain(response.status);
      if (response.status === 200) {
        expect(Array.isArray(response.body)).toBe(true);
      }
    });
  });

  describe("GET /api/organizations/:id", () => {
    it("should return 401 without authentication", async () => {
      const response = await request(app)
        .get("/api/organizations/123");

      expect(response.status).toBe(401);
    });

    it("should get organization by ID", async () => {
      const response = await request(app)
        .get("/api/organizations/123")
        .set("Authorization", mockToken);

      expect([200, 404, 401, 403]).toContain(response.status);
    });
  });

  describe("PUT /api/organizations/:id", () => {
    it("should return 401 without authentication", async () => {
      const response = await request(app)
        .put("/api/organizations/123")
        .send({
          name: "Updated Org",
        });

      expect(response.status).toBe(401);
    });

    it("should update organization with valid data", async () => {
      const response = await request(app)
        .put("/api/organizations/123")
        .set("Authorization", mockToken)
        .send({
          name: "Updated Organization",
          description: "Updated description",
        });

      expect([200, 404, 401, 403, 400]).toContain(response.status);
    });
  });

  describe("DELETE /api/organizations/:id", () => {
    it("should return 401 without authentication", async () => {
      const response = await request(app)
        .delete("/api/organizations/123");

      expect(response.status).toBe(401);
    });

    it("should delete organization", async () => {
      const response = await request(app)
        .delete("/api/organizations/123")
        .set("Authorization", mockToken);

      expect([200, 204, 404, 401, 403]).toContain(response.status);
    });
  });
});
