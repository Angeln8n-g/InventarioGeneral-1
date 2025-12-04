import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// GET - Fetch all maintenance reports
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const deviceId = searchParams.get('deviceId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    let query = supabase
      .from('maintenance_reports')
      .select(`
        *,
        electronic_device:electronic_devices(
          id,
          brand,
          model,
          tool_instance:tool_instances(
            id,
            qr_code,
            serial_number,
            status,
            item_type:item_types(
              id,
              name,
              category
            )
          )
        ),
        creator:users!maintenance_reports_created_by_fkey(
          id,
          username,
          full_name
        )
      `, { count: 'exact' })
      .order('report_date', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq('status', status)
    }

    if (deviceId) {
      query = query.eq('electronic_device_id', parseInt(deviceId))
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching maintenance reports:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    // Transform data for frontend
    const reports = (data || []).map(report => ({
      id: report.id,
      deviceId: report.electronic_device_id,
      deviceName: report.electronic_device?.tool_instance?.item_type?.name || 'Unknown',
      brand: report.electronic_device?.brand || '',
      model: report.electronic_device?.model || '',
      serialNumber: report.electronic_device?.tool_instance?.serial_number || '',
      issueDescription: report.issue_description,
      technicianType: report.technician_type,
      technicianName: report.technician_name,
      technicianCompany: report.technician_company,
      status: report.status,
      reportDate: report.report_date,
      resolutionDate: report.resolution_date,
      resolutionNotes: report.resolution_notes,
      cost: report.cost,
      createdBy: report.creator?.username || 'System',
    }))

    return NextResponse.json({
      success: true,
      data: reports,
      total: count || 0,
      page,
      limit,
    })
  } catch (error) {
    console.error('Error in GET maintenance reports:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}


// POST - Create a new maintenance report
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Received body:', body)
    
    const { 
      deviceId, 
      issueDescription, 
      technicianType, 
      technicianName, 
      technicianCompany 
    } = body

    // Validate required fields
    if (!deviceId || !issueDescription || !technicianType || !technicianName) {
      console.log('Missing fields:', { deviceId, issueDescription, technicianType, technicianName })
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Convert deviceId to number if it's a string
    const deviceIdNum = typeof deviceId === 'string' ? parseInt(deviceId, 10) : deviceId
    
    if (isNaN(deviceIdNum)) {
      return NextResponse.json(
        { success: false, error: 'Invalid device ID' },
        { status: 400 }
      )
    }

    // Validate technician type
    if (!['internal', 'external'].includes(technicianType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid technician type' },
        { status: 400 }
      )
    }

    // Verify device exists
    const { data: device, error: deviceError } = await supabase
      .from('electronic_devices')
      .select('id, tool_instance_id')
      .eq('id', deviceIdNum)
      .single()

    if (deviceError || !device) {
      console.log('Device not found:', deviceError)
      return NextResponse.json(
        { success: false, error: 'Device not found' },
        { status: 404 }
      )
    }

    console.log('Found device:', device)

    // Create the maintenance report
    const { data: report, error: createError } = await supabase
      .from('maintenance_reports')
      .insert({
        electronic_device_id: deviceIdNum,
        issue_description: issueDescription,
        technician_type: technicianType,
        technician_name: technicianName,
        technician_company: technicianCompany || null,
        status: 'pending',
        report_date: new Date().toISOString(),
      })
      .select(`
        *,
        electronic_device:electronic_devices(
          id,
          brand,
          model,
          tool_instance:tool_instances(
            serial_number,
            item_type:item_types(name)
          )
        )
      `)
      .single()

    if (createError) {
      console.error('Error creating maintenance report:', createError)
      return NextResponse.json(
        { success: false, error: createError.message },
        { status: 500 }
      )
    }

    console.log('Created report:', report)

    // Update device status to 'out-of-service' if we have tool_instance_id
    if (device.tool_instance_id) {
      const { error: statusError } = await supabase
        .from('tool_instances')
        .update({ status: 'out-of-service' })
        .eq('id', device.tool_instance_id)
      
      if (statusError) {
        console.error('Error updating device status:', statusError)
      } else {
        console.log('Device status updated to out-of-service')
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: report.id,
        deviceId: report.electronic_device_id,
        deviceName: report.electronic_device?.tool_instance?.item_type?.name || 'Unknown',
        brand: report.electronic_device?.brand || '',
        issueDescription: report.issue_description,
        technicianType: report.technician_type,
        technicianName: report.technician_name,
        status: report.status,
        reportDate: report.report_date,
      },
      message: 'Maintenance report created successfully',
    })
  } catch (error) {
    console.error('Error in POST maintenance report:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Update maintenance report status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, resolutionNotes, cost } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Report ID is required' },
        { status: 400 }
      )
    }

    const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (status) updateData.status = status
    if (resolutionNotes !== undefined) updateData.resolution_notes = resolutionNotes
    if (cost !== undefined) updateData.cost = cost
    if (status === 'completed') updateData.resolution_date = new Date().toISOString()

    const { data: report, error } = await supabase
      .from('maintenance_reports')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating maintenance report:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    // If completed, update device status back to available
    if (status === 'completed') {
      const { data: device } = await supabase
        .from('electronic_devices')
        .select('tool_instance_id')
        .eq('id', report.electronic_device_id)
        .single()

      if (device?.tool_instance_id) {
        await supabase
          .from('tool_instances')
          .update({ status: 'available' })
          .eq('id', device.tool_instance_id)
      }
    }

    return NextResponse.json({
      success: true,
      data: report,
      message: 'Maintenance report updated successfully',
    })
  } catch (error) {
    console.error('Error in PATCH maintenance report:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
