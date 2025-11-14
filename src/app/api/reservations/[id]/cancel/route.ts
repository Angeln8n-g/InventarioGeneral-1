import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth-middleware'
import { reservationOperations } from '@/lib/supabase-client'

// POST /api/reservations/[id]/cancel - Cancel a reservation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await authenticateRequest(request)

    const { id: idStr } = await params
    const id = parseInt(idStr)

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
        { error: { code: 'FORBIDDEN', message: 'You can only cancel your own reservations' } },
        { status: 403 }
      )
    }

    // Check if reservation is active
    if (existingReservation.status !== 'active') {
      return NextResponse.json(
        { error: { code: 'INVALID_STATUS', message: 'Only active reservations can be cancelled' } },
        { status: 400 }
      )
    }

    const reservation = await reservationOperations.cancel(id)

    return NextResponse.json({
      data: reservation,
      message: 'Reservation cancelled successfully',
    })
  } catch (error: unknown) {
    console.error('Cancel reservation error:', error)
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to cancel reservation',
        },
      },
      { status: 500 }
    )
  }
}
