// backend/src/features/workshop/checklists/checklists.controller.ts
import type { Request, Response } from 'express'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'
import checklistService from './checklists.service.js'
import {
  CreateChecklistTemplateDTO,
  UpdateChecklistTemplateDTO,
  ChecklistTemplateResponseDTO,
} from './checklists.dto.js'
import { ChecklistCategory } from './checklists.interface.js'
import {
  validateWithConditionalRules,
  getValidationDetailsWithConditionalRules,
} from './checklists-conditional.service.js'

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = req.empresaId!
  const userId = ((req as any).user?.id ?? 'system') as string
  const { page, limit, search, category, isActive } = req.query

  const filters: any = {
    page: Number(page) || 1,
    limit: Number(limit) || 20,
    search: search as string,
    category: category as ChecklistCategory,
  }
  if (isActive === 'true') filters.isActive = true
  if (isActive === 'false') filters.isActive = false

  const result = await checklistService.findAllChecklistTemplates(
    empresaId,
    filters,
    (req as any).prisma ||
      require('../../../../services/prisma.service.js').default
  )

  const templates = result.checklists.map(
    (i) => new ChecklistTemplateResponseDTO(i)
  )

  return ApiResponse.paginated(
    res,
    templates,
    result.page,
    result.limit,
    result.total
  )
})

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const item = await checklistService.findChecklistTemplateById(
    req.empresaId!,
    req.params.id as string,
    (req as any).prisma ||
      require('../../../../services/prisma.service.js').default
  )
  return ApiResponse.success(res, new ChecklistTemplateResponseDTO(item))
})

export const create = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = req.empresaId!
  const userId = ((req as any).user?.id ?? 'system') as string

  const dto = new CreateChecklistTemplateDTO(req.body)
  const item = await checklistService.createChecklistTemplate(
    empresaId,
    userId,
    dto,
    (req as any).prisma ||
      require('../../../../services/prisma.service.js').default
  )
  return ApiResponse.created(
    res,
    new ChecklistTemplateResponseDTO(item),
    'Plantilla creada'
  )
})

export const update = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = req.empresaId!
  const userId = ((req as any).user?.id ?? 'system') as string

  const dto = new UpdateChecklistTemplateDTO(req.body)
  const item = await checklistService.updateChecklistTemplate(
    empresaId,
    req.params.id as string,
    dto,
    userId,
    (req as any).prisma ||
      require('../../../../services/prisma.service.js').default
  )
  return ApiResponse.success(
    res,
    new ChecklistTemplateResponseDTO(item),
    'Plantilla actualizada'
  )
})

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const empresaId = req.empresaId!
  const userId = ((req as any).user?.id ?? 'system') as string

  await checklistService.deleteChecklistTemplate(
    empresaId,
    req.params.id as string,
    userId,
    (req as any).prisma ||
      require('../../../../services/prisma.service.js').default
  )
  return ApiResponse.success(res, null, 'Plantilla eliminada')
})

/**
 * FASE 3.3: Evaluate conditional rules based on checklist responses
 * Validates responses against static + conditionally-activated required fields
 */
export const evaluateConditionals = asyncHandler(
  async (req: Request, res: Response) => {
    const { templateId } = req.params
    const { responses } = req.body as { responses: any[] }
    const prisma =
      (req as any).prisma ||
      require('../../../../services/prisma.service.js').default

    if (!Array.isArray(responses)) {
      return ApiResponse.badRequest(res, 'responses debe ser un array')
    }

    // Validate with conditional rules
    const validation = await validateWithConditionalRules(
      prisma,
      templateId as string,
      responses as any[]
    )

    return ApiResponse.success(res, {
      isValid: validation.isValid,
      missingRequiredItems: validation.missingRequiredItems,
      activatedRules: validation.activatedRules,
    })
  }
)

/**
 * Get detailed validation information
 */
export const getValidationDetails = asyncHandler(
  async (req: Request, res: Response) => {
    const { templateId } = req.params
    const { responses } = req.body as { responses: any[] }
    const prisma =
      (req as any).prisma ||
      require('../../../../services/prisma.service.js').default

    if (!Array.isArray(responses)) {
      return ApiResponse.badRequest(res, 'responses debe ser un array')
    }

    const validation = await getValidationDetailsWithConditionalRules(
      prisma,
      templateId as string,
      responses as any[]
    )

    return ApiResponse.success(res, validation)
  }
)
