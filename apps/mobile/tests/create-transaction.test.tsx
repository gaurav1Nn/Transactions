import { describe, it, expect } from "vitest";
import { createTransactionSchema } from "../src/features/transactions/create-transaction.schema.js";
import {
  generateIdempotencyKey,
  getTransactionPayloadFingerprint,
  shouldRotateIdempotencyKey,
} from "../src/utils/idempotency-key.js";

describe("Create Transaction Schema & Idempotency Key", () => {
  it("generates valid UUID v4 idempotency keys", () => {
    const key1 = generateIdempotencyKey();
    const key2 = generateIdempotencyKey();

    expect(key1).not.toBe(key2);
    expect(key1).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  it("validates correct transaction input", () => {
    const valid = createTransactionSchema.safeParse({
      amount: "125.50",
      currency: "USD",
      description: "Client invoice payment",
    });
    expect(valid.success).toBe(true);
  });

  it("rejects zero and negative amounts", () => {
    const zero = createTransactionSchema.safeParse({
      amount: "0.00",
      currency: "USD",
      description: "Zero test",
    });
    expect(zero.success).toBe(false);

    const negative = createTransactionSchema.safeParse({
      amount: "-10.00",
      currency: "USD",
      description: "Negative test",
    });
    expect(negative.success).toBe(false);
  });

  it("rejects oversized descriptions", () => {
    const oversized = createTransactionSchema.safeParse({
      amount: "10.00",
      currency: "USD",
      description: "A".repeat(256),
    });
    expect(oversized.success).toBe(false);
  });

  it("keeps a retry key for the same payload and rotates it for an edited payload", () => {
    const original = getTransactionPayloadFingerprint({
      amount: "10.00",
      currency: "USD",
      description: "First attempt",
    });
    const edited = getTransactionPayloadFingerprint({
      amount: "12.00",
      currency: "USD",
      description: "First attempt",
    });

    expect(shouldRotateIdempotencyKey(original, original)).toBe(false);
    expect(shouldRotateIdempotencyKey(original, edited)).toBe(true);
  });
});
