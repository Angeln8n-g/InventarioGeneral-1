'use client';

/**
 * ThemeProvider Component
 * 
 * Provides theme context to the application and injects CSS custom properties
 * based on design tokens. Dark mode is the default theme.
 * 
 * @requirements 1.6, 16.1
 */

import React, { createContext, useMemo, useEffect } from 'react';
import { colors } from '../tokens/colors';
import { spacing } from '../tokens/spacing';
import { typography } from '../tokens/typography';
import { borders } from '../tokens/borders';
import { breakpoints } from '../tokens/breakpoints';
import type { Theme, ThemeContextValue } from './theme.types';

// Create the theme context with undefined default
export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export interface ThemeProviderProps {
  children: React.ReactNode;
}

/**
 * Converts a camelCase string to kebab-case for CSS variable names
 */
function toKebabCase(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Generates CSS custom properties from design tokens
 */
function generateCSSVariables(theme: Theme): string {
  const variables: string[] = [];

  // Color tokens
  Object.entries(theme.colors).forEach(([key, value]) => {
    variables.push(`--color-${toKebabCase(key)}: ${value};`);
  });

  // Spacing tokens
  Object.entries(theme.spacing).forEach(([key, value]) => {
    variables.push(`--spacing-${key}: ${value}px;`);
  });

  // Typography tokens
  variables.push(`--font-family: ${theme.typography.fontFamily};`);
  Object.entries(theme.typography.fontWeights).forEach(([key, value]) => {
    variables.push(`--font-weight-${key}: ${value};`);
  });
  Object.entries(theme.typography.sizes).forEach(([key, value]) => {
    variables.push(`--font-size-${key}: ${value};`);
  });

  // Border tokens
  Object.entries(theme.borders.radius).forEach(([key, value]) => {
    variables.push(`--border-radius-${key}: ${value}px;`);
  });

  // Breakpoint tokens
  Object.entries(theme.breakpoints).forEach(([key, value]) => {
    variables.push(`--breakpoint-${key}: ${value}px;`);
  });

  return variables.join('\n  ');
}

/**
 * ThemeProvider component that wraps the application and provides theme context
 * with CSS custom properties injection for dark mode (default).
 */
export function ThemeProvider({ children }: ThemeProviderProps): React.ReactElement {
  // Build the theme object from tokens
  const theme: Theme = useMemo(
    () => ({
      colors,
      spacing,
      typography,
      borders,
      breakpoints,
    }),
    []
  );

  // Dark mode is the default per Requirement 16.1
  const isDarkMode = true;

  // Context value
  const contextValue: ThemeContextValue = useMemo(
    () => ({
      theme,
      isDarkMode,
    }),
    [theme, isDarkMode]
  );

  // Inject CSS custom properties into the document
  useEffect(() => {
    const cssVariables = generateCSSVariables(theme);
    const styleId = 'design-system-theme-variables';

    // Remove existing style element if present
    const existingStyle = document.getElementById(styleId);
    if (existingStyle) {
      existingStyle.remove();
    }

    // Create and inject new style element
    const styleElement = document.createElement('style');
    styleElement.id = styleId;
    styleElement.textContent = `
:root {
  ${cssVariables}
  
  /* Dark mode base styles */
  color-scheme: dark;
}

/* Apply dark mode background and text colors to body */
body {
  background-color: var(--color-background);
  color: var(--color-text-primary);
  font-family: var(--font-family);
}
`;
    document.head.appendChild(styleElement);

    // Cleanup on unmount
    return () => {
      const style = document.getElementById(styleId);
      if (style) {
        style.remove();
      }
    };
  }, [theme]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export default ThemeProvider;
