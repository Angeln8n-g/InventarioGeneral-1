import { supabase } from './supabase'
import type { CreateQRScanAttemptInput, QRScanAttempt } from '@/types/database'

/**
 * Log a QR scan attempt (successful or failed)
 * 
 * This function records all scan attempts in the qr_scan_attempts table
 * for auditing, analytics, and rate limiting purposes.
 * 
 * @param input - Scan attempt data
 * @returns The created scan attempt record
 */
export async function logScanAttempt(
  input: CreateQRScanAttemptInput
): Promise<QRScanAttempt> {
  console.log(
    `[QR Scan Logger] Logging ${input.is_successful ? 'successful' : 'failed'} scan attempt for reservation ${input.reservation_id}`
  )

  const { data, error } = await supabase
    .from('qr_scan_attempts')
    .insert({
      reservation_id: input.reservation_id,
      user_id: input.user_id,
      required_qr_code_id: input.required_qr_code_id,
      scanned_qr_code_id: input.scanned_qr_code_id || null,
      scanned_qr_code_text: input.scanned_qr_code_text || null,
      is_successful: input.is_successful,
      error_message: input.error_message || null,
      ip_address: input.ip_address || null,
      user_agent: input.user_agent || null,
      attempt_date: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('[QR Scan Logger] Error logging scan attempt:', error)
    throw new Error('Failed to log scan attempt')
  }

  console.log(`[QR Scan Logger] Scan attempt logged with ID: ${data.id}`)

  return data
}

/**
 * Get recent failed scan attempts for a reservation
 * 
 * Used for rate limiting to prevent abuse.
 * 
 * @param reservationId - The reservation ID
 * @param minutes - Time window in minutes (default: 5)
 * @returns Number of failed attempts in the time window
 */
export async function getRecentFailedAttempts(
  reservationId: number,
  minutes: number = 5
): Promise<number> {
  const timeThreshold = new Date()
  timeThreshold.setMinutes(timeThreshold.getMinutes() - minutes)

  const { count, error } = await supabase
    .from('qr_scan_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('reservation_id', reservationId)
    .eq('is_successful', false)
    .gte('attempt_date', timeThreshold.toISOString())

  if (error) {
    console.error('[QR Scan Logger] Error fetching recent failed attempts:', error)
    throw new Error('Failed to fetch recent failed attempts')
  }

  const attemptCount = count || 0

  console.log(
    `[QR Scan Logger] Reservation ${reservationId} has ${attemptCount} failed attempts in the last ${minutes} minutes`
  )

  return attemptCount
}

/**
 * Get all scan attempts for a reservation
 * 
 * @param reservationId - The reservation ID
 * @returns Array of scan attempts
 */
export async function getScanAttemptsByReservation(
  reservationId: number
): Promise<QRScanAttempt[]> {
  const { data, error } = await supabase
    .from('qr_scan_attempts')
    .select('*')
    .eq('reservation_id', reservationId)
    .order('attempt_date', { ascending: false })

  if (error) {
    console.error('[QR Scan Logger] Error fetching scan attempts:', error)
    throw new Error('Failed to fetch scan attempts')
  }

  return data || []
}

/**
 * Get scan attempts by user
 * 
 * @param userId - The user ID
 * @param limit - Maximum number of attempts to return
 * @returns Array of scan attempts
 */
export async function getScanAttemptsByUser(
  userId: number,
  limit: number = 50
): Promise<QRScanAttempt[]> {
  const { data, error } = await supabase
    .from('qr_scan_attempts')
    .select('*')
    .eq('user_id', userId)
    .order('attempt_date', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[QR Scan Logger] Error fetching user scan attempts:', error)
    throw new Error('Failed to fetch user scan attempts')
  }

  return data || []
}

/**
 * Get scan statistics for a QR code
 * 
 * @param qrCodeId - The QR code ID
 * @returns Statistics object
 */
export async function getQRCodeScanStats(qrCodeId: number): Promise<{
  total_attempts: number
  successful_scans: number
  failed_scans: number
  success_rate: number
}> {
  const { data, error } = await supabase
    .from('qr_scan_attempts')
    .select('is_successful')
    .eq('required_qr_code_id', qrCodeId)

  if (error) {
    console.error('[QR Scan Logger] Error fetching QR code stats:', error)
    throw new Error('Failed to fetch QR code stats')
  }

  const attempts = data || []
  const totalAttempts = attempts.length
  const successfulScans = attempts.filter((a) => a.is_successful).length
  const failedScans = totalAttempts - successfulScans
  const successRate = totalAttempts > 0 ? (successfulScans / totalAttempts) * 100 : 0

  return {
    total_attempts: totalAttempts,
    successful_scans: successfulScans,
    failed_scans: failedScans,
    success_rate: Math.round(successRate * 100) / 100,
  }
}

/**
 * Check if rate limit is exceeded for a reservation
 * 
 * @param reservationId - The reservation ID
 * @param maxAttempts - Maximum allowed failed attempts (default: 5)
 * @param minutes - Time window in minutes (default: 5)
 * @returns Object with rate limit status
 */
export async function checkRateLimit(
  reservationId: number,
  maxAttempts: number = 5,
  minutes: number = 5
): Promise<{
  isExceeded: boolean
  attemptCount: number
  maxAttempts: number
  timeWindowMinutes: number
  retryAfterSeconds: number | null
}> {
  const attemptCount = await getRecentFailedAttempts(reservationId, minutes)
  const isExceeded = attemptCount >= maxAttempts

  // Calculate retry after time (time until oldest attempt expires)
  let retryAfterSeconds: number | null = null
  if (isExceeded) {
    const timeThreshold = new Date()
    timeThreshold.setMinutes(timeThreshold.getMinutes() - minutes)

    const { data } = await supabase
      .from('qr_scan_attempts')
      .select('attempt_date')
      .eq('reservation_id', reservationId)
      .eq('is_successful', false)
      .gte('attempt_date', timeThreshold.toISOString())
      .order('attempt_date', { ascending: true })
      .limit(1)

    if (data && data.length > 0) {
      const oldestAttempt = new Date(data[0].attempt_date)
      const expiresAt = new Date(oldestAttempt.getTime() + minutes * 60 * 1000)
      retryAfterSeconds = Math.max(
        0,
        Math.ceil((expiresAt.getTime() - Date.now()) / 1000)
      )
    }
  }

  return {
    isExceeded,
    attemptCount,
    maxAttempts,
    timeWindowMinutes: minutes,
    retryAfterSeconds,
  }
}
