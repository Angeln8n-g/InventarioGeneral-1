import { supabaseAdmin } from './supabase-admin'
import { supabase } from './supabase'

export interface UserRecord {
  id: number
  username: string
  email: string
  role?: string
  auth_id?: string | null
}

/**
 * Ensures a public.users record has a corresponding auth.users account in Supabase Auth.
 * If auth_id is missing or user does not exist in auth.users, creates or updates the account in auth.users
 * and links auth_id in public.users.
 */
export async function ensureSupabaseAuthUser(
  user: UserRecord,
  password?: string
): Promise<string> {
  const email = user.email || `${user.username}@example.com`

  // 1. Check if user already has an auth_id and if it exists in auth.users
  if (user.auth_id) {
    const { data: authUserData, error: getAuthUserError } = await supabaseAdmin.auth.admin.getUserById(user.auth_id)
    if (!getAuthUserError && authUserData?.user) {
      // User exists in auth.users, update password if provided
      if (password) {
        await supabaseAdmin.auth.admin.updateUserById(user.auth_id, { password })
      }
      return user.auth_id
    }
  }

  // 2. Search for existing user in auth.users by email
  const { data: listData } = await supabaseAdmin.auth.admin.listUsers()
  const existingAuthUser = listData?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase())

  let authUserId: string

  if (existingAuthUser) {
    authUserId = existingAuthUser.id
    if (password) {
      await supabaseAdmin.auth.admin.updateUserById(authUserId, {
        password,
        user_metadata: { username: user.username, role: user.role }
      })
    }
  } else {
    // 3. Create user in auth.users
    const { data: newAuthData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: password || 'DefaultPassword123!',
      email_confirm: true,
      user_metadata: {
        username: user.username,
        role: user.role || 'user'
      }
    })

    if (createError || !newAuthData.user) {
      console.error('Error creating Supabase Auth user:', createError)
      throw new Error(`Failed to provision Supabase Auth account: ${createError?.message || 'Unknown error'}`)
    }

    authUserId = newAuthData.user.id
  }

  // 4. Link auth_id back to public.users
  const { error: updatePublicUserError } = await supabaseAdmin
    .from('users')
    .update({ auth_id: authUserId, email })
    .eq('id', user.id)

  if (updatePublicUserError) {
    console.error('Failed to link auth_id in public.users:', updatePublicUserError)
  }

  return authUserId
}
