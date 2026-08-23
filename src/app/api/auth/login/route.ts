import { NextRequest, NextResponse } from 'next/server'
import { userOperations, auditLogOperations } from '@/lib/supabase-client'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { supabase } from '@/lib/supabase'
import { ensureSupabaseAuthUser } from '@/lib/auth-supabase-sync'
import { loginSchema } from '@/utils/validation'
import bcrypt from 'bcryptjs'
import { loginRateLimiter } from '@/middleware/rate-limit'

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await loginRateLimiter(request)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const body = await request.json()
    console.log('📝 Login attempt for identifier:', body.username)

    // Validate input
    const validatedData = loginSchema.validateSync(body)
    const identifier = validatedData.username.trim()
    const password = validatedData.password

    // 1. Find user in public.users by username or email
    let user = await userOperations.getByUsername(identifier)
    if (!user && identifier.includes('@')) {
      const { data: userByEmail } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', identifier)
        .maybeSingle()
      user = userByEmail
    }

    if (!user) {
      console.log('❌ User not found in database')
      return NextResponse.json(
        { error: { code: 'AUTHENTICATION_ERROR', message: 'Invalid credentials' } },
        { status: 401 }
      )
    }

    // 2. Verify legacy bcrypt password if present
    if (user.password_hash) {
      const isValidPassword = await bcrypt.compare(password, user.password_hash)
      if (!isValidPassword) {
        console.log('❌ Password mismatch')
        return NextResponse.json(
          { error: { code: 'AUTHENTICATION_ERROR', message: 'Invalid credentials' } },
          { status: 401 }
        )
      }
    }

    // 3. Ensure user account is synced in Supabase Auth (auth.users)
    try {
      await ensureSupabaseAuthUser(user, password)
    } catch (syncError) {
      console.error('⚠️ Auth sync warning:', syncError)
    }

    // 4. Authenticate via Supabase Auth
    const userEmail = user.email || `${user.username}@example.com`
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: password
    })

    let token = authData?.session?.access_token

    // Fallback: If signInWithPassword fails due to email confirmation or auth config, issue session via admin
    if (authError || !token) {
      console.warn('Supabase Auth signInWithPassword notice:', authError?.message)
      if (user.auth_id) {
        const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
          type: 'magiclink',
          email: userEmail,
        })
        token = linkData?.properties?.hashed_token || token
      }
    }

    // 5. Create audit log
    try {
      await auditLogOperations.create({
        user_id: user.id,
        action: 'login',
        entity_type: 'user',
        entity_id: user.id,
        new_values: { login_time: new Date().toISOString(), auth_provider: 'supabase_auth' },
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
      })
    } catch (auditError) {
      console.error('Failed to create audit log:', auditError)
    }

    // Prepare clean user payload
    const { password_hash: _password_hash, ...userWithoutPassword } = user

    return NextResponse.json({
      user: {
        ...userWithoutPassword,
        auth_id: user.auth_id || authData?.user?.id
      },
      token: authData?.session?.access_token || token,
      session: authData?.session,
      message: 'Login successful via Supabase Auth'
    })

  } catch (error: unknown) {
    console.error('❌ Login error:', error)

    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: error.message } },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Login failed', details: error instanceof Error ? error.message : String(error) } },
      { status: 500 }
    )
  }
}