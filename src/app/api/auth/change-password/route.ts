import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { withAuth } from '@/lib/auth-middleware'

export async function PUT(request: NextRequest) {
  try {
    return await withAuth(request, async (authContext) => {
      const body = await request.json()
      const { currentPassword, newPassword } = body

      if (!currentPassword || !newPassword) {
        return NextResponse.json(
          { error: { message: 'Current password and new password are required' } },
          { status: 400 }
        )
      }

      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: { message: 'New password must be at least 6 characters long' } },
          { status: 400 }
        )
      }

      // Get user from database
      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('id, password_hash, auth_id, email')
        .eq('id', authContext.user.id)
        .single()

      if (userError || !user) {
        return NextResponse.json(
          { error: { message: 'User not found' } },
          { status: 404 }
        )
      }

      // Verify current password if legacy password_hash exists
      if (user.password_hash) {
        const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash)
        if (!isValidPassword) {
          return NextResponse.json(
            { error: { message: 'Current password is incorrect' } },
            { status: 401 }
          )
        }
      }

      // Update in Supabase Auth if auth_id exists
      if (user.auth_id) {
        const { error: supabaseAuthError } = await supabaseAdmin.auth.admin.updateUserById(user.auth_id, {
          password: newPassword
        })
        if (supabaseAuthError) {
          console.error('Error updating password in Supabase Auth:', supabaseAuthError)
        }
      }

      // Update password_hash in public.users
      const saltRounds = 12
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds)

      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          password_hash: newPasswordHash,
          updated_at: new Date().toISOString()
        })
        .eq('id', authContext.user.id)

      if (updateError) {
        console.error('Password update error:', updateError)
        return NextResponse.json(
          { error: { message: 'Failed to update password' } },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Password changed successfully in Supabase Auth'
      })
    })
  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json(
      { error: { message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
