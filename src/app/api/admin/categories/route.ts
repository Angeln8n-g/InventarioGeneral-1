import { NextRequest, NextResponse } from 'next/server'
import { categoryOperations } from '@/lib/db/categoryOperations'
import { auditLogOperations } from '@/lib/supabase-client'
import { withPermission } from '@/lib/auth-middleware'
import { PERMISSIONS } from '@/lib/permissions'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'

/**
 * GET /api/admin/categories
 * List all device categories with device counts
 */
export async function GET(request: NextRequest) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_TOOLS, async () => {
      const { searchParams } = new URL(request.url)
      
      // Check if we should include counts
      const includeCounts = searchParams.get('includeCounts') !== 'false'
      const activeOnly = searchParams.get('activeOnly') === 'true'
      
      let categories
      if (includeCounts) {
        categories = await categoryOperations.getAllWithCounts()
      } else if (activeOnly) {
        categories = await categoryOperations.getActive()
      } else {
        categories = await categoryOperations.getAll()
      }

      return NextResponse.json({
        data: categories,
        total: categories.length,
      })
    })
  } catch (error: unknown) {
    console.error('Categories fetch error:', error)

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
          details: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/categories
 * Create a new device category
 */
export async function POST(request: NextRequest) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_TOOLS, async (authContext) => {
      const body = await request.json()
      
      // Validate required fields
      if (!body.name || typeof body.name !== 'string') {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'El nombre de la categoría es requerido',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }

      // Create the category
      const category = await categoryOperations.create({
        name: body.name.trim(),
        description: body.description?.trim(),
        icon: body.icon?.trim(),
      })

      // Create audit log
      try {
        await auditLogOperations.create({
          user_id: authContext.user.id,
          action: 'category_create',
          entity_type: 'device_category',
          entity_id: category.id,
          new_values: {
            name: category.name,
            description: category.description,
            icon: category.icon,
          },
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown',
        })
      } catch (auditError) {
        console.error('Failed to create audit log:', auditError)
      }

      return NextResponse.json({
        data: category,
        message: 'Categoría creada exitosamente',
      }, { status: 201 })
    })
  } catch (error: unknown) {
    console.error('Category creation error:', error)

    // Handle duplicate name error
    if (error instanceof Error && error.message.includes('Ya existe una categoría')) {
      return NextResponse.json(
        {
          error: {
            code: 'DUPLICATE_NAME',
            message: error.message,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 409 }
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
