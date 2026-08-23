import { supabase } from '../supabase'
import type {
  EvaluationTemplate,
  EvaluationTemplateWithQuestions,
  TemplateQuestion,
  ScheduledEvaluation,
  ScheduledEvaluationWithDetails,
  EvaluationResult,
  EvaluationResultWithResponses,
  EvaluationResponse,
  CreateTemplateInput,
  UpdateTemplateInput,
  CreateScheduledEvaluationInput,
  CreateEvaluationResultInput,
  SpaceType,
  EvaluationStatus,
} from '@/types/evaluations'

export const evaluationTemplateOperations = {
  async getAll(): Promise<EvaluationTemplate[]> {
    const { data, error } = await supabase
      .from('evaluation_templates')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) throw error
    return data || []
  },

  async getById(id: number): Promise<EvaluationTemplateWithQuestions | null> {
    const { data, error } = await supabase
      .from('evaluation_templates')
      .select(`
        *,
        questions:template_questions(*)
      `)
      .eq('id', id)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    if (!data) return null

    const questions = (data.questions || []).sort(
      (a: TemplateQuestion, b: TemplateQuestion) => a.display_order - b.display_order
    )

    return { ...data, questions }
  },

  async create(input: CreateTemplateInput, userId?: number): Promise<EvaluationTemplateWithQuestions> {
    if (!input.questions || input.questions.length === 0) {
      throw new Error('Template must have at least one question')
    }

    const { data: template, error: templateError } = await supabase
      .from('evaluation_templates')
      .insert({
        name: input.name,
        space_type: input.space_type,
        version: 1,
        is_active: true,
        created_by: userId || null,
      })
      .select()
      .single()

    if (templateError) throw templateError

    const questionsToInsert = input.questions.map((q, index) => ({
      template_id: template.id,
      question_text: q.question_text,
      category: q.category,
      is_required: q.is_required,
      display_order: q.display_order ?? index,
    }))

    const { data: questions, error: questionsError } = await supabase
      .from('template_questions')
      .insert(questionsToInsert)
      .select()

    if (questionsError) throw questionsError

    return { ...template, questions: questions || [] }
  },

  async update(id: number, input: UpdateTemplateInput, userId?: number): Promise<EvaluationTemplateWithQuestions> {
    const { data: existingEvaluations } = await supabase
      .from('scheduled_evaluations')
      .select('id')
      .eq('template_id', id)
      .eq('status', 'completed')
      .limit(1)

    const hasCompletedEvaluations = existingEvaluations && existingEvaluations.length > 0

    if (hasCompletedEvaluations && input.questions) {
      await supabase
        .from('evaluation_templates')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id)

      const { data: currentTemplate } = await supabase
        .from('evaluation_templates')
        .select('version, name, space_type')
        .eq('id', id)
        .single()

      const newTemplateInput: CreateTemplateInput = {
        name: input.name || currentTemplate?.name || '',
        space_type: input.space_type || currentTemplate?.space_type || 'training_room',
        questions: input.questions.map((q, index) => ({
          question_text: q.question_text,
          category: q.category,
          is_required: q.is_required,
          display_order: q.display_order ?? index,
        })),
      }

      const { data: newTemplate, error: newTemplateError } = await supabase
        .from('evaluation_templates')
        .insert({
          name: newTemplateInput.name,
          space_type: newTemplateInput.space_type,
          version: (currentTemplate?.version || 1) + 1,
          is_active: true,
          created_by: userId || null,
        })
        .select()
        .single()

      if (newTemplateError) throw newTemplateError

      const questionsToInsert = newTemplateInput.questions.map((q, index) => ({
        template_id: newTemplate.id,
        question_text: q.question_text,
        category: q.category,
        is_required: q.is_required,
        display_order: q.display_order ?? index,
      }))

      const { data: questions, error: questionsError } = await supabase
        .from('template_questions')
        .insert(questionsToInsert)
        .select()

      if (questionsError) throw questionsError

      return { ...newTemplate, questions: questions || [] }
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }
    if (input.name !== undefined) updateData.name = input.name
    if (input.space_type !== undefined) updateData.space_type = input.space_type
    if (input.is_active !== undefined) updateData.is_active = input.is_active

    const { data: template, error: templateError } = await supabase
      .from('evaluation_templates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (templateError) throw templateError

    if (input.questions) {
      await supabase
        .from('template_questions')
        .delete()
        .eq('template_id', id)

      const questionsToInsert = input.questions.map((q, index) => ({
        template_id: id,
        question_text: q.question_text,
        category: q.category,
        is_required: q.is_required,
        display_order: q.display_order ?? index,
      }))

      const { data: questions, error: questionsError } = await supabase
        .from('template_questions')
        .insert(questionsToInsert)
        .select()

      if (questionsError) throw questionsError

      return { ...template, questions: questions || [] }
    }

    const { data: questions } = await supabase
      .from('template_questions')
      .select('*')
      .eq('template_id', id)
      .order('display_order', { ascending: true })

    return { ...template, questions: questions || [] }
  },

  async delete(id: number): Promise<void> {
    const { data: pendingEvaluations } = await supabase
      .from('scheduled_evaluations')
      .select('id')
      .eq('template_id', id)
      .eq('status', 'pending')
      .limit(1)

    if (pendingEvaluations && pendingEvaluations.length > 0) {
      throw new Error('Cannot delete template with pending evaluations')
    }

    const { error } = await supabase
      .from('evaluation_templates')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async getBySpaceType(spaceType: SpaceType): Promise<EvaluationTemplate[]> {
    const { data, error } = await supabase
      .from('evaluation_templates')
      .select('*')
      .eq('space_type', spaceType)
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) throw error
    return data || []
  },
}

