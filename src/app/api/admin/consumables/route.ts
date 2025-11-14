import { NextRequest, NextResponse } from 'next/server'
import { 
  consumableStockOperations, 
  consumableRequestOperations,
  auditLogOperations 
} from '@/lib/supabase-client'
import { withPermission } from '@/lib/auth-middleware'
import { PERMISSIONS } from '@/lib/permissions'
import { ERROR_CODES, ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/utils/constants'
import type { ConsumableRequest } from '@/types/database'

export async function GET(request: NextRequest) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_CONSUMABLES, async (_authContext) => {
      const { searchParams } = new URL(request.url)
      
      // Get query parameters
      const lowStockOnly = searchParams.get('low_stock_only') === 'true'
      const includeRequests = searchParams.get('include_requests') === 'true'
      
      // Get all consumable stock
      const stocks = await consumableStockOperations.getAll()
      
      // Filter for low stock if requested
      let filteredStocks = stocks
      if (lowStockOnly) {
        filteredStocks = stocks.filter(stock => 
          stock.current_quantity <= stock.minimum_threshold
        )
      }

      // Include pending requests if requested
      let pendingRequests: ConsumableRequest[] = []
      if (includeRequests) {
        pendingRequests = await consumableRequestOperations.getAll({ status: 'pending' })
      }

      // Calculate summary statistics
      const summary = {
        total_items: stocks.length,
        low_stock_items: stocks.filter(stock => stock.current_quantity <= stock.minimum_threshold).length,
        out_of_stock_items: stocks.filter(stock => stock.current_quantity === 0).length,
        pending_requests: pendingRequests.length,
        total_stock_value: stocks.reduce((sum, stock) => sum + stock.current_quantity, 0),
      }

      return NextResponse.json({
        data: filteredStocks,
        pending_requests: pendingRequests,
        total: filteredStocks.length,
        summary,
        filters: {
          low_stock_only: lowStockOnly,
          include_requests: includeRequests,
        },
      })
    })
  } catch (error: unknown) {
    console.error('Admin consumables fetch error:', error)

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

export async function PUT(request: NextRequest) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_CONSUMABLES, async (authContext) => {
      const body = await request.json()
      const { action, stock_id, quantity, notes, invoice_number, supplier_name, purchase_date } = body

      if (!action || !stock_id) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'Action and stock_id are required',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }

      // Get current stock information
      const currentStock = await consumableStockOperations.getById(stock_id)
      if (!currentStock) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.NOT_FOUND,
              message: 'Stock item not found',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 404 }
        )
      }

      let updatedStock
      let auditAction = ''
      let auditValues: Record<string, unknown> = {}

      switch (action) {
        case 'adjust_stock':
          if (typeof quantity !== 'number') {
            return NextResponse.json(
              {
                error: {
                  code: ERROR_CODES.VALIDATION_ERROR,
                  message: 'Quantity is required for stock adjustment',
                  timestamp: new Date().toISOString(),
                },
              },
              { status: 400 }
            )
          }

          // Validate invoice number for positive adjustments (stock increases)
          if (quantity > 0 && !invoice_number) {
            return NextResponse.json(
              {
                error: {
                  code: ERROR_CODES.VALIDATION_ERROR,
                  message: 'Invoice number is required when adding stock',
                  timestamp: new Date().toISOString(),
                },
              },
              { status: 400 }
            )
          }

          updatedStock = await consumableStockOperations.adjustStock(stock_id, quantity)
          auditAction = 'stock_adjustment'
          auditValues = {
            old_quantity: currentStock.current_quantity,
            new_quantity: updatedStock.current_quantity,
            adjustment: quantity,
            notes,
            invoice_number,
            supplier_name,
            purchase_date,
          }
          break

        case 'set_stock':
          if (typeof quantity !== 'number' || quantity < 0) {
            return NextResponse.json(
              {
                error: {
                  code: ERROR_CODES.VALIDATION_ERROR,
                  message: 'Valid quantity is required for setting stock',
                  timestamp: new Date().toISOString(),
                },
              },
              { status: 400 }
            )
          }

          updatedStock = await consumableStockOperations.updateQuantity(stock_id, quantity)
          auditAction = 'stock_set'
          auditValues = {
            old_quantity: currentStock.current_quantity,
            new_quantity: quantity,
            notes,
          }
          break

        case 'restock':
          if (typeof quantity !== 'number' || quantity <= 0) {
            return NextResponse.json(
              {
                error: {
                  code: ERROR_CODES.VALIDATION_ERROR,
                  message: 'Positive quantity is required for restocking',
                  timestamp: new Date().toISOString(),
                },
              },
              { status: 400 }
            )
          }

          // Validate invoice number for restock (always required)
          if (!invoice_number) {
            return NextResponse.json(
              {
                error: {
                  code: ERROR_CODES.VALIDATION_ERROR,
                  message: 'Invoice number is required for restocking',
                  timestamp: new Date().toISOString(),
                },
              },
              { status: 400 }
            )
          }

          updatedStock = await consumableStockOperations.adjustStock(stock_id, quantity)
          auditAction = 'stock_restock'
          auditValues = {
            old_quantity: currentStock.current_quantity,
            new_quantity: updatedStock.current_quantity,
            restock_amount: quantity,
            notes,
            invoice_number,
            supplier_name,
            purchase_date,
          }
          break

        default:
          return NextResponse.json(
            {
              error: {
                code: ERROR_CODES.VALIDATION_ERROR,
                message: 'Invalid action. Supported actions: adjust_stock, set_stock, restock',
                timestamp: new Date().toISOString(),
              },
            },
            { status: 400 }
          )
      }

      // Create audit log
      try {
        await auditLogOperations.create({
          user_id: authContext.user.id,
          action: auditAction,
          entity_type: 'consumable_stock',
          entity_id: stock_id,
          old_values: { current_quantity: currentStock.current_quantity },
          new_values: auditValues,
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown',
        })
      } catch (auditError) {
        console.error('Failed to create audit log:', auditError)
      }

      return NextResponse.json({
        data: updatedStock,
        message: SUCCESS_MESSAGES.STOCK_ADJUSTED,
      })
    })
  } catch (error: unknown) {
    console.error('Stock management error:', error)

    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: error.message,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      )
    }

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