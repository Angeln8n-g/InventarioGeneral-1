import { NextRequest, NextResponse } from 'next/server'
import { migrationOperations } from '@/lib/db/migrationOperations'
import { withPermission } from '@/lib/auth-middleware'
import { PERMISSIONS } from '@/lib/permissions'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'

/**
 * POST /api/admin/categories/migrate/analyze
 * Analyze compatibility between source and target categories
 */
export async function POST(request: NextRequest) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_TOOLS, async () => {
      const body = await request.json()
      
      // Validate required fields
      if (!body.sourceCategoryId || typeof body.sourceCategoryId !== 'number') {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'El ID de la categoría origen es requerido',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }

      if (!body.targetCategoryId || typeof body.targetCategoryId !== 'number') {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'El ID de la categoría destino es requerido',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }

      if (body.sourceCategoryId === body.targetCategoryId) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'Las categorías origen y destino deben ser diferentes',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }

      // Get migration preview with analysis
      const preview = await migrationOperations.getMigrationPreview(
        body.sourceCategoryId,
        body.targetCategoryId
      )

      return NextResponse.json({
        data: {
          analysis: preview.analysis,
          devices: preview.devices,
          warnings: preview.analysis.incompatibleFields.length > 0
            ? [`Los siguientes campos se perderán durante la migración: ${preview.analysis.incompatibleFields.join(', ')}`]
            : [],
        },
      })
    })
  } catch (error: unknown) {
    console.error('Migration analysis error:', error)

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: error.message,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 404 }
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
          message: error instanceof Error ? error.message : ERROR_MESSAGES.GENERIC_ERROR,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    )
  }
}
