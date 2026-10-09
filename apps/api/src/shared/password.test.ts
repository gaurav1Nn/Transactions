import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "./password.js";

describe("Password Security Helper", () => {
  it("hash differs from plaintext", async () => {
    const raw = "SuperSecretP@ssw0rd";
    const hashed = await hashPassword(raw);

    expect(hashed).not.toBe(raw);
    expect(hashed).toMatch(/^\$2[aby]\$/);
  });

  it("correct password verifies successfully", async () => {
    const raw = "SuperSecretP@ssw0rd";
    const hashed = await hashPassword(raw);

    const isValid = await verifyPassword(raw, hashed);
    expect(isValid).toBe(true);
  });

  it("incorrect password fails verification", async () => {
    const raw = "SuperSecretP@ssw0rd";
    const hashed = await hashPassword(raw);

    const isValid = await verifyPassword("WrongPassword123", hashed);
    expect(isValid).toBe(false);
  });
});
