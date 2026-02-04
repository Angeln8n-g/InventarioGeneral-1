/**
 * useToast Hook
 * @requirements 13.3, 13.4, 13.5, 13.6
 */

import { useCallback } from 'react';
import { useToastContext } from '@/components/ds/Toast/ToastProvider';
import type { ToastType } from '@/components/ds/Toast/Toast.types';

export interface UseToastReturn {
  showToast: (type: ToastType, message: string, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  dismissToast: (id: string) => void;
  toasts: ReturnType<typeof useToastContext>['toasts'];
}

export function useToast(): UseToastReturn {
  const { showToast, dismissToast, toasts } = useToastContext();

  const success = useCallback((message: string, duration?: number) => showToast('success', message, duration), [showToast]);
  const error = useCallback((message: string, duration?: number) => showToast('error', message, duration), [showToast]);
  const warning = useCallback((message: string, duration?: number) => showToast('warning', message, duration), [showToast]);
  const info = useCallback((message: string, duration?: number) => showToast('info', message, duration), [showToast]);

  return { showToast, success, error, warning, info, dismissToast, toasts };
}

export default useToast;
