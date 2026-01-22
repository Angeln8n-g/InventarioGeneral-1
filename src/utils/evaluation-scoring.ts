/**
 * Evaluation Scoring Utilities
 * Sistema de Evaluación de Aulas - Funciones de Cálculo de Puntuación
 * 
 * This module provides pure functions for calculating evaluation scores,
 * percentages, and classifications based on the defined scoring rules:
 * 
 * Scoring Rules:
 * - Yes = 1 point
 * - No = 0 points
 * - Not Applicable = Excluded from calculation
 * 
 * Score Classifications:
 * - < 70%: Requires Attention (requires_attention)
 * - 70-89%: Acceptable (acceptable)
 * - >= 90%: Excellent (excellent)
 * 
 * @module utils/evaluation-scoring
 * @validates Requirements 4.1, 4.2, 4.4, 4.5, 4.6
 */

import type { 
  ResponseType, 
  QuestionCategory, 
  ScoreClassification,
  CategoryScores 
} from '@/types/evaluations'

// ============================================================================
// Types
// ============================================================================

/**
 * Input for score calculation - a response with its category
 */
export interface ResponseWithCategory {
  response: ResponseType
  category: QuestionCategory
}

/**
 * Result of score calculation
 */
export interface ScoreResult {
  /** Total score (sum of 'yes' responses) */
  totalScore: number
  /** Maximum possible score (total responses minus 'not_applicable') */
  maxPossibleScore: number
  /** Score as percentage: (totalScore / maxPossibleScore) × 100 */
  percentage: number
  /** Scores broken down by category */
  categoryScores: CategoryScores
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Score classification thresholds
 */
export const SCORE_THRESHOLDS = {
  /** Below this percentage is "requires_attention" */
  REQUIRES_ATTENTION_MAX: 70,
  /** Below this percentage (and >= 70) is "acceptable" */
  ACCEPTABLE_MAX: 90,
} as const

// ============================================================================
// Scoring Functions
// ============================================================================

/**
 * Calculates the total score and category scores from evaluation responses.
 * 
 * Scoring Rules:
 * - 'yes' = 1 point
 * - 'no' = 0 points
 * - 'not_applicable' = excluded from calculation (not counted in max)
 * 
 * @param responses - Array of responses with their categories
 * @returns ScoreResult with total score, max possible, percentage, and category breakdown
 * 
 * @example
 * const responses = [
 *   { response: 'yes', category: 'organization' },
 *   { response: 'no', category: 'cleanliness' },
 *   { response: 'not_applicable', category: 'maintenance' }
 * ]
 * const result = calculateScore(responses)
 * // result.totalScore = 1
 * // result.maxPossibleScore = 2
 * // result.percentage = 50
 * 
 * @validates Requirement 4.1 - Score calculation formula
 * @validates Requirement 4.2 - Percentage calculation
 * @validates Requirement 4.3 - Category score breakdown
 */
export function calculateScore(responses: ResponseWithCategory[]): ScoreResult {
  // Initialize category scores
  const categoryScores: CategoryScores = {
    organization: { score: 0, max: 0 },
    cleanliness: { score: 0, max: 0 },
    maintenance: { score: 0, max: 0 },
  }

  let totalScore = 0
  let maxPossibleScore = 0

  // Process each response
  for (const { response, category } of responses) {
    // Skip 'not_applicable' responses - they don't count toward max
    if (response === 'not_applicable') {
      continue
    }

    // Increment max possible score for applicable responses
    maxPossibleScore += 1
    categoryScores[category].max += 1

    // Add point for 'yes' responses
    if (response === 'yes') {
      totalScore += 1
      categoryScores[category].score += 1
    }
    // 'no' responses add 0 points (no action needed)
  }

  // Calculate percentage
  const percentage = calculatePercentage(totalScore, maxPossibleScore)

  return {
    totalScore,
    maxPossibleScore,
    percentage,
    categoryScores,
  }
}

/**
 * Calculates the percentage score from a score and maximum possible score.
 * 
 * Formula: (score / max) × 100, rounded to 2 decimal places
 * 
 * @param score - The achieved score
 * @param max - The maximum possible score
 * @returns The percentage (0-100), or 0 if max is 0
 * 
 * @example
 * calculatePercentage(7, 10) // returns 70
 * calculatePercentage(9, 10) // returns 90
 * calculatePercentage(0, 0)  // returns 0 (edge case: no applicable questions)
 * 
 * @validates Requirement 4.2 - Percentage calculation formula
 */
export function calculatePercentage(score: number, max: number): number {
  // Handle edge case: no applicable questions
  if (max === 0) {
    return 0
  }

  // Calculate percentage and round to 2 decimal places
  const percentage = (score / max) * 100
  return Math.round(percentage * 100) / 100
}

/**
 * Classifies a score percentage into a classification category.
 * 
 * Classification Rules:
 * - < 70%: 'requires_attention' (Requiere Atención - red indicator)
 * - 70% to 89%: 'acceptable' (Aceptable - yellow indicator)
 * - >= 90%: 'excellent' (Excelente - green indicator)
 * 
 * @param percentage - The score percentage (0-100)
 * @returns The score classification
 * 
 * @example
 * classifyScore(65)  // returns 'requires_attention'
 * classifyScore(70)  // returns 'acceptable'
 * classifyScore(89)  // returns 'acceptable'
 * classifyScore(90)  // returns 'excellent'
 * classifyScore(100) // returns 'excellent'
 * 
 * @validates Requirement 4.4 - < 70% is "Requiere Atención"
 * @validates Requirement 4.5 - 70-89% is "Aceptable"
 * @validates Requirement 4.6 - >= 90% is "Excelente"
 */
export function classifyScore(percentage: number): ScoreClassification {
  if (percentage < SCORE_THRESHOLDS.REQUIRES_ATTENTION_MAX) {
    return 'requires_attention'
  }
  
  if (percentage < SCORE_THRESHOLDS.ACCEPTABLE_MAX) {
    return 'acceptable'
  }
  
  return 'excellent'
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Gets the display label for a score classification in Spanish.
 * 
 * @param classification - The score classification
 * @returns The Spanish label for the classification
 */
export function getClassificationLabel(classification: ScoreClassification): string {
  const labels: Record<ScoreClassification, string> = {
    requires_attention: 'Requiere Atención',
    acceptable: 'Aceptable',
    excellent: 'Excelente',
  }
  return labels[classification]
}

/**
 * Gets the color indicator for a score classification.
 * 
 * @param classification - The score classification
 * @returns The color name for the classification
 */
export function getClassificationColor(classification: ScoreClassification): 'red' | 'yellow' | 'green' {
  const colors: Record<ScoreClassification, 'red' | 'yellow' | 'green'> = {
    requires_attention: 'red',
    acceptable: 'yellow',
    excellent: 'green',
  }
  return colors[classification]
}

/**
 * Calculates the percentage for a single category.
 * 
 * @param categoryScore - The category score object with score and max
 * @returns The percentage for that category
 */
export function calculateCategoryPercentage(categoryScore: { score: number; max: number }): number {
  return calculatePercentage(categoryScore.score, categoryScore.max)
}
