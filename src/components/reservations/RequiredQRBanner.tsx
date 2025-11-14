import React from 'react'

export interface RequiredQRInfo {
  required_qr_code_id: number
  qr_code: string
  location_name: string
  location_description: string
  zone: string
  icon: string
}

interface RequiredQRBannerProps {
  requiredQR: RequiredQRInfo
  className?: string
}

// Zone color mapping for visual distinction
const ZONE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  general: {
    bg: 'bg-blue-50',
    border: 'border-blue-300',
    text: 'text-blue-900',
  },
  tools: {
    bg: 'bg-orange-50',
    border: 'border-orange-300',
    text: 'text-orange-900',
  },
  consumables: {
    bg: 'bg-green-50',
    border: 'border-green-300',
    text: 'text-green-900',
  },
  electronics: {
    bg: 'bg-purple-50',
    border: 'border-purple-300',
    text: 'text-purple-900',
  },
}

/**
 * RequiredQRBanner Component
 * 
 * Displays the specific QR code location that the user must scan.
 * Features:
 * - Large, prominent display of location name
 * - Zone icon for visual identification
 * - Location description for additional context
 * - Color-coded by zone for quick recognition
 * - Responsive design for mobile and desktop
 */
export function RequiredQRBanner({ requiredQR, className = '' }: RequiredQRBannerProps) {
  const colors = ZONE_COLORS[requiredQR.zone] || ZONE_COLORS.general

  return (
    <div
      className={`
        ${colors.bg} ${colors.border} ${colors.text}
        border-2 rounded-lg p-4 mb-4 shadow-md
        ${className}
      `}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        {/* Zone Icon */}
        <div className="text-4xl flex-shrink-0" aria-hidden="true">
          {requiredQR.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="mb-2">
            <p className="text-sm font-medium uppercase tracking-wide opacity-75">
              Escanea este código QR:
            </p>
          </div>

          {/* Location Name - Prominent */}
          <h3 className="text-xl md:text-2xl font-bold mb-2 leading-tight">
            {requiredQR.location_name}
          </h3>

          {/* Location Description */}
          {requiredQR.location_description && (
            <p className="text-sm md:text-base opacity-90 mb-2">
              {requiredQR.location_description}
            </p>
          )}

          {/* QR Code (for manual entry reference) */}
          <div className="mt-3 pt-3 border-t border-current opacity-50">
            <p className="text-xs font-mono">
              Código: Obligatorio
            </p>
          </div>
        </div>
      </div>

      {/* Mobile-friendly hint */}
      <div className="mt-3 pt-3 border-t border-current opacity-75">
        <p className="text-xs md:text-sm">
          💡 <strong>Importante:</strong> Debes escanear el código QR en esta ubicación específica.
        </p>
      </div>
    </div>
  )
}

/**
 * Compact version of the banner for smaller spaces
 */
export function RequiredQRBannerCompact({ requiredQR, className = '' }: RequiredQRBannerProps) {
  const colors = ZONE_COLORS[requiredQR.zone] || ZONE_COLORS.general

  return (
    <div
      className={`
        ${colors.bg} ${colors.border} ${colors.text}
        border rounded-md p-3 shadow-sm
        ${className}
      `}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center gap-2">
        <span className="text-2xl" aria-hidden="true">
          {requiredQR.icon}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium opacity-75">Ubicación requerida:</p>
          <p className="text-sm font-bold truncate">{requiredQR.location_name}</p>
        </div>
      </div>
    </div>
  )
}
