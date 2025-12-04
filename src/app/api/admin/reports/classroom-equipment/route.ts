import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { withPermission } from '@/lib/auth-middleware'
import { PERMISSIONS } from '@/lib/permissions'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'

interface ClassroomEquipmentSummary {
  classroom_id: number
  classroom_name: string
  classroom_location: string
  classroom_status: string
  total_devices: number
  devices_by_category: Record<string, number>
  incomplete_workstations: number
  device_list: Array<{
    id: number
    name: string
    category: string
    brand?: string
    model?: string
    serial_number?: string
    has_combination: boolean
  }>
}

export async function GET(request: NextRequest) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_TOOLS, async (authContext) => {
      // Get all classrooms
      const { data: classrooms, error: classroomsError } = await supabase
        .from('classrooms')
        .select('*')
        .order('name')

      if (classroomsError) throw classroomsError

      // Get all active device assignments with device details
      const { data: assignments, error: assignmentsError } = await supabase
        .from('device_assignments')
        .select(`
          *,
          electronic_device:electronic_devices(
            id,
            brand,
            model,
            tool_instance:tool_instances(
              serial_number,
              item_type:item_types(
                name,
                category
              )
            )
          )
        `)
        .eq('is_active', true)

      if (assignmentsError) throw assignmentsError

      // Get all active device combinations
      const { data: combinations, error: combinationsError } = await supabase
        .from('device_combinations')
        .select('device_1_id, device_2_id')
        .eq('is_active', true)

      if (combinationsError) throw combinationsError

      // Build device combination map
      const deviceCombinationMap = new Set<number>()
      combinations?.forEach(combo => {
        deviceCombinationMap.add(combo.device_1_id)
        deviceCombinationMap.add(combo.device_2_id)
      })

      // Build report data
      const report: ClassroomEquipmentSummary[] = (classrooms || []).map(classroom => {
        // Get assignments for this classroom
        const classroomAssignments = (assignments || []).filter(
          a => a.classroom_id === classroom.id
        )

        // Count devices by category
        const devicesByCategory: Record<string, number> = {}
        const deviceList: ClassroomEquipmentSummary['device_list'] = []

        classroomAssignments.forEach(assignment => {
          const device = assignment.electronic_device as any
          if (!device) return

          const toolInstance = device.tool_instance
          const itemType = toolInstance?.item_type
          const category = itemType?.category || 'Unknown'

          // Count by category
          devicesByCategory[category] = (devicesByCategory[category] || 0) + 1

          // Add to device list
          deviceList.push({
            id: device.id,
            name: itemType?.name || 'Unknown',
            category,
            brand: device.brand,
            model: device.model,
            serial_number: toolInstance?.serial_number,
            has_combination: deviceCombinationMap.has(device.id),
          })
        })

        // Count incomplete workstations (devices without combinations that should have them)
        // Typically monitors and CPUs should be paired
        const monitorsCount = devicesByCategory['Periféricos'] || 0
        const cpusCount = devicesByCategory['Laptops'] || 0
        const pairedDevicesCount = classroomAssignments.filter(a => 
          deviceCombinationMap.has((a.electronic_device as any)?.id)
        ).length
        
        // Incomplete workstations = devices that could be paired but aren't
        const incompleteWorkstations = Math.max(0, 
          Math.min(monitorsCount, cpusCount) * 2 - pairedDevicesCount
        )

        return {
          classroom_id: classroom.id,
          classroom_name: classroom.name,
          classroom_location: classroom.location,
          classroom_status: classroom.status,
          total_devices: classroomAssignments.length,
          devices_by_category: devicesByCategory,
          incomplete_workstations: incompleteWorkstations,
          device_list: deviceList,
        }
      })

      // Calculate summary statistics
      const summary = {
        total_classrooms: classrooms?.length || 0,
        total_devices_assigned: (assignments || []).length,
        total_combinations: (combinations || []).length,
        classrooms_with_devices: report.filter(r => r.total_devices > 0).length,
        classrooms_without_devices: report.filter(r => r.total_devices === 0).length,
        total_incomplete_workstations: report.reduce((sum, r) => sum + r.incomplete_workstations, 0),
      }

      return NextResponse.json({
        data: report,
        summary,
        generated_at: new Date().toISOString(),
      })
    })
  } catch (error: unknown) {
    console.error('Classroom equipment report error:', error)

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
