import { NextRequest, NextResponse } from 'next/server'
import { evaluationTemplateOperations, templateQuestionOperations } from '@/lib/supabase-client'
import { withPermission } from '@/lib/auth-middleware'
import { PERMISSIONS } from '@/lib/permissions'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'
import * as XLSX from 'xlsx'
import type { SpaceType, QuestionCategory } from '@/types/evaluations'

// ============================================================================
// Types
// ============================================================================

interface TemplateWithQuestions {
  id: number
  name: string
  space_type: SpaceType
  version: number
  is_active: boolean
  questions: Array<{
    id: number
    question_text: string
    category: QuestionCategory
    is_required: boolean
    display_order: number
  }>
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Space type labels in Spanish
 */
const SPACE_TYPE_LABELS: Record<SpaceType, string> = {
  training_room: 'Aula de entrenamiento',
  warehouse: 'Almacén',
  external_plant: 'Planta externa'
}

/**
 * Category labels in Spanish
 */
const CATEGORY_LABELS: Record<QuestionCategory, string> = {
  organization: 'Organización',
  cleanliness: 'Limpieza',
  maintenance: 'Mantenimiento'
}

/**
 * Generates timestamp for filename
 */
function generateTimestamp(): string {
  const now = new Date()
  return now.toISOString().replace(/[:.]/g, '-').slice(0, 19)
}

// ============================================================================
// Export Functions
// ============================================================================

/**
 * Generates Excel file with all templates and their questions
 */
function generateAllTemplatesExcel(templates: TemplateWithQuestions[]): Blob {
  const workbook = XLSX.utils.book_new()
  
  // Summary sheet with all templates
  const summaryData = [
    ['Plantillas de Evaluación'],
    ['Generado:', new Date().toLocaleString('es-ES')],
    ['Total de Plantillas:', templates.length],
    [],
    ['ID', 'Nombre', 'Tipo de Espacio', 'Versión', 'Estado', 'Preguntas'],
  ]
  
  templates.forEach((template) => {
    summaryData.push([
      template.id.toString(),
      template.name,
      SPACE_TYPE_LABELS[template.space_type],
      `v${template.version}`,
      template.is_active ? 'Activa' : 'Inactiva',
      template.questions.length.toString(),
    ])
  })
  
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
  summarySheet['!cols'] = [
    { wch: 8 },   // ID
    { wch: 30 },  // Nombre
    { wch: 25 },  // Tipo de Espacio
    { wch: 10 },  // Versión
    { wch: 10 },  // Estado
    { wch: 12 },  // Preguntas
  ]
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen')
  
  // Create a sheet for each template with its questions
  templates.forEach((template) => {
    const templateData: (string | number)[][] = [
      ['Plantilla:', template.name],
      ['Tipo de Espacio:', SPACE_TYPE_LABELS[template.space_type]],
      ['Versión:', template.version],
      ['Estado:', template.is_active ? 'Activa' : 'Inactiva'],
      [],
      ['#', 'Pregunta', 'Categoría', 'Requerida'],
    ]
    
    template.questions
      .sort((a, b) => a.display_order - b.display_order)
      .forEach((question, index) => {
        templateData.push([
          index + 1,
          question.question_text,
          CATEGORY_LABELS[question.category],
          question.is_required ? 'Sí' : 'No',
        ])
      })
    
    const templateSheet = XLSX.utils.aoa_to_sheet(templateData)
    templateSheet['!cols'] = [
      { wch: 5 },   // #
      { wch: 60 },  // Pregunta
      { wch: 15 },  // Categoría
      { wch: 12 },  // Requerida
    ]
    
    // Sanitize sheet name (max 31 chars, no special chars)
    const sheetName = template.name
      .replace(/[\\/*?[\]:]/g, '')
      .substring(0, 31)
    
    XLSX.utils.book_append_sheet(workbook, templateSheet, sheetName)
  })
  
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}

/**
 * Generates Excel file for a single template
 */
function generateSingleTemplateExcel(template: TemplateWithQuestions): Blob {
  const workbook = XLSX.utils.book_new()
  
  // Template info and questions
  const templateData: (string | number)[][] = [
    ['Plantilla de Evaluación'],
    [],
    ['Nombre:', template.name],
    ['Tipo de Espacio:', SPACE_TYPE_LABELS[template.space_type]],
    ['Versión:', template.version],
    ['Estado:', template.is_active ? 'Activa' : 'Inactiva'],
    ['Total de Preguntas:', template.questions.length],
    ['Generado:', new Date().toLocaleString('es-ES')],
    [],
    ['PREGUNTAS'],
    ['#', 'Pregunta', 'Categoría', 'Requerida'],
  ]
  
  template.questions
    .sort((a, b) => a.display_order - b.display_order)
    .forEach((question, index) => {
      templateData.push([
        index + 1,
        question.question_text,
        CATEGORY_LABELS[question.category],
        question.is_required ? 'Sí' : 'No',
      ])
    })
  
  // Add category summary
  const categoryCounts = {
    organization: 0,
    cleanliness: 0,
    maintenance: 0,
  }
  
  template.questions.forEach((q) => {
    categoryCounts[q.category]++
  })
  
  templateData.push([])
  templateData.push(['RESUMEN POR CATEGORÍA'])
  templateData.push(['Categoría', 'Cantidad'])
  templateData.push(['Organización', categoryCounts.organization])
  templateData.push(['Limpieza', categoryCounts.cleanliness])
  templateData.push(['Mantenimiento', categoryCounts.maintenance])
  
  const templateSheet = XLSX.utils.aoa_to_sheet(templateData)
  templateSheet['!cols'] = [
    { wch: 20 },  // Column A
    { wch: 60 },  // Column B (Pregunta)
    { wch: 15 },  // Column C (Categoría)
    { wch: 12 },  // Column D (Requerida)
  ]
  
  XLSX.utils.book_append_sheet(workbook, templateSheet, 'Plantilla')
  
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}

// ============================================================================
// API Handler
// ============================================================================

/**
 * GET /api/admin/evaluations/templates/export
 * Exports evaluation templates to Excel format
 * Requires admin role
 *
 * Query parameters:
 * - template_id: (optional) Export a specific template. If not provided, exports all templates.
 *
 * @returns Excel file with template(s) and questions
 */
export async function GET(request: NextRequest) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_TOOLS, async () => {
      const { searchParams } = new URL(request.url)
      const templateId = searchParams.get('template_id')
      
      const timestamp = generateTimestamp()
      let blob: Blob
      let filename: string
      
      if (templateId) {
        // Export single template
        const id = parseInt(templateId, 10)
        
        if (isNaN(id) || id <= 0) {
          return NextResponse.json(
            {
              error: {
                code: ERROR_CODES.VALIDATION_ERROR,
                message: 'ID de plantilla inválido',
                timestamp: new Date().toISOString(),
              },
            },
            { status: 400 }
          )
        }
        
        const template = await evaluationTemplateOperations.getById(id)
        
        if (!template) {
          return NextResponse.json(
            {
              error: {
                code: ERROR_CODES.NOT_FOUND,
                message: 'Plantilla no encontrada',
                timestamp: new Date().toISOString(),
              },
            },
            { status: 404 }
          )
        }
        
        const templateWithQuestions: TemplateWithQuestions = {
          id: template.id,
          name: template.name,
          space_type: template.space_type,
          version: template.version,
          is_active: template.is_active,
          questions: template.questions || [],
        }
        
        blob = generateSingleTemplateExcel(templateWithQuestions)
        
        // Sanitize filename
        const safeName = template.name
          .replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\s-]/g, '')
          .replace(/\s+/g, '-')
          .substring(0, 50)
        
        filename = `plantilla-${safeName}-${timestamp}.xlsx`
      } else {
        // Export all templates
        const templates = await evaluationTemplateOperations.getAll()
        
        // Get questions for each template
        const templatesWithQuestions: TemplateWithQuestions[] = await Promise.all(
          templates.map(async (template) => {
            const questions = await templateQuestionOperations.getByTemplateId(template.id)
            return {
              id: template.id,
              name: template.name,
              space_type: template.space_type,
              version: template.version,
              is_active: template.is_active,
              questions: questions.map((q) => ({
                id: q.id,
                question_text: q.question_text,
                category: q.category,
                is_required: q.is_required,
                display_order: q.display_order,
              })),
            }
          })
        )
        
        blob = generateAllTemplatesExcel(templatesWithQuestions)
        filename = `plantillas-evaluacion-${timestamp}.xlsx`
      }
      
      // Return the file as a response
      const arrayBuffer = await blob.arrayBuffer()
      
      return new NextResponse(arrayBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': arrayBuffer.byteLength.toString(),
        },
      })
    })
  } catch (error: unknown) {
    console.error('[Templates Export API] GET error:', error)

    if (error instanceof Error) {
      if (error.name === 'AuthenticationError') {
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

      if (error.name === 'AuthorizationError') {
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
    }

    return NextResponse.json(
      {
        error: {
          code: 'EXPORT_FAILED',
          message: ERROR_MESSAGES.GENERIC_ERROR,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    )
  }
}
