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
    const { returnId } = req.params
    const { itemId, quantity, reason, condition, notes } = req.body

    const result = await addItemToReturn(
      returnId,
      itemId,
      quantity,
      reason,
      condition,
      notes
    )
    res
      .status(201)
      .json(ApiResponse.created(result, 'Item added to return successfully'))
  } catch (error: any) {
    res.status(500).json(ApiResponse.error(error.message))
  }
}

export const processItemHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { returnId, itemId } = req.params
    const { action, notes } = req.body

    const result = await processReturnItem(returnId, itemId, action, notes)
    res
      .status(200)
      .json(ApiResponse.success(result, 'Return item processed successfully'))
  } catch (error: any) {
    res.status(500).json(ApiResponse.error(error.message))
  }
}

export const getItemsHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { returnId } = req.params
    const result = await getReturnItems(returnId)
    res
      .status(200)
      .json(ApiResponse.success(result, 'Return items retrieved successfully'))
  } catch (error: any) {
    res.status(500).json(ApiResponse.error(error.message))
  }
}

export const getAnalysisHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { itemId } = req.params
    const days = parseInt(req.query.days as string) || 90
    const result = await getReturnAnalysisByItem(itemId, days)
    res
      .status(200)
      .json(
        ApiResponse.success(result, 'Return analysis retrieved successfully')
      )
  } catch (error: any) {
    res.status(500).json(ApiResponse.error(error.message))
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
    res
      .status(200)
      .json(
        ApiResponse.paginated(
          result.data,
          result.total,
          page,
          limit,
          'Return Items'
        )
      )
  } catch (error: any) {
    res.status(500).json(ApiResponse.error(error.message))
  }
}

export default {
  addItemHandler,
  processItemHandler,
  getItemsHandler,
  getAnalysisHandler,
  getAllItemsHandler,
}
