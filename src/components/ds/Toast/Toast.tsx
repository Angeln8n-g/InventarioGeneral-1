'use client';

/**
 * Toast Component
 * @requirements 13.3, 13.4, 13.5, 13.6
 */

import React, { useEffect, useCallback, memo } from 'react';
import type { ToastProps, ToastType, ToastContainerProps } from './Toast.types';
import { colors, spacing, borders } from '@/design-system/tokens';

const DEFAULT_DURATION = 4000;

const getToastColor = (type: ToastType): string => {
  const colorMap: Record<ToastType, string> = {
    success: colors.accent,
    error: colors.danger,
    warning: colors.warning,
    info: colors.primary,
  };
  return colorMap[type];
};

const ToastIcon: React.FC<{ type: ToastType }> = ({ type }) => {
  const color = getToastColor(type);
  
  if (type === 'success') {
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M16.667 5L7.5 14.167L3.333 10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }
  
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="8" stroke={color} strokeWidth="2"/>
      <path d="M10 6v4M10 14h.01" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
};

const CloseIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const ToastComponent: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  const { id, type, message, duration = DEFAULT_DURATION } = toast;
  const accentColor = getToastColor(type);

  const handleDismiss = useCallback(() => onDismiss(id), [id, onDismiss]);

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(id), duration);
    return () => clearTimeout(timer);
  }, [id, duration, onDismiss]);

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing.md,
        padding: `${spacing.md}px ${spacing.lg}px`,
        backgroundColor: colors.card,
        borderRadius: borders.radius.card,
        borderLeft: `4px solid ${accentColor}`,
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
        minWidth: '280px',
        maxWidth: '400px',
        animation: 'slideIn 0.3s ease-out',
      }}
      data-testid={`toast-${type}`}
    >
      <ToastIcon type={type} />
      <p style={{ flex: 1, color: colors.textPrimary, fontSize: '0.875rem', margin: 0 }}>{message}</p>
      <button
        type="button"
        onClick={handleDismiss}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 28,
          height: 28,
          borderRadius: '50%',
          border: 'none',
          backgroundColor: 'transparent',
          color: colors.textSecondary,
          cursor: 'pointer',
        }}
        aria-label="Dismiss"
      >
        <CloseIcon />
      </button>
    </div>
  );
};

const ToastContainerComponent: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  const animationStyles = `
    @keyframes slideIn {
      from { opacity: 0; transform: translateX(100%); }
      to { opacity: 1; transform: translateX(0); }
    }
  `;

  return (
    <>
      <style>{animationStyles}</style>
      <div
        style={{
          position: 'fixed',
          top: spacing.xl,
          right: spacing.xl,
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.md,
          zIndex: 1100,
          pointerEvents: 'none',
        }}
        data-testid="toast-container"
      >
        {toasts.map((toast) => (
          <div key={toast.id} style={{ pointerEvents: 'auto' }}>
            <ToastComponent toast={toast} onDismiss={onDismiss} />
          </div>
        ))}
      </div>
    </>
  );
};

export const Toast = memo(ToastComponent);
export const ToastContainer = memo(ToastContainerComponent);
Toast.displayName = 'Toast';
ToastContainer.displayName = 'ToastContainer';

export default Toast;
