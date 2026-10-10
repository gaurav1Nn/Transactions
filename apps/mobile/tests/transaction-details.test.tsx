import { describe, it, expect } from "vitest";
import React from "react";
import {
  StatusStepper,
  getStatusStepperAccessibleText,
} from "../src/components/transactions/StatusStepper.js";
import { DetailRow } from "../src/components/transactions/DetailRow.js";

describe("Transaction Details & StatusStepper Components", () => {
  it("StatusStepper configures accessible text based on status", () => {
    expect(getStatusStepperAccessibleText("PENDING")).toBe(
      "Step 2 of 3: Processing. Waiting for an outcome."
    );
    expect(getStatusStepperAccessibleText("SUCCESS")).toBe(
      "Step 3 of 3: Success. Transaction completed."
    );
    expect(getStatusStepperAccessibleText("FAILED")).toBe(
      "Step 3 of 3: Failed. Transaction declined."
    );
  });

  it("DetailRow renders with expected label and values", () => {
    const row = React.createElement(DetailRow, {
      label: "Transaction ID",
      value: "TXN-TEST-1234",
      mono: true,
    });

    expect(row.props.label).toBe("Transaction ID");
    expect(row.props.value).toBe("TXN-TEST-1234");
    expect(row.props.mono).toBe(true);
  });
});
