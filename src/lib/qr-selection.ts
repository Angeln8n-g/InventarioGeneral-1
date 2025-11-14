import { supabase } from './supabase'
import crypto from 'crypto'

// Cache configuration
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes
let qrCodesCache: WarehouseQRCode[] | null = null
let cacheTimestamp: number | null = null

export interface WarehouseQRCode {
  id: number
  qr_code: string
  location_name: string
  location_description: string
  zone: string
  is_active: boolean
}

/**
 * Get active warehouse QR codes from database with caching
 */
export async function getActiveQRCodes(): Promise<WarehouseQRCode[]> {
  // Check if cache is valid
  if (
    qrCodesCache &&
    cacheTimestamp &&
    Date.now() - cacheTimestamp < CACHE_TTL_MS
  ) {
    console.log('[QR Selection] Using cached QR codes')
    return qrCodesCache
  }

  console.log('[QR Selection] Fetching active QR codes from database')

  const { data, error } = await supabase
    .from('warehouse_qr_codes')
    .select('id, qr_code, location_name, location_description, zone, is_active')
    .eq('is_active', true)
    .order('id')

  if (error) {
    console.error('[QR Selection] Error fetching active warehouse QR codes:', error)
    throw new Error('Failed to fetch active warehouse QR codes')
  }

  const qrCodes = data || []

  // Update cache
  qrCodesCache = qrCodes
  cacheTimestamp = Date.now()

  console.log(`[QR Selection] Fetched ${qrCodes.length} active QR codes`)

  return qrCodes
}

/**
 * Select a random QR code using cryptographically secure random number generation
 * 
 * Uses Node.js crypto.randomInt() which provides cryptographically strong
 * random numbers suitable for security-sensitive applications.
 * 
 * @param qrCodes - Array of available QR codes to select from
 * @returns A randomly selected QR code
 * @throws Error if no QR codes are available
 */
export function selectRandomQRCode(qrCodes: WarehouseQRCode[]): WarehouseQRCode {
  if (!qrCodes || qrCodes.length === 0) {
    console.error('[QR Selection] No QR codes available for selection')
    throw new Error('No QR codes available for selection')
  }

  // Use cryptographically secure random number generation
  const randomIndex = crypto.randomInt(0, qrCodes.length)
  const selectedQR = qrCodes[randomIndex]

  console.log(
    `[QR Selection] Selected QR code: ${selectedQR.qr_code} (${selectedQR.location_name}) - Index ${randomIndex} of ${qrCodes.length}`
  )

  return selectedQR
}

/**
 * Get a random active QR code (convenience function)
 * 
 * Combines getActiveQRCodes() and selectRandomQRCode() into a single call.
 * Uses caching for performance.
 * 
 * @returns A randomly selected active QR code
 * @throws Error if no active QR codes are available
 */
export async function getRandomActiveQRCode(): Promise<WarehouseQRCode> {
  const activeQRCodes = await getActiveQRCodes()

  if (activeQRCodes.length === 0) {
    console.error('[QR Selection] CRITICAL: No active warehouse QR codes available')
    throw new Error('No active warehouse QR codes available')
  }

  return selectRandomQRCode(activeQRCodes)
}

/**
 * Invalidate the QR codes cache
 * 
 * Call this when QR codes are added, removed, or their active status changes.
 */
export function invalidateQRCache(): void {
  console.log('[QR Selection] Invalidating QR codes cache')
  qrCodesCache = null
  cacheTimestamp = null
}

/**
 * Get cache status for debugging
 */
export function getCacheStatus(): {
  isCached: boolean
  cacheAge: number | null
  cacheSize: number | null
} {
  return {
    isCached: qrCodesCache !== null && cacheTimestamp !== null,
    cacheAge: cacheTimestamp ? Date.now() - cacheTimestamp : null,
    cacheSize: qrCodesCache ? qrCodesCache.length : null,
  }
}
