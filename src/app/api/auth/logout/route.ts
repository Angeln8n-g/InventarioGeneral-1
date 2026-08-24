import { NextRequest, NextResponse } from 'next/server'
import { auditLogOperations } from '@/lib/supabase-client'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { authenticateRequest } from '@/lib/auth-middleware'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      try {
        const authContext = await authenticateRequest(request)

        if (authContext.user) {
          // Sign out token in Supabase Auth if applicable
          await supabaseAdmin.auth.admin.signOut(token).catch(() => {})

          // Audit log for logout
          await auditLogOperations.create({
            user_id: authContext.user.id,
            action: 'logout',
            entity_type: 'user',
            entity_id: authContext.user.id,
            new_values: { logout_time: new Date().toISOString() },
            ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
            user_agent: request.headers.get('user-agent') || 'unknown',
          }).catch(() => {})
        }
      } catch (authError) {
        console.warn('Notice during logout:', authError)
      }
    }

    const response = NextResponse.json({
      message: 'Logout successful'
    })

    // Clear session cookies
    response.cookies.set('auth-token', '', { path: '/', maxAge: 0 })
    response.cookies.set('sb-access-token', '', { path: '/', maxAge: 0 })
    response.cookies.set('token', '', { path: '/', maxAge: 0 })

    return response

  } catch (error: unknown) {
    console.error('Logout error:', error)

    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Logout failed' } },
      { status: 500 }
    )
  }
}