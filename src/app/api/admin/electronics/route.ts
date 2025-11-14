import { NextRequest, NextResponse } from 'next/server'
import { electronicDeviceOperations, auditLogOperations, itemTypeOperations } from '@/lib/supabase-client'
import { withPermission } from '@/lib/auth-middleware'
import { PERMISSIONS } from '@/lib/permissions'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'
import { validateElectronicDeviceInput } from '@/types/electronics'
import type { ToolInstance } from '@/types/database'

export async function GET(request: NextRequest) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_TOOLS, async (authContext) => {
      const { searchParams } = new URL(request.url)
      
      // Build filters from query parameters
      const filters: {
        status?: ToolInstance['status']
        category?: string
        search?: string
      } = {}
      
      const status = searchParams.get('status')
      if (status) {
        filters.status = status as ToolInstance['status']
      }
      
      const category = searchParams.get('category')
      if (category) {
        filters.category = category
      }
      
      const search = searchParams.get('search')
      if (search) {
        filters.search = search
      }

      // Get electronic devices with filters
      let devices
      try {
        console.log('Fetching electronic devices with filters:', filters)
        devices = await electronicDeviceOperations.getAll(filters)
        console.log('Successfully fetched devices:', devices.length)
      } catch (dbError) {
        console.error('Database error fetching electronic devices:', dbError)
        console.error('Error details:', {
          name: dbError instanceof Error ? dbError.name : 'Unknown',
          message: dbError instanceof Error ? dbError.message : String(dbError),
          stack: dbError instanceof Error ? dbError.stack : undefined,
        })
        throw dbError
      }

      // Add summary statistics
      const statusSummary = devices.reduce((acc, device) => {
        const toolInstance = device.tool_instance as unknown as ToolInstance
        acc[toolInstance.status] = (acc[toolInstance.status] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const categorySummary = devices.reduce((acc, device) => {
        const toolInstance = device.tool_instance as unknown as ToolInstance & { item_type: { category: string } }
        const category = toolInstance.item_type?.category || 'Unknown'
        acc[category] = (acc[category] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      return NextResponse.json({
        data: devices,
        total: devices.length,
        filters: filters,
        summary: {
          by_status: statusSummary,
          by_category: categorySummary,
          total_devices: devices.length,
        },
      })
    })
  } catch (error: unknown) {
    console.error('Admin electronics fetch error:', error)

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
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_TOOLS, async (authContext) => {
      const body = await request.json()
      
      // Validate input
      const validation = validateElectronicDeviceInput(body)
      if (!validation.isValid) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'Validation failed',
              details: validation.errors,
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }

      // Create the electronic device
      const device = await electronicDeviceOperations.create(body)

      // Create audit log
      try {
        const toolInstance = device.tool_instance as unknown as ToolInstance
        await auditLogOperations.create({
          user_id: authContext.user.id,
          action: 'electronic_device_create',
          entity_type: 'electronic_device',
          entity_id: device.id,
          new_values: {
            ...body,
            qr_code: toolInstance.qr_code,
            tool_instance_id: toolInstance.id,
          },
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown',
        })
      } catch (auditError) {
        console.error('Failed to create audit log:', auditError)
      }

      return NextResponse.json({
        data: device,
        message: 'Electronic device created successfully',
      }, { status: 201 })
    })
  } catch (error: unknown) {
    console.error('Electronic device creation error:', error)

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
