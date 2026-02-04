/**
 * Design System Barrel Export
 * 
 * Central export point for the entire design system including
 * tokens, theme provider, and hooks.
 * 
 * @requirements 1.6, 16.1
 */

// Design Tokens
export {
  colors,
  spacing,
  typography,
  borders,
  breakpoints,
  type Colors,
  type ColorKey,
  type Spacing,
  type SpacingKey,
  type Typography,
  type FontWeight,
  type FontSize,
  type Borders,
  type BorderRadiusKey,
  type Breakpoints,
  type BreakpointKey,
} from './tokens';

// Theme
export {
  ThemeProvider,
  ThemeContext,
  useTheme,
  type ThemeProviderProps,
  type Theme,
  type ThemeContextValue,
} from './theme';
