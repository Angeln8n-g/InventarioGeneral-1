import { NextRequest, NextResponse } from 'next/server'
import { notificationPreferencesOperations } from '@/lib/supabase-client'
import { withAuth } from '@/lib/auth-middleware'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'

export async function GET(request: NextRequest) {
  try {
    return await withAuth(request, async (authContext) => {
      const preferences = await notificationPreferencesOperations.getOrCreate(authContext.user.id)

      return NextResponse.json({
        data: preferences,
      })
    })
  } catch (error: unknown) {
    console.error('Notification preferences fetch error:', error)

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

export async function PUT(request: NextRequest) {
  try {
    return await withAuth(request, async (authContext) => {
      const body = await request.json()

      // Validate preferences
      const validKeys = [
        'loan_confirmation',
        'return_confirmation',
        'loan_reminder',
        'overdue_notice',
        'consumable_fulfilled',
        'consumable_backorder',
        'system_announcement',
        'stock_alert',
        'system_maintenance',
        'sound_enabled',
      ]

      const invalidKeys = Object.keys(body).filter(key => !validKeys.includes(key))
      if (invalidKeys.length > 0) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: `Invalid preference keys: ${invalidKeys.join(', ')}`,
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }

      const preferences = await notificationPreferencesOperations.update(
        authContext.user.id,
        body
      )

      return NextResponse.json({
        data: preferences,
        message: 'Preferences updated successfully',
      })
    })
  } catch (error: unknown) {
    console.error('Notification preferences update error:', error)

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
