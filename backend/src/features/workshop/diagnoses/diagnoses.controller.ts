// backend/src/features/workshop/diagnoses/diagnoses.controller.ts
import type { Request, Response } from 'express'
import prisma from '../../../services/prisma.service.js'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import { PaginationHelper } from '../../../shared/utils/pagination.js'
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
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 10
  const serviceOrderId = req.query.serviceOrderId as string | undefined
  const result = await diagnosesService.findAllDiagnoses(prisma, req.empresaId!, page, limit, serviceOrderId)
  const items = result.data.map((i) => new DiagnosisResponseDTO(i))
  const meta = PaginationHelper.getMeta(result.page, result.limit, result.total)
  return res.status(200).json({
    success: true,
    message: 'Datos obtenidos exitosamente',
    data: items,
    meta,
    timestamp: new Date().toISOString(),
  })
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
  const userId = (req as any).user?.id as string
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
    req.params.findingId as string,
    req.empresaId!
  )
  return ApiResponse.success(res, null, 'Hallazgo eliminado')
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
