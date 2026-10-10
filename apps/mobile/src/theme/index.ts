import { colors } from "./colors.js";
import { space, radius, border, elevation, hit, motion } from "./spacing.js";
import { typography, fontFamily } from "./typography.js";
import { statusTheme } from "./status.js";

export const theme = {
  colors,
  space,
  radius,
  border,
  elevation,
  hit,
  motion,
  typography,
  fontFamily,
  status: statusTheme,
} as const;

export type Theme = typeof theme;

export * from "./colors.js";
export * from "./spacing.js";
export * from "./typography.js";
export * from "./status.js";
