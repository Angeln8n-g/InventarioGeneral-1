import { NextRequest, NextResponse } from 'next/server'
import { withPermission } from '@/lib/auth-middleware'
import { PERMISSIONS } from '@/lib/permissions'

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 })
  }

  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_TOOLS, async (authContext) => {
      return NextResponse.json({
        success: true,
        message: 'Authentication successful',
        user: authContext.user,
        timestamp: new Date().toISOString(),
      })
    })
  } catch (error: unknown) {
    console.error('Test auth error:', error)

    if (error instanceof Error && error.name === 'AuthenticationError') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AUTHENTICATION_ERROR',
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
          success: false,
          error: {
            code: 'AUTHORIZATION_ERROR',
            message: error.message,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 403 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    )
  }
}
