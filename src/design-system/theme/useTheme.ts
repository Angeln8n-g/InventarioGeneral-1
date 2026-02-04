'use client';

/**
 * useTheme Hook
 * 
 * Custom hook for accessing the theme context values.
 * Provides access to design tokens and dark mode state.
 * 
 * @requirements 1.6, 16.1
 */

import { useContext } from 'react';
import { ThemeContext } from './ThemeProvider';
import type { ThemeContextValue } from './theme.types';

/**
 * Hook to access the current theme and dark mode state.
 * Must be used within a ThemeProvider.
 * 
 * @returns ThemeContextValue containing theme tokens and isDarkMode flag
 * @throws Error if used outside of ThemeProvider
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { theme, isDarkMode } = useTheme();
 *   
 *   return (
 *     <div style={{ 
 *       backgroundColor: theme.colors.card,
 *       padding: theme.spacing.lg 
 *     }}>
 *       Dark mode: {isDarkMode ? 'Yes' : 'No'}
 *     </div>
 *   );
 * }
 * ```
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}

export default useTheme;
