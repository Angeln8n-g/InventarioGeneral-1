/**
 * Spacing Design Tokens
 * 
 * Spacing scale based on multiples of 4 for consistent layout.
 * 
 * @requirements 1.3
 */

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export type Spacing = typeof spacing;
export type SpacingKey = keyof Spacing;
