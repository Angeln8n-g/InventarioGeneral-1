import { NextRequest, NextResponse } from 'next/server'
import { electronicDeviceOperations } from '@/lib/supabase-client'
import { withAuth } from '@/lib/auth-middleware'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'

export async function GET(request: NextRequest) {
  try {
    return await withAuth(request, async (authContext) => {
      // Get only available electronic devices
      const devices = await electronicDeviceOperations.getAll({
        status: 'available',
      })

      // Filter out sensitive information for regular users
      const publicDevices = devices.map((device) => ({
        id: device.id,
        brand: device.brand,
        model: device.model,
        tool_instance: {
          id: device.tool_instance.id,
          qr_code: device.tool_instance.qr_code,
          serial_number: device.tool_instance.serial_number,
          status: device.tool_instance.status,
          condition_notes: device.tool_instance.condition_notes,
          item_type: device.tool_instance.item_type,
        },
      }))

      return NextResponse.json({
        data: publicDevices,
        total: publicDevices.length,
      })
    })
  } catch (error: unknown) {
    console.error('Available electronics fetch error:', error)

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
