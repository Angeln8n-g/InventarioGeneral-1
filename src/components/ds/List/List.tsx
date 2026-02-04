'use client';

/**
 * List Component
 * 
 * A versatile list component following the Design System specifications.
 * Supports status indicators, action slots, virtualization for large lists,
 * and empty states.
 * 
 * @requirements 9.1, 9.2, 9.3, 9.4, 9.5, 9.6
 */

import React, { memo, useMemo, useState, useCallback, useRef } from 'react';
import type { 
  ListProps, 
  ListItemProps, 
  ListItemInternalProps, 
  ListItemStatus 
} from './List.types';
import { colors, spacing, borders } from '@/design-system/tokens';
import { Skeleton } from '../Skeleton';

/**
 * Virtualization threshold - lists with more items will be virtualized
 * @requirements 9.5
 */
const VIRTUALIZATION_THRESHOLD = 50;

/**
 * Default item height for virtualization calculations
 */
const DEFAULT_ITEM_HEIGHT = 72;

/**
 * Default max height for virtualized lists
 */
const DEFAULT_MAX_HEIGHT = 400;

/**
 * Get status indicator color based on status type
 * @requirements 9.2
 */
const getStatusColor = (status: ListItemStatus): string | null => {
  switch (status) {
    case 'active':
      return colors.accent; // #4ADE80
    case 'pending':
      return colors.warning; // #F59E0B
    case 'error':
      return colors.danger; // #EF4444
    case 'inactive':
    default:
      return null;
  }
};

/**
 * Status Indicator Dot Component
 * @requirements 9.2
 */
const StatusIndicator: React.FC<{ status: ListItemStatus }> = memo(({ status }) => {
  const color = getStatusColor(status);
  
  if (!color) return null;

  return (
    <span
      style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        backgroundColor: color,
        flexShrink: 0,
      }}
      data-testid="list-item-status"
      data-status={status}
      aria-label={`Status: ${status}`}
    />
  );
});

StatusIndicator.displayName = 'StatusIndicator';

/**
 * ListItem Component
 * 
 * Individual list item with support for status indicators and actions.
 * @requirements 9.1, 9.2, 9.3, 9.4
 */
const ListItemComponent: React.FC<ListItemInternalProps> = ({
  id,
  primary,
  secondary,
  status,
  action,
  onClick,
  isLast = false,
  onItemClick,
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = useCallback(() => {
    if (onClick) {
      onClick();
    }
    if (onItemClick) {
      onItemClick({ id, primary, secondary, status, action, onClick });
    }
  }, [onClick, onItemClick, id, primary, secondary, status, action]);

  const isClickable = Boolean(onClick || onItemClick);

  // Base container styles
  // @requirements 9.1 - consistent padding (16px) and Border (#2A3242) separators
  const containerStyles: React.CSSProperties = useMemo(() => ({
    display: 'flex',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg, // 16px padding
    borderBottom: isLast ? 'none' : `1px solid ${colors.border}`,
    backgroundColor: isPressed 
      ? colors.surface 
      : isHovered && isClickable 
        ? `${colors.surface}80` 
        : 'transparent',
    cursor: isClickable ? 'pointer' : 'default',
    transition: 'background-color 0.15s ease-in-out',
    minHeight: DEFAULT_ITEM_HEIGHT,
    boxSizing: 'border-box',
  }), [isLast, isPressed, isHovered, isClickable]);

  // Content container styles
  const contentStyles: React.CSSProperties = {
    flex: 1,
    minWidth: 0, // Allow text truncation
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
  };

  // Primary text styles
  const primaryStyles: React.CSSProperties = {
    color: colors.textPrimary,
    fontSize: '1rem',
    fontWeight: 500,
    lineHeight: 1.4,
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  // Secondary text styles
  const secondaryStyles: React.CSSProperties = {
    color: colors.textSecondary,
    fontSize: '0.875rem',
    fontWeight: 400,
    lineHeight: 1.4,
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  return (
    <div
      role={isClickable ? 'button' : 'listitem'}
      tabIndex={isClickable ? 0 : undefined}
      onClick={isClickable ? handleClick : undefined}
      onKeyDown={isClickable ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      } : undefined}
      onMouseDown={() => isClickable && setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => {
        setIsPressed(false);
        setIsHovered(false);
      }}
      onMouseEnter={() => setIsHovered(true)}
      style={containerStyles}
      data-testid="list-item"
      data-item-id={id}
      aria-label={primary}
    >
      {/* Status indicator dot */}
      {status && status !== 'inactive' && (
        <StatusIndicator status={status} />
      )}

      {/* Content area */}
      <div style={contentStyles}>
        <p style={primaryStyles}>{primary}</p>
        {secondary && (
          <p style={secondaryStyles}>{secondary}</p>
        )}
      </div>

      {/* Action slot */}
      {action && (
        <div 
          style={{ flexShrink: 0 }}
          onClick={(e) => e.stopPropagation()}
          data-testid="list-item-action"
        >
          {action}
        </div>
      )}
    </div>
  );
};

const ListItem = memo(ListItemComponent);
ListItem.displayName = 'ListItem';

/**
 * Default Empty State Component
 * @requirements 9.6
 */
const DefaultEmptyState: React.FC = memo(() => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xxl,
      gap: spacing.md,
    }}
    data-testid="list-empty-state"
  >
    {/* Empty state icon */}
    <svg
      width={48}
      height={48}
      viewBox="0 0 24 24"
      fill="none"
      stroke={colors.textSecondary}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
    <p
      style={{
        color: colors.textSecondary,
        fontSize: '1rem',
        margin: 0,
        textAlign: 'center',
      }}
    >
      No items to display
    </p>
  </div>
));

