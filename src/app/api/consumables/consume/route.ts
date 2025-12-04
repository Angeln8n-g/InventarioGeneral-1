import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { auditLogOperations } from '@/lib/supabase-client'
import { withAuth } from '@/lib/auth-middleware'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'

export async function POST(request: NextRequest) {
  try {
    return await withAuth(request, async (authContext) => {
      const body = await request.json()
      const { qr_code, quantity, notes, start_marker, end_marker } = body

      if (!qr_code || typeof qr_code !== 'string') {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'QR code is required',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }

      // Validate markers if provided
      if (start_marker !== undefined || end_marker !== undefined) {
        // Both markers must be provided together
        if (start_marker === undefined || end_marker === undefined) {
          return NextResponse.json(
            {
              error: {
                code: ERROR_CODES.VALIDATION_ERROR,
                message: 'Both start_marker and end_marker must be provided together',
                timestamp: new Date().toISOString(),
              },
            },
            { status: 400 }
          )
        }

        // Validate marker types
        if (typeof start_marker !== 'number' || typeof end_marker !== 'number') {
          return NextResponse.json(
            {
              error: {
                code: ERROR_CODES.VALIDATION_ERROR,
                message: 'Markers must be numbers',
                timestamp: new Date().toISOString(),
              },
            },
            { status: 400 }
          )
        }

        // Validate marker values
        if (start_marker < 0 || end_marker < 0) {
          return NextResponse.json(
            {
              error: {
                code: ERROR_CODES.VALIDATION_ERROR,
                message: 'Markers must be positive numbers',
                timestamp: new Date().toISOString(),
              },
            },
            { status: 400 }
          )
        }

        if (end_marker <= start_marker) {
          return NextResponse.json(
            {
              error: {
                code: ERROR_CODES.VALIDATION_ERROR,
                message: 'End marker must be greater than start marker',
                timestamp: new Date().toISOString(),
              },
            },
            { status: 400 }
          )
        }
      }

      // Validate quantity (required if no markers provided)
      if (start_marker === undefined && (!quantity || typeof quantity !== 'number' || quantity <= 0)) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'Valid quantity is required when markers are not provided',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }

      // Calculate quantity from markers if provided
      const actualQuantity = start_marker !== undefined && end_marker !== undefined
        ? Math.round((end_marker - start_marker) * 100) / 100
        : quantity

      // Get consumable stock by QR code
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

      // Check if enough stock is available
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

      // Update stock quantity
      const newQuantity = stock.current_quantity - actualQuantity
      const { error: updateError } = await supabase
        .from('consumable_stock')
        .update({ 
          current_quantity: newQuantity,
          updated_at: new Date().toISOString(),
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

      // Create stock movement record
      try {
        const movementData: Record<string, unknown> = {
          consumable_stock_id: stock.id,
          movement_type: 'consumption',
          quantity: -actualQuantity, // Negative for consumption
          user_id: authContext.user.id,
          notes: notes || `Consumed via QR scan`,
        }

        // Add markers if provided
        if (start_marker !== undefined && end_marker !== undefined) {
          movementData.start_marker = start_marker
          movementData.end_marker = end_marker
        }

        const { error: insertError } = await supabase
          .from('stock_movements')
          .insert(movementData)

        // If marker columns don't exist, retry without them
        if (insertError && insertError.code === '42703' && start_marker !== undefined) {
          const basicMovementData = {
            consumable_stock_id: stock.id,
            movement_type: 'consumption',
            quantity: -actualQuantity,
            user_id: authContext.user.id,
            notes: notes || `Consumed via QR scan (markers: ${start_marker}-${end_marker})`,
          }
          await supabase.from('stock_movements').insert(basicMovementData)
        } else if (insertError) {
          throw insertError
        }
      } catch (movementError) {
        console.error('Failed to create stock movement:', movementError)
      }

      // Create audit log
      try {
        const auditNewValues: Record<string, unknown> = {
          current_quantity: newQuantity,
          quantity_consumed: actualQuantity,
        }

        // Add markers to audit log if provided
        if (start_marker !== undefined && end_marker !== undefined) {
          auditNewValues.start_marker = start_marker
          auditNewValues.end_marker = end_marker
        }

        await auditLogOperations.create({
          user_id: authContext.user.id,
          action: 'consumable_consume',
          entity_type: 'consumable_stock',
          entity_id: stock.id,
          old_values: { current_quantity: stock.current_quantity },
          new_values: auditNewValues,
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown',
        })
      } catch (auditError) {
        console.error('Failed to create audit log:', auditError)
      }

      // Check if stock is low and create notification
      if (newQuantity <= stock.minimum_threshold && newQuantity > 0) {
        try {
          // Get all admin users
          const { data: admins } = await supabase
            .from('users')
            .select('id')
            .eq('role', 'admin')

          if (admins && admins.length > 0) {
            const notifications = admins.map(admin => ({
              user_id: admin.id,
              type: 'low_stock',
              title: 'Low Stock Alert',
              message: `${stock.item_type.name} is running low. Current stock: ${newQuantity} ${stock.unit_of_measure || 'units'}`,
            }))

            await supabase
              .from('notifications')
              .insert(notifications)
          }
        } catch (notificationError) {
          console.error('Failed to create notifications:', notificationError)
        }
      }

      const responseData: Record<string, unknown> = {
        item_type: stock.item_type,
        previous_quantity: stock.current_quantity,
        consumed_quantity: actualQuantity,
        remaining_quantity: newQuantity,
        unit_of_measure: stock.unit_of_measure,
        is_low_stock: newQuantity <= stock.minimum_threshold,
      }

      // Add markers to response if provided
      if (start_marker !== undefined && end_marker !== undefined) {
        responseData.start_marker = start_marker
        responseData.end_marker = end_marker
      }

      return NextResponse.json({
        data: responseData,
        message: `Successfully consumed ${actualQuantity} ${stock.unit_of_measure || 'units'} of ${stock.item_type.name}`,
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
