/**
 * Audit API Routes
 * 
 * GET /api/admin/permissions/audit - Get audit history with filters
 * 
 * @see Requirements 6.4 - Show audit history ordered by date descending with filters
 */

import { NextRequest, NextResponse } from 'next/server'
import { AuditService } from '@/services/audit.service'
import { withPermission } from '@/lib/auth-middleware'
import { PERMISSIONS } from '@/lib/permissions'
import { ERROR_CODES } from '@/utils/constants'
import type { AuditHistoryFilters, PermissionAuditEntry } from '@/types/permissions'

/**
 * Valid action types for filtering audit entries
 */
const VALID_ACTION_TYPES: PermissionAuditEntry['actionType'][] = [
  'role_created',
  'role_updated',
  'role_deleted',
  'role_permissions_changed',
  'user_permissions_changed',
]

/**
 * Valid target types for filtering audit entries
 */
const VALID_TARGET_TYPES: Array<'role' | 'user'> = ['role', 'user']

/**
 * Parse and validate query parameters for audit history
 */
function parseQueryParams(searchParams: URLSearchParams): {
  filters: AuditHistoryFilters
  page: number
  pageSize: number
  errors: string[]
} {
  const errors: string[] = []
  const filters: AuditHistoryFilters = {}

  // Parse actionType
  const actionType = searchParams.get('actionType')
  if (actionType) {
    if (VALID_ACTION_TYPES.includes(actionType as PermissionAuditEntry['actionType'])) {
      filters.actionType = actionType as PermissionAuditEntry['actionType']
    } else {
      errors.push(`Invalid actionType: ${actionType}. Valid values: ${VALID_ACTION_TYPES.join(', ')}`)
    }
  }

  // Parse targetType
  const targetType = searchParams.get('targetType')
  if (targetType) {
    if (VALID_TARGET_TYPES.includes(targetType as 'role' | 'user')) {
      filters.targetType = targetType as 'role' | 'user'
    } else {
      errors.push(`Invalid targetType: ${targetType}. Valid values: ${VALID_TARGET_TYPES.join(', ')}`)
    }
  }

  // Parse adminUserId
  const adminUserId = searchParams.get('adminUserId')
  if (adminUserId) {
    const parsedAdminUserId = parseInt(adminUserId, 10)
    if (!isNaN(parsedAdminUserId) && parsedAdminUserId > 0) {
      filters.adminUserId = parsedAdminUserId
    } else {
      errors.push('adminUserId must be a positive integer')
    }
  }

  // Parse startDate
  const startDate = searchParams.get('startDate')
  if (startDate) {
    const parsedStartDate = new Date(startDate)
    if (!isNaN(parsedStartDate.getTime())) {
      filters.startDate = parsedStartDate
    } else {
      errors.push('startDate must be a valid ISO date string')
    }
  }

  // Parse endDate
  const endDate = searchParams.get('endDate')
  if (endDate) {
    const parsedEndDate = new Date(endDate)
    if (!isNaN(parsedEndDate.getTime())) {
      filters.endDate = parsedEndDate
    } else {
      errors.push('endDate must be a valid ISO date string')
    }
  }

  // Validate date range
  if (filters.startDate && filters.endDate && filters.startDate > filters.endDate) {
    errors.push('startDate must be before or equal to endDate')
  }

  // Parse page (default 1)
  const pageParam = searchParams.get('page')
  let page = 1
  if (pageParam) {
    const parsedPage = parseInt(pageParam, 10)
    if (!isNaN(parsedPage) && parsedPage > 0) {
      page = parsedPage
    } else {
      errors.push('page must be a positive integer')
    }
  }

  // Parse pageSize (default 20, max 100)
  const pageSizeParam = searchParams.get('pageSize')
  let pageSize = 20
  if (pageSizeParam) {
    const parsedPageSize = parseInt(pageSizeParam, 10)
    if (!isNaN(parsedPageSize) && parsedPageSize > 0) {
      pageSize = Math.min(parsedPageSize, 100)
    } else {
      errors.push('pageSize must be a positive integer')
    }
  }

  return { filters, page, pageSize, errors }
}

/**
 * GET /api/admin/permissions/audit
 * Get audit history with optional filters and pagination
 * 
 * Query Parameters:
 * - actionType: Filter by action type (role_created, role_updated, role_deleted, role_permissions_changed, user_permissions_changed)
 * - targetType: Filter by target type (role, user)
 * - adminUserId: Filter by admin who made the change
 * - startDate: Filter by start date (ISO string)
 * - endDate: Filter by end date (ISO string)
 * - page: Page number (default 1)
 * - pageSize: Items per page (default 20, max 100)
 * 
 * Response format:
 * - Success: { success: true, data: { entries: [], total: number, page: number, pageSize: number, totalPages: number } }
 * - Error: { success: false, error: { code: string, message: string } }
 * 
 * @see Requirements 6.4 - Show audit history ordered by date descending with filters
 */
export async function GET(request: NextRequest) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_PERMISSIONS, async () => {
      const { searchParams } = new URL(request.url)
      
      // Parse and validate query parameters
      const { filters, page, pageSize, errors } = parseQueryParams(searchParams)

      // Return validation errors if any
      if (errors.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: errors.join('; '),
            },
          },
          { status: 400 }
        )
      }

      // Get audit history from service
      const result = await AuditService.getAuditHistory({
        filters,
        page,
        pageSize,
      })

      return NextResponse.json({
        success: true,
        data: result,
      })
    })
  } catch (error: unknown) {
    console.error('Audit history fetch error:', error)

    if (error instanceof Error && error.name === 'AuthenticationError') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ERROR_CODES.AUTHENTICATION_ERROR,
            message: error.message,
          },
        },
        { status: 401 }
      )
    }

    if (error instanceof Error && error.name === 'AuthorizationError') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ERROR_CODES.AUTHORIZATION_ERROR,
            message: error.message,
          },
        },
        { status: 403 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: 'Error al obtener el historial de auditoría',
        },
      },
      { status: 500 }
    )
  }
}
