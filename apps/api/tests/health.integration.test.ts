import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

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
});
