import { describe, expect, it } from "vitest";
import {
  listTransactionsSchema,
  normalizeIdempotencyKey,
} from "./transactions.schemas.js";

describe("transaction request validation", () => {
  it("rejects an unreasonably large page number", () => {
    const result = listTransactionsSchema.safeParse({
      query: { page: "100001" },
    });

    expect(result.success).toBe(false);
  });

  it("normalizes an idempotency key before it reaches persistence", () => {
    expect(normalizeIdempotencyKey("  payment-attempt-1  ")).toBe(
      "payment-attempt-1"
    );
  });

  it("rejects malformed pagination cursors", () => {
    const result = listTransactionsSchema.safeParse({
      query: { cursor: "not-a-cursor" },
    });

    expect(result.success).toBe(false);
  });
});
