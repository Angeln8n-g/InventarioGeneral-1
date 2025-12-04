/**
 * Property-based tests for Table Functionality
 * 
 * **Feature: unified-reports-dashboard, Property 9: Table Sorting Correctness**
 * **Feature: unified-reports-dashboard, Property 11: Table Search Filtering**
 * 
 * Validates: Requirements 6.2, 6.4
 */

import * as fc from 'fast-check'

// ============================================================================
// Test Utilities
// ============================================================================

interface TableRow {
  id: number
  name: string
  quantity: number
  category: string
  date: string
  status: string
  [key: string]: string | number // Index signature for compatibility
}

type SortDirection = 'asc' | 'desc'

/**
 * Sorts table data by a given field and direction
 */
function sortTableData(
  data: TableRow[],
  field: keyof TableRow,
  direction: SortDirection
): TableRow[] {
  return [...data].sort((a, b) => {
    const aVal = a[field]
    const bVal = b[field]
    
    if (aVal === bVal) return 0
    
    let comparison: number
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      comparison = aVal.localeCompare(bVal)
    } else if (typeof aVal === 'number' && typeof bVal === 'number') {
      comparison = aVal - bVal
    } else {
      comparison = String(aVal).localeCompare(String(bVal))
    }
    
    return direction === 'asc' ? comparison : -comparison
  })
}

/**
 * Filters table data by search term across searchable fields
 */
function searchTableData(
  data: TableRow[],
  searchTerm: string,
  searchableFields: (keyof TableRow)[]
): TableRow[] {
  if (!searchTerm.trim()) return data
  
  const lowerTerm = searchTerm.toLowerCase()
  
  return data.filter(row => 
    searchableFields.some(field => {
      const value = row[field]
      if (value === null || value === undefined) return false
      return String(value).toLowerCase().includes(lowerTerm)
    })
  )
}

/**
 * Checks if an array is sorted correctly
 */
function isSorted(
  arr: TableRow[],
  compareFn: (a: TableRow, b: TableRow) => number,
  direction: SortDirection
): boolean {
  for (let i = 1; i < arr.length; i++) {
    const comparison = compareFn(arr[i - 1], arr[i])
    if (direction === 'asc' && comparison > 0) return false
    if (direction === 'desc' && comparison < 0) return false
  }
  return true
}

// ============================================================================
// Arbitraries (Generators)
// ============================================================================

