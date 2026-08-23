import { NextRequest, NextResponse } from 'next/server'
import { withPermission } from '@/lib/auth-middleware'
import { PERMISSIONS } from '@/lib/permissions'
import { supabase } from '@/lib/supabase'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'

export async function GET(request: NextRequest) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_VIEW_DASHBOARD, async (_authContext) => {
      const now = new Date().toISOString()

      // Run all queries in parallel to drastically improve response time and prevent timeouts
      const [
        { count: totalTools, error: toolsError },
        { count: availableTools, error: availableError },
        { count: loanedTools, error: loanedError },
        { count: activeLoans, error: activeLoansError },
        { count: overdueLoans, error: overdueError },
        { count: totalUsers, error: usersError },
        { count: consumableTypes, error: consumableTypesError },
        { count: totalConsumables, error: totalConsumablesError },
        { data: lowStockData, error: lowStockError },
        { count: totalElectronics, error: electronicsError },
        { data: toolsByCategory, error: toolsByCategoryError },
        { data: consumablesByCategory, error: consumablesByCategoryError },
        { count: maintenanceTools, error: maintenanceError },
      ] = await Promise.all([
        supabase.from('tool_instances').select('id', { count: 'exact', head: true }),
        supabase.from('tool_instances').select('id', { count: 'exact', head: true }).eq('status', 'available'),
        supabase.from('tool_instances').select('id', { count: 'exact', head: true }).eq('status', 'loaned'),
        supabase.from('loans').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('loans').select('id', { count: 'exact', head: true }).eq('status', 'active').lt('due_date', now),
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('item_types').select('id', { count: 'exact', head: true }).eq('is_consumable', true),
        supabase.from('consumable_stock').select('id', { count: 'exact', head: true }),
        supabase.from('consumable_stock').select('current_quantity, minimum_threshold'),
        supabase.from('electronic_devices').select('id', { count: 'exact', head: true }),
        supabase.from('tool_instances').select(`item_type:item_types(category)`),
        supabase.from('consumable_stock').select(`item_type:item_types(category)`),
        supabase.from('tool_instances').select('id', { count: 'exact', head: true }).in('status', ['maintenance', 'out-of-service', 'damaged']),
      ])

      const firstError =
        toolsError ||
        availableError ||
        loanedError ||
        activeLoansError ||
        overdueError ||
        usersError ||
        consumableTypesError ||
        totalConsumablesError ||
        lowStockError ||
        electronicsError ||
        toolsByCategoryError ||
        consumablesByCategoryError ||
        maintenanceError

      if (firstError) throw firstError

      const lowStockItems = lowStockData?.filter(
        item => item.current_quantity <= item.minimum_threshold
      ).length || 0

      // Group tools by category
      const toolsCategoryCount: Record<string, number> = {}
      toolsByCategory?.forEach(tool => {
        const category = (tool.item_type as { category?: string })?.category || 'Sin categoría'
        toolsCategoryCount[category] = (toolsCategoryCount[category] || 0) + 1
      })
      const toolsByCategories = Object.entries(toolsCategoryCount).map(([category, count]) => ({
        category,
        count,
      }))

      // Group consumables by category
      const consumablesCategoryCount: Record<string, number> = {}
      consumablesByCategory?.forEach(item => {
        const category = (item.item_type as { category?: string })?.category || 'Sin categoría'
        consumablesCategoryCount[category] = (consumablesCategoryCount[category] || 0) + 1
      })
      const consumablesByCategories = Object.entries(consumablesCategoryCount).map(([category, count]) => ({
        category,
        count,
      }))

      return NextResponse.json({
        data: {
          totalTools: totalTools || 0,
          availableTools: availableTools || 0,
          loanedTools: loanedTools || 0,
          maintenanceTools: maintenanceTools || 0,
          overdueLoans: overdueLoans || 0,
          totalUsers: totalUsers || 0,
          activeLoans: activeLoans || 0,
          consumableTypes: consumableTypes || 0,
          totalConsumables: totalConsumables || 0,
          lowStockItems,
          totalElectronics: totalElectronics || 0,
          toolsByCategory: toolsByCategories,
          consumablesByCategory: consumablesByCategories,
        },
        message: 'Dashboard stats retrieved successfully',
      })
    })
  } catch (error: unknown) {
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

    const errObj = error as { name?: string; message?: string; details?: string; code?: string; stack?: string; cause?: unknown }
    const errorMessage = errObj?.message || (error instanceof Error ? error.message : 'Unknown error')
    const errorName = errObj?.name || (error instanceof Error ? error.name : '')

    // Gracefully handle aborted requests (client disconnect / timeout)
    if (errorName === 'AbortError' || errorMessage.includes('aborted') || errorMessage.includes('AbortError')) {
      console.warn('Dashboard stats request was aborted (client disconnected or timed out)')
      return NextResponse.json(
        {
          error: {
            code: 'REQUEST_ABORTED',
            message: 'La solicitud fue cancelada o expiró.',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 499 }
      )
    }

    const errorDetails = errObj?.details || (error instanceof Error ? error.stack : (typeof error === 'object' ? JSON.stringify(error) : String(error)))

    console.error('Dashboard stats error:', {
      message: errorMessage,
      details: errorDetails,
      hint: errObj?.cause ? String(errObj.cause) : '',
      code: errObj?.code ? String(errObj.code) : '',
    })

    // Handle fetch/network errors specifically
    if (errorMessage.includes('fetch failed') || errorMessage.includes('ECONNREFUSED')) {
      return NextResponse.json(
        {
          error: {
            code: 'CONNECTION_ERROR',
            message: 'No se pudo conectar a la base de datos. Verifica tu conexión a internet.',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 503 }
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

