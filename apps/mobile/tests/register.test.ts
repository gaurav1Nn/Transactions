import { describe, it, expect } from "vitest";
import {
  registerSchema,
  passwordCriteria,
} from "../src/features/auth/register.schema.js";

describe("Register Schema & Password Requirements", () => {
  it("passwordCriteria validates all 4 rules accurately", () => {
    // Length
    expect(passwordCriteria.minLength("short")).toBe(false);
    expect(passwordCriteria.minLength("12345678")).toBe(true);

    // Case
    expect(passwordCriteria.hasCase("lowercase")).toBe(false);
    expect(passwordCriteria.hasCase("UPPERCASE")).toBe(false);
    expect(passwordCriteria.hasCase("MixedCase")).toBe(true);

    // Number
    expect(passwordCriteria.hasNumber("NoNumbers")).toBe(false);
    expect(passwordCriteria.hasNumber("Number123")).toBe(true);

    // Special
    expect(passwordCriteria.hasSpecial("NoSpecial123")).toBe(false);
    expect(passwordCriteria.hasSpecial("Special!123")).toBe(true);
  });

  it("accepts valid registration data", () => {
    const res = registerSchema.safeParse({
      name: "Jane Doe",
      email: "jane@example.com",
      password: "Password123!",
      confirmPassword: "Password123!",
    });
    expect(res.success).toBe(true);
  });

  it("rejects password confirmation mismatch", () => {
    const res = registerSchema.safeParse({
      name: "Jane Doe",
      email: "jane@example.com",
      password: "Password123!",
      confirmPassword: "DifferentPassword123!",
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0].message).toBe("Passwords do not match");
      expect(res.error.issues[0].path).toContain("confirmPassword");
    }
  });

  it("rejects blank name and invalid email", () => {
    const res = registerSchema.safeParse({
      name: "   ",
      email: "not-an-email",
      password: "Password123!",
      confirmPassword: "Password123!",
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      const messages = res.error.issues.map((i) => i.message);
      expect(messages).toContain("Enter your full name");
      expect(messages).toContain("Enter a valid email address");
    }
  });

  it("rejects passwords lacking required complexity", () => {
    const res = registerSchema.safeParse({
      name: "Jane Doe",
      email: "jane@example.com",
      password: "alllowercase123!",
      confirmPassword: "alllowercase123!",
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0].message).toContain("uppercase, lowercase, number, and special character");
    }
  });
});
