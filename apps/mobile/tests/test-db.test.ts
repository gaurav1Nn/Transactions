import { describe, expect, it } from "vitest";
import { resolveTestDatabaseUrl } from "./test-db.js";

describe("mobile end-to-end test database configuration", () => {
  it("uses an explicitly supplied test database URL", () => {
    expect(
      resolveTestDatabaseUrl({
        TEST_DATABASE_URL: "postgresql://localhost:5432/ace_mobile_test",
      })
    ).toBe("postgresql://localhost:5432/ace_mobile_test");
  });

  it("rejects a database URL that is not clearly a test database", () => {
    expect(() =>
      resolveTestDatabaseUrl({
        TEST_DATABASE_URL: "postgresql://localhost:5432/ace_dev",
      })
    ).toThrow("must end with '_test'");
  });

  it("does not fall back to DATABASE_URL", () => {
    expect(() =>
      resolveTestDatabaseUrl({
        DATABASE_URL: "postgresql://localhost:5432/ace_dev",
      })
    ).toThrow("TEST_DATABASE_URL is required");
  });
});
