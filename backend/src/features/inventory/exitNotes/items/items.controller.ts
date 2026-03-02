/**
 * Exit Notes Items Controller
 * Route handlers for item operations within exit notes
 */

import { Request, Response } from 'express'
import { ExitNoteItemsService } from './items.service'
import { ApiResponse } from '../../../../shared/utils/ApiResponse'

const itemsService = ExitNoteItemsService.getInstance()

/**
 * Get all items for an exit note
 */
export const getItems = async (req: Request, res: Response): Promise<void> => {
  const { exitNoteId } = req.params as { exitNoteId: string }

  const items = await itemsService.getItems(exitNoteId)

  ApiResponse.success(res, items, 'Exit note items retrieved successfully')
}

/**
 * Get a specific item
 */
export const getItem = async (req: Request, res: Response): Promise<void> => {
  const { itemId } = req.params as { itemId: string }

  const item = await itemsService.getItem(itemId)
  if (!item) {
    ApiResponse.error(res, 'Item not found', 404)
    return
  }

  ApiResponse.success(res, item, 'Item retrieved successfully')
}

/**
 * Record item picking
 */
export const recordPicking = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { itemId } = req.params as { itemId: string }
  const { quantityPicked, location, notes } = req.body
  const userId = (req as any).user?.id

  const item = await itemsService.recordPicking(
    itemId,
    quantityPicked,
    location,
    userId,
    notes
  )

  ApiResponse.success(res, item, 'Item picking recorded successfully')
}

/**
 * Assign batch to item
 */
export const assignBatch = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { itemId } = req.params as { itemId: string }
  const { batchId } = req.body
  const userId = (req as any).user?.id

  const item = await itemsService.assignBatch(itemId, batchId, userId)

  ApiResponse.success(res, item, 'Batch assigned successfully')
}

/**
 * Assign serial number to item
 */
export const assignSerial = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { itemId } = req.params as { itemId: string }
  const { serialNumberId } = req.body
  const userId = (req as any).user?.id

  const item = await itemsService.assignSerialNumber(
    itemId,
    serialNumberId,
    userId
  )

  ApiResponse.success(res, item, 'Serial number assigned successfully')
}

/**
 * Verify item
 */
export const verifyItem = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { itemId } = req.params as { itemId: string }
  const { quantityVerified, notes } = req.body
  const userId = (req as any).user?.id

  const item = await itemsService.verifyItem(
    itemId,
    quantityVerified,
    userId,
    notes
  )

  ApiResponse.success(res, item, 'Item verified successfully')
}

/**
 * Reject item
 */
export const rejectItem = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { itemId } = req.params as { itemId: string }
  const { reason } = req.body
  const userId = (req as any).user?.id

  const item = await itemsService.rejectItem(itemId, reason, userId)

  ApiResponse.success(res, item, 'Item rejected successfully')
}

/**
 * Get items summary
 */
export const getItemsSummary = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { exitNoteId } = req.params as { exitNoteId: string }

  const summary = await itemsService.getItemsSummary(exitNoteId)

  ApiResponse.success(res, summary, 'Items summary retrieved successfully')
}

/**
 * Get items by batch
 */
export const getItemsByBatch = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { batchId } = req.params as { batchId: string }

  const items = await itemsService.getItemsByBatch(batchId)

  ApiResponse.success(res, items, 'Items retrieved successfully')
}

/**
 * Get items by serial number
 */
export const getItemsBySerial = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { serialNumberId } = req.params as { serialNumberId: string }

  const items = await itemsService.getItemsBySerial(serialNumberId)

  ApiResponse.success(res, items, 'Items retrieved successfully')
}
