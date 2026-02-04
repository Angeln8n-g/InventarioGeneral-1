/**
 * Skeleton Component Type Definitions
 * 
 * Type definitions for the Design System Skeleton component.
 * Used for loading placeholders that match expected content shapes.
 * 
 * @requirements 13.1, 13.2
 */

/**
 * Skeleton variant types
 * - text: Rectangular shape with rounded corners for text placeholders
 * - circular: Circular shape for avatar/icon placeholders
 * - rectangular: Rectangular shape for card/image placeholders
 */
export type SkeletonVariant = 'text' | 'circular' | 'rectangular';

/**
 * Skeleton animation types
 * - pulse: Opacity-based pulsing animation (default)
 * - wave: Shimmer wave animation
 * - none: No animation
 */
export type SkeletonAnimation = 'pulse' | 'wave' | 'none';

/**
 * Skeleton component props interface
 */
export interface SkeletonProps {
  /** Visual variant of the skeleton */
  variant?: SkeletonVariant;
  /** Width of the skeleton (string with unit or number in pixels) */
  width?: string | number;
  /** Height of the skeleton (string with unit or number in pixels) */
  height?: string | number;
  /** Animation type for the skeleton */
  animation?: SkeletonAnimation;
  /** Additional CSS class name */
  className?: string;
  /** Additional inline styles */
  style?: React.CSSProperties;
  /** Test ID for testing purposes */
  'data-testid'?: string;
}

/**
 * SkeletonCard component props interface
 * A composite skeleton component for card-like loading states
 */
export interface SkeletonCardProps {
  /** Whether to show an icon placeholder */
  showIcon?: boolean;
  /** Number of text lines to display */
  lines?: number;
  /** Additional CSS class name */
  className?: string;
  /** Additional inline styles */
  style?: React.CSSProperties;
  /** Test ID for testing purposes */
  'data-testid'?: string;
}
