import { describe, expect, it } from "vitest";
import {
  decodeTransactionCursor,
  encodeTransactionCursor,
} from "./transaction-cursor.js";

describe("transaction cursor", () => {
  it("round-trips the sort fields used for keyset pagination", () => {
    const cursor = encodeTransactionCursor({
      createdAt: new Date("2026-10-10T12:34:56.000Z"),
      id: "550e8400-e29b-41d4-a716-446655440000",
    });

    expect(decodeTransactionCursor(cursor)).toEqual({
      createdAt: new Date("2026-10-10T12:34:56.000Z"),
      id: "550e8400-e29b-41d4-a716-446655440000",
    });
  });

  it("rejects malformed cursors", () => {
    expect(() => decodeTransactionCursor("not-a-cursor")).toThrow(
      "Invalid transaction cursor"
    );
  });
});
