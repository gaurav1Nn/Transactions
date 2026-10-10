import { describe, it, expect } from "vitest";
import { transactionsQueryKeys } from "../src/features/transactions/query-keys.js";

describe("Transactions query keys factory", () => {
  it("generates stable hierarchical keys", () => {
    expect(transactionsQueryKeys.all).toEqual(["transactions"]);
    expect(transactionsQueryKeys.lists()).toEqual(["transactions", "list"]);
    expect(transactionsQueryKeys.list({ page: 1, limit: 20 })).toEqual([
      "transactions",
      "list",
      { page: 1, limit: 20 },
    ]);
    expect(transactionsQueryKeys.details()).toEqual([
      "transactions",
      "detail",
    ]);
    expect(transactionsQueryKeys.detail("TXN-123")).toEqual([
      "transactions",
      "detail",
      "TXN-123",
    ]);
    expect(transactionsQueryKeys.statusCount("PENDING")).toEqual([
      "transactions",
      "count",
      "PENDING",
    ]);
  });
});
