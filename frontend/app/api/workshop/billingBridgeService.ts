// app/api/workshop/billingBridgeService.ts
// FASE 5: Bridge entre Workshop ServiceOrders y el pipeline de ventas (Sales)
import apiClient from '../apiClient'
import type { WorkshopResponse } from '@/libs/interfaces/workshop'

const BASE = '/workshop/service-orders'

const billingBridgeService = {
  async generatePreInvoice(serviceOrderId: string): Promise<WorkshopResponse<any>> {
    const res = await apiClient.post(`${BASE}/${serviceOrderId}/generate-invoice`)
    return res.data
  },

  async createQuoteFromSO(serviceOrderId: string): Promise<WorkshopResponse<any>> {
    const res = await apiClient.post(`${BASE}/${serviceOrderId}/create-quote`)
    return res.data
  },

  /** Genera una PreInvoice consolidada para varias OTs del mismo cliente */
  async generateConsolidatedPreInvoice(serviceOrderIds: string[]): Promise<WorkshopResponse<any>> {
    const res = await apiClient.post(`${BASE}/consolidated-pre-invoice`, { serviceOrderIds })
    return res.data
  },

  /** Retorna las OTs del cliente en estado READY/DELIVERED sin prefactura */
  async getPendingBillingByCustomer(customerId: string): Promise<WorkshopResponse<any>> {
    const res = await apiClient.get(`${BASE}/customer/${customerId}/pending-billing`)
    return res.data
  },

  /** Sincroniza materiales CONSUMED de la OT como ítems facturables */
  async syncMaterials(serviceOrderId: string): Promise<WorkshopResponse<any>> {
    const res = await apiClient.post(`${BASE}/${serviceOrderId}/sync-materials`)
    return res.data
  },

  /** F3-12: Conciliación presupuesto (cotización aprobada) vs factura real */
  async getBudgetVariance(serviceOrderId: string): Promise<WorkshopResponse<any>> {
    const res = await apiClient.get(`${BASE}/${serviceOrderId}/budget-variance`)
    return res.data
  },
}

export default billingBridgeService
