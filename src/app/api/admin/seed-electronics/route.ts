import { NextRequest, NextResponse } from 'next/server'
import { withPermission } from '@/lib/auth-middleware'
import { PERMISSIONS } from '@/lib/permissions'
import { electronicDeviceOperations } from '@/lib/supabase-client'

export async function POST(request: NextRequest) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_TOOLS, async (authContext) => {
      const devices = [
        {
          name: 'MacBook Pro 14"',
          description: 'Apple MacBook Pro 14 inch laptop',
          category: 'Laptops' as const,
          brand: 'Apple',
          model: 'MacBook Pro 14" M1 Pro',
          serial_number: 'C02XJ0AAJGH5',
          status: 'available' as const,
          condition_notes: 'Excellent condition, includes charger',
        },
        {
          name: 'iPad Pro 11"',
          description: 'Apple iPad Pro 11 inch tablet',
          category: 'Tablets' as const,
          brand: 'Apple',
          model: 'iPad Pro 11" (3rd Gen)',
          serial_number: 'DMXK2LL/A',
          status: 'available' as const,
          condition_notes: 'Good condition, includes Apple Pencil',
        },
        {
          name: 'iPhone 13',
          description: 'Apple iPhone 13 smartphone',
          category: 'Smartphones' as const,
          brand: 'Apple',
          model: 'iPhone 13 128GB',
          serial_number: 'F2G3H4J5K6L7',
          status: 'available' as const,
          condition_notes: 'Like new, 128GB',
        },
        {
          name: 'Dell Latitude 5420',
          description: 'Dell Latitude 5420 business laptop',
          category: 'Laptops' as const,
          brand: 'Dell',
          model: 'Latitude 5420 i7',
          serial_number: 'BXYZ123456',
          status: 'available' as const,
          condition_notes: 'Good condition, Windows 11 Pro',
        },
        {
          name: 'Samsung Galaxy Tab S8',
          description: 'Samsung Galaxy Tab S8 tablet',
          category: 'Tablets' as const,
          brand: 'Samsung',
          model: 'Galaxy Tab S8 11"',
          serial_number: 'R52N123ABCD',
          status: 'loaned' as const,
          condition_notes: 'Good condition, includes S Pen',
        },
      ]

      const createdDevices = []
      const errors = []

      for (const deviceData of devices) {
        try {
          const device = await electronicDeviceOperations.create(deviceData)
          createdDevices.push(device)
        } catch (error) {
          errors.push({
            device: deviceData.name,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }

      return NextResponse.json({
        success: true,
        message: `Created ${createdDevices.length} devices`,
        created: createdDevices.length,
        failed: errors.length,
        devices: createdDevices,
        errors: errors.length > 0 ? errors : undefined,
      })
    })
  } catch (error: unknown) {
    console.error('Seed electronics error:', error)

    if (error instanceof Error && error.name === 'AuthenticationError') {
      return NextResponse.json(
        {
          error: {
            code: 'AUTHENTICATION_ERROR',
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
            code: 'AUTHORIZATION_ERROR',
            message: error.message,
          },
        },
        { status: 403 }
      )
    }

    return NextResponse.json(
      {
        error: {
          code: 'SEED_ERROR',
          message: error instanceof Error ? error.message : 'Failed to seed devices',
        },
      },
      { status: 500 }
    )
  }
}
