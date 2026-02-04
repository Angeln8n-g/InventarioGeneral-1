/**
 * Theme Type Definitions
 * 
 * Defines the structure of the theme object and context value.
 * 
 * @requirements 1.6, 16.1
 */

import type { Colors } from '../tokens/colors';
import type { Spacing } from '../tokens/spacing';
import type { Typography } from '../tokens/typography';
import type { Borders } from '../tokens/borders';
import type { Breakpoints } from '../tokens/breakpoints';

export interface Theme {
  colors: Colors;
  spacing: Spacing;
  typography: Typography;
  borders: Borders;
  breakpoints: Breakpoints;
}

export interface ThemeContextValue {
  theme: Theme;
  isDarkMode: boolean;
}
