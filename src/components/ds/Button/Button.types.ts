/**
 * Button Component Type Definitions
 * 
 * Type definitions for the Design System Button component.
 * 
 * @requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8
 */

import type { ReactNode, ButtonHTMLAttributes } from 'react';

/**
 * Button variant types
 * - primary: Primary action button with brand color (#E50914)
 * - secondary: Secondary action with transparent background and primary border
 * - ghost: Minimal button with transparent background
 * - danger: Destructive action button with danger color (#EF4444)
 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

/**
 * Button size types
 * - sm: Small button for compact spaces
 * - md: Medium button (default)
 * - lg: Large button for prominent actions
 */
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Button component props interface
 */
export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Visual variant of the button */
  variant?: ButtonVariant;
  /** Size of the button */
  size?: ButtonSize;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Whether the button is in a loading state */
  loading?: boolean;
  /** Whether the button should take full width of its container */
  fullWidth?: boolean;
  /** Icon to display on the left side of the button text */
  leftIcon?: ReactNode;
  /** Icon to display on the right side of the button text */
  rightIcon?: ReactNode;
  /** Click handler */
  onClick?: () => void;
  /** Button content */
  children: ReactNode;
  /** Button type attribute */
  type?: 'button' | 'submit' | 'reset';
  /** Accessible label for the button */
  'aria-label'?: string;
}
