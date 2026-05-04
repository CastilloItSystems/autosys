import apiClient from "@/app/api/apiClient";
import { PaginatedResponse } from "@/modules/inventory/types";

export interface AuditLog {
  id: string;
  entity: string;
  entityId: string;
  action: string;
  userId?: string | null;
  empresaId?: string | null;
  changes: unknown;
  metadata?: unknown;
  createdAt: string;
  empresa?: {
    id_empresa: string;
    nombre?: string | null;
  } | null;
  user?: {
    id: string;
    nombre?: string | null;
    correo?: string | null;
  } | null;
}

export interface AuditLogParams {
  page?: number;
  limit?: number;
  entity?: string;
  entityId?: string;
  action?: string;
  actions?: string[] | string;
  userId?: string;
  createdFrom?: string;
  createdTo?: string;
}

const auditLogService = {
  async getAll(params?: AuditLogParams): Promise<PaginatedResponse<AuditLog>> {
    const response = await apiClient.get("/audit-logs", { params });
    return response.data;
  },
};

export default auditLogService;
