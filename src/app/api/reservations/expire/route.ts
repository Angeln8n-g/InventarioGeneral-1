import { NextRequest, NextResponse } from 'next/server'
import { reservationOperations } from '@/lib/supabase-client'

// POST /api/reservations/expire - Expire old reservations
// This endpoint can be called by a cron job or scheduled task
export async function POST(request: NextRequest) {
  try {
    // Optional: Add API key authentication for cron jobs
    const apiKey = request.headers.get('x-api-key')
    const expectedApiKey = process.env.CRON_API_KEY
    
    if (expectedApiKey && apiKey !== expectedApiKey) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Invalid API key' } },
        { status: 401 }
      )
    }

    console.log('🕐 Running reservation expiration job...')
    
    // Call the expiration function
    await reservationOperations.expireOld()
    
    // Get stats about expired reservations
    const allReservations = await reservationOperations.getAll()
    const expiredCount = allReservations.filter(r => r.status === 'expired').length
    const activeCount = allReservations.filter(r => r.status === 'active').length
    
    console.log(`✅ Expiration job completed. Active: ${activeCount}, Expired: ${expiredCount}`)

    return NextResponse.json({
      success: true,
      message: 'Reservation expiration job completed',
      stats: {
        active: activeCount,
        expired: expiredCount,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error: unknown) {
    console.error('❌ Expiration job error:', error)
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to expire reservations',
        },
      },
      { status: 500 }
    )
  }
}

// GET /api/reservations/expire - Check expiration status (for monitoring)
export async function GET(request: NextRequest) {
  try {
    const allReservations = await reservationOperations.getAll()
    const now = new Date()
    
    const stats = {
      total: allReservations.length,
      active: allReservations.filter(r => r.status === 'active').length,
      expired: allReservations.filter(r => r.status === 'expired').length,
      expiring_soon: allReservations.filter(r => 
        r.status === 'active' && 
        new Date(r.expiration_date) <= new Date(now.getTime() + 24 * 60 * 60 * 1000)
      ).length,
      overdue: allReservations.filter(r => 
        r.status === 'active' && 
        new Date(r.expiration_date) < now
      ).length,
    }

    return NextResponse.json({
      stats,
      timestamp: now.toISOString(),
    })
  } catch (error: unknown) {
    console.error('Get expiration status error:', error)
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get expiration status',
        },
      },
      { status: 500 }
    )
  }
}
