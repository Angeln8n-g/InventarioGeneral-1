import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import { supabase } from '@/lib/supabase'
import { auditLogOperations, notificationOperations } from '@/lib/supabase-client'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'

interface ReturnItem {
  item_type_id: number
  returned_quantity: number
  consumption_date: string
  notes?: string
}

export async function POST(request: NextRequest) {
  try {
    return await withAuth(request, async (authContext) => {
      const body = await request.json()
      const { returns } = body as { returns: ReturnItem[] }

      if (!returns || !Array.isArray(returns) || returns.length === 0) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'Returns array is required and must not be empty',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }

      // Validate all returns before processing
      const validationErrors: string[] = []
      const processedReturns: any[] = []
      const stockUpdates: any[] = []

      for (const returnItem of returns) {
        // Validate required fields
        if (!returnItem.item_type_id || !returnItem.returned_quantity || !returnItem.consumption_date) {
          validationErrors.push(`Missing required fields for item_type_id: ${returnItem.item_type_id}`)
          continue
        }

        if (returnItem.returned_quantity <= 0) {
          validationErrors.push(`Invalid quantity for item_type_id ${returnItem.item_type_id}: must be greater than 0`)
          continue
        }

        // Get consumption history for this item on this date
        const { data: movements, error: movementsError } = await supabase
          .from('stock_movements')
          .select(`
            consumable_stock_id,
            quantity,
            consumable_stock!inner(item_type_id)
          `)
          .eq('user_id', authContext.user.id)
          .eq('consumable_stock.item_type_id', returnItem.item_type_id)
          .gte('created_at', returnItem.consumption_date + 'T00:00:00')
          .lte('created_at', returnItem.consumption_date + 'T23:59:59')
          .eq('movement_type', 'consumption')
          .lt('quantity', 0)

        if (movementsError || !movements || movements.length === 0) {
          validationErrors.push(
            `No consumption found for item_type_id ${returnItem.item_type_id} on ${returnItem.consumption_date}`
          )
          continue
        }

        // Calculate total consumed
        const consumedQuantity = movements.reduce((sum, m) => sum + Math.abs(m.quantity), 0)
        const consumableStockId = movements[0].consumable_stock_id

        // Get already returned quantity
        const { data: existingReturns, error: returnsError } = await supabase
          .from('consumable_returns')
          .select('returned_quantity')
          .eq('user_id', authContext.user.id)
          .eq('item_type_id', returnItem.item_type_id)
          .eq('original_consumption_date', returnItem.consumption_date)
          .eq('status', 'completed')

        if (returnsError) {
          validationErrors.push(`Error checking returns for item_type_id ${returnItem.item_type_id}`)
          continue
        }

        const returnedQuantity = existingReturns?.reduce((sum, r) => sum + r.returned_quantity, 0) || 0
        const returnableQuantity = consumedQuantity - returnedQuantity

        const consumption = {
          consumable_stock_id: consumableStockId,
          consumed_quantity: consumedQuantity,
          returned_quantity: returnedQuantity
        }

        if (returnItem.returned_quantity > returnableQuantity) {
          validationErrors.push(
            `Cannot return ${returnItem.returned_quantity} of item_type_id ${returnItem.item_type_id}. ` +
            `Maximum returnable: ${returnableQuantity} (consumed: ${consumption.consumed_quantity}, ` +
            `already returned: ${consumption.returned_quantity})`
          )
          continue
        }

        // Get stock information
        const { data: stock, error: stockError } = await supabase
          .from('consumable_stock')
          .select('id, current_quantity, item_type_id')
          .eq('item_type_id', returnItem.item_type_id)
          .eq('id', consumption.consumable_stock_id)
          .single()

        if (stockError || !stock) {
          validationErrors.push(`Stock not found for item_type_id ${returnItem.item_type_id}`)
          continue
        }

        // Store for processing
        processedReturns.push({
          user_id: authContext.user.id,
          item_type_id: returnItem.item_type_id,
          consumable_stock_id: consumption.consumable_stock_id,
          returned_quantity: returnItem.returned_quantity,
          original_consumption_date: returnItem.consumption_date,
          notes: returnItem.notes || null,
          status: 'completed',
        })

        stockUpdates.push({
          stock_id: stock.id,
          item_type_id: stock.item_type_id,
          old_quantity: stock.current_quantity,
          new_quantity: stock.current_quantity + returnItem.returned_quantity,
          adjustment: returnItem.returned_quantity,
        })
      }

      if (validationErrors.length > 0) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'Validation failed for one or more returns',
              details: validationErrors,
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }

      // Process all returns in a transaction
      try {
        const createdReturns: any[] = []

        // Insert returns
        for (const returnData of processedReturns) {
          const { data: returnRecord, error: insertError } = await supabase
            .from('consumable_returns')
            .insert({
              user_id: returnData.user_id,
              item_type_id: returnData.item_type_id,
              consumable_stock_id: returnData.consumable_stock_id,
              returned_quantity: returnData.returned_quantity,
              original_consumption_date: returnData.original_consumption_date,
              notes: returnData.notes,
              status: returnData.status,
            })
            .select()
            .single()

          if (insertError) {
            throw insertError
          }

          createdReturns.push(returnRecord)
        }

        // Update stock quantities
        for (const stockUpdate of stockUpdates) {
          const { error: updateError } = await supabase
            .from('consumable_stock')
            .update({ current_quantity: stockUpdate.new_quantity })
            .eq('id', stockUpdate.stock_id)

          if (updateError) {
            throw updateError
          }

          // Create stock movement record
          const { error: movementError } = await supabase
            .from('stock_movements')
            .insert({
              consumable_stock_id: stockUpdate.stock_id,
              movement_type: 'return',
              quantity: stockUpdate.adjustment,
              user_id: authContext.user.id,
              notes: 'Consumable return',
            })

          if (movementError) {
            throw movementError
          }

          // Create audit log
          try {
            await auditLogOperations.create({
              user_id: authContext.user.id,
              action: 'consumable_return',
              entity_type: 'consumable_stock',
              entity_id: stockUpdate.stock_id,
              old_values: { current_quantity: stockUpdate.old_quantity },
              new_values: {
                current_quantity: stockUpdate.new_quantity,
                adjustment: stockUpdate.adjustment,
              },
              ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
              user_agent: request.headers.get('user-agent') || 'unknown',
            })
          } catch (auditError) {
            console.error('Failed to create audit log:', auditError)
          }
        }

        // Create notification
        try {
          await notificationOperations.create({
            user_id: authContext.user.id,
            type: 'consumable_return',
            title: 'Devolución Procesada',
            message: `Has devuelto ${processedReturns.length} tipo(s) de consumibles exitosamente.`,
          })
        } catch (notificationError) {
          console.error('Failed to create notification:', notificationError)
        }

        return NextResponse.json({
          data: {
            returns: createdReturns,
            stock_updated: stockUpdates,
          },
          message: 'Returns processed successfully',
          total_returned: processedReturns.length,
        }, { status: 201 })

      } catch (error: unknown) {
        console.error('Return processing error:', error)
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.DATABASE_ERROR,
              message: 'Failed to process returns. Please try again.',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 500 }
        )
      }
    })
  } catch (error: unknown) {
    console.error('Return endpoint error:', error)

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

// Get return history
export async function GET(request: NextRequest) {
  try {
    return await withAuth(request, async (authContext) => {
      const { searchParams } = new URL(request.url)
      
      let query = supabase
        .from('consumable_returns')
        .select(`
          *,
          item_type:item_types(name, description),
          consumable_stock:consumable_stock(unit_of_measure)
        `)
        .eq('user_id', authContext.user.id)

      const status = searchParams.get('status')
      if (status) {
        query = query.eq('status', status)
      }

      const { data: returns, error: returnsError } = await query.order('return_date', { ascending: false })

      if (returnsError) {
        throw returnsError
      }

      // Format the response
      const formattedReturns = returns?.map((r: any) => ({
        ...r,
        item_name: r.item_type?.name,
        item_description: r.item_type?.description,
        unit_of_measure: r.consumable_stock?.unit_of_measure,
      }))

      return NextResponse.json({
        data: formattedReturns || [],
        total: formattedReturns?.length || 0,
      })
    })
  } catch (error: unknown) {
    console.error('Return history fetch error:', error)

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
