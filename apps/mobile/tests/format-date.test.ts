import { describe, it, expect } from "vitest";
import {
  formatMemberSince,
  formatFullDateTime,
  formatUtcDateTime,
  formatRelativeTime,
} from "../src/utils/format-date.js";

describe("format-date utility", () => {
  it("formats member since date cleanly", () => {
    expect(formatMemberSince("2023-03-14T00:00:00.000Z")).toContain("March 2023");
    expect(formatMemberSince("2026-10-10T00:00:00.000Z")).toContain("October 2026");
  });

  it("formats UTC date time accurately", () => {
    const utcStr = formatUtcDateTime("2026-10-10T11:05:00.000Z");
    expect(utcStr).toBe("2026-10-10 11:05 UTC");
  });

  it("formats full date time", () => {
    const d = new Date(2026, 9, 10, 14, 20); // Local Oct 10 2026 14:20
    const str = formatFullDateTime(d);
    expect(str).toContain("10 Oct 2026, 14:20");
  });

  it("formats relative times for list items", () => {
    const now = new Date("2026-10-10T12:00:00.000Z").getTime();

    // 10 seconds ago
    expect(formatRelativeTime(new Date(now - 10000), now)).toBe("Just now");

    // 45 seconds ago
    expect(formatRelativeTime(new Date(now - 45000), now)).toBe("< 1m ago");

    // 5 minutes ago
    expect(formatRelativeTime(new Date(now - 5 * 60 * 1000), now)).toBe("5m ago");

    // 2 hours ago
    expect(formatRelativeTime(new Date(now - 2 * 3600 * 1000), now)).toBe("2h ago");
  });

  it("handles null and invalid inputs gracefully", () => {
    expect(formatMemberSince("invalid")).toBe("Member");
    expect(formatFullDateTime("invalid")).toBe("");
    expect(formatRelativeTime("invalid")).toBe("");
  });
});
