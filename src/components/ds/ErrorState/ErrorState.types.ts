/**
 * ErrorState Component Type Definitions
 * 
 * Type definitions for the Design System ErrorState component.
 * Used to display error states with retry functionality.
 * 
 * @requirements 15.1, 15.2, 15.3, 15.4, 15.5
 */

/**
 * ErrorState component props interface
 */
export interface ErrorStateProps {
  /** Optional custom title for the error */
  title?: string;
  /** Error message to display */
  message: string;
  /** Callback when retry button is clicked */
  onRetry?: () => void;
  /** Whether to show the support message (shown after multiple retries) */
  showSupport?: boolean;
  /** Number of retry attempts (used to determine if support message should show) */
  retryCount?: number;
  /** Optional CSS class name */
  className?: string;
  /** Optional inline styles */
  style?: React.CSSProperties;
  /** Optional test ID for testing */
  'data-testid'?: string;
}
