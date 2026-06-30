/**
 * Workshop Integration Controller
 */

import { Request, Response } from 'express'
import {
  recordMaterialConsumption,
  getWorkOrderMaterialSummary,
  checkMaterialRequirements,
  completeWorkOrder,
  getWorkOrderConsumptionHistory,
} from './workshopIntegration.service.js'
import { ApiResponse } from '../../../../shared/utils/apiResponse.js'

export const recordConsumptionHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const empresaId = req.empresaId!
    const userId = req.user?.userId ?? 'system'
    const workOrderId = req.params.workOrderId as string
    const { itemId, quantity, wasteQuantity } = req.body

    const result = await recordMaterialConsumption(
      workOrderId,
      itemId,
      quantity,
      wasteQuantity,
      userId,
      empresaId,
      req.prisma!
    )
    ApiResponse.created(res, result, 'Material consumption recorded successfully')
  } catch (error: any) {
    ApiResponse.error(res, error.message)
  }
}

export const getMaterialSummaryHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const empresaId = req.empresaId!
    const workOrderId = req.params.workOrderId as string
    const result = await getWorkOrderMaterialSummary(
      workOrderId,
      empresaId,
      req.prisma!
    )
    ApiResponse.success(res, result, 'Material summary retrieved successfully')
  } catch (error: any) {
    ApiResponse.error(res, error.message)
  }
}

export const checkRequirementsHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const empresaId = req.empresaId!
    const { materials } = req.body
    const result = await checkMaterialRequirements(
      materials,
      empresaId,
      req.prisma!
    )
    ApiResponse.success(res, result, 'Material requirements checked successfully')
  } catch (error: any) {
    ApiResponse.error(res, error.message)
  }
}

export const completeWorkOrderHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const empresaId = req.empresaId!
    const workOrderId = req.params.workOrderId as string
    const { finalNotes } = req.body

    await completeWorkOrder(workOrderId, empresaId, req.prisma!, finalNotes)
    ApiResponse.success(res, {}, 'Work order completed successfully')
  } catch (error: any) {
    ApiResponse.error(res, error.message)
  }
}

export const getConsumptionHistoryHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const empresaId = req.empresaId!
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 50

    const result = await getWorkOrderConsumptionHistory(
      empresaId,
      req.prisma!,
      page,
      limit
    )
    ApiResponse.paginated(res, result.data, page, limit, result.total, 'Work Order Consumption History')
  } catch (error: any) {
    ApiResponse.error(res, error.message)
  }
}

export default {
  recordConsumptionHandler,
  getMaterialSummaryHandler,
  checkRequirementsHandler,
  completeWorkOrderHandler,
  getConsumptionHistoryHandler,
}
