"use client"
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CableMeasurementCalculator } from '@/components/consumables/CableMeasurementCalculator'
import { useLanguage } from '@/contexts/LanguageContext'
import { ArrowLeft } from 'lucide-react'

export default function CableCalculatorPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const [mode, setMode] = useState<'consumption' | 'return'>('consumption')

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-text-light dark:text-text-dark transition-colors"
          aria-label={t('common.back')}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold text-text-light dark:text-text-dark">Cable Measurement Calculator</h1>
          <span className="text-text-secondary-light dark:text-text-secondary-dark">Demo</span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          className={`px-3 py-2 rounded-md ${mode === 'consumption' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-800 text-text-light dark:text-text-dark'}`}
          onClick={() => setMode('consumption')}
        >
          {t('consumables.consume')}
        </button>
        <button
          className={`px-3 py-2 rounded-md ${mode === 'return' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-800 text-text-light dark:text-text-dark'}`}
          onClick={() => setMode('return')}
        >
          {t('returns.confirmReturnBtn')}
        </button>
      </div>

      <div className="max-w-2xl">
        <CableMeasurementCalculator
          mode={mode}
          unitOfMeasure="m"
          maxAvailableLength={mode === 'consumption' ? 500 : undefined}
          consumedLength={mode === 'return' ? 200 : undefined}
          alreadyReturned={mode === 'return' ? 50 : undefined}
          warningThreshold={1000}
        />
      </div>
    </div>
  )
}
