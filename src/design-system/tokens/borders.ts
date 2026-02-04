/**
 * Border Design Tokens
 * 
 * Border radius values for consistent component styling.
 * 
 * @requirements 1.4
 */

export const borders = {
  radius: {
    button: 10,
    card: 12,
    modal: 16,
  },
} as const;

export type Borders = typeof borders;
export type BorderRadiusKey = keyof typeof borders.radius;
