import { NextRequest, NextResponse } from 'next/server'
import { consumableReportOperations } from '@/lib/reports/consumable-reports'
import { withPermission } from '@/lib/auth-middleware'
import { PERMISSIONS } from '@/lib/permissions'
import { auditLogOperations } from '@/lib/supabase-client'
import type { ConsumableReportFilters } from '@/types/reports'

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
      const filters: ConsumableReportFilters = {}

      // Search filter (by name)
      const search = searchParams.get('search')
      if (search) {
        filters.search = search
      }

      // Category filter
      const category = searchParams.get('category')
      if (category) {
        filters.category = category
      }

      // Stock level filter
      const stockLevel = searchParams.get('stock_level')
      if (stockLevel) {
        filters.stockLevel = stockLevel as 'all' | 'low' | 'critical' | 'adequate'
      }

      // Date range for consumption calculation
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

      // Get report data
      const [metrics, charts, categories] = await Promise.all([
        consumableReportOperations.getMetrics(filters),
        consumableReportOperations.getChartData(filters),
        consumableReportOperations.getCategorySummaries(filters),
      ])

      // Create audit log
      try {
        await auditLogOperations.create({
          user_id: authContext.user.id,
          action: 'report_view',
          entity_type: 'consumable_report',
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
          categories,
        },
        message: 'Consumable report generated successfully',
      })
    })
  } catch (error: unknown) {
    console.error('Consumable report error:', error)

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
