import { NextRequest, NextResponse } from 'next/server'
import { withPermission } from '@/lib/auth-middleware'
import { PERMISSIONS } from '@/lib/permissions'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
    try {
        return await withPermission(request, PERMISSIONS.ADMIN_VIEW_DASHBOARD, async () => {
            const { searchParams } = new URL(request.url)
            const startDate = searchParams.get('start_date')
            const endDate = searchParams.get('end_date')
            const supplier = searchParams.get('supplier')

            // Get audit logs for purchases
            let auditQuery = supabase
                .from('audit_logs')
                .select(`
                    id,
                    created_at,
                    new_values,
                    entity_id,
                    user:users(username)
                `)
                .in('action', ['stock_restock', 'stock_adjustment'])
                .order('created_at', { ascending: false })
                .limit(100)

            if (startDate) {
                auditQuery = auditQuery.gte('created_at', startDate)
            }

            if (endDate) {
                auditQuery = auditQuery.lte('created_at', endDate)
            }

            const { data: auditLogs, error: auditError } = await auditQuery

            if (auditError) {
                console.error('Error fetching audit logs:', auditError)
                throw auditError
            }

            // Filter and transform purchases
            const purchases = (auditLogs || [])
                .filter((log: any) => {
                    const restockAmount = log.new_values?.restock_amount || log.new_values?.adjustment
                    if (!restockAmount || parseFloat(restockAmount) <= 0) return false
                    if (supplier && log.new_values?.supplier_name) {
                        return log.new_values.supplier_name.toLowerCase().includes(supplier.toLowerCase())
                    }
                    return true
                })
                .map((log: any) => ({
                    id: log.id,
                    created_at: log.created_at,
                    invoice_number: log.new_values?.invoice_number || 'N/A',
                    supplier_name: log.new_values?.supplier_name || 'N/A',
                    purchase_date: log.new_values?.purchase_date || log.created_at,
                    quantity: log.new_values?.restock_amount || log.new_values?.adjustment || 0,
                    notes: log.new_values?.notes || '',
                    consumable_stock_id: log.entity_id,
                    registered_by: log.user?.username || 'Unknown',
                }))

            // Get consumable details
            const stockIds = [...new Set(purchases.map((p: any) => p.consumable_stock_id))]
            const { data: stocks } = await supabase
                .from('consumable_stock')
                .select('id, unit_of_measure, item_type:item_types(name)')
                .in('id', stockIds)

            const stockMap = new Map(stocks?.map((s: any) => [s.id, s]) || [])

            const purchasesWithDetails = purchases.map((purchase: any) => {
                const stock = stockMap.get(purchase.consumable_stock_id)
                return {
                    ...purchase,
                    consumable_name: stock?.item_type?.name || 'Unknown',
                    unit_of_measure: stock?.unit_of_measure || 'units',
                }
            })

            // Calculate summary statistics from purchases
            const currentMonth = new Date()
            currentMonth.setDate(1)
            currentMonth.setHours(0, 0, 0, 0)

            const monthlyPurchases = purchasesWithDetails.filter((p: any) => 
                new Date(p.created_at) >= currentMonth
            )

            const uniqueInvoices = new Set(
                monthlyPurchases
                    .map((p: any) => p.invoice_number)
                    .filter((inv: string) => inv && inv !== 'N/A')
            )

            const uniqueSuppliers = new Set(
                monthlyPurchases
                    .map((p: any) => p.supplier_name)
                    .filter((sup: string) => sup && sup !== 'N/A')
            )

            const totalItems = monthlyPurchases.reduce(
                (sum: number, p: any) => sum + parseFloat(p.quantity || 0),
                0
            )

            // Get top suppliers
            const supplierStats = new Map<string, { count: number; items: number; lastPurchase: string }>()
            monthlyPurchases.forEach((p: any) => {
                if (p.supplier_name && p.supplier_name !== 'N/A') {
                    const current = supplierStats.get(p.supplier_name) || {
                        count: 0,
                        items: 0,
                        lastPurchase: p.created_at,
                    }
                    current.count++
                    current.items += parseFloat(p.quantity || 0)
                    if (new Date(p.created_at) > new Date(current.lastPurchase)) {
                        current.lastPurchase = p.created_at
                    }
                    supplierStats.set(p.supplier_name, current)
                }
            })

            const topSuppliers = Array.from(supplierStats.entries())
                .map(([name, stats]) => ({
                    supplier_name: name,
                    purchase_count: stats.count,
                    total_items: stats.items,
                    last_purchase: stats.lastPurchase,
                }))
                .sort((a, b) => b.purchase_count - a.purchase_count)
                .slice(0, 5)

            // Check for duplicate invoices
            const invoiceCounts = new Map<string, { count: number; suppliers: Set<string> }>()
            purchasesWithDetails.forEach((p: any) => {
                if (p.invoice_number && p.invoice_number !== 'N/A') {
                    const current = invoiceCounts.get(p.invoice_number) || {
                        count: 0,
                        suppliers: new Set<string>(),
                    }
                    current.count++
                    if (p.supplier_name && p.supplier_name !== 'N/A') {
                        current.suppliers.add(p.supplier_name)
                    }
                    invoiceCounts.set(p.invoice_number, current)
                }
            })

            const duplicateInvoices = Array.from(invoiceCounts.entries())
                .filter(([_, data]) => data.count > 1)
                .map(([invoice, data]) => ({
                    invoice_number: invoice,
                    times_used: data.count,
                    suppliers: Array.from(data.suppliers).join(', '),
                }))
                .sort((a, b) => b.times_used - a.times_used)

            // Get recent purchases (last 7 days)
            const sevenDaysAgo = new Date()
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

            const recentPurchases = purchasesWithDetails
                .filter((p: any) => new Date(p.created_at) >= sevenDaysAgo)
                .slice(0, 5)
                .map((p: any) => ({
                    created_at: p.created_at,
                    invoice_number: p.invoice_number,
                    supplier_name: p.supplier_name,
                    quantity: p.quantity,
                    consumable_name: p.consumable_name,
                }))

            return NextResponse.json({
                purchases: purchasesWithDetails,
                summary: {
                    monthly: {
                        total_purchases: monthlyPurchases.length,
                        total_invoices: uniqueInvoices.size,
                        total_suppliers: uniqueSuppliers.size,
                        total_items: totalItems,
                    },
                    top_suppliers: topSuppliers,
                    duplicate_invoices: duplicateInvoices,
                    recent_purchases: recentPurchases,
                },
            })
        })
    } catch (error: unknown) {
        console.error('Purchases report error:', error)

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
