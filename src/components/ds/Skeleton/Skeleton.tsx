'use client';

/**
 * Skeleton Component
 * 
 * A loading placeholder component that displays animated skeleton shapes
 * matching the expected content shape. Uses Surface (#151A21) background
 * with pulse animation as per design system specifications.
 * 
 * @requirements 13.1, 13.2
 */

import React, { memo, useMemo } from 'react';
import type { 
  SkeletonProps, 
  SkeletonCardProps, 
  SkeletonVariant, 
  SkeletonAnimation 
} from './Skeleton.types';
import { colors, borders, spacing } from '@/design-system/tokens';

/**
 * CSS keyframes for animations
 * Injected once when component mounts
 */
const ANIMATION_STYLES = `
  @keyframes skeleton-pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.4;
    }
  }
  
  @keyframes skeleton-wave {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }
`;

/**
 * Inject animation styles into document head
 */
let stylesInjected = false;
const injectStyles = () => {
  if (typeof document !== 'undefined' && !stylesInjected) {
    const styleElement = document.createElement('style');
    styleElement.setAttribute('data-skeleton-styles', 'true');
    styleElement.textContent = ANIMATION_STYLES;
    document.head.appendChild(styleElement);
    stylesInjected = true;
  }
};

/**
 * Convert dimension value to CSS string
 */
const toCssValue = (value: string | number | undefined): string | undefined => {
  if (value === undefined) return undefined;
  if (typeof value === 'number') return `${value}px`;
  return value;
};

/**
 * Get border radius based on variant
 */
const getVariantBorderRadius = (variant: SkeletonVariant): string | number => {
  switch (variant) {
    case 'circular':
      return '50%';
    case 'text':
      return 4; // Slightly rounded for text
    case 'rectangular':
      return borders.radius.card;
    default:
      return 4;
  }
};

/**
 * Get default dimensions based on variant
 */
const getDefaultDimensions = (variant: SkeletonVariant): { width?: string; height?: string } => {
  switch (variant) {
    case 'text':
      return { width: '100%', height: '1em' };
    case 'circular':
      return { width: '40px', height: '40px' };
    case 'rectangular':
      return { width: '100%', height: '100px' };
    default:
      return { width: '100%', height: '1em' };
  }
};

/**
 * Get animation CSS properties
 */
const getAnimationStyles = (animation: SkeletonAnimation): React.CSSProperties => {
  switch (animation) {
    case 'pulse':
      return {
        animation: 'skeleton-pulse 1.5s ease-in-out infinite',
      };
    case 'wave':
      return {
        position: 'relative',
        overflow: 'hidden',
      };
    case 'none':
    default:
      return {};
  }
};

/**
 * Skeleton Component
 * 
 * Displays an animated placeholder for loading content.
 * 
 * @requirements 13.1 - Display skeleton placeholders matching expected content shape
 * @requirements 13.2 - Use Surface (#151A21) background with pulse animation
 */
const SkeletonComponent: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  animation = 'pulse',
  className,
  style,
  'data-testid': testId = 'skeleton',
}) => {
  // Inject animation styles on first render
  React.useEffect(() => {
    injectStyles();
  }, []);

  const defaultDimensions = useMemo(() => getDefaultDimensions(variant), [variant]);

  // Base styles using Surface color as per requirement 13.2
  const baseStyles: React.CSSProperties = useMemo(() => ({
    // Requirement 13.2: Use Surface (#151A21) background
    backgroundColor: colors.surface,
    borderRadius: getVariantBorderRadius(variant),
    width: toCssValue(width) ?? defaultDimensions.width,
    height: toCssValue(height) ?? defaultDimensions.height,
    display: 'block',
    ...getAnimationStyles(animation),
    ...style,
  }), [variant, width, height, animation, style, defaultDimensions]);

  // For wave animation, we need an additional shimmer element
  if (animation === 'wave') {
    return (
      <span
        className={className}
        style={baseStyles}
        data-testid={testId}
        data-variant={variant}
        data-animation={animation}
        aria-hidden="true"
        role="presentation"
      >
        <span
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `linear-gradient(90deg, transparent, ${colors.card}, transparent)`,
            animation: 'skeleton-wave 1.5s ease-in-out infinite',
          }}
        />
      </span>
    );
  }

  return (
    <span
      className={className}
      style={baseStyles}
      data-testid={testId}
      data-variant={variant}
      data-animation={animation}
      aria-hidden="true"
      role="presentation"
    />
  );
};

/**
 * SkeletonCard Component
 * 
 * A composite skeleton component that displays a card-like loading placeholder
 * with optional icon and configurable number of text lines.
 * 
 * @requirements 13.1 - Display skeleton placeholders matching expected content shape
 */
const SkeletonCardComponent: React.FC<SkeletonCardProps> = ({
  showIcon = true,
  lines = 3,
  className,
  style,
  'data-testid': testId = 'skeleton-card',
}) => {
  // Inject animation styles on first render
  React.useEffect(() => {
    injectStyles();
  }, []);

  // Card container styles
  const cardStyles: React.CSSProperties = useMemo(() => ({
    backgroundColor: colors.card,
    borderRadius: borders.radius.card,
    border: `1px solid ${colors.border}`,
    padding: spacing.lg,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.md,
    ...style,
  }), [style]);

  // Header styles (icon + title area)
  const headerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.md,
  };

  // Generate line widths for visual variety
  const lineWidths = useMemo(() => {
    const widths: string[] = [];
    for (let i = 0; i < lines; i++) {
      // Last line is typically shorter
      if (i === lines - 1) {
        widths.push('60%');
      } else {
        // Vary widths between 80% and 100%
        widths.push(i % 2 === 0 ? '100%' : '85%');
      }
    }
    return widths;
  }, [lines]);

  return (
    <div
      className={className}
      style={cardStyles}
      data-testid={testId}
      aria-hidden="true"
      role="presentation"
    >
      {/* Header with optional icon */}
      <div style={headerStyles}>
        {showIcon && (
          <Skeleton
            variant="circular"
            width={40}
            height={40}
            data-testid={`${testId}-icon`}
          />
        )}
        <Skeleton
          variant="text"
          width={showIcon ? '60%' : '40%'}
          height={20}
          data-testid={`${testId}-title`}
        />
      </div>

      {/* Content lines */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
        {lineWidths.map((lineWidth, index) => (
          <Skeleton
            key={index}
            variant="text"
            width={lineWidth}
            height={16}
            data-testid={`${testId}-line-${index}`}
          />
        ))}
      </div>
    </div>
  );
};

// Memoized components for performance
export const Skeleton = memo(SkeletonComponent);
export const SkeletonCard = memo(SkeletonCardComponent);

// Display names for debugging
Skeleton.displayName = 'Skeleton';
SkeletonCard.displayName = 'SkeletonCard';

export default Skeleton;
