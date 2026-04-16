// backend/src/features/workshop/serviceOrders/serviceOrders.controller.ts
import type { Request, Response } from 'express'
import prisma from '../../../services/prisma.service.js'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import {
  createServiceOrder,
  findAllServiceOrders,
  findServiceOrderById,
  findServiceOrderStatusHistory,
  updateServiceOrder,
  updateServiceOrderStatus,
  deleteServiceOrder,
  createWorkshopQuotationFromServiceOrder,
  syncMaterialsToItems,
  generateConsolidatedPreInvoice,
  getPendingBillingByCustomer,
  getStalledOrders,
} from './serviceOrders.service.js'
import {
  CreateServiceOrderDTO,
  UpdateServiceOrderDTO,
  UpdateStatusDTO,
  ServiceOrderResponseDTO,
} from './serviceOrders.dto.js'
import { QuotationResponseDTO } from '../workshopQuotations/workshopQuotations.dto.js'
// FASE 1.2: Import conversion service
import {
  convertQuoteToServiceOrder,
  getServiceOrderQuote,
} from '../integrations/quote-so-converter.service.js'
// FASE 2.7: Import invoice generator service
import {
  generatePreInvoiceFromServiceOrder,
  bulkGeneratePreInvoices,
  getBillingAuditTrail,
  getBudgetInvoiceVariance,
} from '../integrations/so-invoice-generator.service.js'

export const getAll = async (req: Request, res: Response) => {
  const empresaId = req.empresaId!
  const result = await findAllServiceOrders(
    prisma,
    empresaId,
    req.validatedQuery as any
  )
  const items = result.data.map((o) => new ServiceOrderResponseDTO(o))
  return ApiResponse.paginated(
    res,
    items,
    result.page,
    result.limit,
    result.total
  )
}

export const getOne = async (req: Request, res: Response) => {
  const empresaId = req.empresaId!
  const order = await findServiceOrderById(
    prisma,
    req.params.id as string,
    empresaId
  )
  return ApiResponse.success(res, new ServiceOrderResponseDTO(order))
}

export const create = async (req: Request, res: Response) => {
  try {
    const empresaId = req.empresaId!
    const userId = (req as any).user?.userId as string
    const dto = new CreateServiceOrderDTO(req.body)
    const order = await createServiceOrder(prisma, empresaId, userId, dto)
    return ApiResponse.created(res, new ServiceOrderResponseDTO(order))
  } catch (error: any) {
    console.error('Error creating service order:', error)

    // Prisma specific errors
    if (error.code === 'P2002') {
      return ApiResponse.error(
        res,
        `Violación de restricción única: ${error.meta?.target?.join(', ')}`,
        409
      )
    }
    if (error.code === 'P2025') {
      return ApiResponse.error(res, 'Registro no encontrado', 404)
    }
    if (error.code === 'P2003') {
      return ApiResponse.error(
        res,
        `Referencia inválida: ${error.meta?.field_name}`,
        400
      )
    }
    if (error.code === 'P2014') {
      return ApiResponse.error(
        res,
        'No se puede eliminar debido a relaciones',
        400
      )
    }

    // Validation errors
    if (error.details) {
      return ApiResponse.error(
        res,
        `Validación: ${error.message}\nDetalles: ${JSON.stringify(error.details)}`,
        400
      )
    }

    // Generic error
    return ApiResponse.error(
      res,
      error.message || 'Error al crear la orden de servicio',
      500
    )
  }
}

