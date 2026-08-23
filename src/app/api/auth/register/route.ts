import { NextRequest, NextResponse } from 'next/server'
import { userOperations, auditLogOperations } from '@/lib/supabase-client'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createUserSchema } from '@/utils/validation'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validatedData = createUserSchema.validateSync(body)
    const email = validatedData.email || `${validatedData.username}@example.com`

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
      roleId = validatedData.role_id
      const { data: roleData } = await supabaseAdmin
        .from('roles')
        .select('id, name')
        .eq('id', roleId)
        .single()
      if (roleData) roleName = roleData.name
    } else if (validatedData.role) {
      roleName = validatedData.role
      const { data: roleData } = await supabaseAdmin
        .from('roles')
        .select('id')
        .eq('name', roleName)
        .single()
      if (roleData) roleId = roleData.id
    } else {
      const { data: roleData } = await supabaseAdmin
        .from('roles')
        .select('id')
        .eq('name', 'user')
        .single()
      if (roleData) roleId = roleData.id
    }

    // 1. Create account in Supabase Auth (auth.users)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: validatedData.password,
      email_confirm: true,
      user_metadata: {
        username: validatedData.username,
        full_name: validatedData.full_name,
        role: roleName,
      }
    })

    if (authError || !authData.user) {
      console.error('Error creating user in Supabase Auth:', authError)
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: `Supabase Auth error: ${authError?.message || 'Failed to create user'}` } },
        { status: 500 }
      )
    }

    const authId = authData.user.id
    const saltRounds = 12
    const password_hash = await bcrypt.hash(validatedData.password, saltRounds)

    // 2. Create record in public.users
    const { data: user, error: createError } = await supabaseAdmin
      .from('users')
      .insert({
        username: validatedData.username,
        email,
        password_hash,
        full_name: validatedData.full_name,
        role_id: roleId,
        auth_id: authId,
        role: roleName
      })
      .select('id, username, email, full_name, role_id, auth_id, created_at, updated_at')
      .single()

    if (createError || !user) {
      console.error('Error creating public.user:', createError)
      // Cleanup auth.user if public creation failed
      await supabaseAdmin.auth.admin.deleteUser(authId)
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to create user record' } },
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
          auth_id: authId,
          role_name: roleName,
          created_at: user.created_at
        },
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
      })
    } catch (auditError) {
      console.error('Failed to create audit log:', auditError)
    }

    return NextResponse.json({
      user: {
        ...user,
        role: roleName
      },
      message: 'User registered successfully with Supabase Auth'
    }, { status: 201 })

  } catch (error: unknown) {
    console.error('Registration error:', error)

    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: error.message } },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Registration failed' } },
      { status: 500 }
    )
  }
}
