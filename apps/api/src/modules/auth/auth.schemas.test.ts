import { describe, expect, it } from "vitest";
import { registerSchema } from "./auth.schemas.js";

describe("registerSchema", () => {
  it("rejects passwords longer than bcrypt's 72-byte input limit", () => {
    const result = registerSchema.safeParse({
      body: {
        name: "Long Password User",
        email: "long-password@example.com",
        password: `${"a".repeat(72)}1`,
      },
    });

    expect(result.success).toBe(false);
  });

  it("rejects passwords that do not meet the documented complexity rules", () => {
    const result = registerSchema.safeParse({
      body: {
        name: "Weak Password User",
        email: "weak-password@example.com",
        password: "alllowercase123!",
      },
    });

    expect(result.success).toBe(false);
  });
});
