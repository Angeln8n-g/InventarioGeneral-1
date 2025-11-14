import { NextRequest, NextResponse } from 'next/server'
import { withPermission } from '@/lib/auth-middleware'
import { PERMISSIONS } from '@/lib/permissions'
import { auditLogOperations } from '@/lib/supabase-client'
import { checkRateLimit, getRateLimitKey, RATE_LIMITS } from '@/lib/rate-limiter'
import { loanReportOperations } from '@/lib/reports/loan-reports'
import { toolReportOperations } from '@/lib/reports/tool-reports'
import { consumableReportOperations } from '@/lib/reports/consumable-reports'
import {
  generateLoanReportPDF,
  generateToolReportPDF,
  generateConsumableReportPDF,
} from '@/lib/reports/export/pdf-export'
import {
  generateLoanReportExcel,
  generateToolReportExcel,
  generateConsumableReportExcel,
} from '@/lib/reports/export/excel-export'
import {
  generateLoanReportCSV,
  generateToolReportCSV,
  generateConsumableReportCSV,
} from '@/lib/reports/export/csv-export'
import type { ExportRequest } from '@/types/reports'

const ERROR_CODES = {
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  EXPORT_ERROR: 'EXPORT_ERROR',
}

const ERROR_MESSAGES = {
  GENERIC_ERROR: 'An error occurred while processing your request',
  INVALID_FORMAT: 'Invalid export format',
  INVALID_REPORT_TYPE: 'Invalid report type',
}

export async function POST(request: NextRequest) {
  try {
    return await withPermission(request, PERMISSIONS.REPORTS_EXPORT, async (authContext) => {
      // Check rate limit for exports (more restrictive)
      const rateLimitKey = getRateLimitKey(authContext.user.id, 'reports:export')
      const rateLimit = checkRateLimit(rateLimitKey, RATE_LIMITS.REPORT_EXPORT)

      if (!rateLimit.allowed) {
        return NextResponse.json(
          {
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: 'Too many export requests. Please try again later.',
              timestamp: new Date().toISOString(),
              retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000),
            },
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': RATE_LIMITS.REPORT_EXPORT.requests.toString(),
              'X-RateLimit-Remaining': rateLimit.remaining.toString(),
              'X-RateLimit-Reset': rateLimit.resetTime.toString(),
              'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
            },
          }
        )
      }

      const body: ExportRequest = await request.json()
      
      // Validate format
      if (!['pdf', 'excel', 'csv'].includes(body.format)) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: ERROR_MESSAGES.INVALID_FORMAT,
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }
      
      // Validate report type
      if (!['loans', 'tools', 'consumables'].includes(body.reportType)) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: ERROR_MESSAGES.INVALID_REPORT_TYPE,
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }
      
      let blob: Blob
      let contentType: string
      let fileExtension: string
      
      try {
        // Get report data based on type
        if (body.reportType === 'loans') {
          const [metrics, charts, loansData] = await Promise.all([
            loanReportOperations.getMetrics(body.filters as import('@/types/reports').LoanReportFilters),
            loanReportOperations.getChartData(body.filters as import('@/types/reports').LoanReportFilters),
            loanReportOperations.getDetailedLoans(body.filters as import('@/types/reports').LoanReportFilters, 1, 10000),
          ])
          
          const reportData = {
            metrics,
            charts,
            loans: loansData.loans,
            totalCount: loansData.totalCount,
          }
          
          // Generate export based on format
          if (body.format === 'pdf') {
            blob = await generateLoanReportPDF(reportData, body.filters)
            contentType = 'application/pdf'
            fileExtension = 'pdf'
          } else if (body.format === 'excel') {
            blob = await generateLoanReportExcel(reportData, body.filters)
            contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            fileExtension = 'xlsx'
          } else {
            blob = await generateLoanReportCSV(reportData)
            contentType = 'text/csv'
            fileExtension = 'csv'
          }
        } else if (body.reportType === 'tools') {
          const [metrics, charts, tools] = await Promise.all([
            toolReportOperations.getMetrics(body.filters as import('@/types/reports').ToolReportFilters),
            toolReportOperations.getChartData(body.filters as import('@/types/reports').ToolReportFilters),
            toolReportOperations.getDetailedTools(body.filters as import('@/types/reports').ToolReportFilters),
          ])
          
          const reportData = {
            metrics,
            charts,
            tools,
          }
          
          // Generate export based on format
          if (body.format === 'pdf') {
            blob = await generateToolReportPDF(reportData, body.filters)
            contentType = 'application/pdf'
            fileExtension = 'pdf'
          } else if (body.format === 'excel') {
            blob = await generateToolReportExcel(reportData, body.filters)
            contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            fileExtension = 'xlsx'
          } else {
            blob = await generateToolReportCSV(reportData)
            contentType = 'text/csv'
            fileExtension = 'csv'
          }
        } else {
          // consumables
          const [metrics, charts, categories] = await Promise.all([
            consumableReportOperations.getMetrics(body.filters),
            consumableReportOperations.getChartData(body.filters),
            consumableReportOperations.getCategorySummaries(body.filters),
          ])
          
          const reportData = {
            metrics,
            charts,
            categories,
          }
          
          // Generate export based on format
          if (body.format === 'pdf') {
            blob = await generateConsumableReportPDF(reportData, body.filters)
            contentType = 'application/pdf'
            fileExtension = 'pdf'
          } else if (body.format === 'excel') {
            blob = await generateConsumableReportExcel(reportData, body.filters)
            contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            fileExtension = 'xlsx'
          } else {
            blob = await generateConsumableReportCSV(reportData)
            contentType = 'text/csv'
            fileExtension = 'csv'
          }
        }
        
        // Generate filename
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
        const filename = body.filename || `${body.reportType}-report-${timestamp}.${fileExtension}`
        
        // Create audit log
        try {
          await auditLogOperations.create({
            user_id: authContext.user.id,
            action: 'report_export',
            entity_type: `${body.reportType}_report`,
            entity_id: 0,
            new_values: {
              format: body.format,
              filters: body.filters,
              filename,
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
        
        // Convert blob to buffer
        const buffer = await blob.arrayBuffer()
        
        // Return file
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': contentType,
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': buffer.byteLength.toString(),
          },
        })
      } catch (exportError) {
        console.error('Export generation error:', exportError)
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.EXPORT_ERROR,
              message: 'Failed to generate export',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 500 }
        )
      }
    })
  } catch (error: unknown) {
    console.error('Export error:', error)

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
          code: ERROR_CODES.EXPORT_ERROR,
          message: ERROR_MESSAGES.GENERIC_ERROR,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    )
  }
}
