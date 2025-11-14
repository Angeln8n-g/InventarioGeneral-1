'use client'

import Image from 'next/image'
import { ReactNode, useState } from 'react'

interface OptimizedBackgroundImageProps {
  /** Ruta de la imagen en /public */
  src: string
  /** Texto alternativo para accesibilidad */
  alt: string
  /** Contenido a renderizar sobre la imagen */
  children: ReactNode
  /** Si la imagen debe cargarse con prioridad (para LCP) */
  priority?: boolean
  /** Opacidad del overlay oscuro (0-1) */
  overlayOpacity?: number
  /** Opacidad del overlay en dark mode (0-1) */
  darkOverlayOpacity?: number
  /** Clases adicionales para el contenedor */
  className?: string
  /** Calidad de la imagen (1-100) */
  quality?: number
}

export function OptimizedBackgroundImage({
  src,
  alt,
  children,
  priority = false,
  overlayOpacity = 0.2,
  darkOverlayOpacity = 0.4,
  className = '',
  quality = 85,
}: OptimizedBackgroundImageProps) {
  const [imageError, setImageError] = useState(false)

  // Fallback to gradient if image fails to load
  if (imageError) {
    return (
      <div className={`relative min-h-screen bg-gradient-to-br from-red-400 via-purple-400 to-blue-500 ${className}`}>
        <div className="relative z-10">
          {children}
        </div>
      </div>
    )
  }

  return (
    <div className={`relative min-h-screen ${className}`}>
      {/* Background Image Layer */}
      <div className="fixed inset-0 z-0">
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          quality={quality}
          sizes="100vw"
          className="object-cover"
          placeholder="blur"
          blurDataURL={generateBlurDataURL(src)}
          onError={() => setImageError(true)}
        />
        {/* Overlay for contrast - light mode */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})`,
          }}
        />
        {/* Overlay for contrast - dark mode */}
        <div 
          className="absolute inset-0 dark:block hidden"
          style={{
            backgroundColor: `rgba(0, 0, 0, ${darkOverlayOpacity})`,
          }}
        />
      </div>

      {/* Content Layer */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}

// Helper functions for blur placeholder generation
function shimmer(w: number, h: number): string {
  return `
    <svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <defs>
        <linearGradient id="g">
          <stop stop-color="#f3f4f6" offset="20%" />
          <stop stop-color="#e5e7eb" offset="50%" />
          <stop stop-color="#f3f4f6" offset="70%" />
        </linearGradient>
      </defs>
      <rect width="${w}" height="${h}" fill="#f3f4f6" />
      <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
      <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
    </svg>
  `
}

function toBase64(str: string): string {
  return typeof window === 'undefined'
    ? Buffer.from(str).toString('base64')
    : window.btoa(str)
}

function generateBlurDataURL(src: string): string {
  return `data:image/svg+xml;base64,${toBase64(shimmer(700, 475))}`
}
