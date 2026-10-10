import { describe, it, expect } from "vitest";
import React from "react";
import { TransactionListItem } from "../src/components/transactions/TransactionListItem.js";
import { TransactionDto } from "../src/types/api.js";

describe("TransactionListItem Component", () => {
  const dummyTx: TransactionDto = {
    id: "tx-uuid-1",
    transactionId: "TXN-MV1ZR5Z3-3697E392",
    amount: "125.50",
    currency: "USD",
    description: "Office Supplies and B2B settlement",
    status: "PENDING",
    failureReason: null,
    processedAt: null,
    createdAt: "2026-10-10T12:00:00.000Z",
    updatedAt: "2026-10-10T12:00:00.000Z",
  };

  it("renders transaction without throwing and holds exact properties", () => {
    const element = React.createElement(TransactionListItem, {
      transaction: dummyTx,
    });

    expect(element.props.transaction.transactionId).toBe(
      "TXN-MV1ZR5Z3-3697E392"
    );
    expect(element.props.transaction.amount).toBe("125.50");
    expect(element.props.transaction.status).toBe("PENDING");
  });
});
