'use client';

/**
 * ActionCard Component
 * 
 * A card component for displaying quick action items with icon, title,
 * and optional description. Supports highlighted and disabled states
 * with press animation.
 * 
 * @requirements 7.1 - Display icon, title, and optional description
 * @requirements 7.2 - Use Card (#1E2430) background, transitions to Surface (#151A21) on hover
 * @requirements 7.3 - Scale to 95% on press with smooth transition
 * @requirements 7.4 - Support highlighted variant with Primary (#E50914) border
 * @requirements 7.5 - Keyboard accessible with visible focus states
 * @requirements 7.6 - Disabled state uses Disabled (#6B7280) color and prevents interaction
 */

import React, { memo, useState, useCallback, useMemo } from 'react';
import type { ActionCardProps } from './ActionCard.types';
import { colors, borders, spacing } from '@/design-system/tokens';

/**
 * ActionCard Component
 * 
 * Displays an action card with icon, title, and optional description.
 * Supports highlighted variant, disabled state, and press animation.
 */
const ActionCardComponent: React.FC<ActionCardProps> = ({
  icon,
  title,
  description,
  highlighted = false,
  disabled = false,
  onClick,
  'aria-label': ariaLabel,
  className,
  style,
  'data-testid': testId = 'action-card',
}) => {
  // Track pressed state for animation
  const [isPressed, setIsPressed] = useState(false);
  // Track hover state for background transition
  const [isHovered, setIsHovered] = useState(false);

  // Handle click - prevent if disabled (Requirement 7.6)
  const handleClick = useCallback(() => {
    if (!disabled && onClick) {
      onClick();
    }
  }, [disabled, onClick]);

  // Handle keyboard events for accessibility (Requirement 7.5)
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        if (!disabled && onClick) {
          setIsPressed(true);
          onClick();
          // Reset pressed state after animation
          setTimeout(() => setIsPressed(false), 150);
        }
      }
    },
    [disabled, onClick]
  );

  // Handle mouse/touch events for press animation (Requirement 7.3)
  const handleMouseDown = useCallback(() => {
    if (!disabled) {
      setIsPressed(true);
    }
  }, [disabled]);

  const handleMouseUp = useCallback(() => {
    setIsPressed(false);
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (!disabled) {
      setIsHovered(true);
    }
  }, [disabled]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setIsPressed(false);
  }, []);

  // Card container styles
  const cardStyles: React.CSSProperties = useMemo(() => {
    // Base background color - Requirement 7.2
    // Hover state - transitions to Surface (Requirement 7.2)
    const backgroundColor = (isHovered && !disabled) 
      ? colors.surface  // #151A21
      : colors.card;    // #1E2430

    // Border style - Requirement 7.4 (highlighted variant)
    const borderStyle = (highlighted && !disabled)
      ? `2px solid ${colors.primary}` // Primary (#E50914) border
      : `1px solid ${colors.border}`; // Default border

    // Disabled state - Requirement 7.6
    const opacity = disabled ? 0.6 : 1;
    const cursor = disabled ? 'not-allowed' : 'pointer';

    // Press animation - Requirement 7.3
    const transform = isPressed && !disabled ? 'scale(0.95)' : 'scale(1)';

    return {
      backgroundColor,
      border: borderStyle,
      borderRadius: borders.radius.card, // 12px
      padding: spacing.lg, // 16px
      display: 'flex',
      flexDirection: 'column',
      gap: spacing.sm, // 8px
      cursor,
      opacity,
      transform,
      transition: 'all 0.2s ease-in-out',
      outline: 'none',
      userSelect: 'none',
      ...style,
    };
  }, [isHovered, isPressed, highlighted, disabled, style]);

  // Icon wrapper styles
  const iconWrapperStyles: React.CSSProperties = useMemo(() => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
    borderRadius: borders.radius.button, // 10px
    backgroundColor: disabled 
      ? `${colors.disabled}20` // Disabled background
      : `${colors.primary}15`, // Primary with 15% opacity
    color: disabled ? colors.disabled : colors.primary,
    marginBottom: spacing.xs, // 4px
  }), [disabled]);

  // Title styles - Requirement 7.1
  const titleStyles: React.CSSProperties = useMemo(() => ({
    color: disabled ? colors.disabled : colors.textPrimary,
    fontSize: '1rem',
    fontWeight: 600,
    lineHeight: 1.4,
    margin: 0,
  }), [disabled]);

  // Description styles - Requirement 7.1
  const descriptionStyles: React.CSSProperties = useMemo(() => ({
    color: disabled ? colors.disabled : colors.textSecondary,
    fontSize: '0.875rem',
    fontWeight: 400,
    lineHeight: 1.5,
    margin: 0,
  }), [disabled]);

  // Focus ring styles - Requirement 7.5
  const handleFocus = useCallback((e: React.FocusEvent<HTMLDivElement>) => {
    if (!disabled) {
      e.currentTarget.style.boxShadow = `0 0 0 2px ${colors.background}, 0 0 0 4px ${colors.primary}`;
    }
  }, [disabled]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLDivElement>) => {
    e.currentTarget.style.boxShadow = 'none';
  }, []);

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={ariaLabel || title}
      aria-disabled={disabled}
      className={className}
      style={cardStyles}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      data-testid={testId}
      data-highlighted={highlighted}
      data-disabled={disabled}
    >
      {/* Icon - Requirement 7.1 */}
      <div style={iconWrapperStyles} data-testid={`${testId}-icon`} aria-hidden="true">
        {icon}
      </div>

      {/* Title - Requirement 7.1 */}
      <h3 style={titleStyles} data-testid={`${testId}-title`}>
        {title}
      </h3>

      {/* Optional Description - Requirement 7.1 */}
      {description && (
        <p style={descriptionStyles} data-testid={`${testId}-description`}>
          {description}
        </p>
      )}
    </div>
  );
};

// Memoized component for performance
export const ActionCard = memo(ActionCardComponent);

// Display name for debugging
ActionCard.displayName = 'ActionCard';

export default ActionCard;
