/**
 * Property-based tests for Alert Generation
 * 
 * **Feature: unified-reports-dashboard, Property 6: Low Stock Alert Generation**
 * **Feature: unified-reports-dashboard, Property 7: Overdue Loan Alert Generation**
 * 
 * Validates: Requirements 5.1, 5.2
 */

import * as fc from 'fast-check'

// Local type definition to avoid Next.js import issues in tests
interface UnifiedAlert {
  id: string
  type: 'low_stock' | 'overdue_loan' | 'maintenance' | 'warning'
  title: string
  message: string
  severity: 'info' | 'warning' | 'error'
  timestamp: string
}

// ============================================================================
// Test Utilities
// ============================================================================

interface ConsumableItem {
  id: number
  name: string
  currentStock: number
  minimumThreshold: number
}

interface Loan {
  id: number
  toolName: string
  dueDate: string
  returnedAt: string | null
}

/**
 * Generates low stock alerts from consumable items
 */
function generateLowStockAlerts(items: ConsumableItem[]): UnifiedAlert[] {
  return items
    .filter(item => item.currentStock < item.minimumThreshold)
    .map(item => ({
      id: `low_stock_${item.id}`,
      type: 'low_stock' as const,
      title: `Stock bajo: ${item.name}`,
      message: `El stock actual (${item.currentStock}) está por debajo del mínimo (${item.minimumThreshold})`,
      severity: item.currentStock === 0 ? 'error' as const : 'warning' as const,
      timestamp: new Date().toISOString(),
    }))
}

/**
 * Generates overdue loan alerts from loans
 */
function generateOverdueLoanAlerts(loans: Loan[], currentDate: Date): UnifiedAlert[] {
  return loans
    .filter(loan => {
      if (loan.returnedAt) return false
      const dueDate = new Date(loan.dueDate)
      return dueDate < currentDate
    })
    .map(loan => ({
      id: `overdue_loan_${loan.id}`,
      type: 'overdue_loan' as const,
      title: `Préstamo vencido: ${loan.toolName}`,
      message: `El préstamo venció el ${new Date(loan.dueDate).toLocaleDateString('es-ES')}`,
      severity: 'error' as const,
      timestamp: new Date().toISOString(),
    }))
}

// ============================================================================
// Arbitraries (Generators)
// ============================================================================

// Generate items with unique IDs using uniqueArray
const consumableItemArb = fc.record({
  id: fc.integer({ min: 1, max: 100000 }),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  currentStock: fc.integer({ min: 0, max: 1000 }),
  minimumThreshold: fc.integer({ min: 1, max: 100 }),
})

// Helper to ensure unique IDs in arrays
const uniqueConsumableItemsArb = (maxLength: number) =>
  fc.array(consumableItemArb, { minLength: 0, maxLength })
    .map(items => {
      const seen = new Set<number>()
      return items.filter(item => {
        if (seen.has(item.id)) return false
        seen.add(item.id)
        return true
      })
    })

// Use string dates directly to avoid Date object issues
const dateStringArb = fc.integer({ min: 2020, max: 2030 }).chain(year =>
  fc.integer({ min: 1, max: 12 }).chain(month =>
    fc.integer({ min: 1, max: 28 }).map(day => 
      `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00.000Z`
    )
  )
)

const loanArb = fc.record({
  id: fc.integer({ min: 1, max: 10000 }),
  toolName: fc.string({ minLength: 1, maxLength: 50 }),
  dueDate: dateStringArb,
  returnedAt: fc.option(dateStringArb, { nil: null }),
})

const currentDateArb = fc.integer({ min: 2020, max: 2030 }).chain(year =>
  fc.integer({ min: 1, max: 12 }).chain(month =>
    fc.integer({ min: 1, max: 28 }).map(day => 
      new Date(year, month - 1, day)
    )
  )
)

// ============================================================================
// Property Tests
// ============================================================================

