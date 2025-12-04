/**
 * Cable Detection Utility - Property-Based Tests
 * 
 * Property 1: Cable Unit Detection Consistency
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4
 */

import * as fc from 'fast-check'
import { isCableUnit, getUnitDisplayName, getUnitDisplayNameEN } from '../cableDetection'

describe('Property Tests: Cable Detection', () => {
  /**
   * Property 1: Cable Unit Detection Consistency
   * For any consumable with unit_of_measure in ["metros", "pies", "m", "ft"], 
   * the system should identify it as a cable type.
   */
  describe('Property 1: Cable Unit Detection Consistency', () => {
    const cableUnits = ['metros', 'metro', 'm', 'meter', 'meters', 'pies', 'pie', 'ft', 'feet', 'foot']
    const nonCableUnits = ['unidades', 'units', 'kg', 'litros', 'piezas', 'cajas', 'rollos', 'gramos', 'ml']

    test('all cable unit variations are correctly identified', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...cableUnits),
          (unit) => {
            expect(isCableUnit(unit)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('cable units are detected regardless of case', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...cableUnits),
          fc.boolean(),
          (unit, toUpper) => {
            const testUnit = toUpper ? unit.toUpperCase() : unit.toLowerCase()
            expect(isCableUnit(testUnit)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('cable units are detected with leading/trailing whitespace', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...cableUnits),
          fc.integer({ min: 0, max: 5 }),
          fc.integer({ min: 0, max: 5 }),
          (unit, leadingSpaces, trailingSpaces) => {
            const testUnit = ' '.repeat(leadingSpaces) + unit + ' '.repeat(trailingSpaces)
            expect(isCableUnit(testUnit)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('non-cable units are correctly rejected', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...nonCableUnits),
          (unit) => {
            expect(isCableUnit(unit)).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('random strings that are not cable units are rejected', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => 
            !cableUnits.includes(s.toLowerCase().trim())
          ),
          (unit) => {
            // Only test if it's truly not a cable unit
            const normalized = unit.toLowerCase().trim()
            if (!cableUnits.includes(normalized)) {
              expect(isCableUnit(unit)).toBe(false)
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Property: Display name consistency
   * For any cable unit, the display name should be consistent
   */
  describe('Display Name Consistency', () => {
    const meterUnits = ['metros', 'metro', 'm', 'meter', 'meters']
    const feetUnits = ['pies', 'pie', 'ft', 'feet', 'foot']

    test('all meter variations return "metros" in Spanish', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...meterUnits),
          (unit) => {
            expect(getUnitDisplayName(unit)).toBe('metros')
          }
        ),
        { numRuns: 100 }
      )
    })

    test('all feet variations return "pies" in Spanish', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...feetUnits),
          (unit) => {
            expect(getUnitDisplayName(unit)).toBe('pies')
          }
        ),
        { numRuns: 100 }
      )
    })

    test('all meter variations return "meters" in English', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...meterUnits),
          (unit) => {
            expect(getUnitDisplayNameEN(unit)).toBe('meters')
          }
        ),
        { numRuns: 100 }
      )
    })

    test('all feet variations return "feet" in English', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...feetUnits),
          (unit) => {
            expect(getUnitDisplayNameEN(unit)).toBe('feet')
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
