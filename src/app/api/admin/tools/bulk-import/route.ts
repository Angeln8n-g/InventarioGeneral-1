import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { withPermission } from '@/lib/auth-middleware'
import { PERMISSIONS } from '@/lib/permissions'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'
import { toolInstanceOperations, itemTypeOperations, auditLogOperations } from '@/lib/supabase-client'
import { generateToolUUID } from '@/lib/supabase-client'

interface BulkImportItem {
  name: string
  description?: string
  category: string
  quantity: number
  status?: string
  qr_code_prefix?: string
}

interface ImportResult {
  success: boolean
  row: number
  name: string
  message: string
  id?: number
}

export async function POST(request: NextRequest) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_TOOLS, async (authContext) => {
      const body = await request.json()
      const { items } = body as { items: BulkImportItem[] }

      if (!items || !Array.isArray(items) || items.length === 0) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'Items array is required and must not be empty',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }

      if (items.length > 100) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'Maximum 100 items allowed per import',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }

      const results: ImportResult[] = []
      let successCount = 0
      let errorCount = 0

      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        const rowNumber = i + 2 // Excel row number (1-indexed + header row)

        try {
          // Validate required fields
          if (!item.name || item.name.trim() === '') {
            throw new Error('Name is required')
          }

          if (!item.category || item.category.trim() === '') {
            throw new Error('Category is required')
          }

          const quantity = parseInt(String(item.quantity || 1))
          if (isNaN(quantity) || quantity < 1 || quantity > 100) {
            throw new Error('Quantity must be between 1 and 100')
          }

          const statusInput = item.status || 'available'
          const validStatuses = ['available', 'loaned', 'damaged', 'out-of-service', 'lost'] as const
          type ValidStatus = typeof validStatuses[number]
          
          if (!validStatuses.includes(statusInput as ValidStatus)) {
            throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`)
          }
          
          const status = statusInput as ValidStatus

          // Check if item type already exists
          const { data: existingTypes } = await supabase
            .from('item_types')
            .select('id')
            .eq('name', item.name.trim())
            .eq('type', 'tool')
            .limit(1)

          let itemTypeId: number

          if (existingTypes && existingTypes.length > 0) {
            // Use existing item type
            itemTypeId = existingTypes[0].id
          } else {
            // Create new item type
            const newItemType = await itemTypeOperations.create({
              name: item.name.trim(),
              description: item.description?.trim() || undefined,
              category: item.category.trim(),
              is_consumable: false,
            })
            itemTypeId = newItemType.id

            // Log item type creation
            try {
              await auditLogOperations.create({
                user_id: authContext.user.id,
                action: 'item_type_create_bulk_import',
                entity_type: 'item_type',
                entity_id: itemTypeId,
                new_values: {
                  name: item.name.trim(),
                  category: item.category.trim(),
                  type: 'tool',
                },
              })
            } catch (auditError) {
              console.error('Failed to create audit log for item type:', auditError)
            }
          }

          // Create tool instances
          const createdTools = []
          for (let j = 0; j < quantity; j++) {
            const qrCode = item.qr_code_prefix
              ? `${item.qr_code_prefix}-${j + 1}`
              : generateToolUUID()

            const tool = await toolInstanceOperations.create({
              item_type_id: itemTypeId,
              qr_code: qrCode,
              status: status,
            })

            createdTools.push(tool)

            // Log tool creation
            try {
              await auditLogOperations.create({
                user_id: authContext.user.id,
                action: 'tool_create_bulk_import',
                entity_type: 'tool_instance',
                entity_id: tool.id,
                new_values: {
                  item_type_id: itemTypeId,
                  qr_code: qrCode,
                  status: status,
                  bulk_row: rowNumber,
                  bulk_index: j + 1,
                  bulk_total: quantity,
                },
              })
            } catch (auditError) {
              console.error('Failed to create audit log for tool:', auditError)
            }
          }

          results.push({
            success: true,
            row: rowNumber,
            name: item.name,
            message: `Successfully created ${quantity} tool${quantity > 1 ? 's' : ''}`,
            id: createdTools[0]?.id,
          })
          successCount++
        } catch (error) {
          console.error(`Error processing row ${rowNumber}:`, error)
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          results.push({
            success: false,
            row: rowNumber,
            name: item.name || 'Unknown',
            message: errorMessage,
          })
          errorCount++
        }
      }

      return NextResponse.json({
        results,
        summary: {
          total: items.length,
          success: successCount,
          errors: errorCount,
        },
        message: `Import completed: ${successCount} successful, ${errorCount} failed`,
      })
    })
  } catch (error: unknown) {
    console.error('Bulk import error:', error)

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
