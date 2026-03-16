/**
 * Sales Integration Controller
 */

import { Request, Response } from 'express'
import {
  linkExitNoteToPreInvoice,
  linkExitNoteToSalesOrder,
  getSalesOrderFulfillmentStatus,
  getPendingExitNotesForSalesOrders,
  confirmShipment,
  getSalesMetrics,
} from './salesIntegration.service.js'
import { ApiResponse } from '../../../../shared/utils/apiResponse.js'

export const linkToPreInvoiceHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const exitNoteId = req.params.exitNoteId as string
    const { preInvoiceId } = req.body

    const result = await linkExitNoteToPreInvoice(exitNoteId, preInvoiceId)
    ApiResponse.success(res, result, 'Exit note linked to pre-invoice successfully')
  } catch (error: any) {
    ApiResponse.error(res, error.message)
  }
}

export const linkToSalesOrderHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const exitNoteId = req.params.exitNoteId as string
    const { salesOrderId, trackingInfo } = req.body

    const result = await linkExitNoteToSalesOrder(exitNoteId, salesOrderId, trackingInfo)
    ApiResponse.success(res, result, 'Exit note linked to sales order successfully')
  } catch (error: any) {
    ApiResponse.error(res, error.message)
  }
}

export const getFulfillmentStatusHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const salesOrderId = req.params.salesOrderId as string
    const result = await getSalesOrderFulfillmentStatus(salesOrderId)
    ApiResponse.success(res, result, 'Fulfillment status retrieved successfully')
  } catch (error: any) {
    ApiResponse.error(res, error.message)
  }
}

export const getPendingExitsHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 50

    const result = await getPendingExitNotesForSalesOrders(page, limit)
    ApiResponse.paginated(res, result.data, page, limit, result.total, 'Pending Exit Notes for Sales Orders')
  } catch (error: any) {
    ApiResponse.error(res, error.message)
  }
}

export const confirmShipmentHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const exitNoteId = req.params.exitNoteId as string
    const { deliveryDate, signature, notes } = req.body

    const result = await confirmShipment(exitNoteId, new Date(deliveryDate), signature, notes)
    ApiResponse.success(res, result, 'Shipment confirmed successfully')
  } catch (error: any) {
    ApiResponse.error(res, error.message)
  }
}

export const getSalesMetricsHandler = async (
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

    const result = await getSalesMetrics(startDate, endDate)
    ApiResponse.success(res, result, 'Sales metrics retrieved successfully')
  } catch (error: any) {
    ApiResponse.error(res, error.message)
  }
}

export default {
  linkToPreInvoiceHandler,
  linkToSalesOrderHandler,
  getFulfillmentStatusHandler,
  getPendingExitsHandler,
  confirmShipmentHandler,
  getSalesMetricsHandler,
}
