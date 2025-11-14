import { NextRequest, NextResponse } from 'next/server'
import { toolInstanceOperations } from '@/lib/supabase-client'
import { withAuth } from '@/lib/auth-middleware'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'

interface ToolsByType {
  [key: number]: {
    item_type_id: number
    name: string
    description?: string
    category?: string
    available_count: number
  }
}

export async function GET(request: NextRequest) {
  try {
    return await withAuth(request, async () => {
      // Get all available tools
      const toolsData = await toolInstanceOperations.getAll({ status: 'available' })

      // Group by item type and count
      const toolsByType = toolsData.reduce((acc: ToolsByType, tool) => {
        const typeId = tool.item_type?.id
        const typeName = tool.item_type?.name || 'Unknown'
        
        if (typeId) {
          if (!acc[typeId]) {
            acc[typeId] = {
              item_type_id: typeId,
              name: typeName,
              description: tool.item_type?.description || undefined,
              category: tool.item_type?.category || undefined,
              available_count: 0
            }
          }
          acc[typeId].available_count++
        }
        return acc
      }, {})

      const result = Object.values(toolsByType).sort((a, b) => 
        a.name.localeCompare(b.name)
      )

      return NextResponse.json({
        data: result,
        total: result.length,
        total_available_tools: toolsData.length,
      })
    })
  } catch (error: unknown) {
    console.error('Available tools fetch error:', error)

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
