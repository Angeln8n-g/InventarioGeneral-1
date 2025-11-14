import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { withPermission } from '@/lib/auth-middleware'
import { PERMISSIONS } from '@/lib/permissions'
import { auditLogOperations } from '@/lib/supabase-client'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'

/**
 * GET /api/admin/users/[id]
 * Get a specific user by ID
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        return await withPermission(request, PERMISSIONS.USERS_VIEW_ALL, async (authContext) => {
            const { id } = await params
            const userId = parseInt(id, 10)

            if (isNaN(userId)) {
                return NextResponse.json(
                    {
                        error: {
                            code: ERROR_CODES.VALIDATION_ERROR,
                            message: 'Invalid user ID',
                            timestamp: new Date().toISOString(),
                        },
                    },
                    { status: 400 }
                )
            }

            // Get user from database
            const { data: user, error } = await supabase
                .from('users')
                .select('id, username, email, role, full_name, created_at, updated_at')
                .eq('id', userId)
                .single()

            if (error || !user) {
                return NextResponse.json(
                    {
                        error: {
                            code: ERROR_CODES.NOT_FOUND,
                            message: 'User not found',
                            timestamp: new Date().toISOString(),
                        },
                    },
                    { status: 404 }
                )
            }

            return NextResponse.json({
                data: user,
            })
        })
    } catch (error: unknown) {
        console.error('User fetch error:', error)

        if (error instanceof Error && error.name === 'AuthenticationError') {
            return NextResponse.json(
                {
                    error: {
                        code: ERROR_CODES.AUTHENTICATION_ERROR,
                        message: error.message,
                        timestamp: new Date().toISOString(),
                    },
                },
                { status: 401 }
            )
        }

        if (error instanceof Error && error.name === 'AuthorizationError') {
            return NextResponse.json(
                {
                    error: {
                        code: ERROR_CODES.AUTHORIZATION_ERROR,
                        message: error.message,
                        timestamp: new Date().toISOString(),
                    },
                },
                { status: 403 }
            )
        }

        return NextResponse.json(
            {
                error: {
                    code: ERROR_CODES.DATABASE_ERROR,
                    message: ERROR_MESSAGES.GENERIC_ERROR,
                    timestamp: new Date().toISOString(),
                },
            },
            { status: 500 }
        )
    }
}

/**
 * PUT /api/admin/users/[id]
 * Update a user's information
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        return await withPermission(request, PERMISSIONS.USERS_MANAGE, async (authContext) => {
            const { id } = await params
            const userId = parseInt(id, 10)

            if (isNaN(userId)) {
                return NextResponse.json(
                    {
                        error: {
                            code: ERROR_CODES.VALIDATION_ERROR,
                            message: 'Invalid user ID',
                            timestamp: new Date().toISOString(),
                        },
                    },
                    { status: 400 }
                )
            }

            const body = await request.json()
            const { email, role, full_name } = body

            // Validate input
            if (!email && !role && !full_name) {
                return NextResponse.json(
                    {
                        error: {
                            code: ERROR_CODES.VALIDATION_ERROR,
                            message: 'At least one field (email, role, or full_name) is required',
                            timestamp: new Date().toISOString(),
                        },
                    },
                    { status: 400 }
                )
            }

            // Validate role if provided
            if (role && !['admin', 'user'].includes(role)) {
                return NextResponse.json(
                    {
                        error: {
                            code: ERROR_CODES.VALIDATION_ERROR,
                            message: 'Invalid role. Must be "admin" or "user"',
                            timestamp: new Date().toISOString(),
                        },
                    },
                    { status: 400 }
                )
            }

            // Validate email format if provided
            if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                return NextResponse.json(
                    {
                        error: {
                            code: ERROR_CODES.VALIDATION_ERROR,
                            message: 'Invalid email format',
                            timestamp: new Date().toISOString(),
                        },
                    },
                    { status: 400 }
                )
            }

            // Get current user data for audit log
            const { data: currentUser, error: fetchError } = await supabase
                .from('users')
                .select('id, username, email, role, full_name')
                .eq('id', userId)
                .single()

            if (fetchError || !currentUser) {
                return NextResponse.json(
                    {
                        error: {
                            code: ERROR_CODES.NOT_FOUND,
                            message: 'User not found',
                            timestamp: new Date().toISOString(),
                        },
                    },
                    { status: 404 }
                )
            }

            // Prevent user from changing their own role
            if (userId === authContext.user.id && role && role !== currentUser.role) {
                return NextResponse.json(
                    {
                        error: {
                            code: ERROR_CODES.AUTHORIZATION_ERROR,
                            message: 'You cannot change your own role',
                            timestamp: new Date().toISOString(),
                        },
                    },
                    { status: 403 }
                )
            }

            // Check if email is already taken by another user
            if (email && email !== currentUser.email) {
                const { data: existingUser } = await supabase
                    .from('users')
                    .select('id')
                    .eq('email', email)
                    .neq('id', userId)
                    .single()

                if (existingUser) {
                    return NextResponse.json(
                        {
                            error: {
                                code: ERROR_CODES.VALIDATION_ERROR,
                                message: 'Email is already taken',
                                timestamp: new Date().toISOString(),
                            },
                        },
                        { status: 400 }
                    )
                }
            }

            // Build update object
            const updateData: Record<string, unknown> = {
                updated_at: new Date().toISOString(),
            }

            if (email) updateData.email = email
            if (role) updateData.role = role
            if (full_name !== undefined) updateData.full_name = full_name

            // Update user
            const { data: updatedUser, error: updateError } = await supabase
                .from('users')
                .update(updateData)
                .eq('id', userId)
                .select('id, username, email, role, full_name, created_at, updated_at')
                .single()

            if (updateError) {
                throw updateError
            }

            // Create audit log
            try {
                await auditLogOperations.create({
                    user_id: authContext.user.id,
                    action: 'user_update',
                    entity_type: 'user',
                    entity_id: userId,
                    old_values: {
                        email: currentUser.email,
                        role: currentUser.role,
                        full_name: currentUser.full_name,
                    },
                    new_values: {
                        email: updatedUser.email,
                        role: updatedUser.role,
                        full_name: updatedUser.full_name,
                    },
                    ip_address:
                        request.headers.get('x-forwarded-for') ||
                        request.headers.get('x-real-ip') ||
                        'unknown',
                    user_agent: request.headers.get('user-agent') || 'unknown',
                })
            } catch (auditError) {
                console.error('Failed to create audit log:', auditError)
            }

            return NextResponse.json({
                data: updatedUser,
                message: 'User updated successfully',
            })
        })
    } catch (error: unknown) {
        console.error('User update error:', error)

        if (error instanceof Error && error.name === 'AuthenticationError') {
            return NextResponse.json(
                {
                    error: {
                        code: ERROR_CODES.AUTHENTICATION_ERROR,
                        message: error.message,
                        timestamp: new Date().toISOString(),
                    },
                },
                { status: 401 }
            )
        }

        if (error instanceof Error && error.name === 'AuthorizationError') {
            return NextResponse.json(
                {
                    error: {
                        code: ERROR_CODES.AUTHORIZATION_ERROR,
                        message: error.message,
                        timestamp: new Date().toISOString(),
                    },
                },
                { status: 403 }
            )
        }

        return NextResponse.json(
            {
                error: {
                    code: ERROR_CODES.DATABASE_ERROR,
                    message: ERROR_MESSAGES.GENERIC_ERROR,
                    timestamp: new Date().toISOString(),
                },
            },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/admin/users/[id]
 * Delete a user (soft delete by setting inactive status)
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        return await withPermission(request, PERMISSIONS.USERS_MANAGE, async (authContext) => {
            const { id } = await params
            const userId = parseInt(id, 10)

            if (isNaN(userId)) {
                return NextResponse.json(
                    {
                        error: {
                            code: ERROR_CODES.VALIDATION_ERROR,
                            message: 'Invalid user ID',
                            timestamp: new Date().toISOString(),
                        },
                    },
                    { status: 400 }
                )
            }

            // Prevent user from deleting themselves
            if (userId === authContext.user.id) {
                return NextResponse.json(
                    {
                        error: {
                            code: ERROR_CODES.AUTHORIZATION_ERROR,
                            message: 'You cannot delete your own account',
                            timestamp: new Date().toISOString(),
                        },
                    },
                    { status: 403 }
                )
            }

            // Get user data for audit log
            const { data: user, error: fetchError } = await supabase
                .from('users')
                .select('id, username, email, role')
                .eq('id', userId)
                .single()

            if (fetchError || !user) {
                return NextResponse.json(
                    {
                        error: {
                            code: ERROR_CODES.NOT_FOUND,
                            message: 'User not found',
                            timestamp: new Date().toISOString(),
                        },
                    },
                    { status: 404 }
                )
            }

            // Delete user (CASCADE will handle related records)
            const { error: deleteError } = await supabase.from('users').delete().eq('id', userId)

            if (deleteError) {
                throw deleteError
            }

            // Create audit log
            try {
                await auditLogOperations.create({
                    user_id: authContext.user.id,
                    action: 'user_delete',
                    entity_type: 'user',
                    entity_id: userId,
                    old_values: {
                        username: user.username,
                        email: user.email,
                        role: user.role,
                    },
                    new_values: null,
                    ip_address:
                        request.headers.get('x-forwarded-for') ||
                        request.headers.get('x-real-ip') ||
                        'unknown',
                    user_agent: request.headers.get('user-agent') || 'unknown',
                })
            } catch (auditError) {
                console.error('Failed to create audit log:', auditError)
            }

            return NextResponse.json({
                message: 'User deleted successfully',
            })
        })
    } catch (error: unknown) {
        console.error('User delete error:', error)

        if (error instanceof Error && error.name === 'AuthenticationError') {
            return NextResponse.json(
                {
                    error: {
                        code: ERROR_CODES.AUTHENTICATION_ERROR,
                        message: error.message,
                        timestamp: new Date().toISOString(),
                    },
                },
                { status: 401 }
            )
        }

        if (error instanceof Error && error.name === 'AuthorizationError') {
            return NextResponse.json(
                {
                    error: {
                        code: ERROR_CODES.AUTHORIZATION_ERROR,
                        message: error.message,
                        timestamp: new Date().toISOString(),
                    },
                },
                { status: 403 }
            )
        }

        return NextResponse.json(
            {
                error: {
                    code: ERROR_CODES.DATABASE_ERROR,
                    message: ERROR_MESSAGES.GENERIC_ERROR,
                    timestamp: new Date().toISOString(),
                },
            },
            { status: 500 }
        )
    }
}
