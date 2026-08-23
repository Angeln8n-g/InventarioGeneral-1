import { NextRequest, NextResponse } from 'next/server'
import { assignmentOperations } from '@/lib/supabase-client'

/**
 * GET /api/admin/device-assignments/[id]
 * Get a specific device assignment by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = parseInt(idParam)

    if (isNaN(id)) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'ID de asignación inválido',
            timestamp: new Date().toISOString()
          }
        },
        { status: 400 }
      )
    }

    const assignment = await assignmentOperations.getById(id)

    if (!assignment) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'Asignación no encontrada',
            timestamp: new Date().toISOString()
          }
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: assignment
    })
  } catch (error) {
    console.error('Error fetching device assignment:', error)
    return NextResponse.json(
      {
        error: {
          code: 'DATABASE_ERROR',
          message: 'Error al obtener la asignación',
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/device-assignments/[id]
 * Remove a device assignment (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = parseInt(idParam)

    if (isNaN(id)) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'ID de asignación inválido',
            timestamp: new Date().toISOString()
          }
        },
        { status: 400 }
      )
    }

    // Get user ID from request (assuming it's set by middleware)
    const userId = (request as any).userId

    const assignment = await assignmentOperations.remove(id, userId)

    return NextResponse.json({
      success: true,
      data: assignment,
      message: 'Asignación removida exitosamente'
    })
  } catch (error: any) {
    console.error('Error removing device assignment:', error)

    if (error.message?.includes('not found')) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'Asignación no encontrada',
            timestamp: new Date().toISOString()
          }
        },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        error: {
          code: 'DATABASE_ERROR',
          message: 'Error al remover la asignación',
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
