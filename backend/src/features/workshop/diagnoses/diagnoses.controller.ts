// backend/src/features/workshop/diagnoses/diagnoses.controller.ts
import type { Request, Response } from 'express'
import prisma from '../../../services/prisma.service.js'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import r2StorageService from '../../../services/r2-storage.service.js'
import { BadRequestError } from '../../../shared/utils/apiError.js'
import * as diagnosesService from './diagnoses.service.js'
import {
  getRecommendedDiagnosticTemplate,
  getAllDiagnosticTemplates,
  getDiagnosticTemplateByCode,
  getDiagnosticTemplateStats,
} from '../integrations/diagnosis-templates-manager.service.js'
import {
  DiagnosisResponseDTO,
  CreateDiagnosisDTO,
  UpdateDiagnosisDTO,
  CreateDiagnosisFindingDTO,
  CreateDiagnosisSuggestedOpDTO,
  CreateDiagnosisSuggestedPartDTO,
} from './diagnoses.dto.js'
import { WORKSHOP_MESSAGES } from '../shared/constants/messages.js'

export const getAll = async (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 10,
    serviceOrderId,
    status,
  } = req.validatedQuery as any
  const result = await diagnosesService.findAllDiagnoses(
    prisma,
    req.empresaId!,
    page,
    limit,
    serviceOrderId,
    status
  )
  const items = result.data.map((i) => new DiagnosisResponseDTO(i))
  return ApiResponse.paginated(
    res,
    items,
    result.page,
    result.limit,
    result.total
  )
}

export const getOne = async (req: Request, res: Response) => {
  const item = await diagnosesService.findDiagnosisById(
    prisma,
    req.params.id as string,
    req.empresaId!
  )
  return ApiResponse.success(res, new DiagnosisResponseDTO(item))
}

export const getByOrder = async (req: Request, res: Response) => {
  const item = await diagnosesService.findDiagnosisByServiceOrder(
    prisma,
    req.params.orderId as string,
    req.empresaId!
  )
  return ApiResponse.success(res, item ? new DiagnosisResponseDTO(item) : {})
}

export const create = async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId as string
  const dto = new CreateDiagnosisDTO(req.body)
  const item = await diagnosesService.createDiagnosis(
    prisma,
    req.empresaId!,
    userId,
    dto
  )
  return ApiResponse.created(
    res,
    new DiagnosisResponseDTO(item),
    WORKSHOP_MESSAGES.diagnosis.created
  )
}

export const update = async (req: Request, res: Response) => {
  const dto = new UpdateDiagnosisDTO(req.body)
  const item = await diagnosesService.updateDiagnosis(
    prisma,
    req.params.id as string,
    req.empresaId!,
    dto
  )
  return ApiResponse.success(
    res,
    new DiagnosisResponseDTO(item),
    WORKSHOP_MESSAGES.diagnosis.updated
  )
}

export const addFinding = async (req: Request, res: Response) => {
  const dto = new CreateDiagnosisFindingDTO(req.body)
  const item = await diagnosesService.addDiagnosisFinding(
    prisma,
    req.params.id as string,
    req.empresaId!,
    dto
  )
  return ApiResponse.created(res, item, 'Hallazgo agregado')
}

export const addSuggestedOp = async (req: Request, res: Response) => {
  const dto = new CreateDiagnosisSuggestedOpDTO(req.body)
  const item = await diagnosesService.addDiagnosisSuggestedOp(
    prisma,
    req.params.id as string,
    req.empresaId!,
    dto
  )
  return ApiResponse.created(res, item, 'Operación sugerida agregada')
}

export const addSuggestedPart = async (req: Request, res: Response) => {
  const dto = new CreateDiagnosisSuggestedPartDTO(req.body)
  const item = await diagnosesService.addDiagnosisSuggestedPart(
    prisma,
    req.params.id as string,
    req.empresaId!,
    dto
  )
  return ApiResponse.created(res, item, 'Repuesto sugerido agregado')
}

export const removeFinding = async (req: Request, res: Response) => {
  await diagnosesService.removeDiagnosisFinding(
    prisma,
    req.params.id as string,
    req.params.findingId as string,
    req.empresaId!
  )
  return ApiResponse.success(res, null, 'Hallazgo eliminado')
}

