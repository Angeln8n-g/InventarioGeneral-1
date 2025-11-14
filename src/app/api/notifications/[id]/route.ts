import { NextRequest, NextResponse } from 'next/server'
import { notificationOperations } from '@/lib/supabase-client'
import { withAuth } from '@/lib/auth-middleware'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    return await withAuth(request, async (authContext) => {
      const { id } = await params
      const notificationId = parseInt(id)

      if (isNaN(notificationId)) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'Invalid notification ID',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }

      // Verify notification belongs to user
      const notifications = await notificationOperations.getByUserId(authContext.user.id)
      const notification = notifications.data.find(n => n.id === notificationId)

      if (!notification) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.NOT_FOUND,
              message: 'Notification not found',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 404 }
        )
      }

      await notificationOperations.delete(notificationId)

      return NextResponse.json({
        message: 'Notification deleted successfully',
      })
    })
  } catch (error: unknown) {
    console.error('Notification delete error:', error)

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
