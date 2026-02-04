/**
 * ActionCard Component Types
 * 
 * Type definitions for the ActionCard component used to display
 * quick action items with icon, title, and optional description.
 * 
 * @requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
 */

import React from 'react';

/**
 * Props for the ActionCard component
 */
export interface ActionCardProps {
  /** Icon to display in the card */
  icon: React.ReactNode;
  /** Title of the action */
  title: string;
  /** Optional description text */
  description?: string;
  /** Whether the card should have a highlighted border (Primary color) */
  highlighted?: boolean;
  /** Whether the card is disabled */
  disabled?: boolean;
  /** Click handler for the card */
  onClick?: () => void;
  /** Accessible label for the card */
  'aria-label'?: string;
  /** Optional CSS class name */
  className?: string;
  /** Optional inline styles */
  style?: React.CSSProperties;
  /** Test ID for testing purposes */
  'data-testid'?: string;
}
