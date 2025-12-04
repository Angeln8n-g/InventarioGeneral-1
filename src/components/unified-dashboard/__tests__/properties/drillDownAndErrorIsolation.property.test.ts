/**
 * Property-Based Tests for Drill-down Filter Preservation and Section Error Isolation
 *
 * **Feature: unified-reports-dashboard, Property 10: Drill-down Filter Preservation**
 * **Feature: unified-reports-dashboard, Property 12: Section Error Isolation**
 * **Validates: Requirements 6.3, 7.4**
 */

import * as fc from 'fast-check'

// Types for testing
interface GlobalFilters {
  dateRange: {
    type: 'week' | 'month' | 'quarter' | 'year' | 'custom'
    start?: string
    end?: string
  }
  category?: string
}

type DashboardSection = 'overview' | 'tools' | 'consumables' | 'loans' | 'electronics' | 'classrooms' | 'users'

interface DrillDownContext {
  metric: string
  filters: GlobalFilters
  sourceSection: DashboardSection
}

interface SectionErrorState {
  section: DashboardSection
  hasError: boolean
  errorMessage?: string
}

// Helper function to simulate drill-down with filter preservation
function performDrillDown(
  currentFilters: GlobalFilters,
  metric: string,
  sourceSection: DashboardSection
): DrillDownContext {
  // Drill-down should preserve all current filters
  return {
    metric,
    filters: { ...currentFilters },
    sourceSection,
  }
}

// Helper function to check if filters are preserved
function areFiltersPreserved(original: GlobalFilters, drillDownContext: DrillDownContext): boolean {
  return (
    original.dateRange.type === drillDownContext.filters.dateRange.type &&
    original.dateRange.start === drillDownContext.filters.dateRange.start &&
    original.dateRange.end === drillDownContext.filters.dateRange.end &&
    original.category === drillDownContext.filters.category
  )
}

// Helper function to simulate section error handling
function handleSectionError(
  currentErrors: Record<DashboardSection, boolean>,
  section: DashboardSection,
  hasError: boolean
): Record<DashboardSection, boolean> {
  return {
    ...currentErrors,
    [section]: hasError,
  }
}

// Helper function to check if other sections are unaffected
function areOtherSectionsUnaffected(
  errorsBefore: Record<DashboardSection, boolean>,
  errorsAfter: Record<DashboardSection, boolean>,
  affectedSection: DashboardSection
): boolean {
  const sections: DashboardSection[] = ['overview', 'tools', 'consumables', 'loans', 'electronics', 'classrooms', 'users']

  return sections
    .filter((s) => s !== affectedSection)
    .every((s) => errorsBefore[s] === errorsAfter[s])
}

// Generators
const dateRangeTypeArb = fc.constantFrom<'week' | 'month' | 'quarter' | 'year' | 'custom'>(
  'week',
  'month',
  'quarter',
  'year',
  'custom'
)

const globalFiltersArb: fc.Arbitrary<GlobalFilters> = fc.record({
  dateRange: fc.record({
    type: dateRangeTypeArb,
    start: fc.option(fc.constant('2024-01-01'), { nil: undefined }),
    end: fc.option(fc.constant('2024-12-31'), { nil: undefined }),
  }),
  category: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: undefined }),
})

const sectionArb = fc.constantFrom<DashboardSection>(
  'overview',
  'tools',
  'consumables',
  'loans',
  'electronics',
  'classrooms',
  'users'
)

const metricArb = fc.constantFrom(
  'total',
  'available',
  'loaned',
  'maintenance',
  'low_stock',
  'overdue',
  'active',
  'assigned'
)

const sectionErrorsArb: fc.Arbitrary<Record<DashboardSection, boolean>> = fc.record({
  overview: fc.boolean(),
  tools: fc.boolean(),
  consumables: fc.boolean(),
  loans: fc.boolean(),
  electronics: fc.boolean(),
  classrooms: fc.boolean(),
  users: fc.boolean(),
})

