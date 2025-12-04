import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import { supabase } from '@/lib/supabase'
import { auditLogOperations, notificationOperations } from '@/lib/supabase-client'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'
import { isCableUnit } from '@/utils/cableDetection'
import { calculateLength } from '@/utils/markerValidation'
import { validateSegmentReturn } from '@/utils/segmentOverlap'

interface ReturnItem {
  item_type_id: number
  returned_quantity: number
  consumption_date: string
  notes?: string
  // Cable segment fields (optional)
  segment_start?: number
  segment_end?: number
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
        if (!returnItem.item_type_id || !returnItem.consumption_date) {
          validationErrors.push(`Missing required fields for item_type_id: ${returnItem.item_type_id}`)
          continue
        }

        // Get consumption history for this item on this date
        const { data: movements, error: movementsError } = await supabase
          .from('stock_movements')
          .select(`
            consumable_stock_id,
            quantity,
            start_marker,
            end_marker,
            consumable_stock!inner(item_type_id, unit_of_measure)
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
        const unitOfMeasure = (movements[0].consumable_stock as any).unit_of_measure
        const isCable = isCableUnit(unitOfMeasure)
        
        // Get consumed markers if this is a cable consumption
        const consumedStartMarker = movements[0].start_marker
        const consumedEndMarker = movements[0].end_marker

        // Validate cable segment inputs
        let returnedQuantity = returnItem.returned_quantity
        let segmentStart: number | null = null
        let segmentEnd: number | null = null

        if (isCable && (returnItem.segment_start !== undefined || returnItem.segment_end !== undefined)) {
          // Cable return with segment markers
          if (returnItem.segment_start === undefined || returnItem.segment_end === undefined) {
            validationErrors.push(
              `Both segment_start and segment_end are required for cable returns (item_type_id: ${returnItem.item_type_id})`
            )
            continue
          }

          segmentStart = returnItem.segment_start
          segmentEnd = returnItem.segment_end

          // Validate segment markers
          if (segmentEnd <= segmentStart) {
            validationErrors.push(
              `Invalid segment for item_type_id ${returnItem.item_type_id}: segment_end (${segmentEnd}) must be greater than segment_start (${segmentStart})`
            )
            continue
          }

          // Calculate returned quantity from segment
          returnedQuantity = calculateLength(segmentStart, segmentEnd, 2)

          // Validate segment is within consumed range (if markers exist)
          if (consumedStartMarker !== null && consumedEndMarker !== null) {
            if (segmentStart < consumedStartMarker || segmentEnd > consumedEndMarker) {
              validationErrors.push(
                `Segment [${segmentStart}-${segmentEnd}] is outside consumed range [${consumedStartMarker}-${consumedEndMarker}] for item_type_id ${returnItem.item_type_id}`
              )
              continue
            }
          }

          // Check for overlapping segments in existing returns
          const { data: existingReturns, error: returnsError } = await supabase
            .from('consumable_returns')
            .select('segment_start, segment_end, return_date')
            .eq('user_id', authContext.user.id)
            .eq('item_type_id', returnItem.item_type_id)
            .eq('original_consumption_date', returnItem.consumption_date)
            .eq('status', 'completed')
            .not('segment_start', 'is', null)
            .not('segment_end', 'is', null)

          if (returnsError) {
            validationErrors.push(`Error checking returns for item_type_id ${returnItem.item_type_id}`)
            continue
          }

          // Validate no overlap with existing segments
          const overlapValidation = validateSegmentReturn(
            segmentStart,
            segmentEnd,
            existingReturns || []
          )

          if (!overlapValidation.isValid) {
            validationErrors.push(
              `Overlapping segment detected for item_type_id ${returnItem.item_type_id}: ${overlapValidation.message}`
            )
            continue
          }
        } else {
          // Standard quantity-based return (non-cable or legacy)
          if (!returnItem.returned_quantity || returnItem.returned_quantity <= 0) {
            validationErrors.push(
              `Invalid quantity for item_type_id ${returnItem.item_type_id}: must be greater than 0`
            )
            continue
          }
        }

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

        const alreadyReturnedQuantity = existingReturns?.reduce((sum, r) => sum + r.returned_quantity, 0) || 0
        const returnableQuantity = consumedQuantity - alreadyReturnedQuantity

        const consumption = {
          consumable_stock_id: consumableStockId,
          consumed_quantity: consumedQuantity,
          returned_quantity: alreadyReturnedQuantity
        }

        if (returnedQuantity > returnableQuantity) {
          validationErrors.push(
            `Cannot return ${returnedQuantity} of item_type_id ${returnItem.item_type_id}. ` +
            `Maximum returnable: ${returnableQuantity.toFixed(2)} (consumed: ${consumption.consumed_quantity}, ` +
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
          returned_quantity: returnedQuantity,
          original_consumption_date: returnItem.consumption_date,
          notes: returnItem.notes || null,
          status: 'completed',
          segment_start: segmentStart,
          segment_end: segmentEnd,
        })

        stockUpdates.push({
          stock_id: stock.id,
          item_type_id: stock.item_type_id,
          old_quantity: stock.current_quantity,
          new_quantity: stock.current_quantity + returnedQuantity,
          adjustment: returnedQuantity,
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
          const insertData: any = {
            user_id: returnData.user_id,
            item_type_id: returnData.item_type_id,
            consumable_stock_id: returnData.consumable_stock_id,
            returned_quantity: returnData.returned_quantity,
            original_consumption_date: returnData.original_consumption_date,
            notes: returnData.notes,
            status: returnData.status,
          }

          // Add segment fields if present
          if (returnData.segment_start !== null && returnData.segment_end !== null) {
            insertData.segment_start = returnData.segment_start
            insertData.segment_end = returnData.segment_end
          }

          let returnRecord: any = null
          const { data, error: insertError } = await supabase
            .from('consumable_returns')
            .insert(insertData)
            .select()
            .single()

          // If segment columns don't exist, retry without them
          if (insertError && insertError.code === '42703' && returnData.segment_start !== null) {
            const basicInsertData = {
              user_id: returnData.user_id,
              item_type_id: returnData.item_type_id,
              consumable_stock_id: returnData.consumable_stock_id,
              returned_quantity: returnData.returned_quantity,
              original_consumption_date: returnData.original_consumption_date,
              notes: returnData.notes ? `${returnData.notes} (segment: ${returnData.segment_start}-${returnData.segment_end})` : `Segment: ${returnData.segment_start}-${returnData.segment_end}`,
              status: returnData.status,
            }
            const { data: fallbackData, error: fallbackError } = await supabase
              .from('consumable_returns')
              .insert(basicInsertData)
              .select()
              .single()
            
            if (fallbackError) throw fallbackError
            returnRecord = fallbackData
          } else if (insertError) {
            throw insertError
          } else {
            returnRecord = data
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
