export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  gutter: 16,
  cardPadding: 16,
  sectionGap: 24,
} as const;

export const radius = {
  badge: 4,
  control: 8,
  card: 8,
  hero: 12,
  round: 999,
} as const;

export const border = {
  card: 1,
  field: 1,
  focus: 2,
} as const;

export const elevation = {
  flat: 0,
  modal: 8,
  toast: 8,
} as const;

export const hit = {
  minSize: 48,
  slop: { top: 12, bottom: 12, left: 12, right: 12 },
} as const;

export const motion = {
  fast: 120,
  base: 220,
  slow: 360,
} as const;