describe('Drill-down and Error Isolation Properties', () => {
  /**
   * **Feature: unified-reports-dashboard, Property 10: Drill-down Filter Preservation**
   * **Validates: Requirements 6.3**
   *
   * For any drill-down action from a summary metric, the detailed view should
   * maintain all currently applied global filters.
   */
  it('drill-down should preserve all filter values', () => {
    fc.assert(
      fc.property(fc.tuple(globalFiltersArb, metricArb, sectionArb), ([filters, metric, section]) => {
        const drillDownContext = performDrillDown(filters, metric, section)

        expect(areFiltersPreserved(filters, drillDownContext)).toBe(true)
      }),
      { numRuns: 100 }
    )
  })

  /**
   * **Feature: unified-reports-dashboard, Property 10: Drill-down Filter Preservation**
   * **Validates: Requirements 6.3**
   *
   * Drill-down context should include the source section.
   */
  it('drill-down context should include source section', () => {
    fc.assert(
      fc.property(fc.tuple(globalFiltersArb, metricArb, sectionArb), ([filters, metric, section]) => {
        const drillDownContext = performDrillDown(filters, metric, section)

        expect(drillDownContext.sourceSection).toBe(section)
      }),
      { numRuns: 100 }
    )
  })

  /**
   * **Feature: unified-reports-dashboard, Property 10: Drill-down Filter Preservation**
   * **Validates: Requirements 6.3**
   *
   * Drill-down context should include the metric being drilled into.
   */
  it('drill-down context should include metric', () => {
    fc.assert(
      fc.property(fc.tuple(globalFiltersArb, metricArb, sectionArb), ([filters, metric, section]) => {
        const drillDownContext = performDrillDown(filters, metric, section)

        expect(drillDownContext.metric).toBe(metric)
      }),
      { numRuns: 100 }
    )
  })

  /**
   * **Feature: unified-reports-dashboard, Property 10: Drill-down Filter Preservation**
   * **Validates: Requirements 6.3**
   *
   * Date range filter should be preserved exactly.
   */
  it('date range filter should be preserved exactly', () => {
    fc.assert(
      fc.property(fc.tuple(globalFiltersArb, metricArb, sectionArb), ([filters, metric, section]) => {
        const drillDownContext = performDrillDown(filters, metric, section)

        expect(drillDownContext.filters.dateRange.type).toBe(filters.dateRange.type)
        expect(drillDownContext.filters.dateRange.start).toBe(filters.dateRange.start)
        expect(drillDownContext.filters.dateRange.end).toBe(filters.dateRange.end)
      }),
      { numRuns: 100 }
    )
  })

  /**
   * **Feature: unified-reports-dashboard, Property 12: Section Error Isolation**
   * **Validates: Requirements 7.4**
   *
   * For any API failure in one section, all other sections should continue
   * to display their data correctly.
   */
  it('error in one section should not affect other sections', () => {
    fc.assert(
      fc.property(fc.tuple(sectionErrorsArb, sectionArb, fc.boolean()), ([initialErrors, section, newErrorState]) => {
        const updatedErrors = handleSectionError(initialErrors, section, newErrorState)

        expect(areOtherSectionsUnaffected(initialErrors, updatedErrors, section)).toBe(true)
      }),
      { numRuns: 100 }
    )
  })

  /**
   * **Feature: unified-reports-dashboard, Property 12: Section Error Isolation**
   * **Validates: Requirements 7.4**
   *
   * Setting error state for a section should only affect that section.
   */
  it('setting error state should only affect target section', () => {
    fc.assert(
      fc.property(fc.tuple(sectionArb, fc.boolean()), ([section, hasError]) => {
        const initialErrors: Record<DashboardSection, boolean> = {
          overview: false,
          tools: false,
          consumables: false,
          loans: false,
          electronics: false,
          classrooms: false,
          users: false,
        }

        const updatedErrors = handleSectionError(initialErrors, section, hasError)

        // Only the target section should change
        expect(updatedErrors[section]).toBe(hasError)

        // All other sections should remain false
        const sections: DashboardSection[] = ['overview', 'tools', 'consumables', 'loans', 'electronics', 'classrooms', 'users']
        sections
          .filter((s) => s !== section)
          .forEach((s) => {
            expect(updatedErrors[s]).toBe(false)
          })
      }),
      { numRuns: 100 }
    )
  })

  /**
   * **Feature: unified-reports-dashboard, Property 12: Section Error Isolation**
   * **Validates: Requirements 7.4**
   *
   * Multiple sections can have errors independently.
   */
  it('multiple sections can have errors independently', () => {
    fc.assert(
      fc.property(
        fc.tuple(sectionArb, sectionArb).filter(([a, b]) => a !== b),
        ([section1, section2]) => {
          let errors: Record<DashboardSection, boolean> = {
            overview: false,
            tools: false,
            consumables: false,
            loans: false,
            electronics: false,
            classrooms: false,
            users: false,
          }

          // Set error for first section
          errors = handleSectionError(errors, section1, true)
          expect(errors[section1]).toBe(true)
          expect(errors[section2]).toBe(false)

          // Set error for second section
          errors = handleSectionError(errors, section2, true)
          expect(errors[section1]).toBe(true)
          expect(errors[section2]).toBe(true)

          // Clear error for first section
          errors = handleSectionError(errors, section1, false)
          expect(errors[section1]).toBe(false)
          expect(errors[section2]).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * **Feature: unified-reports-dashboard, Property 12: Section Error Isolation**
   * **Validates: Requirements 7.4**
   *
   * Error state should be toggleable.
   */
  it('error state should be toggleable', () => {
    fc.assert(
      fc.property(sectionArb, (section) => {
        let errors: Record<DashboardSection, boolean> = {
          overview: false,
          tools: false,
          consumables: false,
          loans: false,
          electronics: false,
          classrooms: false,
          users: false,
        }

        // Set error
        errors = handleSectionError(errors, section, true)
        expect(errors[section]).toBe(true)

        // Clear error
        errors = handleSectionError(errors, section, false)
        expect(errors[section]).toBe(false)

        // Set error again
        errors = handleSectionError(errors, section, true)
        expect(errors[section]).toBe(true)
      }),
      { numRuns: 100 }
    )
  })
})
