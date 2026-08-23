import { NextRequest, NextResponse } from 'next/server'
import { withPermission } from '@/lib/auth-middleware'
import { PERMISSIONS } from '@/lib/permissions'
import { supabase } from '@/lib/supabase'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'

export async function GET(request: NextRequest) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_VIEW_DASHBOARD, async (_authContext) => {
      // Get total tools count
      const { count: totalTools, error: toolsError } = await supabase
        .from('tool_instances')
        .select('*', { count: 'exact', head: true })

      if (toolsError) throw toolsError

      // Get available tools count
      const { count: availableTools, error: availableError } = await supabase
        .from('tool_instances')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'available')

      if (availableError) throw availableError

      // Get loaned tools count
      const { count: loanedTools, error: loanedError } = await supabase
        .from('tool_instances')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'loaned')

      if (loanedError) throw loanedError

      // Get active loans count
      const { count: activeLoans, error: activeLoansError } = await supabase
        .from('loans')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')

      if (activeLoansError) throw activeLoansError

      // Get overdue loans count
      const now = new Date().toISOString()
      const { count: overdueLoans, error: overdueError } = await supabase
        .from('loans')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .lt('due_date', now)

      if (overdueError) throw overdueError

      // Get total users count
      const { count: totalUsers, error: usersError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })

      if (usersError) throw usersError

      // Get consumable types count
      const { count: consumableTypes, error: consumableTypesError } = await supabase
        .from('item_types')
        .select('*', { count: 'exact', head: true })
        .eq('is_consumable', true)

      if (consumableTypesError) throw consumableTypesError

      // Get total consumables count (number of consumable_stock records)
      const { count: totalConsumables, error: totalConsumablesError } = await supabase
        .from('consumable_stock')
        .select('*', { count: 'exact', head: true })

      if (totalConsumablesError) throw totalConsumablesError

      // Get low stock items count
      const { data: lowStockData, error: lowStockError } = await supabase
        .from('consumable_stock')
        .select('current_quantity, minimum_threshold')

      if (lowStockError) throw lowStockError

      const lowStockItems = lowStockData?.filter(
        item => item.current_quantity <= item.minimum_threshold
      ).length || 0

      // Get total electronics count
      const { count: totalElectronics, error: electronicsError } = await supabase
        .from('electronic_devices')
        .select('*', { count: 'exact', head: true })

      if (electronicsError) throw electronicsError

      // Get tools by category
      const { data: toolsByCategory, error: toolsByCategoryError } = await supabase
        .from('tool_instances')
        .select(`
          item_type:item_types(category)
        `)

      if (toolsByCategoryError) throw toolsByCategoryError

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

      // Get consumables by category
      const { data: consumablesByCategory, error: consumablesByCategoryError } = await supabase
        .from('consumable_stock')
        .select(`
          item_type:item_types(category)
        `)

      if (consumablesByCategoryError) throw consumablesByCategoryError

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

      // Get maintenance tools count
      const { count: maintenanceTools, error: maintenanceError } = await supabase
        .from('tool_instances')
        .select('*', { count: 'exact', head: true })
        .in('status', ['maintenance', 'out-of-service', 'damaged'])

      if (maintenanceError) throw maintenanceError

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

    const errObj = error as { message?: string; details?: string; code?: string; stack?: string; cause?: unknown }
    const errorMessage = errObj?.message || (error instanceof Error ? error.message : 'Unknown error')
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
