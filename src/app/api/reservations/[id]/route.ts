import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth-middleware'
import { reservationOperations } from '@/lib/supabase-client'

// GET /api/reservations/[id] - Get reservation by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await authenticateRequest(request)

    const { id: idStr } = await params
    const id = parseInt(idStr)
    const reservation = await reservationOperations.getById(id)

    if (!reservation) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Reservation not found' } },
        { status: 404 }
      )
    }

    return NextResponse.json({
      data: reservation,
      message: 'Reservation retrieved successfully',
    })
  } catch (error: unknown) {
    console.error('Get reservation error:', error)
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get reservation',
        },
      },
      { status: 500 }
    )
  }
}

// PATCH /api/reservations/[id] - Update reservation
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await authenticateRequest(request)

    const { id: idStr } = await params
    const id = parseInt(idStr)
    const body = await request.json()

    // Check if user owns the reservation or is admin
    const existingReservation = await reservationOperations.getById(id)
    if (!existingReservation) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Reservation not found' } },
        { status: 404 }
      )
    }

    if (
      existingReservation.user_id !== authContext.user.id &&
      authContext.user.role !== 'admin'
    ) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'You can only update your own reservations' } },
        { status: 403 }
      )
    }

    const reservation = await reservationOperations.update(id, body)

    return NextResponse.json({
      data: reservation,
      message: 'Reservation updated successfully',
    })
  } catch (error: unknown) {
    console.error('Update reservation error:', error)
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to update reservation',
        },
      },
      { status: 500 }
    )
  }
}
