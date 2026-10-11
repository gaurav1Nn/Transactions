import { describe, it, expect } from "vitest";
import { parseEnv } from "../src/config/env.js";

describe("Environment Configuration", () => {
  it("parseEnv rejects missing production secrets", () => {
    expect(() => {
      parseEnv({
        NODE_ENV: "production",
      });
    }).toThrow();
  });

  it("parseEnv applies safe development defaults only where allowed", () => {
    const parsed = parseEnv({
      NODE_ENV: "development",
      DATABASE_URL: "postgresql://localhost:5432/ace_dev",
      JWT_SECRET: "development-secret-that-is-at-least-32-chars-long",
    });

    expect(parsed.NODE_ENV).toBe("development");
    expect(parsed.PORT).toBe(3000);
    expect(parsed.BCRYPT_ROUNDS).toBe(10);
    expect(parsed.LOG_LEVEL).toBe("info");
    expect(parsed.JWT_EXPIRES_IN).toBe("24h");
    expect(parsed.CORS_ORIGINS).toEqual(["*"]);
    expect(parsed.TRUST_PROXY_HOPS).toBe(0);
  });

  it("accepts an explicit trusted proxy hop count for reverse-proxy deployments", () => {
    const parsed = parseEnv({
      DATABASE_URL: "postgresql://localhost:5432/ace_dev",
      JWT_SECRET: "development-secret-that-is-at-least-32-chars-long",
      TRUST_PROXY_HOPS: "1",
    });

    expect(parsed.TRUST_PROXY_HOPS).toBe(1);
  });
});
