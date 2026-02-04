'use client';

/**
 * Toast Provider Component
 * @requirements 13.5, 13.6
 */

import React, { createContext, useContext, useState, useCallback, useMemo, memo, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { ToastData, ToastType, ToastContextValue } from './Toast.types';
import { ToastContainer } from './Toast';

const MAX_TOASTS = 3;
const DEFAULT_DURATION = 4000;

const generateId = (): string => `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

export const ToastContext = createContext<ToastContextValue | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

const ToastProviderComponent: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const showToast = useCallback((type: ToastType, message: string, duration: number = DEFAULT_DURATION) => {
    const newToast: ToastData = { id: generateId(), type, message, duration };
    setToasts((current) => {
      const updated = [...current, newToast];
      return updated.length > MAX_TOASTS ? updated.slice(-MAX_TOASTS) : updated;
    });
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const contextValue = useMemo<ToastContextValue>(() => ({ toasts, showToast, dismissToast }), [toasts, showToast, dismissToast]);

  const renderToastContainer = () => {
    if (typeof document === 'undefined') return null;
    return createPortal(<ToastContainer toasts={toasts} onDismiss={dismissToast} />, document.body);
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {renderToastContainer()}
    </ToastContext.Provider>
  );
};

export const ToastProvider = memo(ToastProviderComponent);
ToastProvider.displayName = 'ToastProvider';

export const useToastContext = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context;
};

export default ToastProvider;
