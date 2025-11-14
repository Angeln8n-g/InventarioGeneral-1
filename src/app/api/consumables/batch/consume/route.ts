import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { auditLogOperations } from '@/lib/supabase-client'
import { withAuth } from '@/lib/auth-middleware'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'

interface BatchConsumeRequest {
    consumptions: Array<{
        item_type_id: number
        quantity: number
        notes?: string
    }>
}

interface BatchConsumeResult {
    item_type_id: number
    success: boolean
    data?: unknown
    error?: string
}

export async function POST(request: NextRequest) {
    try {
        return await withAuth(request, async (authContext) => {
            const body: BatchConsumeRequest = await request.json()

            if (!body.consumptions || !Array.isArray(body.consumptions) || body.consumptions.length === 0) {
                return NextResponse.json(
                    {
                        error: {
                            code: ERROR_CODES.VALIDATION_ERROR,
                            message: 'consumptions array is required and must not be empty',
                            timestamp: new Date().toISOString(),
                        },
                    },
                    { status: 400 }
                )
            }

            // Validate all consumptions
            for (const consumption of body.consumptions) {
                if (!consumption.item_type_id || typeof consumption.item_type_id !== 'number') {
                    return NextResponse.json(
                        {
                            error: {
                                code: ERROR_CODES.VALIDATION_ERROR,
                                message: 'Each consumption must have a valid item_type_id',
                                timestamp: new Date().toISOString(),
                            },
                        },
                        { status: 400 }
                    )
                }

                if (!consumption.quantity || typeof consumption.quantity !== 'number' || consumption.quantity <= 0) {
                    return NextResponse.json(
                        {
                            error: {
                                code: ERROR_CODES.VALIDATION_ERROR,
                                message: 'Each consumption must have a valid positive quantity',
                                timestamp: new Date().toISOString(),
                            },
                        },
                        { status: 400 }
                    )
                }
            }

            // Process consumptions in parallel with Promise.allSettled
            const results = await Promise.allSettled(
                body.consumptions.map(async (consumption): Promise<BatchConsumeResult> => {
                    try {
                        // Get consumable stock by item_type_id
                        const { data: stock, error: stockError } = await supabase
                            .from('consumable_stock')
                            .select(`
                *,
                item_type:item_types(*)
              `)
                            .eq('item_type_id', consumption.item_type_id)
                            .single()

                        if (stockError || !stock) {
                            return {
                                item_type_id: consumption.item_type_id,
                                success: false,
                                error: 'Consumable not found',
                            }
                        }

                        // Check if enough stock is available
                        if (stock.current_quantity < consumption.quantity) {
                            return {
                                item_type_id: consumption.item_type_id,
                                success: false,
                                error: `Insufficient stock. Available: ${stock.current_quantity}, Requested: ${consumption.quantity}`,
                            }
                        }

                        // Update stock quantity
                        const newQuantity = stock.current_quantity - consumption.quantity
                        const { error: updateError } = await supabase
                            .from('consumable_stock')
                            .update({
                                current_quantity: newQuantity,
                                updated_at: new Date().toISOString(),
                            })
                            .eq('id', stock.id)

                        if (updateError) {
                            console.error('Failed to update stock:', updateError)
                            return {
                                item_type_id: consumption.item_type_id,
                                success: false,
                                error: 'Failed to update stock',
                            }
                        }

                        // Create stock movement record (non-blocking)
                        void (async () => {
                            try {
                                await supabase
                                    .from('stock_movements')
                                    .insert({
                                        consumable_stock_id: stock.id,
                                        movement_type: 'consumption',
                                        quantity: -consumption.quantity, // Negative for consumption
                                        user_id: authContext.user.id,
                                        notes: consumption.notes || `Consumed via batch operation`,
                                    })
                            } catch (err) {
                                console.error('Stock movement error:', err)
                            }
                        })()

                        // Create audit log (non-blocking)
                        void (async () => {
                            try {
                                await auditLogOperations.create({
                                    user_id: authContext.user.id,
                                    action: 'consumable_consume_batch',
                                    entity_type: 'consumable_stock',
                                    entity_id: stock.id,
                                    old_values: { current_quantity: stock.current_quantity },
                                    new_values: { current_quantity: newQuantity, quantity_consumed: consumption.quantity },
                                    ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
                                    user_agent: request.headers.get('user-agent') || 'unknown',
                                })
                            } catch (err) {
                                console.error('Audit log error:', err)
                            }
                        })()

                        // Check if stock is low and create notification (non-blocking)
                        if (newQuantity <= stock.minimum_threshold && newQuantity > 0) {
                            void (async () => {
                                try {
                                    const { data: admins } = await supabase
                                        .from('users')
                                        .select('id')
                                        .eq('role', 'admin')

                                    if (admins && admins.length > 0) {
                                        const notifications = admins.map(admin => ({
                                            user_id: admin.id,
                                            type: 'low_stock',
                                            title: 'Low Stock Alert',
                                            message: `${stock.item_type.name} is running low. Current stock: ${newQuantity} ${stock.unit_of_measure || 'units'}`,
                                        }))

                                        await supabase.from('notifications').insert(notifications)
                                    }
                                } catch (err) {
                                    console.error('Notification error:', err)
                                }
                            })()
                        }

                        return {
                            item_type_id: consumption.item_type_id,
                            success: true,
                            data: {
                                item_type: stock.item_type,
                                previous_quantity: stock.current_quantity,
                                consumed_quantity: consumption.quantity,
                                remaining_quantity: newQuantity,
                                unit_of_measure: stock.unit_of_measure,
                                is_low_stock: newQuantity <= stock.minimum_threshold,
                            },
                        }
                    } catch (error) {
                        console.error(`Failed to consume item ${consumption.item_type_id}:`, error)
                        return {
                            item_type_id: consumption.item_type_id,
                            success: false,
                            error: error instanceof Error ? error.message : 'Unknown error occurred',
                        }
                    }
                })
            )

            // Process results
            const processed: unknown[] = []
            const failed: Array<{ item_type_id: number; error: string }> = []

            results.forEach((result) => {
                if (result.status === 'fulfilled') {
                    if (result.value.success) {
                        processed.push(result.value.data)
                    } else {
                        failed.push({
                            item_type_id: result.value.item_type_id,
                            error: result.value.error || 'Unknown error',
                        })
                    }
                } else {
                    failed.push({
                        item_type_id: 0,
                        error: result.reason?.message || 'Promise rejected',
                    })
                }
            })

            const allSuccess = failed.length === 0
            const statusCode = allSuccess ? 200 : (processed.length > 0 ? 207 : 400)

            return NextResponse.json({
                success: allSuccess,
                data: {
                    processed,
                    failed,
                    summary: {
                        total: body.consumptions.length,
                        successful: processed.length,
                        failed: failed.length,
                    },
                },
                message: allSuccess
                    ? `Successfully consumed ${processed.length} item(s)`
                    : `Processed ${processed.length} of ${body.consumptions.length} consumptions successfully`,
            }, { status: statusCode })
        })
    } catch (error: unknown) {
        console.error('Batch consume error:', error)

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
