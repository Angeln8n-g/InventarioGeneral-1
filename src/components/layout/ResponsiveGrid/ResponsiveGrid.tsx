'use client';

/**
 * ResponsiveGrid Component
 * @requirements 2.1, 2.2, 2.3
 */

import React, { memo, useMemo } from 'react';
import { spacing } from '@/design-system/tokens';
import { useResponsive } from '@/hooks/useResponsive';
import type { ResponsiveGridProps } from './ResponsiveGrid.types';

const DEFAULT_COLUMNS = {
  mobile: 1,
  tablet: 2,
  desktop: 4,
};

const ResponsiveGridComponent: React.FC<ResponsiveGridProps> = ({
  children,
  columns = DEFAULT_COLUMNS,
  gap = spacing.lg,
  className,
  style,
  'data-testid': testId = 'responsive-grid',
}) => {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  const columnCount = useMemo(() => {
    if (isMobile) return columns.mobile ?? DEFAULT_COLUMNS.mobile;
    if (isTablet) return columns.tablet ?? DEFAULT_COLUMNS.tablet;
    return columns.desktop ?? DEFAULT_COLUMNS.desktop;
  }, [isMobile, isTablet, isDesktop, columns]);

  const gridStyles: React.CSSProperties = useMemo(() => ({
    display: 'grid',
    gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
    gap: `${gap}px`,
    ...style,
  }), [columnCount, gap, style]);

  return (
    <div
      className={className}
      style={gridStyles}
      data-testid={testId}
      data-columns={columnCount}
    >
      {children}
    </div>
  );
};

export const ResponsiveGrid = memo(ResponsiveGridComponent);
ResponsiveGrid.displayName = 'ResponsiveGrid';

export default ResponsiveGrid;
