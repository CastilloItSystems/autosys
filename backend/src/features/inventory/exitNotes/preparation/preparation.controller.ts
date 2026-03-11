/**
 * Exit Notes Preparation Controller
 * Route handlers for preparation workflow
 */

import { Request, Response } from 'express'
import { ExitNotePreparationService } from './preparation.service'
import { ApiResponse } from '../../../../shared/utils/apiResponse'

const preparationService = ExitNotePreparationService.getInstance()

/**
 * Start preparation - generate picking list
 */
export const startPreparation = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { exitNoteId } = req.params
  const userId = (req as any).userId

  const result = await preparationService.startPreparation(exitNoteId, userId)
  res
    .status(200)
    .json(
      ApiResponse.success(result, 'Preparation started, picking list generated')
    )
}

/**
 * Get picking list
 */
export const getPickingList = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { exitNoteId } = req.params

  const result = await preparationService.getPickingList(exitNoteId)
  res.status(200).json(ApiResponse.success(result, 'Picking list retrieved'))
}

/**
 * Mark items as picked
 */
export const markItemsAsPicked = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { exitNoteId } = req.params
  const { items } = req.body
  const userId = (req as any).userId

  const result = await preparationService.markItemsAsPicked(
    exitNoteId,
    items,
    userId
  )
  res
    .status(200)
    .json(ApiResponse.success(result, 'Items marked as picked successfully'))
}

/**
 * Verify picked items
 */
export const verifyPickedItems = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { exitNoteId } = req.params
  const { items: verifications } = req.body
  const userId = (req as any).userId

  const result = await preparationService.verifyPickedItems(
    exitNoteId,
    verifications,
    userId
  )
  res
    .status(200)
    .json(ApiResponse.success(result, 'Items verified successfully'))
}

/**
 * Get preparation status
 */
export const getPreparationStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { exitNoteId } = req.params

  const result = await preparationService.getPreparationStatus(exitNoteId)
  res.status(200).json(ApiResponse.success(result, 'Preparation status'))
}

/**
 * Complete preparation
 */
export const completePreparation = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { exitNoteId } = req.params
  const userId = (req as any).userId

  const result = await preparationService.completePreparation(
    exitNoteId,
    userId
  )
  res
    .status(200)
    .json(ApiResponse.success(result, 'Preparation completed successfully'))
}

/**
 * Get preparation summary
 */
export const getPreparationSummary = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { exitNoteId } = req.params

  const result = await preparationService.getPreparationSummary(exitNoteId)
  res
    .status(200)
    .json(ApiResponse.success(result, 'Preparation summary retrieved'))
}
