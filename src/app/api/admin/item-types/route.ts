import { NextRequest, NextResponse } from 'next/server'
import { itemTypeOperations, auditLogOperations } from '@/lib/supabase-client'
import { withPermission } from '@/lib/auth-middleware'
import { PERMISSIONS } from '@/lib/permissions'
import { createItemTypeSchema, updateItemTypeSchema } from '@/utils/validation'
import { ERROR_CODES, ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/utils/constants'

export async function GET(request: NextRequest) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_ITEMS, async (authContext) => {
      const { searchParams } = new URL(request.url)
      
      // Get query parameters
      const consumableOnly = searchParams.get('consumable_only') === 'true'
      const toolsOnly = searchParams.get('tools_only') === 'true'
      
      let itemTypes
      if (consumableOnly) {
        itemTypes = await itemTypeOperations.getConsumables()
      } else if (toolsOnly) {
        itemTypes = await itemTypeOperations.getTools()
      } else {
        itemTypes = await itemTypeOperations.getAll()
      }

      return NextResponse.json({
        data: itemTypes,
        total: itemTypes.length,
        filters: {
          consumable_only: consumableOnly,
          tools_only: toolsOnly,
        },
      })
    })
  } catch (error: unknown) {
    console.error('Item types fetch error:', error)

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
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_ITEMS, async (authContext) => {
      const body = await request.json()
      
      // Extract stock-related fields that don't belong to item_types
      const { initial_quantity, minimum_threshold, unit_of_measure, ...itemTypeData } = body
      
      // Validate input (only item_type fields)
      const validatedData = createItemTypeSchema.validateSync(itemTypeData)

      // Create the item type
      const itemType = await itemTypeOperations.create(validatedData)

      // If it's a consumable, create the stock entry
      if (validatedData.is_consumable) {
        try {
          const { supabase } = await import('@/lib/supabase')
          const { generateToolUUID } = await import('@/lib/supabase-client')
          
          // Generate unique QR code for the consumable
          const qr_code = `CONSUMABLE-${generateToolUUID()}`
          
          const { error: stockError } = await supabase
            .from('consumable_stock')
            .insert({
              item_type_id: itemType.id,
              current_quantity: initial_quantity || 0,
              minimum_threshold: minimum_threshold || 5,
              unit_of_measure: unit_of_measure || null,
              qr_code: qr_code,
            })
          
          if (stockError) {
            console.error('Failed to create consumable stock:', stockError)
            throw stockError
          }
        } catch (stockError) {
          console.error('Failed to create consumable stock:', stockError)
          // Rollback: delete the item type if stock creation fails
          await itemTypeOperations.delete(itemType.id)
          throw new Error('Failed to create consumable stock')
        }
      }

      // Create audit log
      try {
        await auditLogOperations.create({
          user_id: authContext.user.id,
          action: 'item_type_create',
          entity_type: 'item_type',
          entity_id: itemType.id,
          new_values: validatedData,
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown',
        })
      } catch (auditError) {
        console.error('Failed to create audit log:', auditError)
      }

      return NextResponse.json({
        data: itemType,
        message: 'Item type created successfully',
      }, { status: 201 })
    })
  } catch (error: unknown) {
    console.error('Item type creation error:', error)

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