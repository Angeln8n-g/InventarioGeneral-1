import { NextRequest, NextResponse } from 'next/server'
import { toolInstanceOperations, itemTypeOperations, auditLogOperations } from '@/lib/supabase-client'
import { withPermission } from '@/lib/auth-middleware'
import { PERMISSIONS } from '@/lib/permissions'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'
import { generateToolUUID } from '@/lib/supabase-client'

export async function POST(request: NextRequest) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_TOOLS, async (authContext) => {
      const body = await request.json()
      
      const { name, description, category, quantity, status, qr_code_prefix } = body

      // Validate inputs
      if (!name || typeof name !== 'string' || !name.trim()) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'Tool name is required',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }

      if (!category || typeof category !== 'string' || !category.trim()) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'Category is required',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }

      if (!quantity || typeof quantity !== 'number' || quantity < 1 || quantity > 100) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'Quantity must be between 1 and 100',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }

      // Step 1: Check if item_type already exists with this name and category
      const allItemTypes = await itemTypeOperations.getAll()
      let itemType = allItemTypes.find(
        (type) => 
          type.name.toLowerCase() === name.trim().toLowerCase() && 
          type.category?.toLowerCase() === category.trim().toLowerCase() &&
          type.is_consumable === false
      )

      // Step 2: If item_type doesn't exist, create it
      if (!itemType) {
        try {
          itemType = await itemTypeOperations.create({
            name: name.trim(),
            description: description?.trim() || null,
            category: category.trim(),
            is_consumable: false,
            default_loan_duration_days: 7,
          })

          // Create audit log for item type creation
          try {
            await auditLogOperations.create({
              user_id: authContext.user.id,
              action: 'item_type_create_auto',
              entity_type: 'item_type',
              entity_id: itemType.id,
              new_values: {
                name: itemType.name,
                description: itemType.description,
                category: itemType.category,
                is_consumable: false,
                created_via: 'tool_creation',
              },
              ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
              user_agent: request.headers.get('user-agent') || 'unknown',
            })
          } catch (auditError) {
            console.error('Failed to create audit log for item type:', auditError)
          }
        } catch (error) {
          console.error('Failed to create item type:', error)
          return NextResponse.json(
            {
              error: {
                code: ERROR_CODES.DATABASE_ERROR,
                message: 'Failed to create item type',
                timestamp: new Date().toISOString(),
              },
            },
            { status: 500 }
          )
        }
      }

      // Step 3: Create tool instances
      const createdTools = []
      const errors = []

      for (let i = 0; i < quantity; i++) {
        try {
          const qr_code = qr_code_prefix 
            ? `${qr_code_prefix}-${i + 1}` 
            : generateToolUUID()

          const tool = await toolInstanceOperations.create({
            item_type_id: itemType.id,
            qr_code,
            status: status || 'available',
          })

          createdTools.push(tool)

          // Create audit log for each tool
          try {
            await auditLogOperations.create({
              user_id: authContext.user.id,
              action: 'tool_create_bulk',
              entity_type: 'tool_instance',
              entity_id: tool.id,
              new_values: {
                item_type_id: itemType.id,
                item_type_name: itemType.name,
                qr_code,
                status: status || 'available',
                bulk_index: i + 1,
                bulk_total: quantity,
              },
              ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
              user_agent: request.headers.get('user-agent') || 'unknown',
            })
          } catch (auditError) {
            console.error('Failed to create audit log:', auditError)
          }
        } catch (error) {
          console.error(`Failed to create tool ${i + 1}:`, error)
          errors.push({
            index: i + 1,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }

      if (createdTools.length === 0) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.DATABASE_ERROR,
              message: 'Failed to create any tools',
              details: errors,
              timestamp: new Date().toISOString(),
            },
          },
          { status: 500 }
        )
      }

      return NextResponse.json({
        data: createdTools,
        item_type: {
          id: itemType.id,
          name: itemType.name,
          description: itemType.description,
          category: itemType.category,
          was_created: !allItemTypes.find(t => t.id === itemType.id),
        },
        summary: {
          total_requested: quantity,
          total_created: createdTools.length,
          total_failed: errors.length,
          errors: errors.length > 0 ? errors : undefined,
        },
        message: `Successfully created ${createdTools.length} tool${createdTools.length > 1 ? 's' : ''}`,
      }, { status: 201 })
    })
  } catch (error: unknown) {
    console.error('Tool creation with type error:', error)

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
