import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { withPermission } from '@/lib/auth-middleware'
import { PERMISSIONS } from '@/lib/permissions'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'
import { auditLogOperations } from '@/lib/supabase-client'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_CONSUMABLES, async (authContext) => {
      const { id } = await params
      const consumableId = parseInt(id, 10)

      if (isNaN(consumableId)) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'Invalid consumable ID',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }

      // Get consumable details
      const { data: consumable, error } = await supabase
        .from('consumable_stock')
        .select(`
          *,
          item_type:item_types(*)
        `)
        .eq('id', consumableId)
        .single()

      if (error || !consumable) {
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

      return NextResponse.json({
        data: consumable,
      })
    })
  } catch (error: unknown) {
    console.error('Consumable fetch error:', error)

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_CONSUMABLES, async (authContext) => {
      const { id } = await params
      const consumableId = parseInt(id, 10)

      if (isNaN(consumableId)) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'Invalid consumable ID',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }

      const body = await request.json()
      const { name, description, category, unit_of_measure, minimum_threshold } = body

      // Validate required fields
      if (!name || name.trim() === '') {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'Name is required',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }

      // Get current consumable data
      const { data: currentConsumable, error: fetchError } = await supabase
        .from('consumable_stock')
        .select(`
          *,
          item_type:item_types(*)
        `)
        .eq('id', consumableId)
        .single()

      if (fetchError || !currentConsumable) {
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

      // Update item_type
      const { error: itemTypeError } = await supabase
        .from('item_types')
        .update({
          name: name.trim(),
          description: description?.trim() || null,
          category: category?.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentConsumable.item_type.id)

      if (itemTypeError) {
        console.error('Error updating item type:', itemTypeError)
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.DATABASE_ERROR,
              message: 'Failed to update consumable details',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 500 }
        )
      }

      // Update consumable_stock
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      }

      if (unit_of_measure !== undefined) {
        updateData.unit_of_measure = unit_of_measure?.trim() || null
      }

      if (minimum_threshold !== undefined && !isNaN(parseFloat(minimum_threshold))) {
        updateData.minimum_threshold = parseFloat(minimum_threshold)
      }

      const { error: stockError } = await supabase
        .from('consumable_stock')
        .update(updateData)
        .eq('id', consumableId)

      if (stockError) {
        console.error('Error updating consumable stock:', stockError)
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.DATABASE_ERROR,
              message: 'Failed to update consumable stock details',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 500 }
        )
      }

      // Get updated consumable
      const { data: updatedConsumable, error: getError } = await supabase
        .from('consumable_stock')
        .select(`
          *,
          item_type:item_types(*)
        `)
        .eq('id', consumableId)
        .single()

      if (getError || !updatedConsumable) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.DATABASE_ERROR,
              message: 'Failed to fetch updated consumable',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 500 }
        )
      }

      // Log audit event
      try {
        await auditLogOperations.create({
          user_id: authContext.user.id,
          action: 'consumable_update',
          entity_type: 'consumable',
          entity_id: consumableId,
          old_values: {
            name: currentConsumable.item_type.name,
            description: currentConsumable.item_type.description,
            category: currentConsumable.item_type.category,
            unit_of_measure: currentConsumable.unit_of_measure,
            minimum_threshold: currentConsumable.minimum_threshold,
          },
          new_values: {
            name: name.trim(),
            description: description?.trim() || null,
            category: category?.trim() || null,
            unit_of_measure: unit_of_measure?.trim() || null,
            minimum_threshold: minimum_threshold ? parseFloat(minimum_threshold) : null,
          },
        })
      } catch (auditError) {
        console.error('Failed to create audit log:', auditError)
      }

      return NextResponse.json({
        data: updatedConsumable,
        message: 'Consumable updated successfully',
      })
    })
  } catch (error: unknown) {
    console.error('Consumable update error:', error)

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


export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_CONSUMABLES, async (authContext) => {
      const { id } = await params
      const consumableId = parseInt(id, 10)

      if (isNaN(consumableId)) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'Invalid consumable ID',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }

      // Get current consumable data for audit log
      const { data: currentConsumable, error: fetchError } = await supabase
        .from('consumable_stock')
        .select(`
          *,
          item_type:item_types(*)
        `)
        .eq('id', consumableId)
        .single()

      if (fetchError || !currentConsumable) {
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

      // Check for active reservations
      const { data: activeReservations, error: reservationsError } = await supabase
        .from('consumable_reservations')
        .select('id')
        .eq('item_type_id', currentConsumable.item_type_id)
        .eq('status', 'active')
        .limit(1)

      if (reservationsError) {
        console.error('Error checking reservations:', reservationsError)
      }

      if (activeReservations && activeReservations.length > 0) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'Cannot delete consumable with active reservations. Please cancel or fulfill all reservations first.',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }

      // Delete stock movements first (foreign key constraint)
      const { error: movementsError } = await supabase
        .from('stock_movements')
        .delete()
        .eq('consumable_stock_id', consumableId)

      if (movementsError) {
        console.error('Error deleting stock movements:', movementsError)
        // Continue anyway, some tables might not have this constraint
      }

      // Delete consumable returns
      const { error: returnsError } = await supabase
        .from('consumable_returns')
        .delete()
        .eq('consumable_stock_id', consumableId)

      if (returnsError) {
        console.error('Error deleting consumable returns:', returnsError)
      }

      // Delete consumable_stock record
      const { error: stockError } = await supabase
        .from('consumable_stock')
        .delete()
        .eq('id', consumableId)

      if (stockError) {
        console.error('Error deleting consumable stock:', stockError)
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.DATABASE_ERROR,
              message: 'Failed to delete consumable. It may have related records.',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 500 }
        )
      }

      // Optionally delete the item_type if no other stocks reference it
      const { data: otherStocks } = await supabase
        .from('consumable_stock')
        .select('id')
        .eq('item_type_id', currentConsumable.item_type_id)
        .limit(1)

      if (!otherStocks || otherStocks.length === 0) {
        // No other stocks reference this item_type, safe to delete
        const { error: itemTypeError } = await supabase
          .from('item_types')
          .delete()
          .eq('id', currentConsumable.item_type_id)

        if (itemTypeError) {
          console.error('Error deleting item type:', itemTypeError)
          // Not critical, consumable is already deleted
        }
      }

      // Log audit event
      try {
        await auditLogOperations.create({
          user_id: authContext.user.id,
          action: 'consumable_delete',
          entity_type: 'consumable',
          entity_id: consumableId,
          old_values: {
            name: currentConsumable.item_type.name,
            description: currentConsumable.item_type.description,
            category: currentConsumable.item_type.category,
            current_quantity: currentConsumable.current_quantity,
            unit_of_measure: currentConsumable.unit_of_measure,
          },
          new_values: null,
        })
      } catch (auditError) {
        console.error('Failed to create audit log:', auditError)
      }

      return NextResponse.json({
        message: 'Consumable deleted successfully',
        deleted_id: consumableId,
        deleted_name: currentConsumable.item_type.name,
      })
    })
  } catch (error: unknown) {
    console.error('Consumable delete error:', error)

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
