import { supabase } from '../supabase'
import type {
  ReservationReportFilters,
  ReservationMetrics,
  ReservationCharts,
  ReservationDetailData,
  WarehouseQRStat,
  QRScanAttemptData,
} from '@/types/reports'

export const reservationReportOperations = {
  /**
   * Get metrics for reservation reports
   */
  async getMetrics(filters: ReservationReportFilters): Promise<ReservationMetrics> {
    // Build base query
    let query = supabase
      .from('reservation_details')
      .select('*', { count: 'exact' })

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    if (filters.userId) {
      query = query.eq('user_id', filters.userId)
    }

    if (filters.itemTypeId) {
      query = query.eq('item_type_id', filters.itemTypeId)
    }

    if (filters.category) {
      query = query.eq('item_category', filters.category)
    }

    if (filters.dateRange?.start) {
      const startDateTime = filters.dateRange.start.includes('T')
        ? filters.dateRange.start
        : `${filters.dateRange.start}T00:00:00`
      query = query.gte('reservation_date', startDateTime)
    }

    if (filters.dateRange?.end) {
      const endDateTime = filters.dateRange.end.includes('T')
        ? filters.dateRange.end
        : `${filters.dateRange.end}T23:59:59`
      query = query.lte('reservation_date', endDateTime)
    }

    const { data: reservations, error, count } = await query

    if (error) throw error

    const totalReservations = count || 0

    // Calculate metrics
    const activeReservations = reservations?.filter((r) => r.status === 'active').length || 0
    const fulfilledReservations = reservations?.filter((r) => r.status === 'fulfilled').length || 0
    const cancelledReservations = reservations?.filter((r) => r.status === 'cancelled').length || 0
    const expiredReservations = reservations?.filter((r) => r.status === 'expired').length || 0

    // Calculate expiring soon (within 1 day)
    const expiringSoon =
      reservations?.filter((r) => r.status === 'active' && r.days_until_expiration <= 1).length || 0

    // Calculate total reserved quantity
    const totalReservedQuantity =
      reservations?.reduce((sum, r) => sum + r.reserved_quantity, 0) || 0

    // Calculate fulfillment rate
    const fulfillmentRate =
      totalReservations > 0 ? (fulfilledReservations / totalReservations) * 100 : 0

    // Calculate cancellation rate
    const cancellationRate =
      totalReservations > 0 ? (cancelledReservations / totalReservations) * 100 : 0

    // Calculate expiration rate
    const expirationRate =
      totalReservations > 0 ? (expiredReservations / totalReservations) * 100 : 0

    // Calculate average time to pickup (for fulfilled reservations)
    const fulfilledWithPickup = reservations?.filter(
      (r) => r.status === 'fulfilled' && r.pickup_date
    )
    let avgTimeToPickup = 0
    if (fulfilledWithPickup && fulfilledWithPickup.length > 0) {
      const totalTime = fulfilledWithPickup.reduce((sum, r) => {
        const reservationDate = new Date(r.reservation_date).getTime()
        const pickupDate = new Date(r.pickup_date!).getTime()
        return sum + (pickupDate - reservationDate)
      }, 0)
      avgTimeToPickup = totalTime / fulfilledWithPickup.length / (1000 * 60 * 60) // Convert to hours
    }

    // Count reservations with QR verification
    const reservationsWithQR =
      reservations?.filter((r) => r.status === 'fulfilled' && r.warehouse_qr_code_id).length || 0

    const qrVerificationRate =
      fulfilledReservations > 0 ? (reservationsWithQR / fulfilledReservations) * 100 : 0

    return {
      totalReservations,
      activeReservations,
      fulfilledReservations,
      cancelledReservations,
      expiredReservations,
      expiringSoon,
      totalReservedQuantity,
      fulfillmentRate,
      cancellationRate,
      expirationRate,
      avgTimeToPickup,
      reservationsWithQR,
      qrVerificationRate,
    }
  },

  /**
   * Get chart data for reservation reports
   */
  async getChartData(filters: ReservationReportFilters): Promise<ReservationCharts> {
    // Build base query
    let query = supabase.from('reservation_details').select('*')

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    if (filters.userId) {
      query = query.eq('user_id', filters.userId)
    }

    if (filters.itemTypeId) {
      query = query.eq('item_type_id', filters.itemTypeId)
    }

    if (filters.category) {
      query = query.eq('item_category', filters.category)
    }

    if (filters.dateRange?.start) {
      const startDateTime = filters.dateRange.start.includes('T')
        ? filters.dateRange.start
        : `${filters.dateRange.start}T00:00:00`
      query = query.gte('reservation_date', startDateTime)
    }

    if (filters.dateRange?.end) {
      const endDateTime = filters.dateRange.end.includes('T')
        ? filters.dateRange.end
        : `${filters.dateRange.end}T23:59:59`
      query = query.lte('reservation_date', endDateTime)
    }

    const { data: reservations, error } = await query

    if (error) throw error

    // Status distribution
    const statusDistribution = [
      {
        status: 'active',
        count: reservations?.filter((r) => r.status === 'active').length || 0,
      },
      {
        status: 'fulfilled',
        count: reservations?.filter((r) => r.status === 'fulfilled').length || 0,
      },
      {
        status: 'cancelled',
        count: reservations?.filter((r) => r.status === 'cancelled').length || 0,
      },
      {
        status: 'expired',
        count: reservations?.filter((r) => r.status === 'expired').length || 0,
      },
    ]

    // Reservations by category
    const categoryMap = new Map<string, number>()
    reservations?.forEach((r) => {
      const category = r.item_category || 'Sin categoría'
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1)
    })
    const reservationsByCategory = Array.from(categoryMap.entries()).map(([category, count]) => ({
      category,
      count,
    }))

    // Reservations over time (daily)
    const dateMap = new Map<string, number>()
    reservations?.forEach((r) => {
      const date = new Date(r.reservation_date).toISOString().split('T')[0]
      dateMap.set(date, (dateMap.get(date) || 0) + 1)
    })
    const reservationsOverTime = Array.from(dateMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Top reserved items
    const itemMap = new Map<string, { name: string; count: number; quantity: number }>()
    reservations?.forEach((r) => {
      const existing = itemMap.get(r.item_name) || { name: r.item_name, count: 0, quantity: 0 }
      itemMap.set(r.item_name, {
        name: r.item_name,
        count: existing.count + 1,
        quantity: existing.quantity + r.reserved_quantity,
      })
    })
    const topReservedItems = Array.from(itemMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Fulfillment time distribution (hours)
    const timeRanges = [
      { range: '0-6h', min: 0, max: 6, count: 0 },
      { range: '6-12h', min: 6, max: 12, count: 0 },
      { range: '12-24h', min: 12, max: 24, count: 0 },
      { range: '1-2d', min: 24, max: 48, count: 0 },
      { range: '2-7d', min: 48, max: 168, count: 0 },
      { range: '>7d', min: 168, max: Infinity, count: 0 },
    ]

    reservations
      ?.filter((r) => r.status === 'fulfilled' && r.pickup_date)
      .forEach((r) => {
        const reservationDate = new Date(r.reservation_date).getTime()
        const pickupDate = new Date(r.pickup_date!).getTime()
        const hours = (pickupDate - reservationDate) / (1000 * 60 * 60)

        const range = timeRanges.find((tr) => hours >= tr.min && hours < tr.max)
        if (range) range.count++
      })

    const fulfillmentTimeDistribution = timeRanges.map(({ range, count }) => ({ range, count }))

    return {
      statusDistribution,
      reservationsByCategory,
      reservationsOverTime,
      topReservedItems,
      fulfillmentTimeDistribution,
    }
  },

  /**
   * Get detailed reservation data
   */
  async getDetailedReservations(
    filters: ReservationReportFilters
  ): Promise<ReservationDetailData[]> {
    // Build base query with warehouse QR info
    let query = supabase
      .from('consumable_reservations')
      .select(
        `
        *,
        user:users(id, username, email),
        item_type:item_types(id, name, category),
        warehouse_qr:warehouse_qr_codes(id, qr_code, location_name, zone)
      `
      )
      .order('reservation_date', { ascending: false })

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    if (filters.userId) {
      query = query.eq('user_id', filters.userId)
    }

    if (filters.itemTypeId) {
      query = query.eq('item_type_id', filters.itemTypeId)
    }

    if (filters.warehouseQrId) {
      query = query.eq('warehouse_qr_code_id', filters.warehouseQrId)
    }

    if (filters.dateRange?.start) {
      const startDateTime = filters.dateRange.start.includes('T')
        ? filters.dateRange.start
        : `${filters.dateRange.start}T00:00:00`
      query = query.gte('reservation_date', startDateTime)
    }

    if (filters.dateRange?.end) {
      const endDateTime = filters.dateRange.end.includes('T')
        ? filters.dateRange.end
        : `${filters.dateRange.end}T23:59:59`
      query = query.lte('reservation_date', endDateTime)
    }

    const { data: reservations, error } = await query

    if (error) throw error

    // Transform data
    return (
      reservations?.map((r: any) => ({
        id: r.id,
        user_id: r.user_id,
        username: r.user?.username || 'Unknown',
        email: r.user?.email || '',
        item_type_id: r.item_type_id,
        item_name: r.item_type?.name || 'Unknown',
        item_category: r.item_type?.category || null,
        reserved_quantity: r.reserved_quantity,
        status: r.status,
        reservation_date: r.reservation_date,
        expiration_date: r.expiration_date,
        pickup_date: r.pickup_date,
        notes: r.notes,
        purpose: r.purpose,
        warehouse_qr_code_id: r.warehouse_qr_code_id,
        warehouse_qr_code: r.warehouse_qr?.qr_code || null,
        warehouse_location: r.warehouse_qr?.location_name || null,
        warehouse_zone: r.warehouse_qr?.zone || null,
        created_at: r.created_at,
      })) || []
    )
  },

  /**
   * Get warehouse QR statistics
   */
  async getWarehouseQRStats(filters: ReservationReportFilters): Promise<WarehouseQRStat[]> {
    // Get all warehouse QR codes with their usage stats
    const { data: qrCodes, error } = await supabase
      .from('warehouse_qr_codes')
      .select('*')
      .order('id')

    if (error) throw error

    // For each QR code, count reservations
    const stats = await Promise.all(
      (qrCodes || []).map(async (qr) => {
        let query = supabase
          .from('consumable_reservations')
          .select('*', { count: 'exact', head: true })
          .eq('warehouse_qr_code_id', qr.id)
          .eq('status', 'fulfilled')

        // Apply date filter if provided
        if (filters.dateRange?.start) {
          const startDateTime = filters.dateRange.start.includes('T')
            ? filters.dateRange.start
            : `${filters.dateRange.start}T00:00:00`
          query = query.gte('pickup_date', startDateTime)
        }

        if (filters.dateRange?.end) {
          const endDateTime = filters.dateRange.end.includes('T')
            ? filters.dateRange.end
            : `${filters.dateRange.end}T23:59:59`
          query = query.lte('pickup_date', endDateTime)
        }

        const { count } = await query

        // Get last scan date
        const { data: lastScan } = await supabase
          .from('consumable_reservations')
          .select('pickup_date')
          .eq('warehouse_qr_code_id', qr.id)
          .eq('status', 'fulfilled')
          .not('pickup_date', 'is', null)
          .order('pickup_date', { ascending: false })
          .limit(1)
          .single()

        return {
          id: qr.id,
          qr_code: qr.qr_code,
          location_name: qr.location_name,
          zone: qr.zone,
          is_active: qr.is_active,
          total_scans: count || 0,
          last_scan_date: lastScan?.pickup_date || null,
        }
      })
    )

    return stats.sort((a, b) => b.total_scans - a.total_scans)
  },

  /**
   * Get QR scan statistics from qr_scan_attempts table
   */
  async getQRScanStatistics(filters: ReservationReportFilters): Promise<QRScanAttemptData[]> {
    // Query the qr_scan_statistics view
    let query = supabase.from('qr_scan_statistics').select('*')

    // Apply date filter if provided
    if (filters.dateRange?.start || filters.dateRange?.end) {
      // For date filtering, we need to query qr_scan_attempts directly
      let attemptsQuery = supabase
        .from('qr_scan_attempts')
        .select(
          `
          required_qr_code_id,
          is_successful,
          warehouse_qr_codes!qr_scan_attempts_required_qr_code_id_fkey(
            id,
            location_name
          )
        `
        )

      if (filters.dateRange?.start) {
        const startDateTime = filters.dateRange.start.includes('T')
          ? filters.dateRange.start
          : `${filters.dateRange.start}T00:00:00`
        attemptsQuery = attemptsQuery.gte('attempt_date', startDateTime)
      }

      if (filters.dateRange?.end) {
        const endDateTime = filters.dateRange.end.includes('T')
          ? filters.dateRange.end
          : `${filters.dateRange.end}T23:59:59`
        attemptsQuery = attemptsQuery.lte('attempt_date', endDateTime)
      }

      const { data: attempts, error: attemptsError } = await attemptsQuery

      if (attemptsError) throw attemptsError

      // Aggregate the data manually
      const statsMap = new Map<
        number,
        {
          qr_code_id: number
          location_name: string
          total_attempts: number
          successful_scans: number
          failed_scans: number
        }
      >()

      attempts?.forEach((attempt: any) => {
        const qrCodeId = attempt.required_qr_code_id
        const locationName = attempt.warehouse_qr_codes?.location_name || 'Unknown'

        if (!statsMap.has(qrCodeId)) {
          statsMap.set(qrCodeId, {
            qr_code_id: qrCodeId,
            location_name: locationName,
            total_attempts: 0,
            successful_scans: 0,
            failed_scans: 0,
          })
        }

        const stats = statsMap.get(qrCodeId)!
        stats.total_attempts++
        if (attempt.is_successful) {
          stats.successful_scans++
        } else {
          stats.failed_scans++
        }
      })

      return Array.from(statsMap.values()).map((stat) => ({
        ...stat,
        success_rate:
          stat.total_attempts > 0
            ? Math.round((stat.successful_scans / stat.total_attempts) * 100 * 100) / 100
            : 0,
      }))
    }

    // If no date filter, use the view
    const { data: stats, error } = await query

    if (error) throw error

    return (
      stats?.map((stat: any) => ({
        qr_code_id: stat.qr_code_id,
        location_name: stat.location_name,
        total_attempts: stat.times_required || 0,
        successful_scans: stat.successful_scans || 0,
        failed_scans: stat.failed_scans || 0,
        success_rate: stat.success_rate || 0,
      })) || []
    )
  },

  /**
   * Get most problematic QR codes (highest failure rate)
   */
  async getProblematicQRCodes(
    filters: ReservationReportFilters,
    limit: number = 5
  ): Promise<QRScanAttemptData[]> {
    const allStats = await reservationReportOperations.getQRScanStatistics(filters)

    // Filter out QR codes with very few attempts (less than 3) to avoid skewed data
    const significantStats = allStats.filter((stat) => stat.total_attempts >= 3)

    // Sort by success rate (ascending) to get most problematic first
    return significantStats.sort((a, b) => a.success_rate - b.success_rate).slice(0, limit)
  },

  /**
   * Get enhanced metrics including QR scan statistics
   */
  async getEnhancedMetrics(filters: ReservationReportFilters): Promise<ReservationMetrics> {
    // Get base metrics
    const baseMetrics = await reservationReportOperations.getMetrics(filters)

    // Get QR scan statistics
    try {
      let scanQuery = supabase.from('qr_scan_attempts').select('is_successful', { count: 'exact' })

      // Apply date filter if provided
      if (filters.dateRange?.start) {
        const startDateTime = filters.dateRange.start.includes('T')
          ? filters.dateRange.start
          : `${filters.dateRange.start}T00:00:00`
        scanQuery = scanQuery.gte('attempt_date', startDateTime)
      }

      if (filters.dateRange?.end) {
        const endDateTime = filters.dateRange.end.includes('T')
          ? filters.dateRange.end
          : `${filters.dateRange.end}T23:59:59`
        scanQuery = scanQuery.lte('attempt_date', endDateTime)
      }

      // Apply required QR filter if provided
      if (filters.warehouseQrId) {
        scanQuery = scanQuery.eq('required_qr_code_id', filters.warehouseQrId)
      }

      const { data: scanAttempts, count: totalAttempts } = await scanQuery

      const successfulScans = scanAttempts?.filter((a) => a.is_successful).length || 0
      const failedScans = (totalAttempts || 0) - successfulScans

      const qrScanSuccessRate =
        totalAttempts && totalAttempts > 0
          ? Math.round((successfulScans / totalAttempts) * 100 * 100) / 100
          : 0

      return {
        ...baseMetrics,
        qrScanSuccessRate,
        totalScanAttempts: totalAttempts || 0,
        failedScanAttempts: failedScans,
      }
    } catch (error) {
      console.error('Error fetching QR scan statistics:', error)
      // Return base metrics if QR stats fail
      return baseMetrics
    }
  },
}
