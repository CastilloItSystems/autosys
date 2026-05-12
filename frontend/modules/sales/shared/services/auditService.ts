// frontend/modules/sales/shared/services/auditService.ts

import apiClient from "@/app/api/apiClient";

export interface AuditLogEntry {
  id: string;
  entity: string;
  entityId: string;
  action: string;
  userName?: string | null;
  userId?: string | null;
  changes?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

const ACTION_LABELS: Record<string, string> = {
  CREATE: "Creado",
  UPDATE: "Actualizado",
  APPROVE: "Aprobado",
  DELETE: "Eliminado",
  CANCEL: "Anulado",
  PAYMENT: "Pago registrado",
};

export function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action;
}

const auditService = {
  async getHistory(
    entity: "Order" | "PreInvoice" | "Invoice",
    entityId: string,
    limit = 50
  ): Promise<AuditLogEntry[]> {
    const res = await apiClient.get<{ data: AuditLogEntry[] }>(
      `/sales/audit?entity=${entity}&entityId=${entityId}&limit=${limit}`
    );
    return res.data.data;
  },
};

export default auditService;
