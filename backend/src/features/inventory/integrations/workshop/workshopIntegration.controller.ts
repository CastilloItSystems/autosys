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
    const workOrderId = req.params.workOrderId as string
    const { itemId, quantity, wasteQuantity } = req.body

    const result = await recordMaterialConsumption(workOrderId, itemId, quantity, wasteQuantity)
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
    const workOrderId = req.params.workOrderId as string
    const result = await getWorkOrderMaterialSummary(workOrderId)
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
    const { materials } = req.body
    const result = await checkMaterialRequirements(materials)
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
    const workOrderId = req.params.workOrderId as string
    const { finalNotes } = req.body

    await completeWorkOrder(workOrderId, finalNotes)
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
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 50

    const result = await getWorkOrderConsumptionHistory(page, limit)
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
