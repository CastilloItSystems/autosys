/**
 * Accounting Integration Controller
 */

import { Request, Response } from 'express'
import {
  postMovementToGL,
  allocateCostToCostCenters,
  getCostByCostCenter,
  getInventoryValuation,
} from './accountingIntegration.service.js'
import { ApiResponse } from '../../../../shared/utils/apiResponse.js'

export const postMovementHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const movementId = req.params.movementId as string
    const result = await postMovementToGL(movementId)
    ApiResponse.success(res, result, 'Movement posted to GL successfully')
  } catch (error: any) {
    ApiResponse.error(res, error.message)
  }
}

export const allocatCostHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const movementId = req.params.movementId as string
    const result = await allocateCostToCostCenters(movementId)
    ApiResponse.success(res, result, 'Cost allocated successfully')
  } catch (error: any) {
    ApiResponse.error(res, error.message)
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
    ApiResponse.success(res, result, 'Cost by center retrieved successfully')
  } catch (error: any) {
    ApiResponse.error(res, error.message)
  }
}

export const getValuationHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = await getInventoryValuation()
    ApiResponse.success(res, result, 'Inventory valuation retrieved successfully')
  } catch (error: any) {
    ApiResponse.error(res, error.message)
  }
}

export default {
  postMovementHandler,
  allocatCostHandler,
  getCostByCenterHandler,
  getValuationHandler,
}
