import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth-middleware'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authContext = await authenticateRequest(request)

    const body = await request.json()
    const { qr_code } = body

    if (!qr_code) {
      return NextResponse.json(
        { error: 'Código QR requerido' },
        { status: 400 }
      )
    }

    // Validate that the QR code exists and is active
    const { data: warehouseQR, error } = await supabase
      .from('warehouse_qr_codes')
      .select('id, qr_code, location_name, zone, is_active')
      .eq('qr_code', qr_code)
      .single()

    if (error || !warehouseQR) {
      return NextResponse.json(
        { 
          error: 'Código QR no válido',
          message: 'Este código no pertenece al almacén. Por favor, escanea uno de los códigos QR oficiales del almacén.'
        },
        { status: 404 }
      )
    }

    if (!warehouseQR.is_active) {
      return NextResponse.json(
        { 
          error: 'Código QR inactivo',
          message: 'Este código QR ha sido desactivado. Por favor, escanea otro código del almacén.'
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: warehouseQR.id,
        location: warehouseQR.location_name,
        zone: warehouseQR.zone
      }
    })

  } catch (error) {
    console.error('Error validating warehouse QR:', error)
    return NextResponse.json(
      { error: 'Error al validar el código QR' },
      { status: 500 }
    )
  }
}
