import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { withPermission } from '@/lib/auth-middleware'
import { PERMISSIONS } from '@/lib/permissions'

export async function GET(request: NextRequest) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_TOOLS, async (authContext) => {
      const tests: any = {
        timestamp: new Date().toISOString(),
        user: authContext.user,
        tests: {},
      }

      // Test 1: Check if electronic_devices table exists
      try {
        const { data, error, count } = await supabase
          .from('electronic_devices')
          .select('*', { count: 'exact', head: true })

        tests.tests.electronic_devices_table = {
          exists: !error,
          count: count || 0,
          error: error?.message || null,
        }
      } catch (err) {
        tests.tests.electronic_devices_table = {
          exists: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        }
      }

      // Test 2: Check if tool_instances table exists
      try {
        const { data, error, count } = await supabase
          .from('tool_instances')
          .select('*', { count: 'exact', head: true })

        tests.tests.tool_instances_table = {
          exists: !error,
          count: count || 0,
          error: error?.message || null,
        }
      } catch (err) {
        tests.tests.tool_instances_table = {
          exists: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        }
      }

      // Test 3: Check if item_types table exists
      try {
        const { data, error, count } = await supabase
          .from('item_types')
          .select('*', { count: 'exact', head: true })

        tests.tests.item_types_table = {
          exists: !error,
          count: count || 0,
          error: error?.message || null,
        }
      } catch (err) {
        tests.tests.item_types_table = {
          exists: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        }
      }

      // Test 4: Try to query electronic_devices with joins
      try {
        const { data, error } = await supabase
          .from('electronic_devices')
          .select(`
            *,
            tool_instance:tool_instances(
              *,
              item_type:item_types(*)
            )
          `)
          .limit(1)

        tests.tests.electronic_devices_query = {
          success: !error,
          hasData: !!data && data.length > 0,
          sampleData: data && data.length > 0 ? data[0] : null,
          error: error?.message || null,
        }
      } catch (err) {
        tests.tests.electronic_devices_query = {
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        }
      }

      // Test 5: Check Supabase connection
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id')
          .limit(1)

        tests.tests.supabase_connection = {
          connected: !error,
          error: error?.message || null,
        }
      } catch (err) {
        tests.tests.supabase_connection = {
          connected: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        }
      }

      return NextResponse.json(tests)
    })
  } catch (error: unknown) {
    console.error('Test DB error:', error)

    if (error instanceof Error && error.name === 'AuthenticationError') {
      return NextResponse.json(
        {
          error: {
            code: 'AUTHENTICATION_ERROR',
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
            code: 'AUTHORIZATION_ERROR',
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
          code: 'UNKNOWN_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    )
  }
}