export const update = async (req: Request, res: Response) => {
  try {
    const empresaId = req.empresaId!
    const dto = new UpdateServiceOrderDTO(req.body)
    const order = await updateServiceOrder(
      prisma,
      req.params.id as string,
      empresaId,
      dto
    )
    return ApiResponse.success(res, new ServiceOrderResponseDTO(order))
  } catch (error: any) {
    console.error('Error updating service order:', error)

    // Prisma specific errors
    if (error.code === 'P2002') {
      return ApiResponse.error(
        res,
        `Violación de restricción única: ${error.meta?.target?.join(', ')}`,
        409
      )
    }
    if (error.code === 'P2025') {
      return ApiResponse.error(res, 'Registro no encontrado', 404)
    }
    if (error.code === 'P2003') {
      return ApiResponse.error(
        res,
        `Referencia inválida: ${error.meta?.field_name}`,
        400
      )
    }

    // Validation errors
    if (error.details) {
      return ApiResponse.error(
        res,
        `Validación: ${error.message}\nDetalles: ${JSON.stringify(error.details)}`,
        400
      )
    }

    return ApiResponse.error(
      res,
      error.message || 'Error al actualizar la orden de servicio',
      500
    )
  }
}

export const updateStatus = async (req: Request, res: Response) => {
  const empresaId = req.empresaId!
  const userId = req.user?.userId as string
  const dto = new UpdateStatusDTO(req.body)
  const order = await updateServiceOrderStatus(
    prisma,
    req.params.id as string,
    empresaId,
    dto,
    userId
  )
  return ApiResponse.success(res, new ServiceOrderResponseDTO(order))
}

export const getStatusHistory = async (req: Request, res: Response) => {
  const empresaId = req.empresaId!
  const result = await findServiceOrderStatusHistory(
    prisma,
    req.params.id as string,
    empresaId,
    req.validatedQuery as any
  )
  return ApiResponse.paginated(
    res,
    result.data,
    result.page,
    result.limit,
    result.total
  )
}

export const remove = async (req: Request, res: Response) => {
  const empresaId = req.empresaId!
  await deleteServiceOrder(prisma, req.params.id as string, empresaId)
  return ApiResponse.success(res, null, 'Orden eliminada')
}

/**
 * FASE 1.2: Convert a CRM Quote to a ServiceOrder
 * POST /api/workshops/service-orders/from-quote/:quoteId
 *
 * Converts an approved SERVICE-type quote to a workshop ServiceOrder
 * Business rule: Quote must be type=SERVICE and status=APPROVED
 * Result: Quote.status → CONVERTED, new ServiceOrder created with status=DRAFT
 */
export const convertFromQuote = async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId as string
  const quoteId = req.params.quoteId as string

  const serviceOrder = await convertQuoteToServiceOrder(prisma, quoteId, userId)

  return ApiResponse.created(
    res,
    new ServiceOrderResponseDTO(serviceOrder),
    `ServiceOrder ${serviceOrder.folio} created from Quote ${quoteId}`
  )
}

/**
 * FASE 1.3: Get the originating Quote for a ServiceOrder
 * GET /api/workshops/service-orders/:id/quote
 *
 * Returns the CRM Quote that this ServiceOrder was created from (if any)
 * Useful for audit trail and workflow tracking
 */
export const getQuoteForServiceOrder = async (req: Request, res: Response) => {
  const serviceOrderId = req.params.id as string

  const quote = await getServiceOrderQuote(prisma, serviceOrderId)

  if (!quote) {
    return ApiResponse.success(
      res,
      null,
      'This ServiceOrder was not created from a Quote'
    )
  }

  return ApiResponse.success(res, quote)
}

// FASE 2.7: Generate PreInvoice from ServiceOrder
export const generatePreInvoice = async (req: Request, res: Response) => {
  try {
    const serviceOrderId = req.params.id as string
    const userId = req.user?.userId as string

    if (!userId) {
      return ApiResponse.error(res, 'User not authenticated', 401)
    }

    const preInvoice = await generatePreInvoiceFromServiceOrder(
      prisma,
      serviceOrderId,
      userId
    )

    return ApiResponse.success(
      res,
      preInvoice,
      'PreInvoice generated successfully from ServiceOrder'
    )
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Error generating PreInvoice'
    return ApiResponse.error(res, message, 400)
  }
}

