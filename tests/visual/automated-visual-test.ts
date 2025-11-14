/**
 * Automated Visual Testing Script for Claro Theme
 * 
 * This script provides automated verification of color values and contrast ratios
 * for the Claro theme implementation.
 */

interface ColorTest {
  name: string
  expectedLight?: string
  expectedDark?: string
  element: string
  property: string
}

interface ContrastTest {
  name: string
  foreground: string
  background: string
  minimumRatio: number
  level: 'AA' | 'AAA'
}

// Color definitions from Claro theme
export const CLARO_COLORS = {
  // Brand colors
  'claro-red': '#E30613',
  'claro-green': '#4CAF50',
  'claro-warning': '#FF9800',
  'claro-blue': '#1976D2',
  
  // Light mode
  'background-light': '#F4F4F4',
  'card-light': '#FFFFFF',
  'text-light': '#212121',
  'text-secondary-light': '#757575',
  
  // Dark mode
  'background-dark': '#121212',
  'card-dark': '#1E1E1E',
  'text-dark': '#FFFFFF',
  'text-secondary-dark': '#A3A3A3',
}

/**
 * Convert hex color to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

/**
 * Calculate relative luminance
 */
export function getRelativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex)
  if (!rgb) return 0

  const rsRGB = rgb.r / 255
  const gsRGB = rgb.g / 255
  const bsRGB = rgb.b / 255

  const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4)
  const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4)
  const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4)

  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/**
 * Calculate contrast ratio between two colors
 */
export function getContrastRatio(color1: string, color2: string): number {
  const l1 = getRelativeLuminance(color1)
  const l2 = getRelativeLuminance(color2)

  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)

  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Check if contrast ratio meets WCAG standards
 */
export function meetsWCAG(ratio: number, level: 'AA' | 'AAA', isLargeText: boolean = false): boolean {
  if (level === 'AA') {
    return isLargeText ? ratio >= 3 : ratio >= 4.5
  } else {
    return isLargeText ? ratio >= 4.5 : ratio >= 7
  }
}

/**
 * Contrast tests for Claro theme
 */
export const CONTRAST_TESTS: ContrastTest[] = [
  // Light mode contrasts
  {
    name: 'Light Mode: Primary text on background',
    foreground: CLARO_COLORS['text-light'],
    background: CLARO_COLORS['background-light'],
    minimumRatio: 4.5,
    level: 'AA',
  },
  {
    name: 'Light Mode: Secondary text on background',
    foreground: CLARO_COLORS['text-secondary-light'],
    background: CLARO_COLORS['background-light'],
    minimumRatio: 4.5,
    level: 'AA',
  },
  {
    name: 'Light Mode: Primary text on card',
    foreground: CLARO_COLORS['text-light'],
    background: CLARO_COLORS['card-light'],
    minimumRatio: 4.5,
    level: 'AA',
  },
  {
    name: 'Light Mode: Claro red on white',
    foreground: CLARO_COLORS['claro-red'],
    background: CLARO_COLORS['card-light'],
    minimumRatio: 4.5,
    level: 'AA',
  },
  
  // Dark mode contrasts
  {
    name: 'Dark Mode: Primary text on background',
    foreground: CLARO_COLORS['text-dark'],
    background: CLARO_COLORS['background-dark'],
    minimumRatio: 4.5,
    level: 'AA',
  },
  {
    name: 'Dark Mode: Secondary text on background',
    foreground: CLARO_COLORS['text-secondary-dark'],
    background: CLARO_COLORS['background-dark'],
    minimumRatio: 4.5,
    level: 'AA',
  },
  {
    name: 'Dark Mode: Primary text on card',
    foreground: CLARO_COLORS['text-dark'],
    background: CLARO_COLORS['card-dark'],
    minimumRatio: 4.5,
    level: 'AA',
  },
  {
    name: 'Dark Mode: Claro red on card',
    foreground: CLARO_COLORS['claro-red'],
    background: CLARO_COLORS['card-dark'],
    minimumRatio: 3,
    level: 'AA',
  },
  
  // Button contrasts
  {
    name: 'Button: White text on claro-red',
    foreground: '#FFFFFF',
    background: CLARO_COLORS['claro-red'],
    minimumRatio: 4.5,
    level: 'AA',
  },
  
  // Badge contrasts
  {
    name: 'Badge: White text on claro-green',
    foreground: '#FFFFFF',
    background: CLARO_COLORS['claro-green'],
    minimumRatio: 4.5,
    level: 'AA',
  },
  {
    name: 'Badge: White text on claro-warning',
    foreground: '#FFFFFF',
    background: CLARO_COLORS['claro-warning'],
    minimumRatio: 4.5,
    level: 'AA',
  },
  {
    name: 'Badge: White text on claro-blue',
    foreground: '#FFFFFF',
    background: CLARO_COLORS['claro-blue'],
    minimumRatio: 4.5,
    level: 'AA',
  },
]

