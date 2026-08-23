import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { withPermission } from '@/lib/auth-middleware'
import { PERMISSIONS } from '@/lib/permissions'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'

export async function GET(request: NextRequest) {
  try {
    return await withPermission(request, PERMISSIONS.USERS_VIEW_ALL, async (authContext) => {
      const { searchParams } = new URL(request.url)
      const role = searchParams.get('role')

      // Get all users from database via supabaseAdmin (bypassing RLS for admin API)
      const { data: users, error } = await supabaseAdmin
        .from('users')
        .select('id, username, email, full_name, role, auth_id, created_at, updated_at')
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      // Filter by role if specified
      let filteredUsers = users || []
      if (role && role !== 'all') {
        filteredUsers = (users || []).filter((user) => user.role === role)
      }

      // Summary statistics
      const roleSummary = (users || []).reduce((acc: Record<string, number>, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      return NextResponse.json({
        data: filteredUsers,
        total: filteredUsers.length,
        filters: { role },
        summary: {
          by_role: roleSummary,
          total_users: (users || []).length,
        },
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

    console.error('Users fetch error:', error)

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
