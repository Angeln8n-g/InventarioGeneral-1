import { NextRequest, NextResponse } from 'next/server'
import { combinationOperations } from '@/lib/supabase-client'

/**
 * GET /api/admin/device-combinations/[id]
 * Get a specific device combination by ID
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
            message: 'ID de combinación inválido',
            timestamp: new Date().toISOString()
          }
        },
        { status: 400 }
      )
    }

    const combination = await combinationOperations.getById(id)

    if (!combination) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'Combinación no encontrada',
            timestamp: new Date().toISOString()
          }
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: combination
    })
  } catch (error) {
    console.error('Error fetching device combination:', error)
    return NextResponse.json(
      {
        error: {
          code: 'DATABASE_ERROR',
          message: 'Error al obtener la combinación',
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/device-combinations/[id]
 * Remove a device combination (soft delete)
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
            message: 'ID de combinación inválido',
            timestamp: new Date().toISOString()
          }
        },
        { status: 400 }
      )
    }

    // Get user ID from request (assuming it's set by middleware)
    const userId = (request as any).userId

    const combination = await combinationOperations.remove(id, userId)

    return NextResponse.json({
      success: true,
      data: combination,
      message: 'Combinación removida exitosamente'
    })
  } catch (error: any) {
    console.error('Error removing device combination:', error)

    if (error.message?.includes('not found')) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'Combinación no encontrada',
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
          message: 'Error al remover la combinación',
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
