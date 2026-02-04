'use client';

/**
 * Modal Component
 * 
 * A responsive modal component that renders as a Bottom_Sheet on mobile
 * and as a centered dialog on desktop. Implements focus trapping,
 * backdrop click, and Escape key close functionality.
 * 
 * @requirements 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7
 */

import React, { useEffect, useRef, useCallback, memo } from 'react';
import { createPortal } from 'react-dom';
import type { ModalProps, ModalSize } from './Modal.types';
import { colors, borders, spacing } from '@/design-system/tokens';
import { useResponsive } from '@/hooks/useResponsive';

/**
 * Close icon component for the modal header
 */
const CloseIcon: React.FC = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M18 6L6 18M6 6L18 18"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Get modal width based on size variant
 */
const getModalWidth = (size: ModalSize): string => {
  const widths: Record<ModalSize, string> = {
    sm: '400px',
    md: '500px',
    lg: '700px',
    full: '100%',
  };
  return widths[size];
};

/**
 * Get focusable elements within a container
 */
const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
  const focusableSelectors = [
    'button:not([disabled])',
    'a[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors));
};

/**
 * Modal Component
 * 
 * Renders a responsive modal with focus trapping and keyboard navigation.
 */
const ModalComponent: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
  closeOnEscape = true,
}) => {
  const { isMobile } = useResponsive();
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  /**
   * Handle Escape key press
   * @requirements 10.6
   */
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape' && closeOnEscape) {
        event.preventDefault();
        onClose();
      }

      // Focus trap implementation
      // @requirements 10.3
      if (event.key === 'Tab' && modalRef.current) {
        const focusableElements = getFocusableElements(modalRef.current);
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
          // Shift + Tab: Move focus backwards
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab: Move focus forwards
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    },
    [closeOnEscape, onClose]
  );

  /**
   * Handle backdrop click
   * @requirements 10.6
   */
  const handleBackdropClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (closeOnBackdrop && event.target === event.currentTarget) {
        onClose();
      }
    },
    [closeOnBackdrop, onClose]
  );

  /**
   * Handle close button click
   */
  const handleCloseClick = useCallback(() => {
    onClose();
  }, [onClose]);

  /**
   * Focus management and event listeners
   * @requirements 10.3
   */
  useEffect(() => {
    if (isOpen) {
      // Store the currently focused element
      previousActiveElement.current = document.activeElement as HTMLElement;

      // Add event listener for keyboard events
      document.addEventListener('keydown', handleKeyDown);

      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';

      // Focus the modal container or first focusable element
      if (modalRef.current) {
        const focusableElements = getFocusableElements(modalRef.current);
        if (focusableElements.length > 0) {
          // Small delay to ensure the modal is rendered
          setTimeout(() => {
            focusableElements[0].focus();
          }, 50);
        } else {
          modalRef.current.focus();
        }
      }
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';

      // Restore focus to the previously focused element
      if (previousActiveElement.current && !isOpen) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen, handleKeyDown]);

  // Don't render if not open
  if (!isOpen) {
    return null;
  }

  /**
   * Backdrop styles
   * @requirements 10.5
   */
  const backdropStyles: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: isMobile ? 'flex-end' : 'center',
    justifyContent: 'center',
    zIndex: 1000,
    // Animation
    animation: 'fadeIn 0.2s ease-out',
  };

  /**
   * Modal container styles
   * @requirements 10.1, 10.4, 10.5, 10.7
   */
  const modalStyles: React.CSSProperties = {
    // Requirement 10.1: Card (#1E2430) background with 16px border radius
    backgroundColor: colors.card,
    borderRadius: isMobile
      ? `${borders.radius.modal}px ${borders.radius.modal}px 0 0`
      : `${borders.radius.modal}px`,
    maxWidth: isMobile ? '100%' : getModalWidth(size),
    width: '100%',
    maxHeight: isMobile ? '90vh' : '85vh',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    // Requirement 10.7: Animations
    animation: isMobile
      ? 'slideUp 0.3s ease-out'
      : 'fadeScale 0.2s ease-out',
  };

  /**
   * Header styles
   * @requirements 10.2
   */
  const headerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${spacing.lg}px ${spacing.xl}px`,
    borderBottom: `1px solid ${colors.border}`,
    flexShrink: 0,
  };

  /**
   * Title styles
   */
  const titleStyles: React.CSSProperties = {
    color: colors.textPrimary,
    fontSize: '1.25rem',
    fontWeight: 600,
    margin: 0,
    lineHeight: 1.4,
  };

  /**
   * Close button styles
   * @requirements 10.2
   */
  const closeButtonStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    borderRadius: '50%',
    border: 'none',
    backgroundColor: 'transparent',
    color: colors.textSecondary,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    padding: 0,
  };

  /**
   * Content styles
   */
  const contentStyles: React.CSSProperties = {
    padding: spacing.xl,
    overflowY: 'auto',
    flex: 1,
    color: colors.textPrimary,
  };

  /**
   * Footer styles
   */
  const footerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.md,
    padding: `${spacing.lg}px ${spacing.xl}px`,
    borderTop: `1px solid ${colors.border}`,
    flexShrink: 0,
  };

  // CSS keyframes for animations
  const animationStyles = `
    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    @keyframes slideUp {
      from {
        transform: translateY(100%);
      }
      to {
        transform: translateY(0);
      }
    }

    @keyframes fadeScale {
      from {
        opacity: 0;
        transform: scale(0.95);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
  `;

  const modalContent = (
    <>
      <style>{animationStyles}</style>
      <div
        style={backdropStyles}
        onClick={handleBackdropClick}
        data-testid="modal-backdrop"
        aria-hidden="true"
      >
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          style={modalStyles}
          onClick={(e) => e.stopPropagation()}
          tabIndex={-1}
          data-testid="modal-container"
          data-variant={isMobile ? 'bottom-sheet' : 'centered'}
        >
          {/* Header with title and close button */}
          {/* @requirements 10.2 */}
          <div style={headerStyles} data-testid="modal-header">
            <h2 id="modal-title" style={titleStyles}>
              {title}
            </h2>
            <button
              type="button"
              onClick={handleCloseClick}
              style={closeButtonStyles}
              aria-label="Close modal"
              data-testid="modal-close-button"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.surface;
                e.currentTarget.style.color = colors.textPrimary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = colors.textSecondary;
              }}
              onFocus={(e) => {
                e.currentTarget.style.boxShadow = `0 0 0 2px ${colors.primary}`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <CloseIcon />
            </button>
          </div>

          {/* Modal content */}
          <div style={contentStyles} data-testid="modal-content">
            {children}
          </div>

          {/* Optional footer */}
          {footer && (
            <div style={footerStyles} data-testid="modal-footer">
              {footer}
            </div>
          )}
        </div>
      </div>
    </>
  );

  // Use portal to render modal at document body level
  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return null;
};

ModalComponent.displayName = 'Modal';

/**
 * Memoized Modal component for performance optimization
 */
export const Modal = memo(ModalComponent);

export default Modal;
