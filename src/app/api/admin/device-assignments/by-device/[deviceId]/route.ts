import { NextRequest, NextResponse } from 'next/server'
import { assignmentOperations } from '@/lib/supabase-client'

/**
 * GET /api/admin/device-assignments/by-device/[deviceId]
 * Get assignment history for a specific device
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { deviceId: string } }
) {
  try {
    const deviceId = parseInt(params.deviceId)

    if (isNaN(deviceId)) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'ID de dispositivo inválido',
            timestamp: new Date().toISOString()
          }
        },
        { status: 400 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as 'active' | 'removed' | undefined

    const filters: {
      electronic_device_id: number
      status?: 'active' | 'removed'
    } = {
      electronic_device_id: deviceId
    }

    if (status) {
      filters.status = status
    }

    const assignments = await assignmentOperations.getAll(filters)

    return NextResponse.json({
      success: true,
      data: assignments,
      count: assignments.length
    })
  } catch (error) {
    console.error('Error fetching device assignment history:', error)
    return NextResponse.json(
      {
        error: {
          code: 'DATABASE_ERROR',
          message: 'Error al obtener el historial de asignaciones del dispositivo',
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