DefaultEmptyState.displayName = 'DefaultEmptyState';

/**
 * Loading Skeleton for List
 */
const ListSkeleton: React.FC<{ count?: number }> = memo(({ count = 3 }) => (
  <div data-testid="list-skeleton">
    {Array.from({ length: count }).map((_, index) => (
      <div
        key={index}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.md,
          padding: spacing.lg,
          borderBottom: index < count - 1 ? `1px solid ${colors.border}` : 'none',
        }}
      >
        <Skeleton variant="circular" width={8} height={8} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
          <Skeleton variant="text" width="60%" height={16} />
          <Skeleton variant="text" width="40%" height={14} />
        </div>
      </div>
    ))}
  </div>
));

ListSkeleton.displayName = 'ListSkeleton';


/**
 * Simple Virtualized List Implementation
 * 
 * A lightweight virtualization approach that renders only visible items
 * plus a buffer. This avoids the need for react-window dependency.
 * 
 * @requirements 9.5 - Support virtualization for lists with more than 50 items
 */
interface VirtualizedListProps {
  items: ListItemProps[];
  itemHeight: number;
  maxHeight: number;
  onItemClick?: (item: ListItemProps) => void;
}

const VirtualizedList: React.FC<VirtualizedListProps> = memo(({
  items,
  itemHeight,
  maxHeight,
  onItemClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  // Buffer items above and below visible area
  const BUFFER_SIZE = 5;

  // Calculate visible range
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - BUFFER_SIZE);
  const endIndex = Math.min(
    items.length,
    Math.ceil((scrollTop + maxHeight) / itemHeight) + BUFFER_SIZE
  );

  // Total height for scroll area
  const totalHeight = items.length * itemHeight;

  // Offset for visible items
  const offsetY = startIndex * itemHeight;

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Visible items slice
  const visibleItems = useMemo(() => 
    items.slice(startIndex, endIndex),
    [items, startIndex, endIndex]
  );

  return (
    <div
      ref={containerRef}
      style={{
        height: maxHeight,
        overflow: 'auto',
        position: 'relative',
      }}
      onScroll={handleScroll}
      data-testid="virtualized-list-container"
    >
      {/* Spacer to maintain scroll height */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* Positioned container for visible items */}
        <div
          style={{
            position: 'absolute',
            top: offsetY,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, index) => (
            <ListItem
              key={item.id}
              {...item}
              isLast={startIndex + index === items.length - 1}
              onItemClick={onItemClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

VirtualizedList.displayName = 'VirtualizedList';

/**
 * List Component
 * 
 * A design system list component with support for status indicators,
 * action slots, virtualization, and empty states.
 * 
 * @requirements 9.1, 9.2, 9.3, 9.4, 9.5, 9.6
 */
const ListComponent: React.FC<ListProps> = ({
  items,
  loading = false,
  emptyState,
  virtualized,
  onItemClick,
  itemHeight = DEFAULT_ITEM_HEIGHT,
  maxHeight = DEFAULT_MAX_HEIGHT,
  className,
  style,
  'data-testid': testId = 'list',
}) => {
  // Determine if virtualization should be enabled
  // @requirements 9.5 - auto-enable for lists > 50 items
  const shouldVirtualize = virtualized ?? items.length > VIRTUALIZATION_THRESHOLD;

  // Container styles
  const containerStyles: React.CSSProperties = useMemo(() => ({
    backgroundColor: colors.card,
    borderRadius: borders.radius.card,
    border: `1px solid ${colors.border}`,
    overflow: 'hidden',
    ...style,
  }), [style]);

  // Show loading skeleton
  if (loading) {
    return (
      <div
        className={className}
        style={containerStyles}
        data-testid={testId}
        role="list"
        aria-busy="true"
      >
        <ListSkeleton count={3} />
      </div>
    );
  }

  // Show empty state when no items
  // @requirements 9.6
  if (items.length === 0) {
    return (
      <div
        className={className}
        style={containerStyles}
        data-testid={testId}
        role="list"
        aria-label="Empty list"
      >
        {emptyState || <DefaultEmptyState />}
      </div>
    );
  }

  // Render virtualized list for large datasets
  if (shouldVirtualize) {
    return (
      <div
        className={className}
        style={containerStyles}
        data-testid={testId}
        role="list"
        data-virtualized="true"
      >
        <VirtualizedList
          items={items}
          itemHeight={itemHeight}
          maxHeight={maxHeight}
          onItemClick={onItemClick}
        />
      </div>
    );
  }

  // Render standard list
  return (
    <div
      className={className}
      style={containerStyles}
      data-testid={testId}
      role="list"
    >
      {items.map((item, index) => (
        <ListItem
          key={item.id}
          {...item}
          isLast={index === items.length - 1}
          onItemClick={onItemClick}
        />
      ))}
    </div>
  );
};

// Memoized List component for performance
export const List = memo(ListComponent);
List.displayName = 'List';

// Export ListItem for standalone use if needed
export { ListItem };

export default List;
