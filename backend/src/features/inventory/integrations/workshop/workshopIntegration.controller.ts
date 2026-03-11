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
} from './workshopIntegration.service'
import { ApiResponse } from '../../../../shared/utils/apiResponse'

export const recordConsumptionHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { workOrderId } = req.params
    const { itemId, quantity, wasteQuantity } = req.body

    const result = await recordMaterialConsumption(
      workOrderId,
      itemId,
      quantity,
      wasteQuantity
    )
    res
      .status(201)
      .json(
        ApiResponse.created(
          result,
          'Material consumption recorded successfully'
        )
      )
  } catch (error: any) {
    res.status(500).json(ApiResponse.error(error.message))
  }
}

export const getMaterialSummaryHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { workOrderId } = req.params
    const result = await getWorkOrderMaterialSummary(workOrderId)
    res
      .status(200)
      .json(
        ApiResponse.success(result, 'Material summary retrieved successfully')
      )
  } catch (error: any) {
    res.status(500).json(ApiResponse.error(error.message))
  }
}

export const checkRequirementsHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { materials } = req.body
    const result = await checkMaterialRequirements(materials)
    res
      .status(200)
      .json(
        ApiResponse.success(
          result,
          'Material requirements checked successfully'
        )
      )
  } catch (error: any) {
    res.status(500).json(ApiResponse.error(error.message))
  }
}

export const completeWorkOrderHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { workOrderId } = req.params
    const { finalNotes } = req.body

    await completeWorkOrder(workOrderId, finalNotes)
    res
      .status(200)
      .json(ApiResponse.success({}, 'Work order completed successfully'))
  } catch (error: any) {
    res.status(500).json(ApiResponse.error(error.message))
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
    res
      .status(200)
      .json(
        ApiResponse.paginated(
          result.data,
          result.total,
          page,
          limit,
          'Work Order Consumption History'
        )
      )
  } catch (error: any) {
    res.status(500).json(ApiResponse.error(error.message))
  }
}

export default {
  recordConsumptionHandler,
  getMaterialSummaryHandler,
  checkRequirementsHandler,
  completeWorkOrderHandler,
  getConsumptionHistoryHandler,
}
