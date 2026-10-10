import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { AppError } from "../src/shared/app-error.js";

describe("Security & Hardening Integration", () => {
  it("includes security headers via Helmet", async () => {
    const app = createApp();
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-frame-options"]).toBeDefined();
  });

  it("rejects oversized request bodies with 413", async () => {
    const app = createApp({ bodyLimit: "1kb" });
    const largePayload = {
      name: "A".repeat(2048),
      email: "large@example.com",
      password: "Password123!",
    };

    const res = await request(app)
      .post("/api/auth/register")
      .send(largePayload);

    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe("PAYLOAD_TOO_LARGE");
    expect(res.body.error.requestId).toBeDefined();
  });

  it("rate limits repeated login abuse with 429 in an isolated rate-limit test", async () => {
    // Isolated app with low rate limit threshold
    const app = createApp({
      enableRateLimit: true,
      authRateLimitMax: 3,
    });

    const credentials = {
      email: "badlogin@example.com",
      password: "WrongPassword1!",
    };

    // First 3 attempts return 401
    for (let i = 0; i < 3; i++) {
      const res = await request(app).post("/api/auth/login").send(credentials);
      expect([401, 404]).toContain(res.status);
    }

    // 4th attempt exceeds rate limit
    const resBlocked = await request(app)
      .post("/api/auth/login")
      .send(credentials);

    expect(resBlocked.status).toBe(429);
    expect(resBlocked.body.error.code).toBe("RATE_LIMIT_EXCEEDED");
    expect(resBlocked.body.error.requestId).toBeDefined();
  });

  it("production 500 contains no stack, SQL, password, JWT, or database URL", async () => {
    const app = createApp((testApp) => {
      testApp.get("/test-error", () => {
        throw new Error(
          "FATAL: postgresql://postgres:secret123@db:5432/ace_prod error SELECT * FROM users WHERE password_hash = 'secret_hash' JWT_SECRET=super_secret"
        );
      });
    });

    const res = await request(app).get("/test-error");

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("INTERNAL_SERVER_ERROR");
    expect(res.body.error.message).toBe("An unexpected error occurred");
    expect(res.body.error.requestId).toBeDefined();

    // Sensitive info must NOT be present
    const responseString = JSON.stringify(res.body);
    expect(responseString).not.toContain("stack");
    expect(responseString).not.toContain("postgresql://");
    expect(responseString).not.toContain("secret123");
    expect(responseString).not.toContain("secret_hash");
    expect(responseString).not.toContain("super_secret");
    expect(responseString).not.toContain("SELECT * FROM");
  });
});
