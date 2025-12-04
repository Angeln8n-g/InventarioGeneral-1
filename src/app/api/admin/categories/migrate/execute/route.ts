import { NextRequest, NextResponse } from 'next/server'
import { migrationOperations } from '@/lib/db/migrationOperations'
import { auditLogOperations } from '@/lib/supabase-client'
import { withPermission } from '@/lib/auth-middleware'
import { PERMISSIONS } from '@/lib/permissions'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'

/**
 * POST /api/admin/categories/migrate/execute
 * Execute category migration for devices
 */
export async function POST(request: NextRequest) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_TOOLS, async (authContext) => {
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

      // Execute the migration
      const result = await migrationOperations.migrateBulk(
        {
          sourceCategoryId: body.sourceCategoryId,
          targetCategoryId: body.targetCategoryId,
          deviceIds: body.deviceIds,
          fieldMapping: body.fieldMapping,
        },
        authContext.user.id
      )

      // Create audit log for the migration
      try {
        await auditLogOperations.create({
          user_id: authContext.user.id,
          action: 'category_migration',
          entity_type: 'device_category',
          entity_id: body.targetCategoryId,
          old_values: {
            source_category_id: body.sourceCategoryId,
          },
          new_values: {
            target_category_id: body.targetCategoryId,
            migrated_count: result.migratedCount,
            failed_count: result.failedCount,
          },
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown',
        })
      } catch (auditError) {
        console.error('Failed to create audit log:', auditError)
      }

      if (!result.success) {
        return NextResponse.json({
          data: result,
          message: `Migración parcialmente completada. ${result.migratedCount} dispositivos migrados, ${result.failedCount} fallidos.`,
        }, { status: 207 }) // Multi-Status
      }

      return NextResponse.json({
        data: result,
        message: `Migración completada exitosamente. ${result.migratedCount} dispositivos migrados.`,
      })
    })
  } catch (error: unknown) {
    console.error('Migration execution error:', error)

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
