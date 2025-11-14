import { NextRequest, NextResponse } from 'next/server'
import { electronicDeviceOperations, auditLogOperations } from '@/lib/supabase-client'
import { withPermission } from '@/lib/auth-middleware'
import { PERMISSIONS } from '@/lib/permissions'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'

interface ImportItem {
  name: string
  description?: string
  category: string
  brand?: string
  model?: string
  serial_number?: string
  status?: string
  condition_notes?: string
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
      const { items } = body as { items: ImportItem[] }

      if (!items || !Array.isArray(items) || items.length === 0) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'No items provided for import',
            },
          },
          { status: 400 }
        )
      }

      const results: ImportResult[] = []
      let successCount = 0
      let errorCount = 0

      // Process each item
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        const rowNumber = i + 2 // +2 because row 1 is headers and array is 0-indexed

        try {
          // Validate required fields
          if (!item.name || !item.category) {
            results.push({
              success: false,
              row: rowNumber,
              name: item.name || 'Unknown',
              message: 'Missing required fields: name and category are required',
            })
            errorCount++
            continue
          }

          // Create the electronic device
          const device = await electronicDeviceOperations.create({
            name: item.name,
            description: item.description || undefined,
            category: item.category as any,
            brand: item.brand || undefined,
            model: item.model || undefined,
            serial_number: item.serial_number || undefined,
            status: (item.status as any) || 'available',
            condition_notes: item.condition_notes || undefined,
          })

          // Create audit log
          try {
            await auditLogOperations.create({
              user_id: authContext.user.id,
              action: 'electronic_device_bulk_import',
              entity_type: 'electronic_device',
              entity_id: device.id,
              new_values: {
                name: item.name,
                category: item.category,
                brand: item.brand,
                model: item.model,
              },
              ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
              user_agent: request.headers.get('user-agent') || 'unknown',
            })
          } catch (auditError) {
            console.error('Failed to create audit log:', auditError)
          }

          results.push({
            success: true,
            row: rowNumber,
            name: item.name,
            message: 'Successfully imported',
            id: device.id,
          })
          successCount++
        } catch (error) {
          console.error(`Error importing row ${rowNumber}:`, error)
          results.push({
            success: false,
            row: rowNumber,
            name: item.name || 'Unknown',
            message: error instanceof Error ? error.message : 'Failed to import',
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
        },
      },
      { status: 500 }
    )
  }
}
