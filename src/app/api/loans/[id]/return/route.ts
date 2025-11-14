import { NextRequest, NextResponse } from 'next/server'
import { loanOperations, toolInstanceOperations, auditLogOperations, notificationOperations } from '@/lib/supabase-client'
import { withAuth } from '@/lib/auth-middleware'
import { canReturnTool } from '@/lib/permissions'
import { ERROR_CODES, ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/utils/constants'

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params
        return await withAuth(request, async (authContext) => {
            const loanId = parseInt(resolvedParams.id, 10)

            if (isNaN(loanId)) {
                return NextResponse.json(
                    {
                        error: {
                            code: ERROR_CODES.VALIDATION_ERROR,
                            message: 'Invalid loan ID',
                            timestamp: new Date().toISOString(),
                        },
                    },
                    { status: 400 }
                )
            }

            // Get loan information
            const loan = await loanOperations.getById(loanId)

            if (!loan) {
                return NextResponse.json(
                    {
                        error: {
                            code: ERROR_CODES.NOT_FOUND,
                            message: 'Loan not found',
                            timestamp: new Date().toISOString(),
                        },
                    },
                    { status: 404 }
                )
            }

            // Check if user can return this tool
            if (!canReturnTool(authContext.user, loan.user_id)) {
                return NextResponse.json(
                    {
                        error: {
                            code: ERROR_CODES.AUTHORIZATION_ERROR,
                            message: ERROR_MESSAGES.UNAUTHORIZED_RETURN,
                            timestamp: new Date().toISOString(),
                        },
                    },
                    { status: 403 }
                )
            }

            // Check if loan is already returned
            if (loan.status === 'returned') {
                return NextResponse.json(
                    {
                        error: {
                            code: ERROR_CODES.CONFLICT,
                            message: 'Loan has already been returned',
                            details: {
                                return_date: loan.return_date,
                            },
                            timestamp: new Date().toISOString(),
                        },
                    },
                    { status: 409 }
                )
            }

            // Check if loan is lost
            if (loan.status === 'lost') {
                return NextResponse.json(
                    {
                        error: {
                            code: ERROR_CODES.CONFLICT,
                            message: 'Cannot return a loan marked as lost',
                            timestamp: new Date().toISOString(),
                        },
                    },
                    { status: 409 }
                )
            }

            const body = await request.json()
            const returnNotes = body.notes || ''

            try {
                // Start transaction-like operations
                // 1. Update loan status to returned
                const updatedLoan = await loanOperations.returnTool(loanId)

                // 2. Update tool status back to available
                await toolInstanceOperations.updateStatus(
                    loan.tool_instance_id,
                    'available',
                    `Returned by ${authContext.user.username} on ${new Date().toISOString()}${returnNotes ? `. Notes: ${returnNotes}` : ''}`
                )

                // 3. Create audit log
                try {
                    await auditLogOperations.create({
                        user_id: authContext.user.id,
                        action: 'loan_return',
                        entity_type: 'loan',
                        entity_id: loanId,
                        old_values: {
                            status: loan.status,
                            return_date: loan.return_date,
                        },
                        new_values: {
                            status: 'returned',
                            return_date: new Date().toISOString(),
                            notes: returnNotes,
                        },
                        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
                        user_agent: request.headers.get('user-agent') || 'unknown',
                    })
                } catch (auditError) {
                    console.error('Failed to create audit log:', auditError)
                    // Don't fail the return if audit logging fails
                }

                // 4. Create notification for return confirmation
                try {
                    const isOverdue = new Date(loan.due_date) < new Date()
                    await notificationOperations.create({
                        user_id: authContext.user.id,
                        type: 'return_confirmation',
                        title: 'Tool Returned Successfully',
                        message: `You have successfully returned ${loan.tool_instance?.item_type?.name || 'the tool'}${isOverdue ? ' (was overdue)' : ''}.`,
                    })
                } catch (notificationError) {
                    console.error('Failed to create notification:', notificationError)
                    // Don't fail the return if notification fails
                }

                return NextResponse.json({
                    data: updatedLoan,
                    message: SUCCESS_MESSAGES.TOOL_RETURNED,
                })

            } catch (error: unknown) {
                console.error('Loan return transaction error:', error)

                return NextResponse.json(
                    {
                        error: {
                            code: ERROR_CODES.DATABASE_ERROR,
                            message: 'Failed to return tool. Please try again.',
                            timestamp: new Date().toISOString(),
                        },
                    },
                    { status: 500 }
                )
            }
        })
    } catch (error: unknown) {
        console.error('Loan return error:', error)

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