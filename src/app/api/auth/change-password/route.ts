import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabase } from '@/lib/supabase'
import { withAuth } from '@/lib/auth-middleware'

export async function PUT(request: NextRequest) {
  try {
    return await withAuth(request, async (authContext) => {
      // Get request body
      const body = await request.json()
      const { currentPassword, newPassword } = body

      // Validate input
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
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, password_hash')
        .eq('id', authContext.user.id)
        .single()

      if (userError || !user) {
        return NextResponse.json(
          { error: { message: 'User not found' } },
          { status: 404 }
        )
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash)
      
      if (!isValidPassword) {
        return NextResponse.json(
          { error: { message: 'Current password is incorrect' } },
          { status: 401 }
        )
      }

      // Hash new password
      const saltRounds = 12
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds)

      // Update password in database
      const { error: updateError } = await supabase
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
        message: 'Password changed successfully'
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