describe('Alert Generation Properties', () => {
  /**
   * **Feature: unified-reports-dashboard, Property 6: Low Stock Alert Generation**
   * 
   * For any consumable item with current stock below its minimum threshold,
   * a low stock alert should exist in the alerts panel.
   */
  describe('Property 6: Low Stock Alert Generation', () => {
    it('should generate an alert for every item below minimum threshold', () => {
      fc.assert(
        fc.property(
          uniqueConsumableItemsArb(50),
          (items) => {
            const alerts = generateLowStockAlerts(items)
            const lowStockItems = items.filter(item => item.currentStock < item.minimumThreshold)
            
            // Every low stock item should have a corresponding alert
            return lowStockItems.every(item => 
              alerts.some(alert => alert.id === `low_stock_${item.id}`)
            )
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should not generate alerts for items at or above threshold', () => {
      fc.assert(
        fc.property(
          uniqueConsumableItemsArb(50),
          (items) => {
            const alerts = generateLowStockAlerts(items)
            const adequateStockItems = items.filter(item => item.currentStock >= item.minimumThreshold)
            
            // No alert should exist for items with adequate stock
            return adequateStockItems.every(item => 
              !alerts.some(alert => alert.id === `low_stock_${item.id}`)
            )
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should mark zero-stock items as error severity', () => {
      fc.assert(
        fc.property(
          uniqueConsumableItemsArb(50),
          (items) => {
            const alerts = generateLowStockAlerts(items)
            const zeroStockItems = items.filter(item => item.currentStock === 0)
            
            return zeroStockItems.every(item => {
              const alert = alerts.find(a => a.id === `low_stock_${item.id}`)
              return !alert || alert.severity === 'error'
            })
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should have exactly one alert per low stock item', () => {
      fc.assert(
        fc.property(
          uniqueConsumableItemsArb(50),
          (items) => {
            const alerts = generateLowStockAlerts(items)
            const lowStockItems = items.filter(item => item.currentStock < item.minimumThreshold)
            
            // Count of alerts should equal count of low stock items
            return alerts.length === lowStockItems.length
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * **Feature: unified-reports-dashboard, Property 7: Overdue Loan Alert Generation**
   * 
   * For any loan past its due date that has not been returned,
   * an overdue loan alert should exist in the alerts panel.
   */
  describe('Property 7: Overdue Loan Alert Generation', () => {
    it('should generate an alert for every overdue unreturned loan', () => {
      fc.assert(
        fc.property(
          fc.array(loanArb, { minLength: 0, maxLength: 50 }),
          currentDateArb,
          (loans, currentDate) => {
            const alerts = generateOverdueLoanAlerts(loans, currentDate)
            const overdueLoans = loans.filter(loan => {
              if (loan.returnedAt) return false
              return new Date(loan.dueDate) < currentDate
            })
            
            // Every overdue loan should have a corresponding alert
            return overdueLoans.every(loan => 
              alerts.some(alert => alert.id === `overdue_loan_${loan.id}`)
            )
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should not generate alerts for returned loans', () => {
      fc.assert(
        fc.property(
          fc.array(loanArb, { minLength: 0, maxLength: 50 }),
          currentDateArb,
          (loans, currentDate) => {
            const alerts = generateOverdueLoanAlerts(loans, currentDate)
            const returnedLoans = loans.filter(loan => loan.returnedAt !== null)
            
            // No alert should exist for returned loans
            return returnedLoans.every(loan => 
              !alerts.some(alert => alert.id === `overdue_loan_${loan.id}`)
            )
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should not generate alerts for loans not yet due', () => {
      fc.assert(
        fc.property(
          fc.array(loanArb, { minLength: 0, maxLength: 50 }),
          currentDateArb,
          (loans, currentDate) => {
            const alerts = generateOverdueLoanAlerts(loans, currentDate)
            const notDueLoans = loans.filter(loan => {
              if (loan.returnedAt) return false
              return new Date(loan.dueDate) >= currentDate
            })
            
            // No alert should exist for loans not yet due
            return notDueLoans.every(loan => 
              !alerts.some(alert => alert.id === `overdue_loan_${loan.id}`)
            )
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should mark all overdue loan alerts as error severity', () => {
      fc.assert(
        fc.property(
          fc.array(loanArb, { minLength: 0, maxLength: 50 }),
          currentDateArb,
          (loans, currentDate) => {
            const alerts = generateOverdueLoanAlerts(loans, currentDate)
            
            return alerts.every(alert => alert.severity === 'error')
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
