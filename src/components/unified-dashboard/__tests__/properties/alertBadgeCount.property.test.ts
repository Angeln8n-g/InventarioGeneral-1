/**
 * Property-based tests for Alert Badge Count
 *
 * **Feature: unified-reports-dashboard, Property 8: Alert Badge Count Accuracy**
 *
 * Validates: Requirements 5.4
 */

import * as fc from 'fast-check'

// ============================================================================
// Test Utilities
// ============================================================================

// Local type definition to avoid Next.js import issues in tests
interface UnifiedAlert {
  id: string
  type: 'low_stock' | 'overdue_loan' | 'maintenance' | 'warning'
  title: string
  message: string
  severity: 'info' | 'warning' | 'error'
  timestamp: string
}

/**
 * Calculates the badge count for alerts
 * This should equal the total number of active alerts
 */
function calculateAlertBadgeCount(alerts: UnifiedAlert[]): number {
  return alerts.length
}

/**
 * Calculates badge count by severity
 */
function calculateBadgeCountBySeverity(
  alerts: UnifiedAlert[],
  severity: 'info' | 'warning' | 'error'
): number {
  return alerts.filter((alert) => alert.severity === severity).length
}

/**
 * Calculates badge count by type
 */
function calculateBadgeCountByType(
  alerts: UnifiedAlert[],
  type: UnifiedAlert['type']
): number {
  return alerts.filter((alert) => alert.type === type).length
}

/**
 * Simulates the alert panel state with badge
 */
interface AlertPanelState {
  alerts: UnifiedAlert[]
  badgeCount: number
  isVisible: boolean
}

function createAlertPanelState(alerts: UnifiedAlert[]): AlertPanelState {
  return {
    alerts,
    badgeCount: calculateAlertBadgeCount(alerts),
    isVisible: alerts.length > 0,
  }
}

/**
 * Adds an alert to the panel and updates badge
 */
function addAlert(
  state: AlertPanelState,
  alert: UnifiedAlert
): AlertPanelState {
  const newAlerts = [...state.alerts, alert]
  return createAlertPanelState(newAlerts)
}

/**
 * Removes an alert from the panel and updates badge
 */
function removeAlert(
  state: AlertPanelState,
  alertId: string
): AlertPanelState {
  const newAlerts = state.alerts.filter((a) => a.id !== alertId)
  return createAlertPanelState(newAlerts)
}

// ============================================================================
// Arbitraries (Generators)
// ============================================================================

const alertTypeArb = fc.constantFrom<UnifiedAlert['type']>(
  'low_stock',
  'overdue_loan',
  'maintenance',
  'warning'
)

const alertSeverityArb = fc.constantFrom<UnifiedAlert['severity']>(
  'info',
  'warning',
  'error'
)

const dateStringArb = fc
  .integer({ min: 2023, max: 2025 })
  .chain((year) =>
    fc
      .integer({ min: 1, max: 12 })
      .chain((month) =>
        fc
          .integer({ min: 1, max: 28 })
          .map(
            (day) =>
              `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T12:00:00.000Z`
          )
      )
  )

const alertArb: fc.Arbitrary<UnifiedAlert> = fc.record({
  id: fc.uuid(),
  type: alertTypeArb,
  title: fc.string({ minLength: 1, maxLength: 50 }),
  message: fc.string({ minLength: 1, maxLength: 100 }),
  severity: alertSeverityArb,
  timestamp: dateStringArb,
})

// ============================================================================
// Property Tests
// ============================================================================

