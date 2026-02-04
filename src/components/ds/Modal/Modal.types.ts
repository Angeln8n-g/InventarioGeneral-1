/**
 * Modal Component Type Definitions
 * 
 * Type definitions for the Design System Modal component.
 * Supports responsive variants (Bottom_Sheet on mobile, centered on desktop).
 * 
 * @requirements 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7
 */

import type { ReactNode } from 'react';

/**
 * Modal size variants
 * - sm: Small modal (max-width: 400px)
 * - md: Medium modal (max-width: 500px) - default
 * - lg: Large modal (max-width: 700px)
 * - full: Full screen modal
 */
export type ModalSize = 'sm' | 'md' | 'lg' | 'full';

/**
 * Modal component props interface
 */
export interface ModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when the modal should close */
  onClose: () => void;
  /** Title displayed in the modal header */
  title: string;
  /** Modal content */
  children: ReactNode;
  /** Optional footer content (e.g., action buttons) */
  footer?: ReactNode;
  /** Size variant of the modal */
  size?: ModalSize;
  /** Whether clicking the backdrop should close the modal */
  closeOnBackdrop?: boolean;
  /** Whether pressing Escape key should close the modal */
  closeOnEscape?: boolean;
}
