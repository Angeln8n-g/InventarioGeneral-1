/**
 * Typography Design Tokens
 * 
 * Font family, weights, and sizes for consistent text styling.
 * Uses Inter as primary font with SF Pro and Roboto as fallbacks.
 * 
 * @requirements 1.5
 */

export const typography = {
  fontFamily: "'Inter', 'SF Pro', 'Roboto', sans-serif",
  fontWeights: {
    regular: 400,
    semibold: 600,
  },
  sizes: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
  },
} as const;

export type Typography = typeof typography;
export type FontWeight = keyof typeof typography.fontWeights;
export type FontSize = keyof typeof typography.sizes;
