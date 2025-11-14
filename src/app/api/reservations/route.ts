import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth-middleware'
import { reservationOperations } from '@/lib/supabase-client'
import type { ReservationFilters } from '@/types/database'

// GET /api/reservations - Get all reservations with optional filters
export async function GET(request: NextRequest) {
  try {
    const authContext = await authenticateRequest(request)

    const { searchParams } = new URL(request.url)
    const filters: ReservationFilters = {}

    if (searchParams.get('user_id')) {
      filters.user_id = parseInt(searchParams.get('user_id')!)
    }

    if (searchParams.get('item_type_id')) {
      filters.item_type_id = parseInt(searchParams.get('item_type_id')!)
    }

    if (searchParams.get('status')) {
      filters.status = searchParams.get('status') as any
    }

    if (searchParams.get('expiring_soon') === 'true') {
      filters.expiring_soon = true
    }

    const reservations = await reservationOperations.getAll(filters)

    return NextResponse.json({
      data: reservations,
      message: 'Reservations retrieved successfully',
    })
  } catch (error: unknown) {
    console.error('Get reservations error:', error)
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get reservations',
        },
      },
      { status: 500 }
    )
  }
}

// POST /api/reservations - Create a new reservation
export async function POST(request: NextRequest) {
  try {
    const authContext = await authenticateRequest(request)

    const body = await request.json()
    const { item_type_id, reserved_quantity, expiration_date, notes, purpose } = body

    // Validation
    if (!item_type_id || !reserved_quantity) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'item_type_id and reserved_quantity are required' } },
        { status: 400 }
      )
    }

    // Calculate expiration date if not provided (default: 7 days)
    let finalExpirationDate = expiration_date
    if (!finalExpirationDate) {
      const expirationDate = new Date()
      expirationDate.setDate(expirationDate.getDate() + 7)
      finalExpirationDate = expirationDate.toISOString()
    }

    // Validate reservation limits
    const { validateReservation } = await import('@/lib/reservation-limits')
    const { itemTypeOperations, consumableStockOperations } = await import('@/lib/supabase-client')
    
    // Get user's active reservations count
    const userReservations = await reservationOperations.getAll({ 
      user_id: authContext.user.id, 
      status: 'active' 
    })
    
    // Get item stock info
    const itemType = await itemTypeOperations.getById(item_type_id)
    if (!itemType) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Item type not found' } },
        { status: 404 }
      )
    }

    const stocks = await consumableStockOperations.getAll()
    const stock = stocks.find(s => s.item_type_id === item_type_id)
    if (!stock) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Stock information not found' } },
        { status: 404 }
      )
    }

    // Get current reserved quantity for this item
    const currentReserved = await reservationOperations.getTotalReservedQuantity(item_type_id)
    
    // Calculate expiration days
    const expirationDays = Math.ceil(
      (new Date(finalExpirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )

    // Validate
    const validation = validateReservation({
      userId: authContext.user.id,
      itemTypeId: item_type_id,
      requestedQuantity: reserved_quantity,
      availableStock: stock.current_quantity,
      currentReservedQuantity: currentReserved,
      userActiveReservationsCount: userReservations.length,
      expirationDays,
    })

    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: validation.errors.join('. '),
            details: validation.errors,
          } 
        },
        { status: 400 }
      )
    }

    const reservation = await reservationOperations.create(authContext.user.id, {
      item_type_id,
      reserved_quantity,
      expiration_date: finalExpirationDate,
      notes,
      purpose,
    })

    return NextResponse.json({
      data: reservation,
      message: 'Reservation created successfully',
      warnings: validation.warnings,
    })
  } catch (error: unknown) {
    console.error('Create reservation error:', error)
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create reservation',
        },
      },
      { status: 500 }
    )
  }
}
