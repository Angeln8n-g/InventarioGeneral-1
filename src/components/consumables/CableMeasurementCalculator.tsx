'use client'
import React, { useEffect, useMemo, useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Dialog } from '@/components/ui/Dialog'
import { useLanguage } from '@/contexts/LanguageContext'
import { calculateLength, parseMarker, validateMarkers, validateAgainstStock, validateReturnLength } from '@/utils/markerValidation'
import { getUnitDisplayName, getUnitDisplayNameEN } from '@/utils/cableDetection'

type Mode = 'consumption' | 'return'

interface CableMeasurementCalculatorProps {
  mode: Mode
  unitOfMeasure: string
  maxAvailableLength?: number // para consumo (stock disponible)
  consumedLength?: number // para devolución (lo consumido originalmente)
  alreadyReturned?: number // para devolución (lo ya devuelto)
  warningThreshold?: number
  className?: string
  onValidChange?: (payload: { startMarker: number; endMarker: number; length: number }) => void
}

export const CableMeasurementCalculator: React.FC<CableMeasurementCalculatorProps> = ({
  mode,
  unitOfMeasure,
  maxAvailableLength,
  consumedLength,
  alreadyReturned = 0,
  warningThreshold = 1000,
  className = '',
  onValidChange,
}) => {
  const { t, language, formatNumber } = useLanguage()

  const [startMarker, setStartMarker] = useState('')
  const [endMarker, setEndMarker] = useState('')
  const [errors, setErrors] = useState<string[]>([])
  const [warnings, setWarnings] = useState<string[]>([])
  const [length, setLength] = useState<number | null>(null)
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [largeConfirmed, setLargeConfirmed] = useState(false)

  const unitLabel = useMemo(() => (
    language === 'en' ? getUnitDisplayNameEN(unitOfMeasure) : getUnitDisplayName(unitOfMeasure)
  ), [unitOfMeasure, language])

  const translateMessage = (msg: string): string => {
    // Mapear mensajes conocidos del validador a claves de i18n
    if (msg === 'Ambos campos son requeridos') return t('calculator.error.required')
    if (msg === 'Los valores deben ser numéricos') return t('calculator.error.numeric')
    if (msg === 'Los valores deben ser positivos') return t('calculator.error.positive')
    if (msg === 'El número final debe ser mayor que el número inicial') return t('calculator.error.endGreater')
    if (msg.startsWith('La cantidad calculada (') && msg.includes(') excede el máximo permitido (')) {
      const match = msg.match(/La cantidad calculada \(([^)]+)\) excede el máximo permitido \(([^)]+)\)/)
      if (match) {
        const value = match[1]
        const max = match[2]
        return t('calculator.error.exceedsMax', { value, max })
      }
    }
    if (msg.startsWith('La cantidad calculada (') && msg.includes(') es menor al mínimo requerido (')) {
      const match = msg.match(/La cantidad calculada \(([^)]+)\) es menor al mínimo requerido \(([^)]+)\)/)
      if (match) {
        const value = match[1]
        const min = match[2]
        return t('calculator.error.belowMin', { value, min })
      }
    }
    if (msg.startsWith('Stock insuficiente. Disponible:')) {
      const match = msg.match(/Stock insuficiente\. Disponible: (.+)/)
      const available = match?.[1] ?? ''
      return t('calculator.error.insufficientStock', { available })
    }
    if (msg === 'Estás consumiendo más del 80% del stock disponible') return t('calculator.warning.stock80')
    if (msg.startsWith('No puedes devolver más de lo que consumiste')) {
      const match = msg.match(/Disponible para devolver: (.+)/)
      const available = match?.[1] ?? ''
      return t('calculator.error.returnExceeds', { available })
    }
    if (msg === 'Estás devolviendo todo lo consumido') return t('calculator.warning.returnAll')
    if (msg.startsWith('La cantidad calculada (') && msg.includes(') es muy grande')) return t('calculator.warning.large')
    return msg
  }

  // Cálculo y validación en tiempo real con debounce
  useEffect(() => {
    const handle = setTimeout(() => {
      const parsedStart = parseMarker(startMarker)
      const parsedEnd = parseMarker(endMarker)

      const baseValidation = validateMarkers(startMarker, endMarker, {
        allowDecimals: true,
        warningThreshold,
      })

      let currentErrors = [...baseValidation.errors]
      let currentWarnings = [...baseValidation.warnings]
      let calculated: number | null = null

      if (parsedStart != null && parsedEnd != null) {
        calculated = calculateLength(parsedStart, parsedEnd, 2)

        // Validación adicional contra stock en consumo
        if (mode === 'consumption' && typeof maxAvailableLength === 'number') {
          const stockValidation = validateAgainstStock(calculated, maxAvailableLength)
          currentErrors = [...currentErrors, ...stockValidation.errors]
          currentWarnings = [...currentWarnings, ...stockValidation.warnings]
        }

        // Validación adicional contra consumido en devolución
        if (mode === 'return' && typeof consumedLength === 'number') {
          const returnValidation = validateReturnLength(calculated, consumedLength, alreadyReturned)
          currentErrors = [...currentErrors, ...returnValidation.errors]
          currentWarnings = [...currentWarnings, ...returnValidation.warnings]
        }

        setLength(calculated)
      } else {
        setLength(null)
      }

      setErrors(currentErrors)
      setWarnings(currentWarnings)
      if (currentWarnings.some(w => w.includes('muy grande'))) setLargeConfirmed(false)

      // Emitir cuando es válido
      if (currentErrors.length === 0 && parsedStart != null && parsedEnd != null && calculated != null) {
        onValidChange?.({ startMarker: parsedStart, endMarker: parsedEnd, length: calculated })
      }
    }, 150)

    return () => clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startMarker, endMarker, mode, maxAvailableLength, consumedLength, alreadyReturned, warningThreshold])

  const hasErrors = errors.length > 0
  const hasWarnings = warnings.length > 0

  const resultText = useMemo(() => {
    if (hasErrors || length == null) return t('calculator.invalid')
    return t('calculator.calculated', { value: formatNumber(length), unit: unitLabel })
  }, [hasErrors, length, unitLabel, formatNumber, t])

  const headerIcon = (
    <svg className="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 10h10M7 14h10" />
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    </svg>
  )

  return (
    <div className={`p-4 rounded-lg border ${hasErrors ? 'border-red-accent' : 'border-gray-300 dark:border-gray-700'} bg-card-light dark:bg-card-dark ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        {headerIcon}
        <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">{t('calculator.helperText')}</span>
        <button
          type="button"
          className="ml-auto text-sm px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
          onClick={() => setIsHelpOpen(true)}
          aria-label={t('calculator.help.buttonAria')}
        >
          {t('calculator.help.button')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label={mode === 'return' ? t('calculator.segmentStartLabel') : t('calculator.initialLabel')}
          value={startMarker}
          onChange={(e) => setStartMarker(e.target.value)}
          placeholder={t('calculator.example')}
          type="number"
          inputMode="decimal"
          error={errors.length > 0 ? translateMessage(errors[0]) : undefined}
          aria-invalid={hasErrors}
        />
        <Input
          label={mode === 'return' ? t('calculator.segmentEndLabel') : t('calculator.finalLabel')}
          value={endMarker}
          onChange={(e) => setEndMarker(e.target.value)}
          placeholder={t('calculator.example')}
          type="number"
          inputMode="decimal"
          error={errors.length > 1 ? translateMessage(errors[1]) : undefined}
          aria-invalid={hasErrors}
        />
      </div>

      <div className={`mt-2 text-sm ${hasErrors ? 'text-red-accent' : 'text-text-secondary-light dark:text-text-secondary-dark'}`} aria-live="polite">
        {hasErrors ? translateMessage(errors[0]) : resultText}
      </div>

      {hasWarnings && (
        <div className="mt-2 text-amber-600 dark:text-amber-400 text-sm" aria-live="polite">
          {warnings.map((w, i) => (
            <div key={i} className="flex items-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
              </svg>
              <span>{translateMessage(w)}</span>
            </div>
          ))}

          {warnings.some(w => w.includes('muy grande')) && !largeConfirmed && (
            <div className="mt-2">
              <button
                type="button"
                className="px-3 py-1 rounded-md bg-primary text-white hover:opacity-90"
                onClick={() => setLargeConfirmed(true)}
              >
                {t('common.yes')}
              </button>
            </div>
          )}
        </div>
      )}

      <Dialog
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        title={t('calculator.help.title')}
        size="md"
      >
        <div className="space-y-3 text-text-secondary-light dark:text-text-secondary-dark">
          <p>{t('calculator.help.content1')}</p>
          <p>{t('calculator.help.content2')}</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>{t('calculator.help.point1')}</li>
            <li>{t('calculator.help.point2')}</li>
            <li>{t('calculator.help.point3')}</li>
          </ul>
        </div>
      </Dialog>
    </div>
  )
}
