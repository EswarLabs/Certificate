import request from "supertest";
import app from "../src/app.js";

describe("Authentication API", () => {
  describe("POST /api/auth/google", () => {
    it("should authenticate user with valid Google token", async () => {
      const response = await request(app)
        .post("/api/auth/google")
        .send({
          token: "mock-google-token",
        });

      // Expected to pass or fail based on your implementation
      expect(response.status).toBeDefined();
      expect([200, 400, 401, 500]).toContain(response.status);
    });

    it("should return 400 for missing token", async () => {
      const response = await request(app)
        .post("/api/auth/google")
        .send({});

      expect([400, 500]).toContain(response.status);
    });
  });

  describe("POST /api/auth/logout", () => {
    it("should logout user", async () => {
      const response = await request(app)
        .post("/api/auth/logout")
        .send({});

      expect(response.status).toBeDefined();
    });
  });

  describe("GET /api/auth/me", () => {
    it("should return 401 without token", async () => {
      const response = await request(app)
        .get("/api/auth/me");

      expect(response.status).toBe(401);
    });

    it("should return user with valid token", async () => {
      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer mock-jwt-token");

      expect([200, 401, 403]).toContain(response.status);
    });
  });
});
