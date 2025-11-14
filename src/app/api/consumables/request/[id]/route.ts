import { NextRequest, NextResponse } from 'next/server'
import {
  consumableRequestOperations,
  auditLogOperations
} from '@/lib/supabase-client'
import type { UpdateConsumableRequestInput } from '@/types/database'
import { withAuth } from '@/lib/auth-middleware'
import { updateConsumableRequestSchema } from '@/utils/validation'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    return await withAuth(request, async (authContext) => {
      const requestId = parseInt(resolvedParams.id, 10)

      if (isNaN(requestId)) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'Invalid request ID',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }

      // Get the existing request
      const existingRequest = await consumableRequestOperations.getById(requestId)

      if (!existingRequest) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.NOT_FOUND,
              message: 'Request not found',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 404 }
        )
      }

      // Check if user can modify this request
      if (authContext.user.role !== 'admin' && existingRequest.user_id !== authContext.user.id) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.AUTHORIZATION_ERROR,
              message: 'You can only modify your own requests',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 403 }
        )
      }

      const body = await request.json()

      // Validate input
      const validatedData = updateConsumableRequestSchema.validateSync(body) as UpdateConsumableRequestInput

      // Regular users can only cancel their own pending requests
      if (authContext.user.role !== 'admin') {
        if (existingRequest.status !== 'pending') {
          return NextResponse.json(
            {
              error: {
                code: ERROR_CODES.VALIDATION_ERROR,
                message: 'Can only cancel pending requests',
                timestamp: new Date().toISOString(),
              },
            },
            { status: 400 }
          )
        }

        if (validatedData.status && validatedData.status !== 'cancelled') {
          return NextResponse.json(
            {
              error: {
                code: ERROR_CODES.AUTHORIZATION_ERROR,
                message: 'Users can only cancel their requests',
                timestamp: new Date().toISOString(),
              },
            },
            { status: 403 }
          )
        }
      }

      // Update the request
      const updatedRequest = await consumableRequestOperations.update(requestId, validatedData)

      // Create audit log
      try {
        await auditLogOperations.create({
          user_id: authContext.user.id,
          action: 'consumable_request_update',
          entity_type: 'consumable_request',
          entity_id: requestId,
          old_values: {
            status: existingRequest.status,
            fulfilled_quantity: existingRequest.fulfilled_quantity,
            fulfilled_date: existingRequest.fulfilled_date,
          },
          new_values: validatedData as Record<string, unknown>,
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown',
        })
      } catch (auditError) {
        console.error('Failed to create audit log:', auditError)
      }

      return NextResponse.json({
        data: updatedRequest,
        message: 'Request updated successfully',
      })
    })
  } catch (error: unknown) {
    console.error('Request update error:', error)

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