/**
 * Cable Detection Utility
 * 
 * Provides functions to detect if a consumable uses cable-style measurement
 * (meters or feet) and to normalize unit display names.
 */

/**
 * Determines if a consumable uses cable-style measurement
 * 
 * @param unitOfMeasure - The unit of measure string from the consumable
 * @returns true if the unit is a cable unit (meters/feet), false otherwise
 * 
 * @example
 * isCableUnit('metros') // true
 * isCableUnit('m') // true
 * isCableUnit('pies') // true
 * isCableUnit('ft') // true
 * isCableUnit('unidades') // false
 * isCableUnit(null) // false
 */
export function isCableUnit(unitOfMeasure: string | null | undefined): boolean {
  if (!unitOfMeasure) return false
  
  const normalized = unitOfMeasure.toLowerCase().trim()
  
  // List of cable unit variations
  const cableUnits = [
    'metros',
    'metro',
    'pies',
    'pie',
    'm',
    'ft',
    'feet',
    'foot',
    'meter',
    'meters'
  ]
  
  return cableUnits.includes(normalized)
}

/**
 * Gets the standardized display name for a unit of measure
 * 
 * @param unitOfMeasure - The unit of measure string
 * @returns Standardized display name ('metros', 'pies', or original)
 * 
 * @example
 * getUnitDisplayName('m') // 'metros'
 * getUnitDisplayName('METROS') // 'metros'
 * getUnitDisplayName('ft') // 'pies'
 * getUnitDisplayName('feet') // 'pies'
 * getUnitDisplayName('unidades') // 'unidades'
 */
export function getUnitDisplayName(unitOfMeasure: string): string {
  const normalized = unitOfMeasure.toLowerCase().trim()
  
  // Meter variations
  if (['metros', 'metro', 'm', 'meter', 'meters'].includes(normalized)) {
    return 'metros'
  }
  
  // Feet variations
  if (['pies', 'pie', 'ft', 'feet', 'foot'].includes(normalized)) {
    return 'pies'
  }
  
  // Return original if not a cable unit
  return unitOfMeasure
}

/**
 * Gets the English display name for a unit of measure
 * 
 * @param unitOfMeasure - The unit of measure string
 * @returns English display name ('meters', 'feet', or original)
 * 
 * @example
 * getUnitDisplayNameEN('metros') // 'meters'
 * getUnitDisplayNameEN('m') // 'meters'
 * getUnitDisplayNameEN('pies') // 'feet'
 * getUnitDisplayNameEN('ft') // 'feet'
 */
export function getUnitDisplayNameEN(unitOfMeasure: string): string {
  const normalized = unitOfMeasure.toLowerCase().trim()
  
  // Meter variations
  if (['metros', 'metro', 'm', 'meter', 'meters'].includes(normalized)) {
    return 'meters'
  }
  
  // Feet variations
  if (['pies', 'pie', 'ft', 'feet', 'foot'].includes(normalized)) {
    return 'feet'
  }
  
  // Return original if not a cable unit
  return unitOfMeasure
}

/**
 * Checks if a unit is specifically meters (not feet)
 * 
 * @param unitOfMeasure - The unit of measure string
 * @returns true if the unit is meters, false otherwise
 */
export function isMetersUnit(unitOfMeasure: string | null | undefined): boolean {
  if (!unitOfMeasure) return false
  
  const normalized = unitOfMeasure.toLowerCase().trim()
  return ['metros', 'metro', 'm', 'meter', 'meters'].includes(normalized)
}

/**
 * Checks if a unit is specifically feet (not meters)
 * 
 * @param unitOfMeasure - The unit of measure string
 * @returns true if the unit is feet, false otherwise
 */
export function isFeetUnit(unitOfMeasure: string | null | undefined): boolean {
  if (!unitOfMeasure) return false
  
  const normalized = unitOfMeasure.toLowerCase().trim()
  return ['pies', 'pie', 'ft', 'feet', 'foot'].includes(normalized)
}
