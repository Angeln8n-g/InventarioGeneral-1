import { NextRequest, NextResponse } from 'next/server'
import { loanOperations, toolInstanceOperations, auditLogOperations, notificationOperations, supabase } from '@/lib/supabase-client'
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

            let body: any = {}
            try {
                body = await request.json()
            } catch {
                body = {}
            }
            const returnNotes = body.notes || ''
            const toolStatus = body.tool_status || 'available'

            // Try Atomic RPC execution
            try {
                const { data: rpcResult, error: rpcError } = await supabase.rpc('return_tool_atomic', {
                    p_loan_id: loanId,
                    p_condition_notes: returnNotes || null,
                    p_tool_status: toolStatus,
                })

                if (!rpcError && rpcResult && rpcResult.success) {
                    const isOverdue = new Date(loan.due_date) < new Date()
                    notificationOperations.create({
                        user_id: authContext.user.id,
                        type: 'return_confirmation',
                        title: 'Tool Returned Successfully',
                        message: `You have successfully returned ${loan.tool_instance?.item_type?.name || 'the tool'}${isOverdue ? ' (was overdue)' : ''}.`,
                    }).catch(err => console.error('Notification error:', err))

                    return NextResponse.json({
                        data: {
                            ...loan,
                            status: 'returned',
                            return_date: rpcResult.return_date,
                        },
                        message: SUCCESS_MESSAGES.TOOL_RETURNED,
                    })
                }
            } catch (rpcErr) {
                console.warn('return_tool_atomic RPC unavailable, falling back to application transaction logic:', rpcErr)
            }

            // Fallback
            const updatedLoan = await loanOperations.returnTool(loanId)

            await toolInstanceOperations.updateStatus(
                loan.tool_instance_id,
                toolStatus,
                `Returned by ${authContext.user.username} on ${new Date().toISOString()}${returnNotes ? `. Notes: ${returnNotes}` : ''}`
            )

            const isOverdue = new Date(loan.due_date) < new Date()
            notificationOperations.create({
                user_id: authContext.user.id,
                type: 'return_confirmation',
                title: 'Tool Returned Successfully',
                message: `You have successfully returned ${loan.tool_instance?.item_type?.name || 'the tool'}${isOverdue ? ' (was overdue)' : ''}.`,
            }).catch(err => console.error('Notification error:', err))

            return NextResponse.json({
                data: updatedLoan,
                message: SUCCESS_MESSAGES.TOOL_RETURNED,
            })
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