/**
 * ResponsiveGrid Component Types
 * @requirements 2.1, 2.2, 2.3
 */

import React from 'react';

export interface ResponsiveGridProps {
  children: React.ReactNode;
  columns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  gap?: number;
  className?: string;
  style?: React.CSSProperties;
  'data-testid'?: string;
}
