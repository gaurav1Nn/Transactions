import { describe, it, expect } from "vitest";
import jwt from "jsonwebtoken";
import { signAccessToken, verifyAccessToken } from "./jwt.js";
import { env } from "../config/env.js";

describe("JWT Security Helper", () => {
  it("valid signed token returns original subject", () => {
    const userId = "550e8400-e29b-41d4-a716-446655440000";
    const token = signAccessToken(userId);

    const payload = verifyAccessToken(token);
    expect(payload.sub).toBe(userId);
  });

  it("altered token is rejected with an error", () => {
    const userId = "550e8400-e29b-41d4-a716-446655440000";
    const token = signAccessToken(userId);
    const tampered = token.slice(0, -5) + "abcde";

    expect(() => {
      verifyAccessToken(tampered);
    }).toThrow();
  });

  it("expired token is rejected with an error", () => {
    const expiredToken = jwt.sign(
      { sub: "550e8400-e29b-41d4-a716-446655440000" },
      env.JWT_SECRET,
      { expiresIn: "-1s" }
    );

    expect(() => {
      verifyAccessToken(expiredToken);
    }).toThrow();
  });

  it("malformed token string is rejected", () => {
    expect(() => {
      verifyAccessToken("not.a.jwt");
    }).toThrow();
  });
});