export const removeSuggestedOp = async (req: Request, res: Response) => {
  await diagnosesService.removeDiagnosisSuggestedOp(
    prisma,
    req.params.id as string,
    req.params.opId as string,
    req.empresaId!
  )
  return ApiResponse.success(res, null, 'Operación sugerida eliminada')
}

export const removeSuggestedPart = async (req: Request, res: Response) => {
  await diagnosesService.removeDiagnosisSuggestedPart(
    prisma,
    req.params.id as string,
    req.params.partId as string,
    req.empresaId!
  )
  return ApiResponse.success(res, null, 'Repuesto sugerido eliminado')
}

export const addEvidence = async (req: Request, res: Response) => {
  const item = await diagnosesService.addDiagnosisEvidence(
    prisma,
    req.params.id as string,
    req.empresaId!,
    req.body
  )
  return ApiResponse.created(res, item, 'Evidencia agregada')
}

export const uploadEvidenceFile = async (req: Request, res: Response) => {
  if (!req.file) throw new BadRequestError('No se recibió ningún archivo')
  const key = `workshop/diagnoses/${req.params.id as string}/${Date.now()}-${req.file.originalname}`
  const url = await r2StorageService.uploadFile(
    req.file.buffer,
    key,
    req.file.mimetype
  )
  const item = await diagnosesService.addDiagnosisEvidence(
    prisma,
    req.params.id as string,
    req.empresaId!,
    {
      type: req.body.type || 'photo',
      url,
      description: req.body.description || undefined,
    }
  )
  return ApiResponse.created(res, item, 'Evidencia subida')
}

export const removeEvidence = async (req: Request, res: Response) => {
  await diagnosesService.removeDiagnosisEvidence(
    prisma,
    req.params.id as string,
    req.params.evidenceId as string,
    req.empresaId!
  )
  return ApiResponse.success(res, null, 'Evidencia eliminada')
}

export const remove = async (req: Request, res: Response) => {
  await diagnosesService.removeDiagnosis(
    prisma,
    req.params.id as string,
    req.empresaId!
  )
  return ApiResponse.success(res, null, 'Diagnóstico eliminado')
}

// FASE 3.2: Get diagnostic template recommendations for a service type
export const getRecommendedTemplate = async (req: Request, res: Response) => {
  try {
    const { serviceTypeCode } = req.query

    if (!serviceTypeCode) {
      return ApiResponse.error(
        res,
        'serviceTypeCode query parameter is required',
        400
      )
    }

    const template = await getRecommendedDiagnosticTemplate(
      prisma,
      serviceTypeCode as string
    )

    if (!template) {
      return ApiResponse.success(
        res,
        null,
        `No diagnostic template found for service type: ${serviceTypeCode}`
      )
    }

    return ApiResponse.success(
      res,
      template,
      'Recommended diagnostic template retrieved'
    )
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Error retrieving template'
    return ApiResponse.error(res, message, 400)
  }
}

// FASE 3.2: Get all available diagnostic templates
export const listDiagnosticTemplates = async (req: Request, res: Response) => {
  try {
    const templates = await getAllDiagnosticTemplates(prisma)
    return ApiResponse.success(
      res,
      templates,
      `Found ${templates.length} diagnostic templates`
    )
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Error retrieving templates'
    return ApiResponse.error(res, message, 400)
  }
}

// FASE 3.2: Get a specific diagnostic template by code
export const getTemplateByCode = async (req: Request, res: Response) => {
  try {
    const { code } = req.params

    const template = await getDiagnosticTemplateByCode(prisma, code as string)

    if (!template) {
      return ApiResponse.error(
        res,
        `Diagnostic template not found: ${code}`,
        404
      )
    }

    return ApiResponse.success(res, template, 'Diagnostic template retrieved')
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Error retrieving template'
    return ApiResponse.error(res, message, 400)
  }
}

// FASE 3.2: Get diagnostic templates statistics (counts and required items)
export const getTemplatesStats = async (req: Request, res: Response) => {
  try {
    const stats = await getDiagnosticTemplateStats(prisma)
    return ApiResponse.success(
      res,
      stats,
      'Diagnostic templates statistics retrieved'
    )
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Error retrieving statistics'
    return ApiResponse.error(res, message, 400)
  }
}
