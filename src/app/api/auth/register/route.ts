import { NextRequest, NextResponse } from 'next/server'
import { userOperations, auditLogOperations } from '@/lib/supabase-client'
import { createUserSchema } from '@/utils/validation'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = createUserSchema.validateSync(body)
    
    // Check if username already exists
    const existingUser = await userOperations.getByUsername(validatedData.username)
    if (existingUser) {
      return NextResponse.json(
        { error: { code: 'CONFLICT', message: 'Username already exists' } },
        { status: 409 }
      )
    }
    
    // Hash password
    const saltRounds = 12
    const password_hash = await bcrypt.hash(validatedData.password, saltRounds)
    
    // Create user
    const user = await userOperations.create({
      username: validatedData.username,
      email: validatedData.email || `${validatedData.username}@example.com`,
      password_hash,
      full_name: validatedData.full_name,
      role: validatedData.role || 'user',
    })
    
    // Create audit log
    try {
      await auditLogOperations.create({
        user_id: user.id,
        action: 'create',
        entity_type: 'user',
        entity_id: user.id,
        new_values: { 
          username: user.username, 
          email: user.email, 
          role: user.role,
          created_at: user.created_at 
        },
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
      })
    } catch (auditError) {
      console.error('Failed to create audit log:', auditError)
      // Don't fail the registration if audit logging fails
    }
    
    // Return user data (without password)
    const { password_hash: _password_hash, ...userWithoutPassword } = user
    
    return NextResponse.json({
      user: userWithoutPassword,
      message: 'User registered successfully'
    }, { status: 201 })
    
  } catch (error: unknown) {
    console.error('Registration error:', error)
    
    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: error.message } },
        { status: 400 }
      )
    }
    
    if (error && typeof error === 'object' && 'code' in error && error.code === '23505') { // PostgreSQL unique violation
      return NextResponse.json(
        { error: { code: 'CONFLICT', message: 'Username or email already exists' } },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Registration failed' } },
      { status: 500 }
    )
  }
}