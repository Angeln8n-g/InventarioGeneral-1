/**
 * Breakpoint Design Tokens
 * 
 * Responsive breakpoints for mobile-first design.
 * - mobile: 0px - 767px
 * - tablet: 768px - 1023px
 * - desktop: 1024px+
 * 
 * @requirements 2.1, 2.2, 2.3
 */

export const breakpoints = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
} as const;

export type Breakpoints = typeof breakpoints;
export type BreakpointKey = keyof Breakpoints;
