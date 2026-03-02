/**
 * Accounting Integration Controller
 */

import { Request, Response } from 'express'
import {
  postMovementToGL,
  allocateCostToCostCenters,
  getCostByCostCenter,
  getInventoryValuation,
} from './accountingIntegration.service'
import { ApiResponse } from '../../../../shared/utils/api-response'

export const postMovementHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { movementId } = req.params
    const result = await postMovementToGL(movementId)
    res
      .status(200)
      .json(ApiResponse.success(result, 'Movement posted to GL successfully'))
  } catch (error: any) {
    res.status(500).json(ApiResponse.error(error.message))
  }
}

export const allocatCostHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { movementId } = req.params
    const result = await allocateCostToCostCenters(movementId)
    res
      .status(200)
      .json(ApiResponse.success(result, 'Cost allocated successfully'))
  } catch (error: any) {
    res.status(500).json(ApiResponse.error(error.message))
  }
}

export const getCostByCenterHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : new Date()

    const result = await getCostByCostCenter(startDate, endDate)
    res
      .status(200)
      .json(
        ApiResponse.success(result, 'Cost by center retrieved successfully')
      )
  } catch (error: any) {
    res.status(500).json(ApiResponse.error(error.message))
  }
}

export const getValuationHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = await getInventoryValuation()
    res
      .status(200)
      .json(
        ApiResponse.success(
          result,
          'Inventory valuation retrieved successfully'
        )
      )
  } catch (error: any) {
    res.status(500).json(ApiResponse.error(error.message))
  }
}

export default {
  postMovementHandler,
  allocatCostHandler,
  getCostByCenterHandler,
  getValuationHandler,
}
