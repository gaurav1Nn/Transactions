import React from "react";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TestRenderer, { ReactTestRenderer } from "react-test-renderer";

const h = vi.hoisted(() => ({
  props: {} as Record<string, Record<string, any>>,
  createTransaction: vi.fn(),
}));

function stub(name: string) {
  return (props: Record<string, any>) => {
    h.props[name] = props;
    return null;
  };
}

vi.mock("react-native", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-native")>()),
  Keyboard: {
    addListener: () => ({ remove: () => {} }),
    dismiss: () => {},
    isVisible: () => false,
  },
}));
vi.mock("expo-router", () => ({
  useRouter: () => ({ back: vi.fn(), replace: vi.fn(), push: vi.fn() }),
  useNavigation: () => ({ addListener: () => () => {} }),
}));
vi.mock("../src/components/layout/ScreenContainer", () => ({
  ScreenContainer: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("../src/components/forms/SegmentedControl", () => ({ SegmentedControl: stub("currency") }));
vi.mock("../src/components/forms/AmountInput", () => ({ AmountInput: stub("amount") }));
vi.mock("../src/components/forms/AppTextField", () => ({
  AppTextField: React.forwardRef((props: Record<string, any>, _ref) => stub("description")(props)),
}));
vi.mock("../src/components/forms/AppButton", () => ({ AppButton: stub("submit") }));
vi.mock("../src/components/feedback/InlineNotice", () => ({ InlineNotice: () => null }));
vi.mock("../src/components/transactions/ConfirmDialog", () => ({ ConfirmDialog: () => null }));
vi.mock("../src/components/layout/AppIcon", () => ({ AppIcon: () => null }));
vi.mock("../src/features/transactions/useCreateTransaction", () => ({
  useCreateTransaction: () => ({
    createTransaction: h.createTransaction,
    isLoading: false,
    error: null,
    clearError: () => {},
  }),
}));

import CreateTransactionScreen from "../app/(app)/transactions/create";

let renderer: ReactTestRenderer;

async function fillAndSubmit() {
  await act(async () => {
    renderer = TestRenderer.create(<CreateTransactionScreen />);
  });
  act(() => h.props.currency.onChange("EUR"));
  act(() => h.props.amount.onChangeText("50.00"));
  act(() => h.props.description.onChangeText("test"));
  await act(async () => {
    await h.props.submit.onPress();
  });
}

describe("create transaction form reset", () => {
  beforeEach(() => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
    h.props = {};
    h.createTransaction.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    act(() => renderer?.unmount());
    vi.restoreAllMocks();
  });

  it("clears amount, description and currency after a transaction is created", async () => {
    h.createTransaction.mockResolvedValue({ transactionId: "TXN-1" });

    await fillAndSubmit();

    expect(h.createTransaction).toHaveBeenCalledWith({
      amount: "50.00",
      currency: "EUR",
      description: "test",
    });
    expect(h.props.amount.value).toBe("");
    expect(h.props.description.value).toBe("");
    expect(h.props.currency.value).toBe("USD");
  });

  it("keeps the entered values when creation fails so the user can retry", async () => {
    h.createTransaction.mockResolvedValue(null);

    await fillAndSubmit();

    expect(h.props.amount.value).toBe("50.00");
    expect(h.props.description.value).toBe("test");
    expect(h.props.currency.value).toBe("EUR");
  });
});
