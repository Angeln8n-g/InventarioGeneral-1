import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth-middleware'
import { reservationOperations } from '@/lib/supabase-client'
import { supabase } from '@/lib/supabase'
import { logScanAttempt, checkRateLimit } from '@/lib/qr-scan-logger'

// POST /api/reservations/[id]/fulfill - Mark reservation as fulfilled
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await authenticateRequest(request)

    const { id: idStr } = await params
    const id = parseInt(idStr)
    
    // Get warehouse QR code ID from request body
    const body = await request.json()
    const { warehouse_qr_code_id, required_qr_code_id } = body

    if (!warehouse_qr_code_id) {
      return NextResponse.json(
        { error: { code: 'MISSING_QR', message: 'Warehouse QR code verification required' } },
        { status: 400 }
      )
    }

    // Check if reservation exists
    const existingReservation = await reservationOperations.getById(id)
    if (!existingReservation) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Reservation not found' } },
        { status: 404 }
      )
    }

    // Check if user owns the reservation or is admin
    if (
      existingReservation.user_id !== authContext.user.id &&
      authContext.user.role !== 'admin'
    ) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'You can only fulfill your own reservations' } },
        { status: 403 }
      )
    }

    // Check if reservation is active
    if (existingReservation.status !== 'active') {
      return NextResponse.json(
        { error: { code: 'INVALID_STATUS', message: 'Only active reservations can be fulfilled' } },
        { status: 400 }
      )
    }

    // NEW: Validate specific QR code if required_qr_code_id is provided
    // This enables the new specific QR verification feature while maintaining backward compatibility
    if (required_qr_code_id) {
      // Check rate limit before processing
      const rateLimit = await checkRateLimit(id, 5, 5)
      if (rateLimit.isExceeded) {
        return NextResponse.json(
          {
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: `Demasiados intentos fallidos. Por favor, espera ${Math.ceil((rateLimit.retryAfterSeconds || 0) / 60)} minutos antes de intentar nuevamente.`,
              details: {
                attemptCount: rateLimit.attemptCount,
                maxAttempts: rateLimit.maxAttempts,
                retryAfterSeconds: rateLimit.retryAfterSeconds,
              },
            },
          },
          { status: 429 }
        )
      }

      // Validate that the required QR code matches what's stored in the reservation
      if (existingReservation.required_qr_code_id && 
          existingReservation.required_qr_code_id !== required_qr_code_id) {
        return NextResponse.json(
          {
            error: {
              code: 'QR_MISMATCH',
              message: 'El código QR requerido no coincide con el asignado a esta reserva.',
            },
          },
          { status: 400 }
        )
      }

      // Check if QR assignment has expired (30 minutes)
      const QR_ASSIGNMENT_EXPIRATION_MS = 30 * 60 * 1000 // 30 minutes
      const assignmentTime = new Date(existingReservation.updated_at).getTime()
      const currentTime = Date.now()
      const timeSinceAssignment = currentTime - assignmentTime

      if (timeSinceAssignment > QR_ASSIGNMENT_EXPIRATION_MS) {
        // Log expiration attempt
        const ipAddress = request.headers.get('x-forwarded-for') || 
                         request.headers.get('x-real-ip') || 
                         undefined
        const userAgent = request.headers.get('user-agent') || undefined

        await logScanAttempt({
          reservation_id: id,
          user_id: authContext.user.id,
          required_qr_code_id: required_qr_code_id,
          scanned_qr_code_id: warehouse_qr_code_id,
          is_successful: false,
          error_message: `QR assignment expired. Assignment was ${Math.floor(timeSinceAssignment / 60000)} minutes old (max: 30 minutes)`,
          ip_address: ipAddress,
          user_agent: userAgent,
        })

        return NextResponse.json(
          {
            error: {
              code: 'QR_ASSIGNMENT_EXPIRED',
              message: 'La asignación del código QR ha expirado. Por favor, solicita un nuevo código QR.',
              details: {
                assignedMinutesAgo: Math.floor(timeSinceAssignment / 60000),
                maxMinutes: 30,
              },
            },
          },
          { status: 400 }
        )
      }

      // Check if the scanned QR matches the required QR
      if (warehouse_qr_code_id !== required_qr_code_id) {
        // Get information about both QR codes for error message
        const [scannedQR, requiredQR] = await Promise.all([
          supabase
            .from('warehouse_qr_codes')
            .select('qr_code, location_name, zone')
            .eq('id', warehouse_qr_code_id)
            .single(),
          supabase
            .from('warehouse_qr_codes')
            .select('qr_code, location_name, zone')
            .eq('id', required_qr_code_id)
            .single(),
        ])

        // Log failed scan attempt
        const ipAddress = request.headers.get('x-forwarded-for') || 
                         request.headers.get('x-real-ip') || 
                         undefined
        const userAgent = request.headers.get('user-agent') || undefined

        await logScanAttempt({
          reservation_id: id,
          user_id: authContext.user.id,
          required_qr_code_id: required_qr_code_id,
          scanned_qr_code_id: warehouse_qr_code_id,
          is_successful: false,
          error_message: `Wrong QR code scanned. Required: ${requiredQR.data?.location_name}, Scanned: ${scannedQR.data?.location_name}`,
          ip_address: ipAddress,
          user_agent: userAgent,
        })

        return NextResponse.json(
          {
            error: {
              code: 'WRONG_QR_CODE',
              message: 'Código QR incorrecto. Por favor, escanea el código correcto.',
              details: {
                scanned: {
                  location: scannedQR.data?.location_name || 'Desconocido',
                  zone: scannedQR.data?.zone || 'unknown',
                  qr_code: scannedQR.data?.qr_code || '',
                },
                required: {
                  location: requiredQR.data?.location_name || 'Desconocido',
                  zone: requiredQR.data?.zone || 'unknown',
                  qr_code: requiredQR.data?.qr_code || '',
                },
              },
            },
          },
          { status: 400 }
        )
      }

      // Log successful scan attempt
      const ipAddress = request.headers.get('x-forwarded-for') || 
                       request.headers.get('x-real-ip') || 
                       undefined
      const userAgent = request.headers.get('user-agent') || undefined

      await logScanAttempt({
        reservation_id: id,
        user_id: authContext.user.id,
        required_qr_code_id: required_qr_code_id,
        scanned_qr_code_id: warehouse_qr_code_id,
        is_successful: true,
        ip_address: ipAddress,
        user_agent: userAgent,
      })
    }

    const reservation = await reservationOperations.fulfill(id, warehouse_qr_code_id)

    return NextResponse.json({
      data: reservation,
      message: 'Reservation fulfilled successfully',
    })
  } catch (error: unknown) {
    console.error('Fulfill reservation error:', error)
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fulfill reservation',
        },
      },
      { status: 500 }
    )
  }
}
