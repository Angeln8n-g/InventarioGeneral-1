'use client';

/**
 * ErrorState Component
 * 
 * A component for displaying error states with retry functionality.
 * Shows support message after multiple retry attempts.
 * 
 * @requirements 15.1 - Display error state in place of content when module fails
 * @requirements 15.2 - Display error icon, message, and retry button
 * @requirements 15.3 - Use Danger (#EF4444) for icon and retry button
 * @requirements 15.4 - Retry button calls onRetry callback
 * @requirements 15.5 - Show support message after multiple retries
 */

import React, { memo, useMemo } from 'react';
import type { ErrorStateProps } from './ErrorState.types';
import { Button } from '@/components/ds/Button';
import { colors, spacing } from '@/design-system/tokens';

/**
 * Error icon SVG
 */
const ErrorIcon: React.FC = () => (
  <svg
    width="48"
    height="48"
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <circle
      cx="24"
      cy="24"
      r="20"
      stroke={colors.danger}
      strokeWidth="2"
      fill="none"
    />
    <path
      d="M24 14V26"
      stroke={colors.danger}
      strokeWidth="3"
      strokeLinecap="round"
    />
    <circle
      cx="24"
      cy="33"
      r="2"
      fill={colors.danger}
    />
  </svg>
);

/**
 * Threshold for showing support message
 */
const SUPPORT_MESSAGE_THRESHOLD = 3;

/**
 * ErrorState Component
 */
const ErrorStateComponent: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
  showSupport,
  retryCount = 0,
  className,
  style,
  'data-testid': testId = 'error-state',
}) => {
  // Determine if support message should be shown
  const shouldShowSupport = showSupport ?? retryCount >= SUPPORT_MESSAGE_THRESHOLD;

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

  const titleStyles: React.CSSProperties = {
    color: colors.textPrimary,
    fontSize: '1.125rem',
    fontWeight: 600,
    margin: 0,
    lineHeight: 1.4,
  };

  const messageStyles: React.CSSProperties = {
    color: colors.textSecondary,
    fontSize: '0.875rem',
    fontWeight: 400,
    margin: 0,
    lineHeight: 1.5,
    maxWidth: 320,
  };

  const supportStyles: React.CSSProperties = {
    color: colors.textSecondary,
    fontSize: '0.75rem',
    fontWeight: 400,
    margin: 0,
    marginTop: spacing.sm,
  };

  return (
    <div
      className={className}
      style={containerStyles}
      data-testid={testId}
      role="alert"
      aria-label={title}
    >
      <div data-testid={`${testId}-icon`}>
        <ErrorIcon />
      </div>

      <h3 style={titleStyles} data-testid={`${testId}-title`}>
        {title}
      </h3>

      <p style={messageStyles} data-testid={`${testId}-message`}>
        {message}
      </p>

      {onRetry && (
        <Button
          variant="danger"
          size="md"
          onClick={onRetry}
          data-testid={`${testId}-retry`}
        >
          Retry
        </Button>
      )}

      {shouldShowSupport && (
        <p style={supportStyles} data-testid={`${testId}-support`}>
          If the problem persists, please contact support.
        </p>
      )}
    </div>
  );
};

export const ErrorState = memo(ErrorStateComponent);
ErrorState.displayName = 'ErrorState';

export default ErrorState;
