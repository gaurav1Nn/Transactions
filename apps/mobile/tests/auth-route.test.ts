import { describe, expect, it } from "vitest";
import { getAuthRedirect } from "../src/providers/auth-route.js";

describe("getAuthRedirect", () => {
  it("sends an unauthenticated user away from app routes", () => {
    expect(getAuthRedirect("unauthenticated", "(app)")).toBe("/(auth)/login");
  });

  it("sends an authenticated user away from auth routes", () => {
    expect(getAuthRedirect("authenticated", "(auth)")).toBe("/(app)");
  });

  it("does not redirect while restoring or when already in the correct route group", () => {
    expect(getAuthRedirect("restoring", "(app)")).toBeNull();
    expect(getAuthRedirect("authenticated", "(app)")).toBeNull();
    expect(getAuthRedirect("unauthenticated", "(auth)")).toBeNull();
  });
});
