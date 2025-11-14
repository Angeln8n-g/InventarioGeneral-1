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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ category: string }> }
) {
  try {
    return await withPermission(request, PERMISSIONS.REPORTS_VIEW, async (authContext) => {
      const { searchParams } = new URL(request.url)
      const resolvedParams = await params
      const category = decodeURIComponent(resolvedParams.category)

      // Build filters from query parameters
      const filters: ConsumableReportFilters = {}

      // Date range for consumption calculation
      const startDate = searchParams.get('start_date')
      const endDate = searchParams.get('end_date')
      if (startDate || endDate) {
        filters.dateRange = {
          start: startDate || '',
          end: endDate || '',
        }
      }

      // Get category detail
      const categoryDetail = await consumableReportOperations.getCategoryDetail(
        category,
        filters
      )

      // Create audit log
      try {
        await auditLogOperations.create({
          user_id: authContext.user.id,
          action: 'report_view',
          entity_type: 'consumable_category_detail',
          entity_id: 0,
          new_values: {
            category,
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
        data: categoryDetail,
        message: 'Category detail generated successfully',
      })
    })
  } catch (error: unknown) {
    console.error('Category detail error:', error)

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
