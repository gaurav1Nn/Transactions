import { describe, it, expect } from "vitest";
import { theme } from "../src/theme/index.js";

function getLuminance(hex: string): number {
  const cleanHex = hex.replace("#", "");
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const a = [r, g, b].map((val) => {
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });

  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function getContrast(hex1: string, hex2: string): number {
  const lum1 = getLuminance(hex1);
  const lum2 = getLuminance(hex2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

describe("Theme Tokens & WCAG Contrast", () => {
  it("theme exports all required token categories", () => {
    expect(theme.colors).toBeDefined();
    expect(theme.space).toBeDefined();
    expect(theme.radius).toBeDefined();
    expect(theme.typography).toBeDefined();
    expect(theme.status).toBeDefined();
  });

  it("status lookup maps all three API statuses correctly", () => {
    expect(theme.status.PENDING.label).toBe("Pending");
    expect(theme.status.SUCCESS.label).toBe("Success");
    expect(theme.status.FAILED.label).toBe("Failed");
  });

  it("primary color has accessible contrast against white text (>= 4.5:1)", () => {
    const contrast = getContrast(theme.colors.primary, "#FFFFFF");
    expect(contrast).toBeGreaterThanOrEqual(4.5);
  });

  it("ink text has accessible contrast against white surface (>= 7:1)", () => {
    const contrast = getContrast(theme.colors.ink, theme.colors.surface);
    expect(contrast).toBeGreaterThanOrEqual(7.0);
  });

  it("status text colors meet accessible contrast on their respective tint backgrounds", () => {
    const successContrast = getContrast(
      theme.colors.success,
      theme.colors.successBg
    );
    const pendingContrast = getContrast(
      theme.colors.pending,
      theme.colors.pendingBg
    );
    const failedContrast = getContrast(
      theme.colors.failed,
      theme.colors.failedBg
    );

    expect(successContrast).toBeGreaterThanOrEqual(4.5);
    expect(pendingContrast).toBeGreaterThanOrEqual(4.5);
    expect(failedContrast).toBeGreaterThanOrEqual(4.5);
  });
});
