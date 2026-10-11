import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { prisma } from "../src/shared/prisma.js";

describe("Health API", () => {
  it("GET /health returns API readiness without authentication", async () => {
    const app = createApp();
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.body).toEqual({
      data: {
        status: "ok",
      },
    });
  });

  it("GET /ready reports database readiness", async () => {
    const app = createApp();

    const response = await request(app).get("/ready");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: { status: "ready" } });
  });

  it("GET /ready fails when the token-revocation table is unavailable", async () => {
    const check = vi.spyOn(prisma.revokedToken, "findFirst").mockRejectedValueOnce(
      new Error("revoked_tokens unavailable")
    );
    try {
      const response = await request(createApp()).get("/ready");
      expect(response.status).toBe(503);
      expect(response.body.error.code).toBe("SERVICE_UNAVAILABLE");
    } finally {
      check.mockRestore();
    }
  });

  it("GET /ready returns 503 when the database check fails", async () => {
    const app = createApp({
      readinessCheck: async () => {
        throw new Error("database unavailable");
      },
    });

    const response = await request(app).get("/ready");

    expect(response.status).toBe(503);
    expect(response.body.error.code).toBe("SERVICE_UNAVAILABLE");
  });
});
