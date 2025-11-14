import { NextRequest, NextResponse } from 'next/server'
import { toolInstanceOperations } from '@/lib/supabase-client'
import { withAuth } from '@/lib/auth-middleware'
import { PERMISSIONS } from '@/lib/permissions'
import { ERROR_CODES, ERROR_MESSAGES, TOOL_STATUSES } from '@/utils/constants'
import type { ToolFilters } from '@/types/database'

export async function GET(request: NextRequest) {
  try {
    return await withAuth(request, async (authContext) => {
      const { searchParams } = new URL(request.url)
      
      // Build filters from query parameters
      const filters: ToolFilters = {}
      
      const status = searchParams.get('status')
      const validStatuses: Array<'available' | 'loaned' | 'out-of-service' | 'lost' | 'damaged'> = Object.values(TOOL_STATUSES) as Array<'available' | 'loaned' | 'out-of-service' | 'lost' | 'damaged'>
      if (status && validStatuses.includes(status as 'available' | 'loaned' | 'out-of-service' | 'lost' | 'damaged')) {
        filters.status = status as 'available' | 'loaned' | 'out-of-service' | 'lost' | 'damaged'
      }
      
      const category = searchParams.get('category')
      if (category) {
        filters.category = category
      }
      
      const itemTypeId = searchParams.get('item_type_id')
      if (itemTypeId) {
        const parsed = parseInt(itemTypeId, 10)
        if (!isNaN(parsed)) {
          filters.item_type_id = parsed
        }
      }

      // Get tools with filters
      const tools = await toolInstanceOperations.getAll(filters)

      // Filter based on user permissions
      let filteredTools = tools
      
      // Regular users can only see available tools and their own loaned tools
      if (authContext.user.role !== 'admin') {
        filteredTools = tools.filter(tool => 
          tool.status === 'available' || 
          (tool.status === 'loaned' && tool.current_loan?.user_id === authContext.user.id)
        )
      }

      return NextResponse.json({
        data: filteredTools.map(tool => ({
          ...tool,
          is_available: tool.status === 'available',
          can_be_loaned: tool.status === 'available',
        })),
        total: filteredTools.length,
        filters: filters,
      })
    })
  } catch (error: unknown) {
    console.error('Tools fetch error:', error)

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