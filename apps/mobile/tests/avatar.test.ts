import { describe, it, expect } from "vitest";
import { getInitials } from "../src/components/layout/Avatar.js";

describe("Avatar getInitials utility", () => {
  it("derives single initial from one word", () => {
    expect(getInitials("Alice")).toBe("A");
  });

  it("derives two initials from first and last word", () => {
    expect(getInitials("Jane Doe")).toBe("JD");
  });

  it("derives first and last initial from three words", () => {
    expect(getInitials("Jane Marie Doe")).toBe("JD");
  });

  it("tolerates extra whitespace and empty inputs", () => {
    expect(getInitials("   Jane    Doe   ")).toBe("JD");
    expect(getInitials("   ")).toBe("U");
    expect(getInitials("")).toBe("U");
  });
});
