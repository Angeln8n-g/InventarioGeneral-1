import { NextRequest, NextResponse } from 'next/server'
import { notificationOperations } from '@/lib/supabase-client'
import { withAuth } from '@/lib/auth-middleware'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'

export async function GET(request: NextRequest) {
  try {
    return await withAuth(request, async (authContext) => {
      const { searchParams } = new URL(request.url)
      
      // Get query parameters
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '50')
      const type = searchParams.get('type') || undefined
      const read = searchParams.get('read') ? searchParams.get('read') === 'true' : undefined
      const startDate = searchParams.get('start_date') || undefined
      const endDate = searchParams.get('end_date') || undefined

      const filters = {
        type: type as any,
        read,
        startDate,
        endDate,
      }
      
      // Get notifications for the authenticated user
      const result = await notificationOperations.getByUserId(
        authContext.user.id,
        filters,
        page,
        limit
      )

      const totalPages = Math.ceil(result.total / limit)

      return NextResponse.json({
        data: result.data,
        total: result.total,
        unread_count: result.unread_count,
        page,
        limit,
        totalPages,
      })
    })
  } catch (error: unknown) {
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

    // Enhanced error logging for server errors
    const errObj = error as { message?: string; details?: string; code?: string; stack?: string }
    console.error('Notifications fetch error:', {
      message: errObj?.message || (error instanceof Error ? error.message : 'Unknown error'),
      details: errObj?.details || (error instanceof Error ? error.stack : (typeof error === 'object' ? JSON.stringify(error) : String(error))),
      hint: 'Check database connection and Supabase configuration',
      code: errObj?.code || '',
    })

    // Return a more graceful error response
    return NextResponse.json(
      {
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: 'Unable to fetch notifications. Please try again later.',
          details: error instanceof Error ? error.message : 'Unknown error',
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
      const { action, notification_id } = body

      if (action === 'mark_all_read') {
        // Mark all notifications as read for the user
        await notificationOperations.markAllAsRead(authContext.user.id)
        
        return NextResponse.json({
          message: 'All notifications marked as read',
        })
      } else if (action === 'mark_read' && notification_id) {
        // Mark specific notification as read
        const notification = await notificationOperations.markAsRead(notification_id)
        
        return NextResponse.json({
          data: notification,
          message: 'Notification marked as read',
        })
      } else {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'Invalid action or missing notification_id',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }
    })
  } catch (error: unknown) {
    console.error('Notification update error:', error)

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