import { describe, it, expect } from "vitest";
import { formatSyncTime } from "../src/components/feedback/SyncStatusPill.js";

describe("SyncStatusPill formatSyncTime", () => {
  it("formats recent sync as Updated just now", () => {
    const now = Date.now();
    expect(formatSyncTime(new Date(now - 10000))).toBe("Updated just now");
  });

  it("formats under a minute sync", () => {
    const now = Date.now();
    expect(formatSyncTime(new Date(now - 45000))).toBe("Updated < 1m ago");
  });

  it("formats minute differences", () => {
    const now = Date.now();
    expect(formatSyncTime(new Date(now - 5 * 60 * 1000))).toBe("Updated 5m ago");
  });

  it("formats null or undefined as Not yet synced", () => {
    expect(formatSyncTime(null)).toBe("Not yet synced");
    expect(formatSyncTime(undefined)).toBe("Not yet synced");
  });
});
