import { NextRequest, NextResponse } from 'next/server'
import { userOperations } from '@/lib/supabase-client'
import { withAuth } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    return await withAuth(request, async (authContext) => {
      const user = await userOperations.getById(authContext.user.id)

      if (!user) {
        return NextResponse.json(
          { error: { code: 'NOT_FOUND', message: 'User not found' } },
          { status: 404 }
        )
      }

      const { password_hash: _password_hash, ...userWithoutPassword } = user

      return NextResponse.json({
        user: {
          ...userWithoutPassword,
          role: authContext.user.role
        }
      })
    })
  } catch (error: unknown) {
    console.error('Profile fetch error:', error)

    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch profile' } },
      { status: 500 }
    )
  }
}