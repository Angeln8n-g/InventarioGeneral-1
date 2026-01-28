import { NextRequest, NextResponse } from 'next/server'
import { userOperations, auditLogOperations } from '@/lib/supabase-client'
import { createUserSchema } from '@/utils/validation'
import bcrypt from 'bcryptjs'
import { query } from '@/lib/db/client'

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
    
    // Determine role_id
    let roleId: number | undefined
    
    if (validatedData.role_id) {
      // Use provided role_id
      roleId = validatedData.role_id
      
      // Verify role exists
      const roleCheck = await query('SELECT id FROM roles WHERE id = $1', [roleId])
      if (roleCheck.rows.length === 0) {
        return NextResponse.json(
          { error: { code: 'VALIDATION_ERROR', message: 'Invalid role_id' } },
          { status: 400 }
        )
      }
    } else if (validatedData.role) {
      // Legacy: convert role string to role_id
      const roleName = validatedData.role
      const roleResult = await query('SELECT id FROM roles WHERE name = $1', [roleName])
      
      if (roleResult.rows.length === 0) {
        return NextResponse.json(
          { error: { code: 'VALIDATION_ERROR', message: `Role '${roleName}' not found` } },
          { status: 400 }
        )
      }
      
      roleId = roleResult.rows[0].id
    } else {
      // Default to 'user' role
      const roleResult = await query('SELECT id FROM roles WHERE name = $1', ['user'])
      if (roleResult.rows.length === 0) {
        return NextResponse.json(
          { error: { code: 'INTERNAL_ERROR', message: 'Default user role not found' } },
          { status: 500 }
        )
      }
      roleId = roleResult.rows[0].id
    }
    
    // Hash password
    const saltRounds = 12
    const password_hash = await bcrypt.hash(validatedData.password, saltRounds)
    
    // Create user with role_id
    const result = await query(
      `INSERT INTO users (username, email, password_hash, full_name, role_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, email, full_name, role_id, created_at, updated_at`,
      [
        validatedData.username,
        validatedData.email || `${validatedData.username}@example.com`,
        password_hash,
        validatedData.full_name,
        roleId
      ]
    )
    
    const user = result.rows[0]
    
    // Get role name for audit log
    const roleNameResult = await query('SELECT name FROM roles WHERE id = $1', [roleId])
    const roleName = roleNameResult.rows[0]?.name || 'unknown'
    
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
          role_id: user.role_id,
          role_name: roleName,
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
    return NextResponse.json({
      user: {
        ...user,
        role: roleName // Include role name for compatibility
      },
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