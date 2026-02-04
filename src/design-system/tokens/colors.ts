/**
 * Color Design Tokens
 * 
 * Centralized color palette for the Admin Dashboard Design System.
 * All colors follow the dark mode first approach.
 * 
 * @requirements 1.1, 1.2
 */

export const colors = {
  // Primary
  primary: '#E50914',
  primaryHover: '#FF2A2A',
  
  // Semantic
  accent: '#4ADE80',
  warning: '#F59E0B',
  danger: '#EF4444',
  
  // Neutrals (Dark UI)
  background: '#0B0F14',
  surface: '#151A21',
  card: '#1E2430',
  border: '#2A3242',
  
  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  disabled: '#6B7280',
} as const;

export type Colors = typeof colors;
export type ColorKey = keyof Colors;
