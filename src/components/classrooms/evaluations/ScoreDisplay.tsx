'use client'

import React from 'react'
import {
  classifyScore,
  getClassificationLabel,
  calculatePercentage
} from '@/utils/evaluation-scoring'
import type { CategoryScores, ScoreClassification } from '@/types/evaluations'

/**
 * Props for the ScoreDisplay component
 */
export interface ScoreDisplayProps {
  /** Total score achieved (sum of 'yes' responses) */
  totalScore: number
  /** Maximum possible score (total questions minus 'not_applicable') */
  maxScore: number
  /** Optional breakdown of scores by category */
  categoryScores?: CategoryScores
  /** Size variant for the component */
  size?: 'sm' | 'md' | 'lg'
  /** Whether to show category breakdown */
  showCategories?: boolean
}

// Category labels in Spanish
const CATEGORY_LABELS: Record<keyof CategoryScores, string> = {
  organization: 'Organización',
  cleanliness: 'Limpieza',
  maintenance: 'Mantenimiento'
}

// Size configurations for different variants
const SIZE_CONFIG = {
  sm: {
    container: 'p-2',
    percentage: 'text-lg',
    label: 'text-xs',
    categoryText: 'text-xs',
    indicator: 'w-2 h-2',
    gap: 'gap-1'
  },
  md: {
    container: 'p-3',
    percentage: 'text-2xl',
    label: 'text-sm',
    categoryText: 'text-sm',
    indicator: 'w-3 h-3',
    gap: 'gap-2'
  },
  lg: {
    container: 'p-4',
    percentage: 'text-4xl',
    label: 'text-base',
    categoryText: 'text-base',
    indicator: 'w-4 h-4',
    gap: 'gap-3'
  }
} as const

// Color configurations for score classifications
const CLASSIFICATION_STYLES: Record<ScoreClassification, {
  bg: string
  text: string
  border: string
  indicator: string
  progressBg: string
}> = {
  requires_attention: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-200 dark:border-red-800',
    indicator: 'bg-red-500',
    progressBg: 'bg-red-500'
  },
  acceptable: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    text: 'text-yellow-700 dark:text-yellow-300',
    border: 'border-yellow-200 dark:border-yellow-800',
    indicator: 'bg-yellow-500',
    progressBg: 'bg-yellow-500'
  },
  excellent: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-200 dark:border-green-800',
    indicator: 'bg-green-500',
    progressBg: 'bg-green-500'
  }
}

/**
 * ScoreDisplay Component
 * 
 * Displays evaluation scores with color-coded indicators based on performance thresholds.
 * 
 * Features:
 * - Percentage display with color indicator (red <70%, yellow 70-89%, green ≥90%)
 * - Optional category breakdown (organization, cleanliness, maintenance)
 * - Configurable sizes (sm, md, lg)
 * - Tooltips with detailed information
 * - Dark/light theme support
 * 
 * @example
 * // Basic usage
 * <ScoreDisplay totalScore={85} maxScore={100} />
 * 
 * @example
 * // With category breakdown
 * <ScoreDisplay
 *   totalScore={85}
 *   maxScore={100}
 *   categoryScores={{
 *     organization: { score: 30, max: 35 },
 *     cleanliness: { score: 28, max: 30 },
 *     maintenance: { score: 27, max: 35 }
 *   }}
 *   showCategories
 *   size="lg"
 * />
 * 
 * @validates Requirements 4.4, 4.5, 4.6 - Score classification with color indicators
 */
export function ScoreDisplay({
  totalScore,
  maxScore,
  categoryScores,
  size = 'md',
  showCategories = false
}: ScoreDisplayProps) {
  // Calculate percentage
  const percentage = calculatePercentage(totalScore, maxScore)
  
  // Get classification based on percentage
  const classification = classifyScore(percentage)
  const classificationLabel = getClassificationLabel(classification)
  
  // Get style configurations
  const sizeConfig = SIZE_CONFIG[size]
  const colorStyles = CLASSIFICATION_STYLES[classification]

  // Build tooltip content
  const tooltipContent = buildTooltipContent(
    totalScore,
    maxScore,
    percentage,
    classificationLabel,
    categoryScores
  )

  return (
    <div
      className={`rounded-lg border ${colorStyles.border} ${colorStyles.bg} ${sizeConfig.container}`}
      title={tooltipContent}
    >
      {/* Main score display */}
      <div className={`flex items-center ${sizeConfig.gap}`}>
        {/* Color indicator */}
        <div
          className={`${sizeConfig.indicator} rounded-full ${colorStyles.indicator} flex-shrink-0`}
          aria-hidden="true"
        />
        
        {/* Percentage and label */}
        <div className="flex flex-col">
          <span className={`font-bold ${sizeConfig.percentage} ${colorStyles.text} leading-tight`}>
            {percentage.toFixed(1)}%
          </span>
          <span className={`${sizeConfig.label} ${colorStyles.text} opacity-80`}>
            {classificationLabel}
          </span>
        </div>
      </div>

      {/* Category breakdown */}
      {showCategories && categoryScores && (
        <CategoryBreakdown
          categoryScores={categoryScores}
          size={size}
          sizeConfig={sizeConfig}
        />
      )}

      {/* Screen reader text */}
      <span className="sr-only">
        Puntuación: {percentage.toFixed(1)} por ciento, clasificación: {classificationLabel}.
        {totalScore} de {maxScore} puntos posibles.
      </span>
    </div>
  )
}

