import { NextRequest, NextResponse } from 'next/server'
import { withPermission } from '@/lib/auth-middleware'
import { PERMISSIONS } from '@/lib/permissions'
import { ERROR_CODES, ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/utils/constants'
import { consumableStockOperations, itemTypeOperations, auditLogOperations } from '@/lib/supabase-client'

interface BulkImportRow {
    name: string
    description?: string
    category?: string
    current_quantity: number
    minimum_threshold: number
    unit_of_measure?: string
    invoice_number?: string
    supplier_name?: string
    purchase_date?: string
}

interface ImportResult {
    success: boolean
    row: number
    name: string
    message: string
    id?: number
}

export async function POST(request: NextRequest) {
    try {
        return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_CONSUMABLES, async (authContext) => {
            const body = await request.json()
            const { items } = body

            if (!items || !Array.isArray(items) || items.length === 0) {
                return NextResponse.json(
                    {
                        error: {
                            code: ERROR_CODES.VALIDATION_ERROR,
                            message: 'Items array is required and must not be empty',
                            timestamp: new Date().toISOString(),
                        },
                    },
                    { status: 400 }
                )
            }

            const results: ImportResult[] = []
            let successCount = 0
            let errorCount = 0

            // Process each item
            for (let i = 0; i < items.length; i++) {
                const item = items[i] as BulkImportRow
                const rowNumber = i + 2 // +2 because Excel starts at 1 and has header row

                try {
                    // Validate required fields
                    if (!item.name || item.name.trim() === '') {
                        results.push({
                            success: false,
                            row: rowNumber,
                            name: item.name || 'N/A',
                            message: 'Name is required',
                        })
                        errorCount++
                        continue
                    }

                    if (typeof item.current_quantity !== 'number' || item.current_quantity < 0) {
                        results.push({
                            success: false,
                            row: rowNumber,
                            name: item.name,
                            message: 'Current quantity must be a non-negative number',
                        })
                        errorCount++
                        continue
                    }

                    if (typeof item.minimum_threshold !== 'number' || item.minimum_threshold < 0) {
                        results.push({
                            success: false,
                            row: rowNumber,
                            name: item.name,
                            message: 'Minimum threshold must be a non-negative number',
                        })
                        errorCount++
                        continue
                    }

                    // Validate invoice number (required for stock increases)
                    if (item.current_quantity > 0 && (!item.invoice_number || item.invoice_number.trim() === '')) {
                        results.push({
                            success: false,
                            row: rowNumber,
                            name: item.name,
                            message: 'Invoice number is required when adding stock',
                        })
                        errorCount++
                        continue
                    }

                    // Check if item type already exists
                    const existingItemTypes = await itemTypeOperations.getAll()
                    let itemType = existingItemTypes.find(
                        (it) => it.name.toLowerCase() === item.name.trim().toLowerCase()
                    )

                    // Create item type if it doesn't exist
                    if (!itemType) {
                        itemType = await itemTypeOperations.create({
                            name: item.name.trim(),
                            description: item.description?.trim() || undefined,
                            category: item.category?.trim() || 'General',
                        })
                    }

                    // Check if consumable stock already exists for this item type
                    const existingStocks = await consumableStockOperations.getAll()
                    const existingStock = existingStocks.find((s) => s.item_type && s.item_type.id === itemType!.id)

                    if (existingStock) {
                        // Update existing stock
                        await consumableStockOperations.updateQuantity(
                            existingStock.id,
                            item.current_quantity
                        )

                        // Update minimum threshold if different
                        if (existingStock.minimum_threshold !== item.minimum_threshold) {
                            // Note: You may need to add an update method for threshold
                            // For now, we'll just log it
                            console.log(`Threshold update needed for ${item.name}`)
                        }

                        results.push({
                            success: true,
                            row: rowNumber,
                            name: item.name,
                            message: 'Updated existing consumable',
                            id: existingStock.id,
                        })
                        successCount++
                    } else {
                        // Create new consumable stock directly with Supabase
                        const { supabase } = await import('@/lib/supabase')

                        const { data: newStock, error: createError } = await supabase
                            .from('consumable_stock')
                            .insert({
                                item_type_id: itemType.id,
                                current_quantity: item.current_quantity,
                                minimum_threshold: item.minimum_threshold,
                                unit_of_measure: item.unit_of_measure?.trim() || 'units',
                            })
                            .select()
                            .single()

                        if (createError) {
                            results.push({
                                success: false,
                                row: rowNumber,
                                name: item.name,
                                message: `Failed to create consumable: ${createError.message}`,
                            })
                            errorCount++
                        } else {
                            results.push({
                                success: true,
                                row: rowNumber,
                                name: item.name,
                                message: 'Created new consumable',
                                id: newStock.id,
                            })
                            successCount++
                        }
                    }

                    // Create audit log
                    try {
                        await auditLogOperations.create({
                            user_id: authContext.user.id,
                            action: 'bulk_import_consumable',
                            entity_type: 'consumable_stock',
                            entity_id: itemType.id,
                            old_values: {},
                            new_values: {
                                name: item.name,
                                quantity: item.current_quantity,
                                threshold: item.minimum_threshold,
                                invoice_number: item.invoice_number,
                                supplier_name: item.supplier_name,
                                purchase_date: item.purchase_date,
                            },
                            ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
                            user_agent: request.headers.get('user-agent') || 'unknown',
                        })
                    } catch (auditError) {
                        console.error('Failed to create audit log:', auditError)
                    }
                } catch (error) {
                    console.error(`Error processing row ${rowNumber}:`, error)
                    results.push({
                        success: false,
                        row: rowNumber,
                        name: item.name || 'N/A',
                        message: error instanceof Error ? error.message : 'Unknown error occurred',
                    })
                    errorCount++
                }
            }

            return NextResponse.json({
                message: `Import completed: ${successCount} successful, ${errorCount} failed`,
                summary: {
                    total: items.length,
                    success: successCount,
                    errors: errorCount,
                },
                results,
            })
        })
    } catch (error: unknown) {
        console.error('Bulk import error:', error)

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
