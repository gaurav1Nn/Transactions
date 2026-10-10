import { describe, it, expect } from "vitest";
import {
  sanitizeAmountInput,
  padAmountOnBlur,
  addIntegerCents,
  amountToCents,
  centsToAmount,
} from "../src/utils/money-input.js";

describe("Money Input Sanitization & Integer Cent Math", () => {
  it("sanitizeAmountInput keeps digits and single point, limiting precision", () => {
    expect(sanitizeAmountInput("123.45")).toBe("123.45");
    expect(sanitizeAmountInput("abc$12.345xyz")).toBe("12.34");
    expect(sanitizeAmountInput("12.3.4.5")).toBe("12.34");
    expect(sanitizeAmountInput("1234567890123.99")).toBe("1234567890.99");
  });

  it("padAmountOnBlur standardizes decimal representation", () => {
    expect(padAmountOnBlur("10")).toBe("10.00");
    expect(padAmountOnBlur("10.")).toBe("10.00");
    expect(padAmountOnBlur("10.5")).toBe("10.50");
    expect(padAmountOnBlur("")).toBe("");
  });

  it("addIntegerCents performs exact arithmetic without floating point rounding", () => {
    // 0.10 + 0.20 = 0.30 exact
    expect(addIntegerCents("0.10", 20)).toBe("0.30");

    // 50.00 + 50.00 = 100.00
    expect(addIntegerCents("50.00", 5000)).toBe("100.00");

    // 1k quick add
    expect(addIntegerCents("250.00", 100000)).toBe("1250.00");
  });

  it("converts amounts to cents and back exactly", () => {
    expect(amountToCents("123.45")).toBe(12345);
    expect(amountToCents("0.05")).toBe(5);
    expect(centsToAmount(12345)).toBe("123.45");
    expect(centsToAmount(5)).toBe("0.05");
  });
});
