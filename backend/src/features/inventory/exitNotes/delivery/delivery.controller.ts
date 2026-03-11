/**
 * Exit Notes Delivery Controller
 * Route handlers for delivery workflow
 */

import { Request, Response } from 'express'
import { ExitNoteDeliveryService } from './delivery.service'
import { ApiResponse } from '../../../../shared/utils/apiResponse'

const deliveryService = ExitNoteDeliveryService.getInstance()

/**
 * Get delivery information
 */
export const getDeliveryInfo = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { exitNoteId } = req.params

  const result = await deliveryService.getDeliveryInfo(exitNoteId)
  res.status(200).json(ApiResponse.success(result, 'Delivery information'))
}

/**
 * Confirm delivery
 */
export const confirmDelivery = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { exitNoteId } = req.params
  const userId = (req as any).userId

  const result = await deliveryService.confirmDelivery(exitNoteId, userId)
  res
    .status(200)
    .json(ApiResponse.success(result, 'Delivery confirmed successfully'))
}

/**
 * Record delivery confirmation with signature/notes
 */
export const recordDeliveryConfirmation = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { exitNoteId } = req.params
  const { signatureUrl, deliveryNotes, recipientName, deliveredAt } = req.body
  const userId = (req as any).userId

  const result = await deliveryService.recordDeliveryConfirmation(
    exitNoteId,
    {
      signatureUrl,
      deliveryNotes,
      recipientName,
      deliveredAt: deliveredAt ? new Date(deliveredAt) : undefined,
    },
    userId
  )
  res
    .status(200)
    .json(
      ApiResponse.success(result, 'Delivery confirmation recorded successfully')
    )
}

/**
 * Get delivery history
 */
export const getDeliveryHistory = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { exitNoteId } = req.params

  const result = await deliveryService.getDeliveryHistory(exitNoteId)
  res.status(200).json(ApiResponse.success(result, 'Delivery history'))
}

/**
 * Get delivery tracking status
 */
export const getDeliveryTracking = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { exitNoteId } = req.params

  const result = await deliveryService.getDeliveryTracking(exitNoteId)
  res.status(200).json(ApiResponse.success(result, 'Delivery tracking status'))
}

/**
 * Cancel delivery
 */
export const cancelDelivery = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { exitNoteId } = req.params
  const { reason } = req.body
  const userId = (req as any).userId

  const result = await deliveryService.cancelDelivery(
    exitNoteId,
    reason,
    userId
  )
  res
    .status(200)
    .json(ApiResponse.success(result, 'Delivery cancelled successfully'))
}