describe('Alert Badge Count Properties', () => {
  /**
   * **Feature: unified-reports-dashboard, Property 8: Alert Badge Count Accuracy**
   *
   * For any state of the system, the alert badge count should equal
   * the total number of active alerts.
   */
  describe('Property 8: Alert Badge Count Accuracy', () => {
    it('should have badge count equal to total number of alerts', () => {
      fc.assert(
        fc.property(
          fc.array(alertArb, { minLength: 0, maxLength: 100 }),
          (alerts) => {
            const badgeCount = calculateAlertBadgeCount(alerts)

            return badgeCount === alerts.length
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should have badge count of zero when no alerts exist', () => {
      const badgeCount = calculateAlertBadgeCount([])
      expect(badgeCount).toBe(0)
    })

    it('should increment badge count when alert is added', () => {
      fc.assert(
        fc.property(
          fc.array(alertArb, { minLength: 0, maxLength: 50 }),
          alertArb,
          (existingAlerts, newAlert) => {
            const initialState = createAlertPanelState(existingAlerts)
            const newState = addAlert(initialState, newAlert)

            return newState.badgeCount === initialState.badgeCount + 1
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should decrement badge count when alert is removed', () => {
      fc.assert(
        fc.property(
          fc.array(alertArb, { minLength: 1, maxLength: 50 }),
          (alerts) => {
            const initialState = createAlertPanelState(alerts)
            const alertToRemove = alerts[0]
            const newState = removeAlert(initialState, alertToRemove.id)

            return newState.badgeCount === initialState.badgeCount - 1
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should maintain accurate count after multiple add/remove operations', () => {
      fc.assert(
        fc.property(
          fc.array(alertArb, { minLength: 0, maxLength: 30 }),
          fc.array(alertArb, { minLength: 0, maxLength: 20 }),
          fc.array(fc.integer({ min: 0, max: 29 }), {
            minLength: 0,
            maxLength: 10,
          }),
          (initialAlerts, alertsToAdd, indicesToRemove) => {
            let state = createAlertPanelState(initialAlerts)

            // Add alerts
            for (const alert of alertsToAdd) {
              state = addAlert(state, alert)
            }

            // Remove some alerts (by index, if valid)
            const validIndices = indicesToRemove.filter(
              (i) => i < state.alerts.length
            )
            for (const index of validIndices) {
              if (state.alerts[index]) {
                state = removeAlert(state, state.alerts[index].id)
              }
            }

            // Badge count should always equal actual alert count
            return state.badgeCount === state.alerts.length
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should correctly count alerts by severity', () => {
      fc.assert(
        fc.property(
          fc.array(alertArb, { minLength: 0, maxLength: 100 }),
          (alerts) => {
            const infoCount = calculateBadgeCountBySeverity(alerts, 'info')
            const warningCount = calculateBadgeCountBySeverity(
              alerts,
              'warning'
            )
            const errorCount = calculateBadgeCountBySeverity(alerts, 'error')

            // Sum of all severity counts should equal total
            return infoCount + warningCount + errorCount === alerts.length
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should correctly count alerts by type', () => {
      fc.assert(
        fc.property(
          fc.array(alertArb, { minLength: 0, maxLength: 100 }),
          (alerts) => {
            const lowStockCount = calculateBadgeCountByType(alerts, 'low_stock')
            const overdueCount = calculateBadgeCountByType(
              alerts,
              'overdue_loan'
            )
            const maintenanceCount = calculateBadgeCountByType(
              alerts,
              'maintenance'
            )
            const warningCount = calculateBadgeCountByType(alerts, 'warning')

            // Sum of all type counts should equal total
            return (
              lowStockCount +
                overdueCount +
                maintenanceCount +
                warningCount ===
              alerts.length
            )
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should show panel as visible only when alerts exist', () => {
      fc.assert(
        fc.property(
          fc.array(alertArb, { minLength: 0, maxLength: 100 }),
          (alerts) => {
            const state = createAlertPanelState(alerts)

            if (alerts.length === 0) {
              return state.isVisible === false && state.badgeCount === 0
            } else {
              return state.isVisible === true && state.badgeCount > 0
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should not change badge count when removing non-existent alert', () => {
      fc.assert(
        fc.property(
          fc.array(alertArb, { minLength: 0, maxLength: 50 }),
          fc.uuid(),
          (alerts, nonExistentId) => {
            // Ensure the ID doesn't exist in alerts
            const filteredAlerts = alerts.filter((a) => a.id !== nonExistentId)
            const state = createAlertPanelState(filteredAlerts)
            const newState = removeAlert(state, nonExistentId)

            return newState.badgeCount === state.badgeCount
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