export const templateQuestionOperations = {
  async getByTemplateId(templateId: number): Promise<TemplateQuestion[]> {
    const { data, error } = await supabase
      .from('template_questions')
      .select('*')
      .eq('template_id', templateId)
      .order('display_order', { ascending: true })

    if (error) throw error
    return data || []
  },

  async create(
    templateId: number,
    input: Omit<TemplateQuestion, 'id' | 'template_id' | 'created_at' | 'updated_at'>
  ): Promise<TemplateQuestion> {
    const { data, error } = await supabase
      .from('template_questions')
      .insert({
        template_id: templateId,
        question_text: input.question_text,
        category: input.category,
        is_required: input.is_required,
        display_order: input.display_order,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async update(
    id: number,
    input: Partial<Omit<TemplateQuestion, 'id' | 'template_id' | 'created_at' | 'updated_at'>>
  ): Promise<TemplateQuestion> {
    const { data, error } = await supabase
      .from('template_questions')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('template_questions')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async reorder(templateId: number, questionIds: number[]): Promise<void> {
    const updates = questionIds.map((questionId, index) =>
      supabase
        .from('template_questions')
        .update({ display_order: index, updated_at: new Date().toISOString() })
        .eq('id', questionId)
        .eq('template_id', templateId)
    )

    await Promise.all(updates)
  },
}

export const scheduledEvaluationOperations = {
  async getAll(filters?: {
    status?: EvaluationStatus
    classroom_id?: number
    template_id?: number
    assigned_to?: number
  }): Promise<ScheduledEvaluationWithDetails[]> {
    let query = supabase
      .from('scheduled_evaluations')
      .select(`
        *,
        classroom:classrooms(id, name, location, responsible_person),
        template:evaluation_templates(id, name, space_type),
        assigned_user:users!scheduled_evaluations_assigned_to_fkey(id, username, full_name),
        approver:users!scheduled_evaluations_approver_id_fkey(id, username, full_name)
      `)
      .order('scheduled_date', { ascending: false })

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.classroom_id) {
      query = query.eq('classroom_id', filters.classroom_id)
    }
    if (filters?.template_id) {
      query = query.eq('template_id', filters.template_id)
    }
    if (filters?.assigned_to) {
      query = query.eq('assigned_to', filters.assigned_to)
    }

    const { data, error } = await query
    if (error) throw error

    const now = new Date()
    const results = (data || []).map((evaluation) => {
      const scheduledDate = new Date(evaluation.scheduled_date)
      if (evaluation.status === 'pending' && scheduledDate < now) {
        return { ...evaluation, status: 'overdue' as EvaluationStatus }
      }
      return evaluation
    })

    return results as unknown as ScheduledEvaluationWithDetails[]
  },

  async getById(id: number): Promise<ScheduledEvaluationWithDetails | null> {
    const { data, error } = await supabase
      .from('scheduled_evaluations')
      .select(`
        *,
        classroom:classrooms(id, name, location, responsible_person, responsible_user_id),
        template:evaluation_templates(id, name, space_type),
        assigned_user:users!scheduled_evaluations_assigned_to_fkey(id, username, full_name),
        approver:users!scheduled_evaluations_approver_id_fkey(id, username, full_name)
      `)
      .eq('id', id)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    if (!data) return null

    const now = new Date()
    const scheduledDate = new Date(data.scheduled_date)
    if (data.status === 'pending' && scheduledDate < now) {
      data.status = 'overdue'
    }

    const { data: result } = await supabase
      .from('evaluation_results')
      .select('*')
      .eq('scheduled_evaluation_id', id)
      .single()

    return { ...data, result: result || undefined } as unknown as ScheduledEvaluationWithDetails
  },

  async create(input: CreateScheduledEvaluationInput, userId?: number): Promise<ScheduledEvaluation> {
    if (!input.classroom_id || !input.template_id || !input.scheduled_date) {
      throw new Error('Missing required fields: classroom_id, template_id, and scheduled_date are required')
    }

    const { data, error } = await supabase
      .from('scheduled_evaluations')
      .insert({
        classroom_id: input.classroom_id,
        template_id: input.template_id,
        scheduled_date: input.scheduled_date,
        status: 'pending',
        created_by: userId || null,
        assigned_to: input.assigned_to || null,
        approver_id: input.approver_id || null,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async update(
    id: number,
    input: Partial<Pick<ScheduledEvaluation, 'scheduled_date' | 'template_id'>>
  ): Promise<ScheduledEvaluation> {
    const { data: current } = await supabase
      .from('scheduled_evaluations')
      .select('status')
      .eq('id', id)
      .single()

    if (current?.status !== 'pending') {
      throw new Error('Only pending evaluations can be edited')
    }

    const { data, error } = await supabase
      .from('scheduled_evaluations')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('scheduled_evaluations')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) throw error
  },

  async getByDateRange(startDate: string, endDate: string): Promise<ScheduledEvaluationWithDetails[]> {
    const { data, error } = await supabase
      .from('scheduled_evaluations')
      .select(`
        *,
        classroom:classrooms(id, name, location, responsible_person),
        template:evaluation_templates(id, name, space_type)
      `)
      .gte('scheduled_date', startDate)
      .lte('scheduled_date', endDate)
      .order('scheduled_date', { ascending: true })

    if (error) throw error

    const now = new Date()
    const results = (data || []).map((evaluation) => {
      const scheduledDate = new Date(evaluation.scheduled_date)
      if (evaluation.status === 'pending' && scheduledDate < now) {
        return { ...evaluation, status: 'overdue' as EvaluationStatus }
      }
      return evaluation
    })

    return results as unknown as ScheduledEvaluationWithDetails[]
  },

  async getByClassroom(classroomId: number): Promise<ScheduledEvaluationWithDetails[]> {
    return this.getAll({ classroom_id: classroomId })
  },
}

export const evaluationResultOperations = {
  async create(input: CreateEvaluationResultInput, evaluatorId: number): Promise<EvaluationResult> {
    const { data: scheduledEval } = await supabase
      .from('scheduled_evaluations')
      .select(`
        *,
        template:evaluation_templates(
          *,
          questions:template_questions(*)
        )
      `)
      .eq('id', input.scheduled_evaluation_id)
      .single()

    if (!scheduledEval) {
      throw new Error('Scheduled evaluation not found')
    }

    const template = scheduledEval.template as unknown as EvaluationTemplateWithQuestions
    const questions = template.questions || []

    if (!input.is_draft) {
      const requiredQuestionIds = questions
        .filter((q: TemplateQuestion) => q.is_required)
        .map((q: TemplateQuestion) => q.id)

      const answeredQuestionIds = input.responses.map((r) => r.question_id)
      const missingRequired = requiredQuestionIds.filter(
        (id: number) => !answeredQuestionIds.includes(id)
      )

      if (missingRequired.length > 0) {
        throw new Error('Missing required responses')
      }
    }

    let totalScore = 0
    let maxPossibleScore = 0
    const categoryScores = {
      organization: { score: 0, max: 0 },
      cleanliness: { score: 0, max: 0 },
      maintenance: { score: 0, max: 0 },
    }

    input.responses.forEach((response) => {
      const question = questions.find((q: TemplateQuestion) => q.id === response.question_id)
      if (!question) return

      if (response.response !== 'not_applicable') {
        maxPossibleScore++
        categoryScores[question.category].max++

        if (response.response === 'yes') {
          totalScore++
          categoryScores[question.category].score++
        }
      }
    })

    const scorePercentage = maxPossibleScore > 0
      ? Math.round((totalScore / maxPossibleScore) * 10000) / 100
      : 0

    const { data: result, error: resultError } = await supabase
      .from('evaluation_results')
      .insert({
        scheduled_evaluation_id: input.scheduled_evaluation_id,
        evaluator_id: evaluatorId,
        completed_at: new Date().toISOString(),
        total_score: totalScore,
        max_possible_score: maxPossibleScore,
        score_percentage: scorePercentage,
        organization_score: categoryScores.organization.score,
        organization_max: categoryScores.organization.max,
        cleanliness_score: categoryScores.cleanliness.score,
        cleanliness_max: categoryScores.cleanliness.max,
        maintenance_score: categoryScores.maintenance.score,
        maintenance_max: categoryScores.maintenance.max,
        is_draft: input.is_draft || false,
      })
      .select()
      .single()

    if (resultError) throw resultError

    const responsesToInsert = input.responses.map((r) => ({
      result_id: result.id,
      question_id: r.question_id,
      response: r.response,
      observation: r.observation || null,
    }))

    const { error: responsesError } = await supabase
      .from('evaluation_responses')
      .insert(responsesToInsert)

    if (responsesError) throw responsesError

    if (!input.is_draft) {
      await supabase
        .from('scheduled_evaluations')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.scheduled_evaluation_id)
    }

    return result
  },

  async update(id: number, input: CreateEvaluationResultInput): Promise<EvaluationResult> {
    const { data: currentResult } = await supabase
      .from('evaluation_results')
      .select('*')
      .eq('id', id)
      .single()

    if (!currentResult) {
      throw new Error('Evaluation result not found')
    }

    if (!currentResult.is_draft) {
      throw new Error('Cannot update a completed evaluation')
    }

    await supabase
      .from('evaluation_responses')
      .delete()
      .eq('result_id', id)

    const { data: scheduledEval } = await supabase
      .from('scheduled_evaluations')
      .select(`
        template:evaluation_templates(
          questions:template_questions(*)
        )
      `)
      .eq('id', currentResult.scheduled_evaluation_id)
      .single()

    const template = scheduledEval?.template as unknown as { questions: TemplateQuestion[] }
    const questions = template?.questions || []

    let totalScore = 0
    let maxPossibleScore = 0
    const categoryScores = {
      organization: { score: 0, max: 0 },
      cleanliness: { score: 0, max: 0 },
      maintenance: { score: 0, max: 0 },
    }

    input.responses.forEach((response) => {
      const question = questions.find((q) => q.id === response.question_id)
      if (!question) return

      if (response.response !== 'not_applicable') {
        maxPossibleScore++
        categoryScores[question.category].max++

        if (response.response === 'yes') {
          totalScore++
          categoryScores[question.category].score++
        }
      }
    })

    const scorePercentage = maxPossibleScore > 0
      ? Math.round((totalScore / maxPossibleScore) * 10000) / 100
      : 0

    const { data: result, error: resultError } = await supabase
      .from('evaluation_results')
      .update({
        completed_at: new Date().toISOString(),
        total_score: totalScore,
        max_possible_score: maxPossibleScore,
        score_percentage: scorePercentage,
        organization_score: categoryScores.organization.score,
        organization_max: categoryScores.organization.max,
        cleanliness_score: categoryScores.cleanliness.score,
        cleanliness_max: categoryScores.cleanliness.max,
        maintenance_score: categoryScores.maintenance.score,
        maintenance_max: categoryScores.maintenance.max,
        is_draft: input.is_draft || false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (resultError) throw resultError

    const responsesToInsert = input.responses.map((r) => ({
      result_id: id,
      question_id: r.question_id,
      response: r.response,
      observation: r.observation || null,
    }))

    const { error: responsesError } = await supabase
      .from('evaluation_responses')
      .insert(responsesToInsert)

    if (responsesError) throw responsesError

    if (!input.is_draft) {
      await supabase
        .from('scheduled_evaluations')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentResult.scheduled_evaluation_id)
    }

    return result
  },

  async getByScheduledId(scheduledEvaluationId: number): Promise<EvaluationResultWithResponses | null> {
    const { data, error } = await supabase
      .from('evaluation_results')
      .select(`
        *,
        evaluator:users!evaluation_results_evaluator_id_fkey(id, username, full_name),
        responses:evaluation_responses(
          *,
          question:template_questions(*)
        )
      `)
      .eq('scheduled_evaluation_id', scheduledEvaluationId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data as unknown as EvaluationResultWithResponses | null
  },

  async getByClassroom(
    classroomId: number,
    filters?: { start_date?: string; end_date?: string }
  ): Promise<EvaluationResultWithResponses[]> {
    let query = supabase
      .from('evaluation_results')
      .select(`
        *,
        evaluator:users!evaluation_results_evaluator_id_fkey(id, username, full_name),
        scheduled_evaluation:scheduled_evaluations!inner(
          classroom_id,
          scheduled_date,
          template:evaluation_templates(id, name, space_type)
        )
      `)
      .eq('scheduled_evaluation.classroom_id', classroomId)
      .eq('is_draft', false)
      .order('completed_at', { ascending: false })

    if (filters?.start_date) {
      query = query.gte('completed_at', filters.start_date)
    }
    if (filters?.end_date) {
      query = query.lte('completed_at', filters.end_date)
    }

    const { data, error } = await query
    if (error) throw error
    return (data || []) as unknown as EvaluationResultWithResponses[]
  },

  async getByResponsible(
    responsiblePerson: string,
    filters?: { start_date?: string; end_date?: string }
  ): Promise<EvaluationResultWithResponses[]> {
    const { data: classrooms } = await supabase
      .from('classrooms')
      .select('id')
      .eq('responsible_person', responsiblePerson)

    if (!classrooms || classrooms.length === 0) {
      return []
    }

    const classroomIds = classrooms.map((c) => c.id)

    let query = supabase
      .from('evaluation_results')
      .select(`
        *,
        evaluator:users!evaluation_results_evaluator_id_fkey(id, username, full_name),
        scheduled_evaluation:scheduled_evaluations!inner(
          classroom_id,
          scheduled_date,
          classroom:classrooms(id, name, location, responsible_person),
          template:evaluation_templates(id, name, space_type)
        )
      `)
      .in('scheduled_evaluation.classroom_id', classroomIds)
      .eq('is_draft', false)
      .order('completed_at', { ascending: false })

    if (filters?.start_date) {
      query = query.gte('completed_at', filters.start_date)
    }
    if (filters?.end_date) {
      query = query.lte('completed_at', filters.end_date)
    }

    const { data, error } = await query
    if (error) throw error
    return (data || []) as unknown as EvaluationResultWithResponses[]
  },

  async getById(id: number): Promise<EvaluationResult | null> {
    const { data, error } = await supabase
      .from('evaluation_results')
      .select('*')
      .eq('id', id)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data as EvaluationResult | null
  },

  async getByIdWithDetails(id: number): Promise<EvaluationResultWithResponses | null> {
    const { data, error } = await supabase
      .from('evaluation_results')
      .select(`
        *,
        evaluator:users!evaluation_results_evaluator_id_fkey(id, username, full_name),
        approver:users!evaluation_results_approved_by_fkey(id, username, full_name),
        responses:evaluation_responses(
          *,
          question:template_questions(*)
        ),
        scheduled_evaluation:scheduled_evaluations(
          *,
          classroom:classrooms(id, name, location, responsible_person),
          template:evaluation_templates(id, name, space_type)
        )
      `)
      .eq('id', id)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data as unknown as EvaluationResultWithResponses | null
  },

  async updateApproval(
    id: number,
    approvalStatus: 'approved' | 'rejected',
    approvedBy: number,
    comments?: string
  ): Promise<EvaluationResult> {
    const { data, error } = await supabase
      .from('evaluation_results')
      .update({
        approval_status: approvalStatus,
        approved_by: approvedBy,
        approved_at: new Date().toISOString(),
        approval_comments: comments || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as EvaluationResult
  },

  async getPendingApproval(approverId?: number): Promise<EvaluationResultWithResponses[]> {
    let query = supabase
      .from('evaluation_results')
      .select(`
        *,
        evaluator:users!evaluation_results_evaluator_id_fkey(id, username, full_name),
        scheduled_evaluation:scheduled_evaluations!inner(
          *,
          classroom:classrooms(id, name, location, responsible_person),
          template:evaluation_templates(id, name, space_type)
        )
      `)
      .eq('is_draft', false)
      .eq('approval_status', 'pending')
      .order('completed_at', { ascending: false })

    if (approverId) {
      query = query.eq('scheduled_evaluation.approver_id', approverId)
    }

    const { data, error } = await query
    if (error) throw error
    return (data || []) as unknown as EvaluationResultWithResponses[]
  },
}

export const evaluationResponseOperations = {
  async createBatch(
    resultId: number,
    responses: Array<{
      question_id: number
      response: 'yes' | 'no' | 'not_applicable'
      observation?: string
    }>
  ): Promise<EvaluationResponse[]> {
    const responsesToInsert = responses.map((r) => ({
      result_id: resultId,
      question_id: r.question_id,
      response: r.response,
      observation: r.observation || null,
    }))

    const { data, error } = await supabase
      .from('evaluation_responses')
      .insert(responsesToInsert)
      .select()

    if (error) throw error
    return data || []
  },

  async getByResultId(resultId: number): Promise<EvaluationResponse[]> {
    const { data, error } = await supabase
      .from('evaluation_responses')
      .select(`
        *,
        question:template_questions(*)
      `)
      .eq('result_id', resultId)
      .order('question_id', { ascending: true })

    if (error) throw error
    return data || []
  },
}
