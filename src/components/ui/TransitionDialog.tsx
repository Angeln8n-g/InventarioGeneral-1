'use client';

/**
 * TransitionDialog Component
 * Advanced Dialog with contextual view transitions
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useViewTransitionsContext } from '@/contexts/ViewTransitionsContext';
import { TransitionSpeed, generateTransitionName, supportsViewTransitions } from '@/utils/view-transitions';
import { hapticMedium } from '@/utils/haptic-feedback';

// ============================================
// TYPES
// ============================================

export type AnimationType = 'auto' | 'fade' | 'scale' | 'slide' | 'slideUp' | 'slideDown';

export interface TransitionDialogProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  animationType?: AnimationType;
  origin?: { x: number; y: number } | null;
  speed?: TransitionSpeed;
  enableHaptics?: boolean;
  sharedElements?: string[];
  className?: string;
  overlayClassName?: string;
  title?: string;
  description?: string;
  [key: string]: any; // Allow any additional props like data attributes
}

// ============================================
// ANIMATION VARIANTS
// ============================================

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const getDialogVariants = (
  animationType: AnimationType,
  origin?: { x: number; y: number } | null
) => {
  switch (animationType) {
    case 'fade':
      return {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
        exit: { opacity: 0 },
      };
      
    case 'scale':
      // Si hay origin, calcular transform-origin relativo al viewport
      const transformOrigin = origin 
        ? `${origin.x}px ${origin.y}px`
        : 'center center';
      
      return {
        hidden: {
          opacity: 0,
          scale: 0.8,
          transformOrigin,
        },
        visible: {
          opacity: 1,
          scale: 1,
          transformOrigin,
        },
        exit: {
          opacity: 0,
          scale: 0.8,
          transformOrigin,
        },
      };
      
    case 'slideUp':
      return {
        hidden: { opacity: 0, y: '100%' },
        visible: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: '100%' },
      };
      
    case 'slideDown':
      return {
        hidden: { opacity: 0, y: '-100%' },
        visible: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: '-100%' },
      };
      
    case 'slide':
      return {
        hidden: { opacity: 0, x: 30 },
        visible: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: 30 },
      };
      
    default: // auto
      return {
        hidden: { opacity: 0, scale: 0.95 },
        visible: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.95 },
      };
  }
};

// ============================================
// COMPONENT
// ============================================

export function TransitionDialog({
  open,
  onClose,
  children,
  animationType = 'auto',
  origin = null,
  speed = 'fast',
  enableHaptics = true,
  sharedElements = [],
  className = '',
  overlayClassName = '',
  title,
  description,
  ...rest
}: TransitionDialogProps) {
  const { config, capabilities } = useViewTransitionsContext();
  const [isMounted, setIsMounted] = useState(false);
  const [transitionName] = useState(() => generateTransitionName('dialog'));
  const dialogRef = useRef<HTMLDivElement>(null);
  
  // Detectar tipo de animación automáticamente
  const effectiveAnimationType = animationType === 'auto'
    ? detectAnimationType(capabilities?.isMobile || false)
    : animationType;
  
  // Duración basada en speed
  const duration = config.speeds[speed] / 1000; // Convert to seconds
  
  // Montar/desmontar con delay para animaciones
  useEffect(() => {
    if (open) {
      setIsMounted(true);
      
      // Haptic feedback al abrir
      if (enableHaptics && config.enableHaptics) {
        hapticMedium();
      }
      
      // Aplicar view-transition-name a shared elements
      if (sharedElements.length > 0 && supportsViewTransitions()) {
        sharedElements.forEach((selector, index) => {
          const element = document.querySelector(selector);
          if (element instanceof HTMLElement) {
            element.style.viewTransitionName = `shared-${index}`;
          }
        });
      }
    } else {
      // Delay unmount para permitir animación de salida
      const timer = setTimeout(() => {
        setIsMounted(false);
        
        // Limpiar view-transition-name
        if (sharedElements.length > 0) {
          sharedElements.forEach(selector => {
            const element = document.querySelector(selector);
            if (element instanceof HTMLElement) {
              element.style.viewTransitionName = '';
            }
          });
        }
      }, duration * 1000);
      
      return () => clearTimeout(timer);
    }
  }, [open, duration, enableHaptics, config.enableHaptics, sharedElements]);
  
  // Cerrar con Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);
  
  // Prevenir scroll del body cuando está abierto
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);
  
  if (!isMounted) return null;
  
  const dialogVariants = getDialogVariants(effectiveAnimationType, origin);
  
  return (
    <AnimatePresence mode="wait">
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ viewTransitionName: transitionName }}
        >
          {/* Overlay */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: duration * 0.8 }}
            className={`absolute inset-0 bg-black/50 backdrop-blur-sm ${overlayClassName}`}
            onClick={onClose}
          />
          
          {/* Dialog */}
          <motion.div
            ref={dialogRef}
            variants={dialogVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{
              duration,
              ease: [0.4, 0, 0.2, 1],
            }}
            className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden ${className}`}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'dialog-title' : undefined}
            aria-describedby={description ? 'dialog-description' : undefined}
            {...rest}
          >
            {/* Header */}
            {(title || description) && (
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                {title && (
                  <h2
                    id="dialog-title"
                    className="text-xl font-semibold text-gray-900 dark:text-white"
                  >
                    {title}
                  </h2>
                )}
                {description && (
                  <p
                    id="dialog-description"
                    className="mt-1 text-sm text-gray-500 dark:text-gray-400"
                  >
                    {description}
                  </p>
                )}
              </div>
            )}
            
            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-8rem)]">
              {children}
            </div>
            
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Close dialog"
            >
              <svg
                className="w-5 h-5 text-gray-500 dark:text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Detecta el tipo de animación apropiado según el dispositivo
 */
function detectAnimationType(isMobile: boolean): AnimationType {
  if (isMobile) {
    return 'slideUp'; // Bottom sheets en móvil
  }
  return 'scale'; // Scale desde centro en desktop
}

// Haptic feedback is now imported from utility

/**
 * Detecta el origen del modal desde un elemento
 * Captura la posición del elemento que activó el modal para animar desde ese punto
 */
export function detectModalOrigin(element: HTMLElement | null): { x: number; y: number } | null {
  if (!element) return null;
  
  const rect = element.getBoundingClientRect();
  
  // Calcular el centro del elemento
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  
  return {
    x: centerX,
    y: centerY,
  };
}

/**
 * Hook para capturar el origen del modal desde un evento de click
 */
export function useModalOrigin() {
  const [origin, setOrigin] = React.useState<{ x: number; y: number } | null>(null);
  
  const captureOrigin = React.useCallback((event: React.MouseEvent<HTMLElement>) => {
    const element = event.currentTarget;
    const detectedOrigin = detectModalOrigin(element);
    setOrigin(detectedOrigin);
  }, []);
  
  const resetOrigin = React.useCallback(() => {
    setOrigin(null);
  }, []);
  
  return { origin, captureOrigin, resetOrigin };
}
