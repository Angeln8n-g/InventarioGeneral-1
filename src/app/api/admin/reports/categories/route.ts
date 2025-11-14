import { NextRequest, NextResponse } from 'next/server'
import { withPermission } from '@/lib/auth-middleware'
import { PERMISSIONS } from '@/lib/permissions'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_ITEMS, async () => {
      // Get all item types with their categories
      const { data: itemTypes, error: itemTypesError } = await supabase
        .from('item_types')
        .select('*')
        .order('category')

      if (itemTypesError) throw itemTypesError

      // Get all tool instances with their item types
      const { data: toolInstances, error: toolsError } = await supabase
        .from('tool_instances')
        .select(`
          *,
          item_type:item_types(*)
        `)

      if (toolsError) throw toolsError

      // Get all consumable stock with their item types
      const { data: consumableStock, error: consumablesError } = await supabase
        .from('consumable_stock')
        .select(`
          *,
          item_type:item_types(*)
        `)

      if (consumablesError) throw consumablesError

      // Get active loans with tool info
      const { data: activeLoans, error: loansError } = await supabase
        .from('loans')
        .select(`
          *,
          tool_instance:tool_instances(
            *,
            item_type:item_types(*)
          )
        `)
        .eq('status', 'active')

      if (loansError) throw loansError

      // Group data by category
      const categories = new Map<string, {
        category: string
        tools: {
          total: number
          available: number
          loaned: number
          maintenance: number
          utilizationRate: number
        }
        consumables: {
          total: number
          lowStock: number
          totalStock: number
        }
        loans: {
          active: number
          totalLoans: number
        }
        itemTypes: number
      }>()

      // Process item types
      itemTypes?.forEach(itemType => {
        const category = itemType.category || 'Sin Categoría'
        if (!categories.has(category)) {
          categories.set(category, {
            category,
            tools: { total: 0, available: 0, loaned: 0, maintenance: 0, utilizationRate: 0 },
            consumables: { total: 0, lowStock: 0, totalStock: 0 },
            loans: { active: 0, totalLoans: 0 },
            itemTypes: 0,
          })
        }
        const cat = categories.get(category)!
        cat.itemTypes++
      })

      // Process tool instances
      toolInstances?.forEach(tool => {
        const category = tool.item_type?.category || 'Sin Categoría'
        const cat = categories.get(category)
        if (cat) {
          cat.tools.total++
          if (tool.status === 'available') cat.tools.available++
          if (tool.status === 'loaned') cat.tools.loaned++
          if (tool.status === 'maintenance' || tool.status === 'damaged') cat.tools.maintenance++
        }
      })

      // Process consumable stock
      consumableStock?.forEach(stock => {
        const category = stock.item_type?.category || 'Sin Categoría'
        const cat = categories.get(category)
        if (cat) {
          cat.consumables.total++
          cat.consumables.totalStock += stock.current_quantity || 0
          if (stock.current_quantity <= stock.minimum_threshold) {
            cat.consumables.lowStock++
          }
        }
      })

      // Process active loans
      activeLoans?.forEach(loan => {
        const category = loan.tool_instance?.item_type?.category || 'Sin Categoría'
        const cat = categories.get(category)
        if (cat) {
          cat.loans.active++
        }
      })

      // Calculate utilization rates
      categories.forEach(cat => {
        if (cat.tools.total > 0) {
          cat.tools.utilizationRate = (cat.tools.loaned / cat.tools.total) * 100
        }
      })

      // Convert to array and sort by total items
      const categoriesArray = Array.from(categories.values()).sort((a, b) => {
        const totalA = a.tools.total + a.consumables.total
        const totalB = b.tools.total + b.consumables.total
        return totalB - totalA
      })

      // Calculate overall metrics
      const metrics = {
        totalCategories: categoriesArray.length,
        totalTools: categoriesArray.reduce((sum, cat) => sum + cat.tools.total, 0),
        totalConsumables: categoriesArray.reduce((sum, cat) => sum + cat.consumables.total, 0),
        totalActiveLoans: categoriesArray.reduce((sum, cat) => sum + cat.loans.active, 0),
        avgUtilization: categoriesArray.length > 0
          ? categoriesArray.reduce((sum, cat) => sum + cat.tools.utilizationRate, 0) / categoriesArray.length
          : 0,
      }

      // Prepare chart data
      const charts = {
        toolsByCategory: categoriesArray.map(cat => ({
          category: cat.category,
          count: cat.tools.total,
        })),
        consumablesByCategory: categoriesArray.map(cat => ({
          category: cat.category,
          count: cat.consumables.total,
        })),
        utilizationByCategory: categoriesArray.map(cat => ({
          category: cat.category,
          rate: cat.tools.utilizationRate,
        })),
        loansByCategory: categoriesArray.map(cat => ({
          category: cat.category,
          count: cat.loans.active,
        })),
        categoryComparison: categoriesArray.map(cat => ({
          category: cat.category,
          tools: cat.tools.total,
          consumables: cat.consumables.total,
          loans: cat.loans.active,
        })),
      }

      return NextResponse.json({
        data: {
          categories: categoriesArray,
          metrics,
          charts,
        },
      })
    })
  } catch (error: unknown) {
    console.error('Categories report error:', error)

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