/**
 * CategoryBreakdown Component
 * 
 * Displays the score breakdown by category with individual progress bars.
 */
interface CategoryBreakdownProps {
  categoryScores: CategoryScores
  size: 'sm' | 'md' | 'lg'
  sizeConfig: typeof SIZE_CONFIG[keyof typeof SIZE_CONFIG]
}

function CategoryBreakdown({ categoryScores, size, sizeConfig }: CategoryBreakdownProps) {
  const categories: (keyof CategoryScores)[] = ['organization', 'cleanliness', 'maintenance']
  
  // Progress bar height based on size
  const progressHeight = size === 'sm' ? 'h-1' : size === 'md' ? 'h-1.5' : 'h-2'

  return (
    <div className={`mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2`}>
      {categories.map(category => {
        const { score, max } = categoryScores[category]
        
        // Skip categories with no questions
        if (max === 0) return null
        
        const catPercentage = calculatePercentage(score, max)
        const catClassification = classifyScore(catPercentage)
        const catStyles = CLASSIFICATION_STYLES[catClassification]
        
        return (
          <div key={category} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className={`${sizeConfig.categoryText} text-gray-600 dark:text-gray-400`}>
                {CATEGORY_LABELS[category]}
              </span>
              <span 
                className={`${sizeConfig.categoryText} font-medium ${catStyles.text}`}
                title={`${score} de ${max} puntos`}
              >
                {catPercentage.toFixed(0)}%
              </span>
            </div>
            
            {/* Progress bar */}
            <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full ${progressHeight}`}>
              <div
                className={`${catStyles.progressBg} ${progressHeight} rounded-full transition-all duration-300`}
                style={{ width: `${Math.min(catPercentage, 100)}%` }}
                role="progressbar"
                aria-valuenow={catPercentage}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${CATEGORY_LABELS[category]}: ${catPercentage.toFixed(0)}%`}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

/**
 * Builds tooltip content with detailed score information
 */
function buildTooltipContent(
  totalScore: number,
  maxScore: number,
  percentage: number,
  classificationLabel: string,
  categoryScores?: CategoryScores
): string {
  const lines: string[] = [
    `Puntuación: ${percentage.toFixed(1)}%`,
    `Clasificación: ${classificationLabel}`,
    `Puntos: ${totalScore} de ${maxScore}`
  ]

  if (categoryScores) {
    lines.push('')
    lines.push('Desglose por categoría:')
    
    const categories: (keyof CategoryScores)[] = ['organization', 'cleanliness', 'maintenance']
    for (const category of categories) {
      const { score, max } = categoryScores[category]
      if (max > 0) {
        const catPercentage = calculatePercentage(score, max)
        lines.push(`• ${CATEGORY_LABELS[category]}: ${catPercentage.toFixed(0)}% (${score}/${max})`)
      }
    }
  }

  return lines.join('\n')
}

/**
 * ScoreDisplayCompact Component
 * 
 * A compact inline version of ScoreDisplay for use in tables or lists.
 * Shows only the percentage with a colored badge.
 */
export interface ScoreDisplayCompactProps {
  /** Total score achieved */
  totalScore: number
  /** Maximum possible score */
  maxScore: number
}

export function ScoreDisplayCompact({ totalScore, maxScore }: ScoreDisplayCompactProps) {
  const percentage = calculatePercentage(totalScore, maxScore)
  const classification = classifyScore(percentage)
  const classificationLabel = getClassificationLabel(classification)
  const colorStyles = CLASSIFICATION_STYLES[classification]

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${colorStyles.bg} ${colorStyles.text}`}
      title={`${classificationLabel}: ${totalScore} de ${maxScore} puntos`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${colorStyles.indicator}`} />
      {percentage.toFixed(0)}%
    </span>
  )
}

export default ScoreDisplay
