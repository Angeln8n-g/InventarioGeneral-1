import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { withPermission } from '@/lib/auth-middleware'
import { PERMISSIONS } from '@/lib/permissions'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'
import { auditLogOperations } from '@/lib/supabase-client'

export async function POST(request: NextRequest) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_CONSUMABLES, async (authContext) => {
      const formData = await request.formData()
      const image = formData.get('image') as File
      const consumableId = formData.get('consumable_id') as string

      if (!image) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'Image file is required',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }

      if (!consumableId || isNaN(parseInt(consumableId, 10))) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'Valid consumable ID is required',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }

      // Validate file type
      if (!image.type.startsWith('image/')) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'File must be an image',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }

      // Validate file size (max 5MB)
      if (image.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'Image size must be less than 5MB',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }

      // Get consumable details
      const { data: consumable, error: fetchError } = await supabase
        .from('consumable_stock')
        .select(`
          *,
          item_type:item_types(*)
        `)
        .eq('id', parseInt(consumableId, 10))
        .single()

      if (fetchError || !consumable) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.NOT_FOUND,
              message: 'Consumable not found',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 404 }
        )
      }

      // Generate unique filename
      const fileExt = image.name.split('.').pop()
      const fileName = `consumable-${consumableId}-${Date.now()}.${fileExt}`
      const filePath = `consumables/${fileName}`

      // Convert File to ArrayBuffer
      const arrayBuffer = await image.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('item-images')
        .upload(filePath, buffer, {
          contentType: image.type,
          upsert: true,
        })

      if (uploadError) {
        console.error('Error uploading image:', uploadError)
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.DATABASE_ERROR,
              message: 'Failed to upload image',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 500 }
        )
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('item-images')
        .getPublicUrl(filePath)

      // Update item_type with image URL
      const { error: updateError } = await supabase
        .from('item_types')
        .update({
          image_url: urlData.publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', consumable.item_type.id)

      if (updateError) {
        console.error('Error updating item type with image URL:', updateError)
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.DATABASE_ERROR,
              message: 'Failed to update consumable with image',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 500 }
        )
      }

      // Get updated consumable
      const { data: updatedConsumable, error: getError } = await supabase
        .from('consumable_stock')
        .select(`
          *,
          item_type:item_types(*)
        `)
        .eq('id', parseInt(consumableId, 10))
        .single()

      if (getError || !updatedConsumable) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.DATABASE_ERROR,
              message: 'Failed to fetch updated consumable',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 500 }
        )
      }

      // Log audit event
      try {
        await auditLogOperations.create({
          user_id: authContext.user.id,
          action: 'consumable_image_upload',
          entity_type: 'consumable',
          entity_id: parseInt(consumableId, 10),
          old_values: {
            image_url: consumable.item_type.image_url || null,
          },
          new_values: {
            image_url: urlData.publicUrl,
            consumable_name: consumable.item_type.name,
          },
        })
      } catch (auditError) {
        console.error('Failed to create audit log:', auditError)
      }

      return NextResponse.json({
        data: updatedConsumable,
        message: 'Image uploaded successfully',
      })
    })
  } catch (error: unknown) {
    console.error('Image upload error:', error)

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