/**
 * Run all contrast tests
 */
export function runContrastTests(): {
  passed: number
  failed: number
  results: Array<{
    test: ContrastTest
    ratio: number
    passed: boolean
  }>
} {
  const results = CONTRAST_TESTS.map((test) => {
    const ratio = getContrastRatio(test.foreground, test.background)
    const passed = ratio >= test.minimumRatio

    return {
      test,
      ratio,
      passed,
    }
  })

  const passed = results.filter((r) => r.passed).length
  const failed = results.filter((r) => !r.passed).length

  return { passed, failed, results }
}

/**
 * Generate contrast test report
 */
export function generateContrastReport(): string {
  const { passed, failed, results } = runContrastTests()

  let report = '# Claro Theme Contrast Test Report\n\n'
  report += `**Date**: ${new Date().toISOString()}\n\n`
  report += `**Summary**: ${passed} passed, ${failed} failed\n\n`
  report += '---\n\n'

  report += '## Test Results\n\n'

  results.forEach((result, index) => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL'
    report += `### ${index + 1}. ${result.test.name}\n\n`
    report += `- **Status**: ${status}\n`
    report += `- **Foreground**: ${result.test.foreground}\n`
    report += `- **Background**: ${result.test.background}\n`
    report += `- **Contrast Ratio**: ${result.ratio.toFixed(2)}:1\n`
    report += `- **Required**: ${result.test.minimumRatio}:1 (${result.test.level})\n`
    report += `- **Result**: ${result.passed ? 'Meets requirements' : 'Does not meet requirements'}\n\n`
  })

  report += '---\n\n'
  report += '## Color Reference\n\n'
  report += '### Brand Colors\n'
  report += `- Claro Red: ${CLARO_COLORS['claro-red']}\n`
  report += `- Claro Green: ${CLARO_COLORS['claro-green']}\n`
  report += `- Claro Warning: ${CLARO_COLORS['claro-warning']}\n`
  report += `- Claro Blue: ${CLARO_COLORS['claro-blue']}\n\n`

  report += '### Light Mode\n'
  report += `- Background: ${CLARO_COLORS['background-light']}\n`
  report += `- Card: ${CLARO_COLORS['card-light']}\n`
  report += `- Text Primary: ${CLARO_COLORS['text-light']}\n`
  report += `- Text Secondary: ${CLARO_COLORS['text-secondary-light']}\n\n`

  report += '### Dark Mode\n'
  report += `- Background: ${CLARO_COLORS['background-dark']}\n`
  report += `- Card: ${CLARO_COLORS['card-dark']}\n`
  report += `- Text Primary: ${CLARO_COLORS['text-dark']}\n`
  report += `- Text Secondary: ${CLARO_COLORS['text-secondary-dark']}\n\n`

  return report
}

/**
 * Verify color consistency across theme
 */
export function verifyColorConsistency(): {
  consistent: boolean
  issues: string[]
} {
  const issues: string[] = []

  // Verify that accent colors are the same in both themes
  const accentColors = ['claro-red', 'claro-green', 'claro-warning', 'claro-blue']
  
  // This is a placeholder - in a real implementation, you would check
  // that these colors are used consistently across components

  return {
    consistent: issues.length === 0,
    issues,
  }
}

// Export for use in tests
export default {
  CLARO_COLORS,
  hexToRgb,
  getRelativeLuminance,
  getContrastRatio,
  meetsWCAG,
  runContrastTests,
  generateContrastReport,
  verifyColorConsistency,
}
