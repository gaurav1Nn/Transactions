import { describe, it, expect } from "vitest";
import request from "supertest";
import { z } from "zod";
import { createApp } from "../src/app.js";
import { validate } from "../src/middleware/validate.js";
import { AppError } from "../src/shared/app-error.js";

describe("Request ID, Validation & Error Handling", () => {
  it("unknown route returns structured 404 with requestId", async () => {
    const app = createApp();
    const res = await request(app).get("/api/unknown-endpoint");

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
    expect(res.body.error).toMatchObject({
      code: "NOT_FOUND",
      message: "Route not found",
    });
    expect(res.body.error.requestId).toBeDefined();
    expect(res.headers["x-request-id"]).toBe(res.body.error.requestId);
  });

  it("preserves inbound X-Request-ID header", async () => {
    const customId = "custom-client-req-id-12345";
    const app = createApp();
    const res = await request(app)
      .get("/health")
      .set("X-Request-ID", customId);

    expect(res.headers["x-request-id"]).toBe(customId);
  });

  it("validation middleware returns 422 with field details on invalid body", async () => {
    const testSchema = z.object({
      body: z.object({
        email: z.string().email("Invalid email format"),
        age: z.number().int().min(18, "Must be at least 18"),
      }),
    });

    const app = createApp((appInstance) => {
      appInstance.post("/test-validation", validate(testSchema), (_req, res) => {
        res.status(200).json({ data: "ok" });
      });
    });

    const res = await request(app)
      .post("/test-validation")
      .send({ email: "invalid-email", age: 10 });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.details).toEqual(
      expect.arrayContaining([
        { field: "body.email", message: "Invalid email format" },
        { field: "body.age", message: "Must be at least 18" },
      ])
    );
    expect(res.body.error.requestId).toBeDefined();
  });

  it("handles malformed JSON body with 400 BAD_REQUEST", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/health")
      .set("Content-Type", "application/json")
      .send("{ invalid json: ");

    expect(res.status).toBe(400);
    expect(res.body.error).toMatchObject({
      code: "BAD_REQUEST",
      message: "Malformed JSON payload",
    });
    expect(res.body.error.requestId).toBeDefined();
  });

  it("handles unexpected errors with safe 500 without leaking stack", async () => {
    const app = createApp((appInstance) => {
      appInstance.get("/test-error", () => {
        throw new Error("Internal secret database connection leak details");
      });
    });

    const res = await request(app).get("/test-error");

    expect(res.status).toBe(500);
    expect(res.body.error).toEqual({
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred",
      requestId: expect.any(String),
    });
    expect(res.body).not.toHaveProperty("stack");
  });

  it("handles custom AppError with defined status code", async () => {
    const app = createApp((appInstance) => {
      appInstance.get("/test-app-error", () => {
        throw new AppError("RESOURCE_CONFLICT", "Conflict detected", 409);
      });
    });

    const res = await request(app).get("/test-app-error");

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("RESOURCE_CONFLICT");
    expect(res.body.error.message).toBe("Conflict detected");
  });
});
