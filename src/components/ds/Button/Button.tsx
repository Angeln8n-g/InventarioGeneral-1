'use client';

/**
 * Button Component
 * 
 * A versatile button component following the Design System specifications.
 * Supports multiple variants, sizes, loading states, and accessibility features.
 * 
 * @requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8
 */

import React, { forwardRef, memo } from 'react';
import type { ButtonProps, ButtonVariant, ButtonSize } from './Button.types';
import { colors, borders, spacing } from '@/design-system/tokens';

/**
 * Loading Spinner component for button loading state
 */
const LoadingSpinner: React.FC<{ size: ButtonSize }> = ({ size }) => {
  const spinnerSizes: Record<ButtonSize, number> = {
    sm: 14,
    md: 18,
    lg: 22,
  };

  const spinnerSize = spinnerSizes[size];

  return (
    <svg
      className="animate-spin"
      width={spinnerSize}
      height={spinnerSize}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeOpacity="0.25"
      />
      <path
        d="M12 2C6.477 2 2 6.477 2 12"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
};

/**
 * Get styles for each button variant
 * @requirements 8.1, 8.2, 8.3, 8.4, 8.5
 */
const getVariantStyles = (variant: ButtonVariant, disabled: boolean): React.CSSProperties => {
  if (disabled) {
    // Requirement 8.7: Disabled state uses Disabled (#6B7280) background
    return {
      backgroundColor: colors.disabled,
      color: colors.textPrimary,
      border: 'none',
      cursor: 'not-allowed',
      opacity: 0.7,
    };
  }

  switch (variant) {
    case 'primary':
      // Requirement 8.1: Primary uses Primary (#E50914) background with white text
      return {
        backgroundColor: colors.primary,
        color: colors.textPrimary,
        border: 'none',
      };
    case 'secondary':
      // Requirement 8.3: Secondary uses transparent background with Primary border and text
      return {
        backgroundColor: 'transparent',
        color: colors.primary,
        border: `2px solid ${colors.primary}`,
      };
    case 'ghost':
      // Requirement 8.4: Ghost uses transparent background with Text_Secondary text
      return {
        backgroundColor: 'transparent',
        color: colors.textSecondary,
        border: 'none',
      };
    case 'danger':
      // Requirement 8.5: Danger uses Danger (#EF4444) background with white text
      return {
        backgroundColor: colors.danger,
        color: colors.textPrimary,
        border: 'none',
      };
    default:
      return {};
  }
};

/**
 * Get hover styles for each button variant
 * @requirements 8.2, 8.4
 */
const getHoverStyles = (variant: ButtonVariant): React.CSSProperties => {
  switch (variant) {
    case 'primary':
      // Requirement 8.2: Primary hover transitions to Primary_Hover (#FF2A2A)
      return {
        backgroundColor: colors.primaryHover,
      };
    case 'secondary':
      return {
        backgroundColor: `${colors.primary}10`,
      };
    case 'ghost':
      // Requirement 8.4: Ghost text changes to Text_Primary on hover
      return {
        color: colors.textPrimary,
        backgroundColor: `${colors.textSecondary}10`,
      };
    case 'danger':
      return {
        backgroundColor: '#DC2626', // Darker danger on hover
      };
    default:
      return {};
  }
};

/**
 * Get size-specific styles
 * @requirements 8.6
 */
const getSizeStyles = (size: ButtonSize): React.CSSProperties => {
  // Requirement 8.6: All buttons use 16px horizontal padding
  const horizontalPadding = spacing.lg; // 16px

  const sizeConfig: Record<ButtonSize, { height: number; fontSize: string; verticalPadding: number }> = {
    sm: { height: 32, fontSize: '0.875rem', verticalPadding: spacing.sm },
    md: { height: 40, fontSize: '1rem', verticalPadding: spacing.md },
    lg: { height: 48, fontSize: '1.125rem', verticalPadding: spacing.lg },
  };

  const config = sizeConfig[size];

  return {
    minHeight: config.height,
    fontSize: config.fontSize,
    paddingLeft: horizontalPadding,
    paddingRight: horizontalPadding,
    paddingTop: config.verticalPadding,
    paddingBottom: config.verticalPadding,
  };
};

/**
 * Button Component
 * 
 * A design system button with support for variants, sizes, loading states,
 * and accessibility features.
 */
const ButtonComponent = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      disabled = false,
      loading = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      onClick,
      children,
      type = 'button',
      'aria-label': ariaLabel,
      className,
      style,
      ...rest
    },
    ref
  ) => {
    // Button is non-interactive when disabled or loading
    const isDisabled = disabled || loading;

    // Handle click - prevent if disabled or loading
    const handleClick = () => {
      if (!isDisabled && onClick) {
        onClick();
      }
    };

    // Handle keyboard events for accessibility
    const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        if (!isDisabled && onClick) {
          event.preventDefault();
          onClick();
        }
      }
    };

    // Base styles
    const baseStyles: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      // Requirement 8.6: All buttons use 10px border radius
      borderRadius: borders.radius.button,
      fontWeight: 600,
      fontFamily: 'inherit',
      lineHeight: 1.5,
      textDecoration: 'none',
      transition: 'all 0.2s ease-in-out',
      outline: 'none',
      position: 'relative',
      whiteSpace: 'nowrap',
      ...(fullWidth && { width: '100%' }),
    };

    // Combine all styles
    const combinedStyles: React.CSSProperties = {
      ...baseStyles,
      ...getSizeStyles(size),
      ...getVariantStyles(variant, isDisabled),
      ...style,
    };

    // Focus styles (applied via CSS-in-JS for better control)
    const focusRingColor = variant === 'danger' ? colors.danger : colors.primary;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        aria-label={ariaLabel}
        aria-disabled={isDisabled}
        aria-busy={loading}
        className={className}
        style={combinedStyles}
        data-variant={variant}
        data-size={size}
        data-loading={loading}
        data-testid="ds-button"
        onMouseEnter={(e) => {
          if (!isDisabled) {
            const hoverStyles = getHoverStyles(variant);
            Object.assign(e.currentTarget.style, hoverStyles);
          }
        }}
        onMouseLeave={(e) => {
          if (!isDisabled) {
            const variantStyles = getVariantStyles(variant, false);
            Object.assign(e.currentTarget.style, variantStyles);
          }
        }}
        onFocus={(e) => {
          e.currentTarget.style.boxShadow = `0 0 0 2px ${colors.background}, 0 0 0 4px ${focusRingColor}`;
        }}
        onBlur={(e) => {
          e.currentTarget.style.boxShadow = 'none';
        }}
        {...rest}
      >
        {/* Requirement 8.8: Display loading spinner when in loading state */}
        {loading && (
          <LoadingSpinner size={size} />
        )}
        
        {/* Left icon - hidden when loading */}
        {!loading && leftIcon && (
          <span className="button-icon button-icon-left" aria-hidden="true">
            {leftIcon}
          </span>
        )}
        
        {/* Button content - visually hidden but accessible when loading */}
        <span
          style={{
            opacity: loading ? 0.7 : 1,
          }}
        >
          {children}
        </span>
        
        {/* Right icon - hidden when loading */}
        {!loading && rightIcon && (
          <span className="button-icon button-icon-right" aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </button>
    );
  }
);

ButtonComponent.displayName = 'Button';

/**
 * Memoized Button component for performance optimization
 */
export const Button = memo(ButtonComponent);

export default Button;
