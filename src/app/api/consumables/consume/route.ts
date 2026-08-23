import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { withAuth } from '@/lib/auth-middleware'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'
import { ConsumeConsumableSchema, validateRequestBody } from '@/lib/validation/schemas'

export async function POST(request: NextRequest) {
  try {
    return await withAuth(request, async (authContext) => {
      // 1. Zod Schema Validation
      const validation = await validateRequestBody(ConsumeConsumableSchema, request)
      if (!validation.success) {
        return validation.response
      }

      const { qr_code, quantity, notes, start_marker, end_marker } = validation.data

      // Calculate quantity if marker range is provided
      const actualQuantity = (start_marker !== undefined && end_marker !== undefined)
        ? Math.round((end_marker - start_marker) * 100) / 100
        : (quantity || 0)

      // 2. Fetch stock ID by QR code
      const { data: stock, error: stockError } = await supabase
        .from('consumable_stock')
        .select(`
          *,
          item_type:item_types(*)
        `)
        .eq('qr_code', qr_code)
        .single()

      if (stockError || !stock) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.NOT_FOUND,
              message: 'Consumable not found',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 404 }
        )
      }

      // 3. Try Atomic Execution via PostgreSQL RPC
      try {
        const { data: rpcResult, error: rpcError } = await supabase.rpc('consume_consumable_atomic', {
          p_stock_id: stock.id,
          p_user_id: authContext.user.id,
          p_quantity: actualQuantity,
          p_notes: notes || `Consumed via QR scan`,
          p_start_marker: start_marker ?? null,
          p_end_marker: end_marker ?? null,
        })

        if (!rpcError && rpcResult) {
          if (!rpcResult.success) {
            return NextResponse.json(
              {
                error: {
                  code: rpcResult.error_code || ERROR_CODES.VALIDATION_ERROR,
                  message: rpcResult.message || 'Consumption failed',
                  details: rpcResult,
                  timestamp: new Date().toISOString(),
                },
              },
              { status: 400 }
            )
          }

          const responseData: Record<string, unknown> = {
            item_type: stock.item_type,
            previous_quantity: rpcResult.previous_quantity,
            consumed_quantity: rpcResult.consumed_quantity,
            remaining_quantity: rpcResult.remaining_quantity,
            unit_of_measure: rpcResult.unit_of_measure,
            is_low_stock: rpcResult.is_low_stock,
          }

          if (start_marker !== undefined && end_marker !== undefined) {
            responseData.start_marker = start_marker
            responseData.end_marker = end_marker
          }

          return NextResponse.json({
            data: responseData,
            message: `Successfully consumed ${actualQuantity} ${stock.unit_of_measure || 'units'} of ${stock.item_type?.name || 'item'}`,
          })
        }
      } catch (rpcExecutionErr) {
        console.warn('RPC execution unavailable, falling back to client-side transaction logic:', rpcExecutionErr)
      }

      // 4. Graceful Fallback (if RPC is not yet executed in database)
      if (stock.current_quantity < actualQuantity) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: `Insufficient stock. Available: ${stock.current_quantity}, Requested: ${actualQuantity}`,
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }

      const newQuantity = stock.current_quantity - actualQuantity
      const { error: updateError } = await supabase
        .from('consumable_stock')
        .update({ 
          current_quantity: newQuantity,
          updated_at: new Date().toISOString(),
          version: (stock.version || 1) + 1,
        })
        .eq('id', stock.id)

      if (updateError) {
        console.error('Failed to update stock:', updateError)
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.DATABASE_ERROR,
              message: 'Failed to update stock',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 500 }
        )
      }

      const movementData: Record<string, unknown> = {
        consumable_stock_id: stock.id,
        movement_type: 'consumption',
        quantity: -actualQuantity,
        user_id: authContext.user.id,
        notes: notes || `Consumed via QR scan`,
      }
      if (start_marker !== undefined && end_marker !== undefined) {
        movementData.start_marker = start_marker
        movementData.end_marker = end_marker
      }
      await supabase.from('stock_movements').insert(movementData)

      const responseData: Record<string, unknown> = {
        item_type: stock.item_type,
        previous_quantity: stock.current_quantity,
        consumed_quantity: actualQuantity,
        remaining_quantity: newQuantity,
        unit_of_measure: stock.unit_of_measure,
        is_low_stock: newQuantity <= stock.minimum_threshold,
      }

      if (start_marker !== undefined && end_marker !== undefined) {
        responseData.start_marker = start_marker
        responseData.end_marker = end_marker
      }

      return NextResponse.json({
        data: responseData,
        message: `Successfully consumed ${actualQuantity} ${stock.unit_of_measure || 'units'} of ${stock.item_type?.name || 'item'}`,
      })
    })
  } catch (error: unknown) {
    console.error('Consume error:', error)

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
