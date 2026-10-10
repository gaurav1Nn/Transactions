import { describe, it, expect } from "vitest";
import {
  getSectionHeaderInfo,
  groupTransactionsByDate,
} from "../src/features/transactions/TransactionHistoryList.js";
import { TransactionDto } from "../src/types/api.js";

describe("Transaction History Date Grouping", () => {
  it("getSectionHeaderInfo tags today and yesterday accurately", () => {
    const now = new Date();
    const todayInfo = getSectionHeaderInfo(now);
    expect(todayInfo.tag).toBe("Today");

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayInfo = getSectionHeaderInfo(yesterday);
    expect(yesterdayInfo.tag).toBe("Yesterday");

    const pastDate = new Date(2025, 0, 15);
    const pastInfo = getSectionHeaderInfo(pastDate);
    expect(pastInfo.tag).toBeUndefined();
    expect(pastInfo.title).toContain("JAN 2025");
  });

  it("groupTransactionsByDate organizes items into ordered date sections", () => {
    const tx1: TransactionDto = {
      id: "tx-1",
      transactionId: "TXN-1",
      amount: "10.00",
      currency: "USD",
      description: "First",
      status: "PENDING",
      failureReason: null,
      processedAt: null,
      createdAt: "2026-10-10T14:00:00.000Z",
      updatedAt: "2026-10-10T14:00:00.000Z",
    };

    const tx2: TransactionDto = {
      id: "tx-2",
      transactionId: "TXN-2",
      amount: "20.00",
      currency: "USD",
      description: "Second",
      status: "SUCCESS",
      failureReason: null,
      processedAt: null,
      createdAt: "2026-10-10T11:00:00.000Z",
      updatedAt: "2026-10-10T11:00:00.000Z",
    };

    const tx3: TransactionDto = {
      id: "tx-3",
      transactionId: "TXN-3",
      amount: "30.00",
      currency: "USD",
      description: "Third",
      status: "FAILED",
      failureReason: null,
      processedAt: null,
      createdAt: "2026-10-09T09:00:00.000Z",
      updatedAt: "2026-10-09T09:00:00.000Z",
    };

    const sections = groupTransactionsByDate([tx1, tx2, tx3]);

    expect(sections).toHaveLength(2);
    expect(sections[0].data).toHaveLength(2);
    expect(sections[1].data).toHaveLength(1);
    expect(sections[0].data[0].id).toBe("tx-1");
    expect(sections[1].data[0].id).toBe("tx-3");
  });
});
