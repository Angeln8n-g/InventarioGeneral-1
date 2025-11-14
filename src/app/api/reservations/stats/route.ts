import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth-middleware'
import { reservationOperations } from '@/lib/supabase-client'

// GET /api/reservations/stats - Get reservation statistics
export async function GET(request: NextRequest) {
  try {
    const authContext = await authenticateRequest(request)

    const stats = await reservationOperations.getStats(authContext.user.id)

    return NextResponse.json({
      data: stats,
      message: 'Statistics retrieved successfully',
    })
  } catch (error: unknown) {
    console.error('Get stats error:', error)
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get statistics',
        },
      },
      { status: 500 }
    )
  }
}
