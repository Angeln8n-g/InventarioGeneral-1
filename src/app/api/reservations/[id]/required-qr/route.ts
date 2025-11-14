import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth-middleware'
import { reservationOperations } from '@/lib/supabase-client'
import { supabase } from '@/lib/supabase'
import { getRandomActiveQRCode } from '@/lib/qr-selection'

// Zone icons mapping
const ZONE_ICONS: Record<string, string> = {
  general: '🚪',
  tools: '🔧',
  consumables: '📦',
  electronics: '💻',
}

/**
 * Update reservation with the required QR code ID
 */
async function assignRequiredQRCode(
  reservationId: number,
  requiredQrCodeId: number
): Promise<void> {
  const { error } = await supabase
    .from('consumable_reservations')
    .update({
      required_qr_code_id: requiredQrCodeId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reservationId)

  if (error) {
    console.error('Error assigning required QR code:', error)
    throw new Error('Failed to assign required QR code to reservation')
  }
}

// GET /api/reservations/[id]/required-qr - Get required QR code for reservation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const authContext = await authenticateRequest(request)

    const { id: idStr } = await params
    const reservationId = parseInt(idStr)

    if (isNaN(reservationId)) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_ID',
            message: 'Invalid reservation ID',
          },
        },
        { status: 400 }
      )
    }

    // Check if reservation exists
    const reservation = await reservationOperations.getById(reservationId)
    if (!reservation) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'Reservation not found',
          },
        },
        { status: 404 }
      )
    }

    // Check if user owns the reservation or is admin
    if (
      reservation.user_id !== authContext.user.id &&
      authContext.user.role !== 'admin'
    ) {
      return NextResponse.json(
        {
          error: {
            code: 'FORBIDDEN',
            message: 'You can only access your own reservations',
          },
        },
        { status: 403 }
      )
    }

    // Check if reservation is active
    if (reservation.status !== 'active') {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_STATUS',
            message: 'Only active reservations can request a QR code',
          },
        },
        { status: 400 }
      )
    }

    // Get random active QR code (uses caching)
    const selectedQR = await getRandomActiveQRCode()

    // Assign the required QR code to the reservation
    await assignRequiredQRCode(reservationId, selectedQR.id)

    // Get icon for the zone
    const icon = ZONE_ICONS[selectedQR.zone] || '📍'

    // Return required QR information
    return NextResponse.json({
      success: true,
      data: {
        required_qr_code_id: selectedQR.id,
        qr_code: selectedQR.qr_code,
        location_name: selectedQR.location_name,
        location_description: selectedQR.location_description || '',
        zone: selectedQR.zone,
        icon,
      },
    })
  } catch (error: unknown) {
    console.error('Required QR code error:', error)

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('No active warehouse QR codes available')) {
        return NextResponse.json(
          {
            error: {
              code: 'NO_ACTIVE_QR_CODES',
              message:
                'Sistema temporalmente no disponible. Por favor, contacta al administrador.',
              details: {
                fallback:
                  'Puedes usar entrada manual con cualquier código del almacén',
              },
            },
          },
          { status: 503 }
        )
      }

      if (error.message.includes('No QR codes available')) {
        return NextResponse.json(
          {
            error: {
              code: 'NO_QR_CODES',
              message: error.message,
            },
          },
          { status: 503 }
        )
      }
    }

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to get required QR code',
        },
      },
      { status: 500 }
    )
  }
}
