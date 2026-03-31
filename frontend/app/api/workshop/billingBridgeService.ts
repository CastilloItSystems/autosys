// app/api/workshop/billingBridgeService.ts
// FASE 5: Bridge entre Workshop ServiceOrders y el pipeline de ventas (Sales)
import apiClient from '../apiClient'
import type { WorkshopResponse } from '@/libs/interfaces/workshop'

const BASE = '/workshop/service-orders'

const billingBridgeService = {
  /**
   * Genera una PreInvoice desde una OT (status READY | DELIVERED).
   * POST /workshop/service-orders/:id/generate-pre-invoice
   */
  async generatePreInvoice(serviceOrderId: string): Promise<WorkshopResponse<any>> {
    const res = await apiClient.post(`${BASE}/${serviceOrderId}/generate-invoice`)
    return res.data
  },

  /**
   * Crea una Quote CRM pre-llenada desde los datos de la OT.
   * POST /workshop/service-orders/:id/create-quote
   */
  async createQuoteFromSO(serviceOrderId: string): Promise<WorkshopResponse<any>> {
    const res = await apiClient.post(`${BASE}/${serviceOrderId}/create-quote`)
    return res.data
  },
}

export default billingBridgeService
