import { NextRequest, NextResponse } from 'next/server'
import { userOperations, auditLogOperations } from '@/lib/supabase-client'
import { createUserSchema } from '@/utils/validation'
import bcrypt from 'bcryptjs'
import { supabase } from '@/lib/supabase'

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
    let roleName: string = 'user'
    
    if (validatedData.role_id) {
      // Use provided role_id
      roleId = validatedData.role_id
      
      // Verify role exists and get name
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('id, name')
        .eq('id', roleId)
        .single()
      
      if (roleError || !roleData) {
        return NextResponse.json(
          { error: { code: 'VALIDATION_ERROR', message: 'Invalid role_id' } },
          { status: 400 }
        )
      }
      
      roleName = roleData.name
    } else if (validatedData.role) {
      // Legacy: convert role string to role_id
      roleName = validatedData.role
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('name', roleName)
        .single()
      
      if (roleError || !roleData) {
        return NextResponse.json(
          { error: { code: 'VALIDATION_ERROR', message: `Role '${roleName}' not found` } },
          { status: 400 }
        )
      }
      
      roleId = roleData.id
    } else {
      // Default to 'user' role
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('name', 'user')
        .single()
      
      if (roleError || !roleData) {
        return NextResponse.json(
          { error: { code: 'INTERNAL_ERROR', message: 'Default user role not found' } },
          { status: 500 }
        )
      }
      
      roleId = roleData.id
    }
    
    // Hash password
    const saltRounds = 12
    const password_hash = await bcrypt.hash(validatedData.password, saltRounds)
    
    // Create user with role_id
    const { data: user, error: createError } = await supabase
      .from('users')
      .insert({
        username: validatedData.username,
        email: validatedData.email || `${validatedData.username}@example.com`,
        password_hash,
        full_name: validatedData.full_name,
        role_id: roleId
      })
      .select('id, username, email, full_name, role_id, created_at, updated_at')
      .single()
    
    if (createError || !user) {
      console.error('Error creating user:', createError)
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to create user' } },
        { status: 500 }
      )
    }
    
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
