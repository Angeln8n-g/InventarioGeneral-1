import { NextRequest, NextResponse } from 'next/server'
import {
  consumableRequestOperations,
  consumableStockOperations,
  auditLogOperations,
  notificationOperations
} from '@/lib/supabase-client'
import { supabase } from '@/lib/supabase'
import { withAuth } from '@/lib/auth-middleware'
import { createConsumableRequestSchema } from '@/utils/validation'
import { validateConsumableRequest } from '@/utils/validation'
import { ERROR_CODES, ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/utils/constants'

export async function POST(request: NextRequest) {
  try {
    return await withAuth(request, async (authContext) => {
      const body = await request.json()

      // Validate input
      const validatedData = createConsumableRequestSchema.validateSync({
        ...body,
        user_id: authContext.user.id, // Always use authenticated user's ID
      })

      // Get current stock information
      const stock = await consumableStockOperations.getByItemTypeId(validatedData.item_type_id)

      if (!stock) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.NOT_FOUND,
              message: 'Consumable item not found or not in stock',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 404 }
        )
      }

      // Validate the request against available stock
      const validation = validateConsumableRequest(
        validatedData.requested_quantity,
        stock.current_quantity
      )

      if (!validation.isValid) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: validation.reason,
              details: {
                requested_quantity: validatedData.requested_quantity,
                available_quantity: stock.current_quantity,
              },
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }

      try {
        // Create the consumable request
        const consumableRequest = await consumableRequestOperations.create({
          user_id: authContext.user.id,
          item_type_id: validatedData.item_type_id,
          requested_quantity: validatedData.requested_quantity,
          notes: validatedData.notes,
        })

        // If we can fulfill the request immediately, do so
        if (validation.canFulfill) {
          // Update stock quantity
          await consumableStockOperations.adjustStock(stock.id, -validatedData.requested_quantity)

          // Create stock movement record for consumption
          try {
            const { error: movementError } = await supabase
              .from('stock_movements')
              .insert({
                consumable_stock_id: stock.id,
                movement_type: 'consumption',
                quantity: -validatedData.requested_quantity,
                user_id: authContext.user.id,
                notes: `Consumable request fulfilled - Request ID: ${consumableRequest.id}`,
              })

            if (movementError) {
              console.error('Failed to create stock movement:', movementError)
            }
          } catch (movementError) {
            console.error('Failed to create stock movement:', movementError)
          }

          // Update request status to fulfilled
          const fulfilledRequest = await consumableRequestOperations.fulfill(
            consumableRequest.id,
            validatedData.requested_quantity
          )

          // Create audit log for stock adjustment
          try {
            await auditLogOperations.create({
              user_id: authContext.user.id,
              action: 'stock_adjustment',
              entity_type: 'consumable_stock',
              entity_id: stock.id,
              old_values: { current_quantity: stock.current_quantity },
              new_values: {
                current_quantity: stock.current_quantity - validatedData.requested_quantity,
                adjustment: -validatedData.requested_quantity,
                reason: 'consumable_request_fulfilled',
              },
              ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
              user_agent: request.headers.get('user-agent') || 'unknown',
            })
          } catch (auditError) {
            console.error('Failed to create audit log:', auditError)
          }

          // Create notification for fulfillment
          try {
            await notificationOperations.create({
              user_id: authContext.user.id,
              type: 'consumable_fulfilled',
              title: 'Request Fulfilled',
              message: `Your request for ${validatedData.requested_quantity} ${stock.item_type?.name || 'items'} has been fulfilled.`,
            })
          } catch (notificationError) {
            console.error('Failed to create notification:', notificationError)
          }

          return NextResponse.json({
            data: fulfilledRequest,
            message: 'Request created and fulfilled successfully',
            fulfilled: true,
          }, { status: 201 })
        } else {
          // Create backorder notification
          try {
            await notificationOperations.create({
              user_id: authContext.user.id,
              type: 'consumable_backorder',
              title: 'Request Created - Backorder',
              message: `Your request for ${validatedData.requested_quantity} ${stock.item_type?.name || 'items'} has been created as a backorder. You will be notified when stock is available.`,
            })
          } catch (notificationError) {
            console.error('Failed to create notification:', notificationError)
          }

          return NextResponse.json({
            data: consumableRequest,
            message: 'Request created successfully - added to backorder queue',
            fulfilled: false,
          }, { status: 201 })
        }

      } catch (error: unknown) {
        console.error('Consumable request transaction error:', error)

        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.DATABASE_ERROR,
              message: 'Failed to create consumable request. Please try again.',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 500 }
        )
      }
    })
  } catch (error: unknown) {
    console.error('Consumable request error:', error)

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

export async function GET(request: NextRequest) {
  try {
    return await withAuth(request, async (authContext) => {
      const { searchParams } = new URL(request.url)

      // Build filters from query parameters
      const filters: Record<string, unknown> = {}

      // Regular users can only see their own requests
      if (authContext.user.role !== 'admin') {
        filters.user_id = authContext.user.id
      } else {
        // Admins can filter by user_id if specified
        const userId = searchParams.get('user_id')
        if (userId) {
          const parsed = parseInt(userId, 10)
          if (!isNaN(parsed)) {
            filters.user_id = parsed
          }
        }
      }

      const status = searchParams.get('status')
      if (status) {
        filters.status = status
      }

      const itemTypeId = searchParams.get('item_type_id')
      if (itemTypeId) {
        const parsed = parseInt(itemTypeId, 10)
        if (!isNaN(parsed)) {
          filters.item_type_id = parsed
        }
      }

      // Get requests with filters
      const requests = await consumableRequestOperations.getAll(filters)

      return NextResponse.json({
        data: requests,
        total: requests.length,
        filters: filters,
      })
    })
  } catch (error: unknown) {
    console.error('Consumable requests fetch error:', error)

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