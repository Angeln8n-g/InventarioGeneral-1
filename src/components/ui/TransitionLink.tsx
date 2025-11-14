'use client';

/**
 * TransitionLink Component
 * Intelligent Link component with automatic view transitions
 */

import React from 'react';
import Link, { LinkProps } from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useViewTransition } from '@/hooks/useViewTransition';
import { TransitionSpeed, TransitionEasing } from '@/utils/view-transitions';
import { NavigationDirection } from '@/utils/route-analyzer';

// ============================================
// TYPES
// ============================================

export interface TransitionLinkProps extends Omit<LinkProps, 'onClick'> {
  children: React.ReactNode;
  className?: string;
  direction?: NavigationDirection | 'auto';
  speed?: TransitionSpeed;
  easing?: TransitionEasing;
  enableHaptics?: boolean;
  sharedElements?: string[];
  skipTransition?: boolean;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

// ============================================
// COMPONENT
// ============================================

export function TransitionLink({
  children,
  href,
  className,
  direction = 'auto',
  speed,
  easing,
  enableHaptics = true,
  sharedElements = [],
  skipTransition = false,
  onClick,
  ...linkProps
}: TransitionLinkProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  const { startTransition, isTransitioning } = useViewTransition({
    speed,
    easing,
    direction,
    enableHaptics,
    skipTransition,
  });
  
  /**
   * Maneja el click en el link
   */
  const handleClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Llamar onClick personalizado si existe
    onClick?.(e);
    
    // Si el evento fue prevenido, no hacer nada
    if (e.defaultPrevented) {
      return;
    }
    
    // Prevenir navegación por defecto
    e.preventDefault();
    
    // Si ya está en transición, ignorar
    if (isTransitioning) {
      return;
    }
    
    // Obtener URL de destino
    const targetHref = typeof href === 'string' ? href : href.pathname || '/';
    
    // Si es la misma ruta, no hacer nada
    if (targetHref === pathname) {
      return;
    }
    
    // Aplicar view-transition-name a shared elements
    if (sharedElements.length > 0) {
      sharedElements.forEach((selector, index) => {
        const element = document.querySelector(selector);
        if (element instanceof HTMLElement) {
          element.style.viewTransitionName = `shared-${index}`;
        }
      });
    }
    
    try {
      // Ejecutar transición
      await startTransition(async () => {
        // Navegar a la nueva ruta
        router.push(targetHref);
        
        // Esperar un frame para que Next.js actualice
        await new Promise(resolve => requestAnimationFrame(() => resolve(null)));
      }, targetHref);
    } finally {
      // Limpiar view-transition-name de shared elements
      if (sharedElements.length > 0) {
        sharedElements.forEach(selector => {
          const element = document.querySelector(selector);
          if (element instanceof HTMLElement) {
            element.style.viewTransitionName = '';
          }
        });
      }
    }
  };
  
  return (
    <Link
      href={href}
      className={className}
      onClick={handleClick}
      {...linkProps}
    >
      {children}
    </Link>
  );
}

// ============================================
// CONVENIENCE COMPONENTS
// ============================================

/**
 * Link para navegación hacia adelante (profundizar)
 */
export function ForwardLink(props: Omit<TransitionLinkProps, 'direction'>) {
  return <TransitionLink {...props} direction="forward" />;
}

/**
 * Link para navegación hacia atrás (regresar)
 */
export function BackwardLink(props: Omit<TransitionLinkProps, 'direction'>) {
  return <TransitionLink {...props} direction="backward" />;
}

/**
 * Link para navegación lateral (mismo nivel)
 */
export function LateralLink(props: Omit<TransitionLinkProps, 'direction'>) {
  return <TransitionLink {...props} direction="lateral" />;
}

/**
 * Link para abrir modales
 */
export function ModalLink(props: Omit<TransitionLinkProps, 'direction'>) {
  return <TransitionLink {...props} direction="modal" speed="fast" />;
}
