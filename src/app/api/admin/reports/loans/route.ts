import { NextRequest, NextResponse } from 'next/server'
import { loanReportOperations } from '@/lib/reports/loan-reports'
import { withPermission } from '@/lib/auth-middleware'
import { PERMISSIONS } from '@/lib/permissions'
import { auditLogOperations } from '@/lib/supabase-client'
import { checkRateLimit, getRateLimitKey, RATE_LIMITS } from '@/lib/rate-limiter'
import type { LoanReportFilters } from '@/types/reports'

const ERROR_CODES = {
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
}

const ERROR_MESSAGES = {
  GENERIC_ERROR: 'An error occurred while processing your request',
  INVALID_DATE_RANGE: 'Invalid date range provided',
}

export async function GET(request: NextRequest) {
  try {
    return await withPermission(request, PERMISSIONS.REPORTS_VIEW, async (authContext) => {
      // Check rate limit
      const rateLimitKey = getRateLimitKey(authContext.user.id, 'reports:loans')
      const rateLimit = checkRateLimit(rateLimitKey, RATE_LIMITS.REPORT_VIEW)

      if (!rateLimit.allowed) {
        return NextResponse.json(
          {
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: 'Too many requests. Please try again later.',
              timestamp: new Date().toISOString(),
              retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000),
            },
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': RATE_LIMITS.REPORT_VIEW.requests.toString(),
              'X-RateLimit-Remaining': rateLimit.remaining.toString(),
              'X-RateLimit-Reset': rateLimit.resetTime.toString(),
              'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
            },
          }
        )
      }

      const { searchParams } = new URL(request.url)

      // Build filters from query parameters
      const filters: LoanReportFilters = {}

      // Date range
      const startDate = searchParams.get('start_date')
      const endDate = searchParams.get('end_date')
      if (startDate || endDate) {
        filters.dateRange = {
          start: startDate || '',
          end: endDate || '',
        }

        // Validate date range
        if (startDate && endDate) {
          const start = new Date(startDate)
          const end = new Date(endDate)
          if (start > end) {
            return NextResponse.json(
              {
                error: {
                  code: ERROR_CODES.VALIDATION_ERROR,
                  message: 'Start date must be before end date',
                  timestamp: new Date().toISOString(),
                },
              },
              { status: 400 }
            )
          }

          // Check if range exceeds 1 year
          const daysDiff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
          if (daysDiff > 365) {
            return NextResponse.json(
              {
                error: {
                  code: ERROR_CODES.VALIDATION_ERROR,
                  message: 'Date range cannot exceed 1 year',
                  timestamp: new Date().toISOString(),
                },
              },
              { status: 400 }
            )
          }
        }
      }

      // User filter
      const userId = searchParams.get('user_id')
      if (userId) {
        const parsed = parseInt(userId, 10)
        if (!isNaN(parsed)) {
          filters.userId = parsed
        }
      }

      // Tool instance filter
      const toolInstanceId = searchParams.get('tool_instance_id')
      if (toolInstanceId) {
        const parsed = parseInt(toolInstanceId, 10)
        if (!isNaN(parsed)) {
          filters.toolInstanceId = parsed
        }
      }

      // Status filter
      const status = searchParams.get('status')
      if (status) {
        filters.status = status as 'active' | 'returned' | 'overdue' | 'lost'
      }

      // Pagination
      const page = parseInt(searchParams.get('page') || '1', 10)
      const pageSize = parseInt(searchParams.get('page_size') || '50', 10)

      // Validate pagination
      if (page < 1 || pageSize < 1 || pageSize > 200) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'Invalid pagination parameters',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }

      // Get report data
      const [metrics, charts, loansData] = await Promise.all([
        loanReportOperations.getMetrics(filters),
        loanReportOperations.getChartData(filters),
        loanReportOperations.getDetailedLoans(filters, page, pageSize),
      ])

      // Create audit log
      try {
        await auditLogOperations.create({
          user_id: authContext.user.id,
          action: 'report_view',
          entity_type: 'loan_report',
          entity_id: 0, // Reports don't have a specific ID
          new_values: {
            filters,
            page,
            pageSize,
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
          loans: loansData.loans,
          totalCount: loansData.totalCount,
        },
        message: 'Loan report generated successfully',
      })
    })
  } catch (error: unknown) {
    console.error('Loan report error:', error)

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
