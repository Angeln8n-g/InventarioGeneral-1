import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { withPermission } from '@/lib/auth-middleware'
import { PERMISSIONS } from '@/lib/permissions'

export async function GET(request: NextRequest) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_TOOLS, async (authContext) => {
      const tests: any = {
        timestamp: new Date().toISOString(),
        tests: {},
      }

      // Test 1: Simple query without joins
      try {
        const { data, error } = await supabase
          .from('electronic_devices')
          .select('*')
          .limit(5)

        tests.tests.simple_query = {
          success: !error,
          count: data?.length || 0,
          data: data,
          error: error?.message || null,
        }
      } catch (err) {
        tests.tests.simple_query = {
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        }
      }

      // Test 2: Query with tool_instances join (explicit relationship)
      try {
        const { data, error } = await supabase
          .from('electronic_devices')
          .select(`
            *,
            tool_instance:tool_instances!electronic_devices_tool_instance_id_fkey(*)
          `)
          .limit(5)

        tests.tests.with_tool_instances = {
          success: !error,
          count: data?.length || 0,
          data: data,
          error: error?.message || null,
          errorDetails: error ? {
            code: error.code,
            details: error.details,
            hint: error.hint,
          } : null,
        }
      } catch (err) {
        tests.tests.with_tool_instances = {
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        }
      }

      // Test 3: Query with full joins (explicit relationship)
      try {
        const { data, error } = await supabase
          .from('electronic_devices')
          .select(`
            *,
            tool_instance:tool_instances!electronic_devices_tool_instance_id_fkey(
              *,
              item_type:item_types(*)
            )
          `)
          .limit(5)

        tests.tests.with_full_joins = {
          success: !error,
          count: data?.length || 0,
          data: data,
          error: error?.message || null,
          errorDetails: error ? {
            code: error.code,
            details: error.details,
            hint: error.hint,
          } : null,
        }
      } catch (err) {
        tests.tests.with_full_joins = {
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        }
      }

      // Test 4: Check foreign key relationship
      try {
        const { data, error } = await supabase.rpc('get_table_info', {
          table_name: 'electronic_devices'
        })

        tests.tests.foreign_keys = {
          success: !error,
          data: data,
          error: error?.message || null,
        }
      } catch (err) {
        tests.tests.foreign_keys = {
          success: false,
          error: 'RPC function not available (this is OK)',
        }
      }

      return NextResponse.json(tests)
    })
  } catch (error: unknown) {
    console.error('Test query error:', error)

    return NextResponse.json(
      {
        error: {
          code: 'TEST_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        },
      },
      { status: 500 }
    )
  }
}
