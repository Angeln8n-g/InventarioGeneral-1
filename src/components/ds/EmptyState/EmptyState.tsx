'use client';

/**
 * EmptyState Component
 * 
 * A component for displaying helpful empty states when lists or sections have no data.
 * Displays an illustrative icon, title, description, and optional call-to-action button.
 * 
 * @requirements 14.1 - Display empty state component when list/section has no data
 * @requirements 14.2 - Display illustrative icon, title, and description
 * @requirements 14.3 - Optionally display a call-to-action button
 * @requirements 14.4 - Use Text_Secondary (#9CA3AF) for text and muted icon
 */

import React, { memo, useMemo } from 'react';
import type { EmptyStateProps } from './EmptyState.types';
import { Button } from '@/components/ds/Button';
import { colors, spacing } from '@/design-system/tokens';

/**
 * Default empty state icon (document with lines)
 */
const DefaultEmptyIcon: React.FC = () => (
  <svg
    width="48"
    height="48"
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <rect
      x="8"
      y="4"
      width="32"
      height="40"
      rx="4"
      stroke={colors.textSecondary}
      strokeWidth="2"
      strokeOpacity="0.5"
    />
    <path
      d="M18 16H30"
      stroke={colors.textSecondary}
      strokeWidth="2"
      strokeLinecap="round"
      strokeOpacity="0.5"
    />
    <path
      d="M18 24H30"
      stroke={colors.textSecondary}
      strokeWidth="2"
      strokeLinecap="round"
      strokeOpacity="0.5"
    />
    <path
      d="M18 32H26"
      stroke={colors.textSecondary}
      strokeWidth="2"
      strokeLinecap="round"
      strokeOpacity="0.5"
    />
  </svg>
);

/**
 * EmptyState Component
 */
const EmptyStateComponent: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
  style,
  'data-testid': testId = 'empty-state',
}) => {
  const containerStyles: React.CSSProperties = useMemo(
    () => ({
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: spacing.xxl,
      gap: spacing.lg,
      ...style,
    }),
    [style]
  );

  const iconWrapperStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: colors.textSecondary,
    opacity: 0.7,
  };

  const titleStyles: React.CSSProperties = {
    color: colors.textPrimary,
    fontSize: '1.125rem',
    fontWeight: 600,
    margin: 0,
    lineHeight: 1.4,
  };

  const descriptionStyles: React.CSSProperties = {
    color: colors.textSecondary,
    fontSize: '0.875rem',
    fontWeight: 400,
    margin: 0,
    lineHeight: 1.5,
    maxWidth: 320,
  };

  return (
    <div
      className={className}
      style={containerStyles}
      data-testid={testId}
      role="status"
      aria-label={title}
    >
      <div style={iconWrapperStyles} data-testid={`${testId}-icon`}>
        {icon || <DefaultEmptyIcon />}
      </div>

      <h3 style={titleStyles} data-testid={`${testId}-title`}>
        {title}
      </h3>

      {description && (
        <p style={descriptionStyles} data-testid={`${testId}-description`}>
          {description}
        </p>
      )}

      {action && (
        <Button
          variant="primary"
          size="md"
          onClick={action.onClick}
          data-testid={`${testId}-action`}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
};

export const EmptyState = memo(EmptyStateComponent);
EmptyState.displayName = 'EmptyState';

export default EmptyState;
