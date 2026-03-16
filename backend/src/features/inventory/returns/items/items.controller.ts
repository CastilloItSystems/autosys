/**
 * Return Items Controller
 */

import { Request, Response } from 'express'
import {
  addItemToReturn,
  processReturnItem,
  getReturnItems,
  getReturnAnalysisByItem,
  getAllReturnItems,
} from './items.service.js'
import { ApiResponse } from '../../../../shared/utils/apiResponse.js'

export const addItemHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const returnId = req.params.returnId as string
    const { itemId, quantity, reason, condition, notes } = req.body

    const result = await addItemToReturn(
      returnId,
      itemId,
      quantity,
      reason,
      condition,
      notes
    )
    ApiResponse.created(res, result, 'Item added to return successfully')
  } catch (error: any) {
    ApiResponse.error(res, error.message)
  }
}

export const processItemHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const returnId = req.params.returnId as string
    const itemId = req.params.itemId as string
    const { action, notes } = req.body

    const result = await processReturnItem(returnId, itemId, action, notes)
    ApiResponse.success(res, result, 'Return item processed successfully')
  } catch (error: any) {
    ApiResponse.error(res, error.message)
  }
}

export const getItemsHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const returnId = req.params.returnId as string
    const result = await getReturnItems(returnId)
    ApiResponse.success(res, result, 'Return items retrieved successfully')
  } catch (error: any) {
    ApiResponse.error(res, error.message)
  }
}

export const getAnalysisHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const itemId = req.params.itemId as string
    const days = parseInt(req.query.days as string) || 90
    const result = await getReturnAnalysisByItem(itemId, days)
    ApiResponse.success(res, result, 'Return analysis retrieved successfully')
  } catch (error: any) {
    ApiResponse.error(res, error.message)
  }
}

export const getAllItemsHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 50
    const result = await getAllReturnItems(page, limit)
    ApiResponse.paginated(res, result.data, page, limit, result.total, 'Return Items')
  } catch (error: any) {
    ApiResponse.error(res, error.message)
  }
}

export default {
  addItemHandler,
  processItemHandler,
  getItemsHandler,
  getAnalysisHandler,
  getAllItemsHandler,
}
