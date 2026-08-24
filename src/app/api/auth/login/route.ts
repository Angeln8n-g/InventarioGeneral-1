import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { userOperations, auditLogOperations } from '@/lib/supabase-client'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { supabase } from '@/lib/supabase'
import { ensureSupabaseAuthUser } from '@/lib/auth-supabase-sync'
import { loginSchema } from '@/utils/validation'
import bcrypt from 'bcryptjs'
import { loginRateLimiter } from '@/middleware/rate-limit'

const JWT_SECRET = process.env.JWT_SECRET || 'inventario_sgi_jwt_secret_key_default'

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

    // 4. Authenticate via Supabase Auth (with local JWT fallback)
    let token: string | undefined = undefined
    let authUserId: string | undefined = user.auth_id || undefined
    let sessionData: any = undefined

    try {
      const userEmail = user.email || `${user.username}@example.com`
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: password
      })

      if (!authError && authData?.session?.access_token) {
        token = authData.session.access_token
        sessionData = authData.session
        authUserId = authData.user?.id || user.auth_id || undefined
      }
    } catch (authErr) {
      console.warn('⚠️ Supabase Auth online login skipped or unavailable:', authErr instanceof Error ? authErr.message : authErr)
    }

    // Fallback: If no Supabase token was obtained, generate local JWT token
    if (!token && JWT_SECRET) {
      token = jwt.sign(
        { userId: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      )
    }

    if (!token) {
      return NextResponse.json(
        { error: { code: 'AUTHENTICATION_ERROR', message: 'Unable to issue authentication session' } },
        { status: 500 }
      )
    }

    // 5. Create audit log
    try {
      await auditLogOperations.create({
        user_id: user.id,
        action: 'login',
        entity_type: 'user',
        entity_id: user.id,
        new_values: { login_time: new Date().toISOString(), auth_provider: sessionData ? 'supabase_auth' : 'local_jwt' },
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
      })
    } catch (auditError) {
      console.error('Failed to create audit log:', auditError)
    }

    // Prepare clean user payload
    const { password_hash: _password_hash, ...userWithoutPassword } = user

    const response = NextResponse.json({
      user: {
        ...userWithoutPassword,
        auth_id: authUserId
      },
      token,
      session: sessionData,
      message: sessionData ? 'Login successful via Supabase Auth' : 'Login successful via Local Auth'
    })

    // Synchronize cookies for SSR and Next.js Edge Middleware
    response.cookies.set('auth-token', token, {
      httpOnly: false,
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
    })
    response.cookies.set('sb-access-token', token, {
      httpOnly: false,
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
    })

    return response

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