import { describe, it, expect } from "vitest";
import { formatMoney, formatMoneyParts } from "../src/utils/format-money.js";

describe("format-money utility without floating-point math", () => {
  it("formats standard amounts with grouping and currency symbol", () => {
    expect(formatMoney("1234567.89", "USD")).toBe("$1,234,567.89");
    expect(formatMoney("1234567.89", "EUR")).toBe("€1,234,567.89");
    expect(formatMoney("1234567.89", "GBP")).toBe("£1,234,567.89");
  });

  it("handles small and single-decimal inputs cleanly", () => {
    expect(formatMoney("0.05", "USD")).toBe("$0.05");
    expect(formatMoney("10.5", "USD")).toBe("$10.50");
    expect(formatMoney("10", "USD")).toBe("$10.00");
  });

  it("handles large 12-digit integer amounts with exact grouping", () => {
    const res = formatMoneyParts("123456789012.34", "USD");
    expect(res.formatted).toBe("$123,456,789,012.34");
    expect(res.integerPart).toBe("123,456,789,012");
    expect(res.decimalPart).toBe("34");
  });

  it("generates natural speech text for accessibility", () => {
    const res = formatMoneyParts("125.50", "USD");
    expect(res.speechText).toBe("125 dollars and 50 cents");

    const eurRes = formatMoneyParts("20.00", "EUR");
    expect(eurRes.speechText).toBe("20 euros and 00 cents");
  });
});
