import { describe, expect, it } from "vitest";
import { getTransactionDetailsState } from "../src/features/transactions/transaction-details-state.js";

describe("getTransactionDetailsState", () => {
  it("shows a retryable error when loading fails without a transaction", () => {
    expect(
      getTransactionDetailsState({
        isLoading: false,
        isError: true,
        isNotFound: false,
        hasTransaction: false,
      })
    ).toBe("error");
  });

  it("shows not found only for an actual 404", () => {
    expect(
      getTransactionDetailsState({
        isLoading: false,
        isError: true,
        isNotFound: true,
        hasTransaction: false,
      })
    ).toBe("not-found");
  });
});
