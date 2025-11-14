import { NextRequest, NextResponse } from 'next/server'
import { itemTypeOperations, consumableStockOperations } from '@/lib/supabase-client'
import { withAuth } from '@/lib/auth-middleware'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'

export async function GET(request: NextRequest) {
  try {
    return await withAuth(request, async (authContext) => {
      const { searchParams } = new URL(request.url)
      
      // Get query parameters
      const category = searchParams.get('category')
      const search = searchParams.get('search')
      const lowStock = searchParams.get('low_stock') === 'true'
      
      // Get all consumable stocks (same as admin endpoint)
      const allStocks = await consumableStockOperations.getAll()
      
      // Transform stocks to match the expected format for users
      const consumablesWithStock = allStocks
        .filter((stock) => stock.item_type) // Filter out stocks without item_type
        .map((stock) => ({
          id: stock.item_type!.id,
          name: stock.item_type!.name,
          description: stock.item_type!.description,
          category: stock.item_type!.category,
          is_consumable: stock.item_type!.is_consumable,
          stock: {
            id: stock.id,
            current_quantity: stock.current_quantity,
            minimum_threshold: stock.minimum_threshold,
            unit_of_measure: stock.unit_of_measure,
            is_low_stock: stock.current_quantity <= stock.minimum_threshold,
            is_available: stock.current_quantity > 0,
          },
        }))
      
      // Apply filters
      let filteredConsumables = consumablesWithStock
      
      if (category) {
        filteredConsumables = filteredConsumables.filter(item => 
          item.category?.toLowerCase().includes(category.toLowerCase())
        )
      }
      
      if (search) {
        const searchLower = search.toLowerCase()
        filteredConsumables = filteredConsumables.filter(item =>
          item.name.toLowerCase().includes(searchLower) ||
          item.description?.toLowerCase().includes(searchLower) ||
          item.category?.toLowerCase().includes(searchLower)
        )
      }
      
      if (lowStock) {
        filteredConsumables = filteredConsumables.filter(item =>
          item.stock?.is_low_stock === true
        )
      }

      // Sort by name
      filteredConsumables.sort((a, b) => a.name.localeCompare(b.name))

      return NextResponse.json({
        data: filteredConsumables,
        total: filteredConsumables.length,
        filters: {
          category,
          search,
          low_stock: lowStock,
        },
      })
    })
  } catch (error: unknown) {
    console.error('Consumables fetch error:', error)

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