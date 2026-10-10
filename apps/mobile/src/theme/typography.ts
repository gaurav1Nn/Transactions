import { TextStyle, Platform } from "react-native";

export const fontFamily = {
  serif: Platform.select({ ios: "Georgia", android: "serif", default: "serif" }),
  sans: Platform.select({ ios: "System", android: "Roboto", default: "sans-serif" }),
  mono: Platform.select({ ios: "Courier", android: "monospace", default: "monospace" }),
} as const;

export const typography: Record<string, TextStyle> = {
  display: {
    fontFamily: fontFamily.serif,
    fontSize: 36,
    lineHeight: 40,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  amountXL: {
    fontFamily: fontFamily.serif,
    fontSize: 44,
    lineHeight: 48,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  title: {
    fontFamily: fontFamily.serif,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "600",
  },
  headline: {
    fontFamily: fontFamily.serif,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "600",
  },
  body: {
    fontFamily: fontFamily.sans,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400",
  },
  bodyStrong: {
    fontFamily: fontFamily.sans,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
  },
  bodySm: {
    fontFamily: fontFamily.sans,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400",
  },
  eyebrow: {
    fontFamily: fontFamily.sans,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  caption: {
    fontFamily: fontFamily.sans,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "400",
  },
  mono: {
    fontFamily: fontFamily.mono,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
  },
};
