'use client'

import React from 'react'
import type { TrendComparisonProps } from '@/types/statistics'

export function TrendComparison({ currentPeriod, previousPeriod, metrics }: TrendComparisonProps) {
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return Math.round(((current - previous) / previous) * 100)
  }

  return (
    <div className="w-full p-6 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
        Comparativa de Tendencias
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Consumibles</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{currentPeriod.consumablesUsed}</p>
          <p className={`text-sm ${calculateChange(currentPeriod.consumablesUsed, previousPeriod.consumablesUsed) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {calculateChange(currentPeriod.consumablesUsed, previousPeriod.consumablesUsed) > 0 ? '+' : ''}
            {calculateChange(currentPeriod.consumablesUsed, previousPeriod.consumablesUsed)}%
          </p>
        </div>
        <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Préstamos</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{currentPeriod.loansCreated}</p>
          <p className={`text-sm ${calculateChange(currentPeriod.loansCreated, previousPeriod.loansCreated) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {calculateChange(currentPeriod.loansCreated, previousPeriod.loansCreated) > 0 ? '+' : ''}
            {calculateChange(currentPeriod.loansCreated, previousPeriod.loansCreated)}%
          </p>
        </div>
        <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Duración Promedio</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{currentPeriod.avgLoanDuration} días</p>
          <p className={`text-sm ${calculateChange(currentPeriod.avgLoanDuration, previousPeriod.avgLoanDuration) >= 0 ? 'text-red-500' : 'text-green-500'}`}>
            {calculateChange(currentPeriod.avgLoanDuration, previousPeriod.avgLoanDuration) > 0 ? '+' : ''}
            {calculateChange(currentPeriod.avgLoanDuration, previousPeriod.avgLoanDuration)}%
          </p>
        </div>
        <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Costos</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">${currentPeriod.costs}</p>
          <p className={`text-sm ${calculateChange(currentPeriod.costs, previousPeriod.costs) >= 0 ? 'text-red-500' : 'text-green-500'}`}>
            {calculateChange(currentPeriod.costs, previousPeriod.costs) > 0 ? '+' : ''}
            {calculateChange(currentPeriod.costs, previousPeriod.costs)}%
          </p>
        </div>
      </div>
    </div>
  )
}
