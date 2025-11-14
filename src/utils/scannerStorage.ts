export interface ScannedItem {
  id: string
  qr_code: string
  tool_instance_id?: number
  consumable_id?: number
  loan_id?: number
  item_type: {
    id: number
    name: string
    description?: string
  }
  serial_number?: string
  status?: string
  quantity?: number
  available_stock?: number
  scanned_at: string
  error?: string
}

export interface StoredScanState {
  action: 'loan' | 'return' | 'consume'
  items: ScannedItem[]
  timestamp: string
  userId: number
}

const STORAGE_KEY = 'scanner_multi_mode_state'
const EXPIRATION_HOURS = 24

/**
 * Save scanned items to localStorage
 */
export function saveScannedItems(
  action: 'loan' | 'return' | 'consume',
  items: ScannedItem[],
  userId: number
): void {
  try {
    const state: StoredScanState = {
      action,
      items,
      timestamp: new Date().toISOString(),
      userId,
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (error) {
    console.error('Failed to save scanned items to localStorage:', error)
  }
}

/**
 * Load scanned items from localStorage
 */
export function loadScannedItems(userId: number): StoredScanState | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    
    if (!stored) {
      return null
    }

    const state: StoredScanState = JSON.parse(stored)

    // Validate user ID matches
    if (state.userId !== userId) {
      console.warn('Stored items belong to different user, clearing')
      clearScannedItems()
      return null
    }

    // Check if expired
    const storedTime = new Date(state.timestamp).getTime()
    const now = new Date().getTime()
    const hoursDiff = (now - storedTime) / (1000 * 60 * 60)

    if (hoursDiff > EXPIRATION_HOURS) {
      console.log('Stored items expired, clearing')
      clearScannedItems()
      return null
    }

    return state
  } catch (error) {
    console.error('Failed to load scanned items from localStorage:', error)
    return null
  }
}

/**
 * Clear scanned items from localStorage
 */
export function clearScannedItems(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Failed to clear scanned items from localStorage:', error)
  }
}

/**
 * Check if there are stored items
 */
export function hasStoredItems(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null
  } catch (error) {
    return false
  }
}

/**
 * Debounce function for auto-save
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) {
      clearTimeout(timeout)
    }

    timeout = setTimeout(later, wait)
  }
}
