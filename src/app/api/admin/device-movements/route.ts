import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// GET - Fetch all device movements
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const deviceId = searchParams.get('deviceId')
    const classroomId = searchParams.get('classroomId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    let query = supabase
      .from('device_movements')
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
        ),
        from_classroom:classrooms!device_movements_from_classroom_id_fkey(id, name, location),
        to_classroom:classrooms!device_movements_to_classroom_id_fkey(id, name, location),
        moved_by_user:users!device_movements_moved_by_fkey(id, username, full_name)
      `, { count: 'exact' })
      .order('moved_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (deviceId) {
      query = query.eq('electronic_device_id', parseInt(deviceId))
    }

    if (classroomId) {
      query = query.or(`from_classroom_id.eq.${classroomId},to_classroom_id.eq.${classroomId}`)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching device movements:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    // Transform data for frontend
    const movements = (data || []).map(movement => ({
      id: movement.id,
      deviceId: movement.electronic_device_id,
      deviceName: movement.electronic_device?.tool_instance?.item_type?.name || 'Unknown',
      serialNumber: movement.electronic_device?.tool_instance?.serial_number || '',
      brand: movement.electronic_device?.brand || '',
      model: movement.electronic_device?.model || '',
      fromClassroom: movement.from_classroom ? {
        id: movement.from_classroom.id,
        name: movement.from_classroom.name,
        building: movement.from_classroom.location,
      } : null,
      toClassroom: movement.to_classroom ? {
        id: movement.to_classroom.id,
        name: movement.to_classroom.name,
        building: movement.to_classroom.location,
      } : null,
      movedAt: movement.moved_at,
      movedBy: movement.moved_by_user ? {
        id: movement.moved_by_user.id,
        username: movement.moved_by_user.username || movement.moved_by_user.full_name,
      } : null,
      reason: movement.reason,
      notes: movement.notes,
    }))

    return NextResponse.json({
      success: true,
      data: movements,
      total: count || 0,
      page,
      limit,
    })
  } catch (error) {
    console.error('Error in GET device movements:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create a new device movement record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { deviceId, fromClassroomId, toClassroomId, reason, notes, movedBy } = body

    if (!deviceId) {
      return NextResponse.json(
        { success: false, error: 'Device ID is required' },
        { status: 400 }
      )
    }

    // Create the movement record
    const { data: movement, error: createError } = await supabase
      .from('device_movements')
      .insert({
        electronic_device_id: deviceId,
        from_classroom_id: fromClassroomId || null,
        to_classroom_id: toClassroomId || null,
        reason: reason || null,
        notes: notes || null,
        moved_by: movedBy || null,
        moved_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating device movement:', createError)
      return NextResponse.json(
        { success: false, error: createError.message },
        { status: 500 }
      )
    }

    // Update the device's classroom assignment if toClassroomId is provided
    if (toClassroomId) {
      // First, remove existing assignment
      await supabase
        .from('classroom_device_assignments')
        .delete()
        .eq('electronic_device_id', deviceId)

      // Then create new assignment
      await supabase
        .from('classroom_device_assignments')
        .insert({
          classroom_id: toClassroomId,
          electronic_device_id: deviceId,
          assigned_date: new Date().toISOString(),
        })
    }

    return NextResponse.json({
      success: true,
      data: movement,
      message: 'Device movement recorded successfully',
    })
  } catch (error) {
    console.error('Error in POST device movement:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
