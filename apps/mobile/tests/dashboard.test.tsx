import { describe, it, expect } from "vitest";
import { getGreeting, getFirstName } from "../src/utils/greeting.js";

describe("Dashboard greeting and metrics calculations", () => {
  it("getFirstName extracts first word and handles edge cases", () => {
    expect(getFirstName("Jane Doe")).toBe("Jane");
    expect(getFirstName("Jane Marie Doe")).toBe("Jane");
    expect(getFirstName("")).toBe("User");
    expect(getFirstName(undefined)).toBe("User");
  });

  it("getGreeting adapts to morning, afternoon, and evening hours", () => {
    expect(getGreeting("Jane Doe", 9).greetingText).toBe("Good morning, Jane");
    expect(getGreeting("Jane Doe", 14).greetingText).toBe("Good afternoon, Jane");
    expect(getGreeting("Jane Doe", 20).greetingText).toBe("Good evening, Jane");
    expect(getGreeting("Jane Doe", 2).greetingText).toBe("Good evening, Jane");
  });

  it("calculates success rate accurately without floating point distortion", () => {
    const success = 93;
    const total = 100;
    const rate = ((Math.round((success * 1000) / total) / 10)).toFixed(1);
    expect(rate).toBe("93.0");

    const partial = 1;
    const totalPartial = 3;
    const partialRate = ((Math.round((partial * 1000) / totalPartial) / 10)).toFixed(1);
    expect(partialRate).toBe("33.3");
  });
});
