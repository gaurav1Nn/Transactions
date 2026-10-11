import React from "react";
import { describe, expect, it, vi } from "vitest";
const { renderToStaticMarkup } = require("react-dom/server") as {
  renderToStaticMarkup: (element: React.ReactElement) => string;
};

vi.mock("react-native", async (importOriginal) => {
  const original = await importOriginal<typeof import("react-native")>();
  return {
    ...original,
    View: ({ children }: { children: React.ReactNode }) =>
      React.createElement("div", null, children),
  };
});

vi.mock("expo-router", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useLocalSearchParams: () => ({}),
}));
vi.mock("../src/providers/AuthProvider.js", () => ({
  useAuth: () => ({ user: { name: "Test User" } }),
}));
vi.mock("../src/features/transactions/transaction-hooks.js", () => ({
  useInfiniteTransactions: () => ({
    items: [{
      id: "11111111-1111-4111-8111-111111111111",
      transactionId: "TXN-TEST",
      amount: "10.00",
      currency: "USD",
      description: "Test",
      status: "PENDING",
      failureReason: null,
      processedAt: null,
      createdAt: "2026-10-10T11:00:00.000Z",
      updatedAt: "2026-10-10T11:00:00.000Z",
    }],
    isLoading: false,
    isError: true,
    isFetchNextPageError: true,
    errorMessage: "Network error",
    fetchNextPage: vi.fn(),
    hasNextPage: true,
    isFetchingNextPage: false,
    refetch: vi.fn(),
    isRefetching: false,
    dataUpdatedAt: 0,
  }),
  useStatusCounts: () => ({
    pending: 1,
    success: 0,
    failed: 0,
    total: 1,
    refetch: vi.fn(),
  }),
}));
vi.mock("../src/components/layout/ScreenContainer.js", () => ({
  ScreenContainer: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("../src/components/layout/AppHeader.js", () => ({ AppHeader: () => null }));
vi.mock("../src/components/layout/Avatar.js", () => ({ Avatar: () => null }));
vi.mock("../src/components/transactions/FilterChips.js", () => ({ FilterChips: () => null }));
vi.mock("../src/components/feedback/SyncStatusPill.js", () => ({ SyncStatusPill: () => null }));
vi.mock("../src/features/transactions/TransactionHistoryList.js", () => ({
  TransactionHistoryList: ({
    isNextPageError,
    onRetryNextPage,
  }: {
    isNextPageError?: boolean;
    onRetryNextPage?: () => void;
  }) =>
    isNextPageError && onRetryNextPage
      ? React.createElement("button", null, "Try loading more")
      : null,
}));

import TransactionsHistoryScreen from "../app/(app)/transactions/index.js";

describe("transaction history pagination", () => {
  it("shows a retry action when the next page fails after earlier items loaded", () => {
    expect(
      renderToStaticMarkup(React.createElement(TransactionsHistoryScreen))
    ).toContain("Try loading more");
  });
});
