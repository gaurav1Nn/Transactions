import { describe, it, expect } from "vitest";
import { loginSchema } from "../src/features/auth/login.schema.js";
import { getLoginErrorMessage } from "../src/features/auth/useLogin.js";
import { AxiosError } from "axios";

describe("Login Schema & Error Handling", () => {
  it("validates correct email and password", () => {
    const valid = loginSchema.safeParse({
      email: "jane@example.com",
      password: "Password123!",
    });
    expect(valid.success).toBe(true);
  });

  it("rejects invalid email formats", () => {
    const res = loginSchema.safeParse({
      email: "not-an-email",
      password: "Password123!",
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0].message).toBe("Enter a valid email address");
    }
  });

  it("rejects empty email and empty password", () => {
    const res = loginSchema.safeParse({
      email: "",
      password: "",
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      const messages = res.error.issues.map((i) => i.message);
      expect(messages).toContain("Enter your email address");
      expect(messages).toContain("Enter your password");
    }
  });

  it("maps 401 to generic credential failure message", () => {
    const err = {
      isAxiosError: true,
      response: {
        status: 401,
        data: {},
      },
    } as unknown as AxiosError;

    const res = getLoginErrorMessage(err);
    expect(res.message).toBe("Email or password is incorrect.");
  });

  it("maps 429 to rate limit message", () => {
    const err = {
      isAxiosError: true,
      response: {
        status: 429,
        data: {},
      },
    } as unknown as AxiosError;

    const res = getLoginErrorMessage(err);
    expect(res.message).toBe(
      "Too many attempts. Please wait a few minutes and try again."
    );
  });

  it("maps timeout to connection failure message", () => {
    const err = {
      isAxiosError: true,
      code: "ECONNABORTED",
    } as unknown as AxiosError;

    const res = getLoginErrorMessage(err);
    expect(res.message).toBe(
      "Can't reach the server. Check your connection and try again."
    );
  });
});
