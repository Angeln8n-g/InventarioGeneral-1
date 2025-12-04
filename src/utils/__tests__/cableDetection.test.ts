/**
 * Cable Detection Utility - Unit Tests
 * 
 * Tests for cable unit detection and display name functions
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */

import { 
  isCableUnit, 
  getUnitDisplayName, 
  getUnitDisplayNameEN,
  isMetersUnit,
  isFeetUnit 
} from '../cableDetection'

describe('isCableUnit', () => {
  describe('should return true for cable units', () => {
    const cableUnits = ['metros', 'metro', 'm', 'meter', 'meters', 'pies', 'pie', 'ft', 'feet', 'foot']
    
    test.each(cableUnits)('isCableUnit("%s") should return true', (unit) => {
      expect(isCableUnit(unit)).toBe(true)
    })

    test.each(cableUnits.map(u => u.toUpperCase()))('isCableUnit("%s") (uppercase) should return true', (unit) => {
      expect(isCableUnit(unit)).toBe(true)
    })

    test.each(cableUnits.map(u => `  ${u}  `))('isCableUnit("%s") (with spaces) should return true', (unit) => {
      expect(isCableUnit(unit)).toBe(true)
    })
  })

  describe('should return false for non-cable units', () => {
    const nonCableUnits = ['unidades', 'units', 'kg', 'litros', 'piezas', 'cajas', 'rollos', '']
    
    test.each(nonCableUnits)('isCableUnit("%s") should return false', (unit) => {
      expect(isCableUnit(unit)).toBe(false)
    })
  })

  describe('should handle null/undefined', () => {
    test('isCableUnit(null) should return false', () => {
      expect(isCableUnit(null)).toBe(false)
    })

    test('isCableUnit(undefined) should return false', () => {
      expect(isCableUnit(undefined)).toBe(false)
    })
  })
})

describe('getUnitDisplayName', () => {
  describe('should return "metros" for meter units', () => {
    const meterUnits = ['metros', 'metro', 'm', 'meter', 'meters']
    
    test.each(meterUnits)('getUnitDisplayName("%s") should return "metros"', (unit) => {
      expect(getUnitDisplayName(unit)).toBe('metros')
    })
  })

  describe('should return "pies" for feet units', () => {
    const feetUnits = ['pies', 'pie', 'ft', 'feet', 'foot']
    
    test.each(feetUnits)('getUnitDisplayName("%s") should return "pies"', (unit) => {
      expect(getUnitDisplayName(unit)).toBe('pies')
    })
  })

  test('should return original for non-cable units', () => {
    expect(getUnitDisplayName('unidades')).toBe('unidades')
    expect(getUnitDisplayName('kg')).toBe('kg')
  })
})

describe('getUnitDisplayNameEN', () => {
  describe('should return "meters" for meter units', () => {
    const meterUnits = ['metros', 'metro', 'm', 'meter', 'meters']
    
    test.each(meterUnits)('getUnitDisplayNameEN("%s") should return "meters"', (unit) => {
      expect(getUnitDisplayNameEN(unit)).toBe('meters')
    })
  })

  describe('should return "feet" for feet units', () => {
    const feetUnits = ['pies', 'pie', 'ft', 'feet', 'foot']
    
    test.each(feetUnits)('getUnitDisplayNameEN("%s") should return "feet"', (unit) => {
      expect(getUnitDisplayNameEN(unit)).toBe('feet')
    })
  })
})

describe('isMetersUnit', () => {
  test('should return true for meter units', () => {
    expect(isMetersUnit('metros')).toBe(true)
    expect(isMetersUnit('m')).toBe(true)
    expect(isMetersUnit('meter')).toBe(true)
  })

  test('should return false for feet units', () => {
    expect(isMetersUnit('pies')).toBe(false)
    expect(isMetersUnit('ft')).toBe(false)
  })

  test('should return false for null/undefined', () => {
    expect(isMetersUnit(null)).toBe(false)
    expect(isMetersUnit(undefined)).toBe(false)
  })
})

describe('isFeetUnit', () => {
  test('should return true for feet units', () => {
    expect(isFeetUnit('pies')).toBe(true)
    expect(isFeetUnit('ft')).toBe(true)
    expect(isFeetUnit('feet')).toBe(true)
  })

  test('should return false for meter units', () => {
    expect(isFeetUnit('metros')).toBe(false)
    expect(isFeetUnit('m')).toBe(false)
  })

  test('should return false for null/undefined', () => {
    expect(isFeetUnit(null)).toBe(false)
    expect(isFeetUnit(undefined)).toBe(false)
  })
})
