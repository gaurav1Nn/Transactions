import { colors } from "./colors";
import { space, radius, border, elevation, hit, motion } from "./spacing";
import { typography, fontFamily } from "./typography";
import { statusTheme } from "./status";

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

export * from "./colors";
export * from "./spacing";
export * from "./typography";
export * from "./status";
