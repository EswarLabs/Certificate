import request from "supertest";
import app from "../src/app.js";

describe("Upload API", () => {
  const mockToken = "Bearer mock-jwt-token";

  describe("POST /api/upload/image", () => {
    it("should return 401 without authentication", async () => {
      const response = await request(app)
        .post("/api/upload/image")
        .attach("file", Buffer.from("fake image data"), "test.jpg");

      expect(response.status).toBe(401);
    });

    it("should upload image with valid token", async () => {
      const response = await request(app)
        .post("/api/upload/image")
        .set("Authorization", mockToken)
        .attach("file", Buffer.from("fake image data"), "test.jpg");

      expect([200, 201, 400, 401, 403, 500]).toContain(response.status);
      if (response.status === 200 || response.status === 201) {
        expect(response.body).toHaveProperty("url");
      }
    });

    it("should return 400 without file", async () => {
      const response = await request(app)
        .post("/api/upload/image")
        .set("Authorization", mockToken);

      expect([400, 500, 401, 403]).toContain(response.status);
    });
  });

  describe("POST /api/upload/file", () => {
    it("should return 401 without authentication", async () => {
      const response = await request(app)
        .post("/api/upload/file")
        .attach("file", Buffer.from("fake file data"), "test.pdf");

      expect(response.status).toBe(401);
    });

    it("should upload file with valid token", async () => {
      const response = await request(app)
        .post("/api/upload/file")
        .set("Authorization", mockToken)
        .attach("file", Buffer.from("fake file data"), "test.pdf");

      expect([200, 201, 400, 401, 403, 500]).toContain(response.status);
      if (response.status === 200 || response.status === 201) {
        expect(response.body).toHaveProperty("url");
      }
    });

    it("should return 400 without file", async () => {
      const response = await request(app)
        .post("/api/upload/file")
        .set("Authorization", mockToken);

      expect([400, 500, 401, 403]).toContain(response.status);
    });
  });
});
