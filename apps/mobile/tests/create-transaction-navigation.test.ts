import { describe, expect, it } from "vitest";
import { shouldPromptBeforeLeavingTransaction } from "../src/features/transactions/create-transaction-navigation.js";

describe("shouldPromptBeforeLeavingTransaction", () => {
  it("prompts before leaving an unsaved transaction", () => {
    expect(
      shouldPromptBeforeLeavingTransaction({
        hasUnsavedInput: true,
        isSubmitting: false,
        discardConfirmed: false,
      })
    ).toBe(true);
  });

  it("allows removal after discard is confirmed", () => {
    expect(
      shouldPromptBeforeLeavingTransaction({
        hasUnsavedInput: true,
        isSubmitting: false,
        discardConfirmed: true,
      })
    ).toBe(false);
  });
});