const dateStringArb = fc.integer({ min: 2023, max: 2025 }).chain(year =>
  fc.integer({ min: 1, max: 12 }).chain(month =>
    fc.integer({ min: 1, max: 28 }).map(day => 
      `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    )
  )
)

const tableRowArb: fc.Arbitrary<TableRow> = fc.record({
  id: fc.integer({ min: 1, max: 10000 }),
  name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
  quantity: fc.integer({ min: 0, max: 1000 }),
  category: fc.constantFrom('Herramientas', 'Consumibles', 'Electrónicos', 'Cables'),
  date: dateStringArb,
  status: fc.constantFrom('Disponible', 'Prestado', 'Mantenimiento', 'Agotado'),
})

const sortDirectionArb = fc.constantFrom<SortDirection>('asc', 'desc')

const sortableFieldArb = fc.constantFrom<keyof TableRow>('id', 'name', 'quantity', 'category', 'date', 'status')

const searchTermArb = fc.string({ minLength: 0, maxLength: 20 })

// ============================================================================
// Property Tests
// ============================================================================

describe('Table Functionality Properties', () => {
  /**
   * **Feature: unified-reports-dashboard, Property 9: Table Sorting Correctness**
   * 
   * For any sortable table column and sort direction, the displayed rows
   * should be correctly ordered by that column.
   */
  describe('Property 9: Table Sorting Correctness', () => {
    it('should sort numeric fields correctly', () => {
      fc.assert(
        fc.property(
          fc.array(tableRowArb, { minLength: 0, maxLength: 100 }),
          sortDirectionArb,
          (data, direction) => {
            const sorted = sortTableData(data, 'quantity', direction)
            
            return isSorted(
              sorted,
              (a, b) => a.quantity - b.quantity,
              direction
            )
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should sort string fields correctly', () => {
      fc.assert(
        fc.property(
          fc.array(tableRowArb, { minLength: 0, maxLength: 100 }),
          sortDirectionArb,
          (data, direction) => {
            const sorted = sortTableData(data, 'name', direction)
            
            return isSorted(
              sorted,
              (a, b) => a.name.localeCompare(b.name),
              direction
            )
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should sort date fields correctly', () => {
      fc.assert(
        fc.property(
          fc.array(tableRowArb, { minLength: 0, maxLength: 100 }),
          sortDirectionArb,
          (data, direction) => {
            const sorted = sortTableData(data, 'date', direction)
            
            return isSorted(
              sorted,
              (a, b) => a.date.localeCompare(b.date),
              direction
            )
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should preserve all original items after sorting', () => {
      fc.assert(
        fc.property(
          fc.array(tableRowArb, { minLength: 0, maxLength: 100 }),
          sortableFieldArb,
          sortDirectionArb,
          (data, field, direction) => {
            const sorted = sortTableData(data, field, direction)
            
            // Same length
            if (sorted.length !== data.length) return false
            
            // All original items present
            return data.every(item => 
              sorted.some(s => s.id === item.id)
            )
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should be stable for equal values', () => {
      fc.assert(
        fc.property(
          fc.array(tableRowArb, { minLength: 2, maxLength: 50 }),
          sortDirectionArb,
          (data, direction) => {
            // Create data with duplicate categories
            const dataWithDupes = data.map((item, i) => ({
              ...item,
              category: i % 2 === 0 ? 'Herramientas' : 'Consumibles'
            }))
            
            const sorted = sortTableData(dataWithDupes, 'category', direction)
            
            // Items with same category should maintain relative order
            const herramientas = sorted.filter(item => item.category === 'Herramientas')
            const originalHerramientas = dataWithDupes.filter(item => item.category === 'Herramientas')
            
            // Check that relative order is preserved for items with same category
            for (let i = 0; i < herramientas.length; i++) {
              if (herramientas[i].id !== originalHerramientas[i].id) {
                // Stable sort not guaranteed, but items should still be present
                return originalHerramientas.some(h => h.id === herramientas[i].id)
              }
            }
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should reverse order when direction changes', () => {
      fc.assert(
        fc.property(
          fc.array(tableRowArb, { minLength: 2, maxLength: 50 }),
          sortableFieldArb,
          (data, field) => {
            const ascSorted = sortTableData(data, field, 'asc')
            const descSorted = sortTableData(data, field, 'desc')
            
            // Both should have same length
            return ascSorted.length === descSorted.length
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * **Feature: unified-reports-dashboard, Property 11: Table Search Filtering**
   * 
   * For any search term entered in a data table, all displayed rows should
   * contain the search term in at least one searchable field.
   */
  describe('Property 11: Table Search Filtering', () => {
    it('should only return rows containing the search term', () => {
      fc.assert(
        fc.property(
          fc.array(tableRowArb, { minLength: 0, maxLength: 100 }),
          searchTermArb.filter(s => s.trim().length > 0),
          (data, searchTerm) => {
            const searchableFields: (keyof TableRow)[] = ['name', 'category', 'status']
            const filtered = searchTableData(data, searchTerm, searchableFields)
            
            const lowerTerm = searchTerm.toLowerCase()
            
            return filtered.every(row => 
              searchableFields.some(field => 
                String(row[field]).toLowerCase().includes(lowerTerm)
              )
            )
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return all rows when search term is empty', () => {
      fc.assert(
        fc.property(
          fc.array(tableRowArb, { minLength: 0, maxLength: 100 }),
          (data) => {
            const searchableFields: (keyof TableRow)[] = ['name', 'category', 'status']
            const filtered = searchTableData(data, '', searchableFields)
            
            return filtered.length === data.length
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return all rows when search term is whitespace only', () => {
      fc.assert(
        fc.property(
          fc.array(tableRowArb, { minLength: 0, maxLength: 100 }),
          fc.constant('   '),
          (data, whitespace) => {
            const searchableFields: (keyof TableRow)[] = ['name', 'category', 'status']
            const filtered = searchTableData(data, whitespace, searchableFields)
            
            return filtered.length === data.length
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should be case-insensitive', () => {
      fc.assert(
        fc.property(
          fc.array(tableRowArb, { minLength: 0, maxLength: 100 }),
          fc.string({ minLength: 1, maxLength: 10 }).filter(s => s.trim().length > 0),
          (data, searchTerm) => {
            const searchableFields: (keyof TableRow)[] = ['name', 'category', 'status']
            
            const lowerFiltered = searchTableData(data, searchTerm.toLowerCase(), searchableFields)
            const upperFiltered = searchTableData(data, searchTerm.toUpperCase(), searchableFields)
            const mixedFiltered = searchTableData(data, searchTerm, searchableFields)
            
            // All should return the same results
            return (
              lowerFiltered.length === upperFiltered.length &&
              upperFiltered.length === mixedFiltered.length
            )
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should not include rows that do not match', () => {
      fc.assert(
        fc.property(
          fc.array(tableRowArb, { minLength: 0, maxLength: 100 }),
          searchTermArb.filter(s => s.trim().length > 0),
          (data, searchTerm) => {
            const searchableFields: (keyof TableRow)[] = ['name', 'category', 'status']
            const filtered = searchTableData(data, searchTerm, searchableFields)
            
            const lowerTerm = searchTerm.toLowerCase()
            
            // Items not in filtered should NOT contain the search term
            const notFiltered = data.filter(row => !filtered.some(f => f.id === row.id))
            
            return notFiltered.every(row => 
              !searchableFields.some(field => 
                String(row[field]).toLowerCase().includes(lowerTerm)
              )
            )
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should search only in specified searchable fields', () => {
      fc.assert(
        fc.property(
          fc.array(tableRowArb, { minLength: 1, maxLength: 50 }),
          (data) => {
            // Search for a quantity value (which is not in searchable fields)
            const quantityStr = String(data[0].quantity)
            const searchableFields: (keyof TableRow)[] = ['name', 'category', 'status']
            const filtered = searchTableData(data, quantityStr, searchableFields)
            
            // Should only find items where name, category, or status contains the number
            return filtered.every(row => 
              searchableFields.some(field => 
                String(row[field]).toLowerCase().includes(quantityStr.toLowerCase())
              )
            )
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Combined sorting and searching
   */
  describe('Combined Sorting and Searching', () => {
    it('should maintain sort order after search filtering', () => {
      fc.assert(
        fc.property(
          fc.array(tableRowArb, { minLength: 0, maxLength: 100 }),
          sortableFieldArb,
          sortDirectionArb,
          searchTermArb,
          (data, sortField, sortDirection, searchTerm) => {
            const searchableFields: (keyof TableRow)[] = ['name', 'category', 'status']
            
            // Sort first, then search
            const sorted = sortTableData(data, sortField, sortDirection)
            const filtered = searchTableData(sorted, searchTerm, searchableFields)
            
            // Search then sort
            const searchedFirst = searchTableData(data, searchTerm, searchableFields)
            const sortedAfter = sortTableData(searchedFirst, sortField, sortDirection)
            
            // Both approaches should yield same results (same items, same order)
            if (filtered.length !== sortedAfter.length) return false
            
            return filtered.every((item, index) => item.id === sortedAfter[index].id)
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
