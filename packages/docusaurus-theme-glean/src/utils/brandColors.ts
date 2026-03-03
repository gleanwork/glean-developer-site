export const GLEAN_BRAND_COLORS = {
  PRIMARY_BLUE: '#343CED',
  PRIMARY_BLUE_LIGHT: '#6366F1', // Lighter blue for dark mode
  BRIGHT_GREEN: '#D8FD49',
  OATMEAL: '#F6F3EB',
  BLACK: '#000000',
  WHITE: '#FFFFFF',
} as const;

export type GleanBrandColor =
  (typeof GLEAN_BRAND_COLORS)[keyof typeof GLEAN_BRAND_COLORS];
