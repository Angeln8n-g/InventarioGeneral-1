import { NextRequest, NextResponse } from 'next/server'
import { reservationReportOperations } from '@/lib/reports/reservation-reports'
import { withPermission } from '@/lib/auth-middleware'
import { PERMISSIONS } from '@/lib/permissions'
import { auditLogOperations } from '@/lib/supabase-client'
import type { ReservationReportFilters } from '@/types/reports'

const ERROR_CODES = {
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
}

const ERROR_MESSAGES = {
  GENERIC_ERROR: 'An error occurred while processing your request',
}

export async function GET(request: NextRequest) {
  try {
    return await withPermission(request, PERMISSIONS.REPORTS_VIEW, async (authContext) => {
      const { searchParams } = new URL(request.url)

      // Build filters from query parameters
      const filters: ReservationReportFilters = {}

      // Status filter
      const status = searchParams.get('status')
      if (status) {
        filters.status = status as 'active' | 'fulfilled' | 'cancelled' | 'expired'
      }

      // Date range
      const startDate = searchParams.get('start_date')
      const endDate = searchParams.get('end_date')
      if (startDate || endDate) {
        filters.dateRange = {
          start: startDate || '',
          end: endDate || '',
        }
      }

      // User filter
      const userId = searchParams.get('user_id')
      if (userId) {
        filters.userId = parseInt(userId, 10)
      }

      // Item type filter
      const itemTypeId = searchParams.get('item_type_id')
      if (itemTypeId) {
        filters.itemTypeId = parseInt(itemTypeId, 10)
      }

      // Category filter
      const category = searchParams.get('category')
      if (category) {
        filters.category = category
      }

      // Warehouse QR filter (for filtering by required QR code)
      const warehouseQrId = searchParams.get('warehouse_qr_id')
      if (warehouseQrId) {
        filters.warehouseQrId = parseInt(warehouseQrId, 10)
      }

      // Get report data with QR scan statistics
      const [metrics, charts, reservations, warehouseStats, qrScanStats] = await Promise.all([
        reservationReportOperations.getEnhancedMetrics(filters),
        reservationReportOperations.getChartData(filters),
        reservationReportOperations.getDetailedReservations(filters),
        reservationReportOperations.getWarehouseQRStats(filters),
        reservationReportOperations.getQRScanStatistics(filters),
      ])

      // Create audit log
      try {
        await auditLogOperations.create({
          user_id: authContext.user.id,
          action: 'report_view',
          entity_type: 'reservation_report',
          entity_id: 0,
          new_values: {
            filters,
          },
          ip_address:
            request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') ||
            'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown',
        })
      } catch (auditError) {
        console.error('Failed to create audit log:', auditError)
      }

      return NextResponse.json({
        data: {
          metrics,
          charts,
          reservations,
          warehouseStats,
          qrScanStats,
        },
        message: 'Reservation report generated successfully',
      })
    })
  } catch (error: unknown) {
    console.error('Reservation report error:', error)

    if (error instanceof Error && error.name === 'AuthenticationError') {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.AUTHENTICATION_ERROR,
            message: error.message,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 401 }
      )
    }

    if (error instanceof Error && error.name === 'AuthorizationError') {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.AUTHORIZATION_ERROR,
            message: error.message,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 403 }
      )
    }

    return NextResponse.json(
      {
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: ERROR_MESSAGES.GENERIC_ERROR,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    )
  }
}
