import { NextRequest, NextResponse } from 'next/server'
import { 
  consumableRequestOperations, 
  consumableStockOperations,
  auditLogOperations,
  notificationOperations 
} from '@/lib/supabase-client'
import { withPermission } from '@/lib/auth-middleware'
import { PERMISSIONS } from '@/lib/permissions'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'
import type { ConsumableRequest, ItemType } from '@/types/database'

interface GroupedBackorder {
  item_type?: ItemType
  requests: ConsumableRequest[]
  total_requested: number
}

export async function GET(request: NextRequest) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_CONSUMABLES, async (_authContext) => {
      const { searchParams } = new URL(request.url)
      
      // Get query parameters
      const itemTypeId = searchParams.get('item_type_id')
      const filters: { status: string; item_type_id?: number } = { status: 'pending' }
      
      if (itemTypeId) {
        const parsed = parseInt(itemTypeId, 10)
        if (!isNaN(parsed)) {
          filters.item_type_id = parsed
        }
      }

      // Get all pending requests (backorders)
      const backorders = await consumableRequestOperations.getAll(filters)

      // Group by item type for easier processing
      const groupedBackorders = backorders.reduce((acc, request) => {
        const itemTypeId = request.item_type_id
        if (!acc[itemTypeId]) {
          acc[itemTypeId] = {
            item_type: request.item_type,
            requests: [],
            total_requested: 0,
          }
        }
        acc[itemTypeId].requests.push(request)
        acc[itemTypeId].total_requested += request.requested_quantity
        return acc
      }, {} as Record<number, GroupedBackorder>)

      return NextResponse.json({
        data: backorders,
        grouped: groupedBackorders,
        total: backorders.length,
        summary: {
          total_backorders: backorders.length,
          unique_items: Object.keys(groupedBackorders).length,
          total_quantity_requested: backorders.reduce((sum, req) => sum + req.requested_quantity, 0),
        },
      })
    })
  } catch (error: unknown) {
    console.error('Backorders fetch error:', error)

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

export async function POST(request: NextRequest) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_CONSUMABLES, async (authContext) => {
      const body = await request.json()
      const { action, item_type_id, new_stock_quantity } = body

      if (action !== 'process_backorders' || !item_type_id || typeof new_stock_quantity !== 'number') {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'Invalid request. Required: action="process_backorders", item_type_id, new_stock_quantity',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }

      // Get current stock
      const stock = await consumableStockOperations.getByItemTypeId(item_type_id)
      if (!stock) {
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

      // Update stock quantity
      const _updatedStock = await consumableStockOperations.updateQuantity(stock.id, new_stock_quantity)

      // Get pending requests for this item type, ordered by request date (FIFO)
      const pendingRequests = await consumableRequestOperations.getAll({
        item_type_id,
        status: 'pending'
      })

      // Sort by request date (oldest first)
      pendingRequests.sort((a, b) => new Date(a.request_date).getTime() - new Date(b.request_date).getTime())

      let availableQuantity = new_stock_quantity
      const processedRequests: ConsumableRequest[] = []
      const notifications: Array<{ user_id: number; type: string; title: string; message: string }> = []

      // Process requests in FIFO order
      for (const request of pendingRequests) {
        if (availableQuantity <= 0) break

        const canFulfill = Math.min(request.requested_quantity, availableQuantity)
        
        if (canFulfill > 0) {
          // Update the request
          const status = canFulfill === request.requested_quantity ? 'fulfilled' : 'partial'
          const updatedRequest = await consumableRequestOperations.update(request.id, {
            fulfilled_quantity: canFulfill,
            status: status as ConsumableRequest['status'],
            fulfilled_date: new Date().toISOString(),
          })

          processedRequests.push(updatedRequest)

          availableQuantity -= canFulfill

          // Create notification for user
          notifications.push({
            user_id: request.user_id,
            type: status === 'fulfilled' ? 'backorder_fulfilled' : 'backorder_partial',
            title: status === 'fulfilled' ? 'Backorder Fulfilled' : 'Backorder Partially Fulfilled',
            message: `Your request for ${request.item_type?.name} has been ${status === 'fulfilled' ? 'fully' : 'partially'} fulfilled. Quantity: ${canFulfill}${status === 'partial' ? ` of ${request.requested_quantity}` : ''}.`,
          })
        }
      }

      // Update final stock quantity after fulfillments
      if (availableQuantity !== new_stock_quantity) {
        await consumableStockOperations.updateQuantity(stock.id, availableQuantity)
      }

      // Send notifications
      for (const notification of notifications) {
        try {
          await notificationOperations.create(notification)
        } catch (notificationError) {
          console.error('Failed to create notification:', notificationError)
        }
      }

      // Create audit log
      try {
        await auditLogOperations.create({
          user_id: authContext.user.id,
          action: 'backorder_processing',
          entity_type: 'consumable_stock',
          entity_id: stock.id,
          old_values: { 
            current_quantity: stock.current_quantity,
            pending_requests: pendingRequests.length,
          },
          new_values: {
            new_stock_quantity,
            final_quantity: availableQuantity,
            processed_requests: processedRequests.length,
            total_fulfilled: new_stock_quantity - availableQuantity,
          },
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown',
        })
      } catch (auditError) {
        console.error('Failed to create audit log:', auditError)
      }

      return NextResponse.json({
        message: 'Backorders processed successfully',
        data: {
          updated_stock: await consumableStockOperations.getById(stock.id),
          processed_requests: processedRequests,
          notifications_sent: notifications.length,
        },
        summary: {
          initial_stock: new_stock_quantity,
          final_stock: availableQuantity,
          requests_processed: processedRequests.length,
          total_fulfilled: new_stock_quantity - availableQuantity,
        },
      })
    })
  } catch (error: unknown) {
    console.error('Backorder processing error:', error)

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