// Crear cotización de taller desde OT (fuente única WorkshopQuotation)
export const createWorkshopQuotation = async (req: Request, res: Response) => {
  try {
    const empresaId = req.empresaId!
    const serviceOrderId = req.params.id as string
    const userId = req.user?.userId as string

    if (!userId) {
      return ApiResponse.error(res, 'User not authenticated', 401)
    }

    const quotation = await createWorkshopQuotationFromServiceOrder(
      prisma,
      serviceOrderId,
      empresaId,
      userId
    )

    return ApiResponse.success(
      res,
      new QuotationResponseDTO(quotation),
      'Cotización de taller creada desde la orden de servicio'
    )
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Error creating workshop quotation from ServiceOrder'
    return ApiResponse.error(res, message, 400)
  }
}

// FASE 2.7: Bulk generate PreInvoices from multiple ServiceOrders
export const bulkGenerateInvoices = async (req: Request, res: Response) => {
  try {
    const { serviceOrderIds } = req.body as { serviceOrderIds: string[] }
    const userId = req.user?.userId as string

    if (!userId) {
      return ApiResponse.error(res, 'User not authenticated', 401)
    }

    if (!Array.isArray(serviceOrderIds) || serviceOrderIds.length === 0) {
      return ApiResponse.error(
        res,
        'serviceOrderIds must be a non-empty array',
        400
      )
    }

    const result = await bulkGeneratePreInvoices(
      prisma,
      serviceOrderIds,
      userId
    )

    return ApiResponse.success(
      res,
      result,
      `Bulk PreInvoice generation complete: ${result.succeeded.length} succeeded, ${result.failed.length} failed`
    )
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Error generating PreInvoices'
    return ApiResponse.error(res, message, 400)
  }
}

// FASE 2.7: Get billing audit trail for ServiceOrder
export const getBillingTrail = async (req: Request, res: Response) => {
  try {
    const serviceOrderId = req.params.id as string

    const auditTrail = await getBillingAuditTrail(prisma, serviceOrderId)

    return ApiResponse.success(
      res,
      auditTrail,
      'Billing audit trail retrieved successfully'
    )
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Error retrieving billing trail'
    return ApiResponse.error(res, message, 400)
  }
}

// M3: Sincronizar materiales consumidos como ítems facturables
export const syncMaterials = async (req: Request, res: Response) => {
  const empresaId = req.empresaId!
  const userId = (req as any).user?.userId as string
  const result = await syncMaterialsToItems(
    prisma,
    req.params.id as string,
    empresaId,
    userId
  )
  return ApiResponse.success(res, result)
}

// M1: Generar prefactura consolidada para varias OTs
export const generateConsolidated = async (req: Request, res: Response) => {
  const empresaId = req.empresaId!
  const userId = (req as any).user?.userId as string
  const { serviceOrderIds } = req.body as { serviceOrderIds: string[] }
  const preInvoice = await generateConsolidatedPreInvoice(
    prisma,
    serviceOrderIds,
    empresaId,
    userId
  )
  return ApiResponse.created(res, preInvoice, 'Prefactura consolidada generada')
}

// B2: Saldo pendiente de facturación por cliente
export const pendingBilling = async (req: Request, res: Response) => {
  const empresaId = req.empresaId!
  const customerId = req.params.customerId as string
  const result = await getPendingBillingByCustomer(
    prisma,
    customerId,
    empresaId
  )
  return ApiResponse.success(res, result)
}

// F3-12: Conciliación presupuesto vs factura
export const getVariance = async (req: Request, res: Response) => {
  const empresaId = req.empresaId!
  const result = await getBudgetInvoiceVariance(
    prisma,
    req.params.id as string,
    empresaId
  )
  return ApiResponse.success(res, result)
}

// B3: OTs estancadas
export const stalled = async (req: Request, res: Response) => {
  const empresaId = req.empresaId!
  const q = req.validatedQuery as any
  const result = await getStalledOrders(prisma, empresaId, {
    waitingPartsDays: q.waitingPartsDays ?? 3,
    pausedDays: q.pausedDays ?? 2,
    waitingAuthDays: q.waitingAuthDays ?? 1,
  })
  return ApiResponse.success(res, result)
}
