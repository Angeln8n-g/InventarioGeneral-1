import { NextRequest, NextResponse } from 'next/server'
import { userOperations } from '@/lib/supabase-client'
import { auditLogOperations } from '@/lib/supabase-client'
import { loginSchema } from '@/utils/validation'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { loginRateLimiter } from '@/middleware/rate-limit'

const JWT_SECRET = process.env.JWT_SECRET as string

if (!JWT_SECRET) {
  throw new Error(
    '🔒 SECURITY ERROR: JWT_SECRET environment variable is required!\n' +
    'Generate a secure secret with: openssl rand -base64 32\n' +
    'Add it to your .env file: JWT_SECRET=your_generated_secret'
  )
}

export async function POST(request: NextRequest) {
  // Aplicar rate limiting
  const rateLimitResponse = await loginRateLimiter(request)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const body = await request.json()
    console.log('📝 Login attempt for username:', body.username)
    
    // Validate input
    const validatedData = loginSchema.validateSync(body)
    console.log('✅ Validation passed')
    
    // Find user by username
    console.log('🔍 Looking up user in database...')
    const user = await userOperations.getByUsername(validatedData.username)
    console.log('👤 User found:', user ? `Yes (id: ${user.id})` : 'No')
    
    if (!user) {
      console.log('❌ User not found in database')
      return NextResponse.json(
        { error: { code: 'AUTHENTICATION_ERROR', message: 'Invalid credentials' } },
        { status: 401 }
      )
    }
    
    // Verify password
    console.log('🔐 Verifying password...')
    const isValidPassword = await bcrypt.compare(validatedData.password, user.password_hash)
    console.log('🔑 Password valid:', isValidPassword)
    
    if (!isValidPassword) {
      console.log('❌ Invalid password')
      return NextResponse.json(
        { error: { code: 'AUTHENTICATION_ERROR', message: 'Invalid credentials' } },
        { status: 401 }
      )
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    )
    
    // Create audit log
    try {
      await auditLogOperations.create({
        user_id: user.id,
        action: 'login',
        entity_type: 'user',
        entity_id: user.id,
        new_values: { login_time: new Date().toISOString() },
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
      })
    } catch (auditError) {
      console.error('Failed to create audit log:', auditError)
      // Don't fail the login if audit logging fails
    }
    
    // Return user data (without password) and token
    const { password_hash: _password_hash, ...userWithoutPassword } = user
    
    return NextResponse.json({
      user: userWithoutPassword,
      token,
      message: 'Login successful'
    })
    
  } catch (error: unknown) {
    console.error('❌ Login error:', error)
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    
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