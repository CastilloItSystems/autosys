import apiClient from "../apiClient";
import { ApiResponse, PaginatedResponse } from "./types";

// ============================================================================
// ENUMS
// ============================================================================

export enum ReturnStatus {
  DRAFT = "DRAFT",
  PENDING_APPROVAL = "PENDING_APPROVAL",
  APPROVED = "APPROVED",
  PROCESSED = "PROCESSED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED",
}

export enum ReturnType {
  SUPPLIER_RETURN = "SUPPLIER_RETURN",
  WORKSHOP_RETURN = "WORKSHOP_RETURN",
  CUSTOMER_RETURN = "CUSTOMER_RETURN",
}

// ============================================================================
// INTERFACES
// ============================================================================

export interface ReturnItem {
  id: string;
  returnOrderId: string;
  itemId: string;
  quantity: number;
  unitPrice?: number;
  notes?: string;
  item?: {
    id: string;
    name: string;
    sku: string;
  };
}

export interface ReturnOrder {
  id: string;
  returnNumber: string;
  type: ReturnType;
  status: ReturnStatus;
  warehouseId: string;
  reason: string;
  notes?: string;
  approvedBy?: string;
  approvedAt?: Date;
  processedBy?: string;
  processedAt?: Date;
  items: ReturnItem[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateReturnInput {
  type: ReturnType;
  warehouseId: string;
  reason: string;
  notes?: string;
  items: Array<{
    itemId: string;
    quantity: number;
    unitPrice?: number;
    notes?: string;
  }>;
}

export interface UpdateReturnInput {
  type?: ReturnType;
  warehouseId?: string;
  reason?: string;
  notes?: string;
}

// ============================================================================
// RETURN STATUS CONFIG
// ============================================================================

export const RETURN_STATUS_CONFIG = {
  [ReturnStatus.DRAFT]: {
    label: "Borrador",
    severity: "secondary",
    icon: "pi pi-file",
  },
  [ReturnStatus.PENDING_APPROVAL]: {
    label: "Pendiente de Aprobación",
    severity: "warning",
    icon: "pi pi-clock",
  },
  [ReturnStatus.APPROVED]: {
    label: "Aprobado",
    severity: "info",
    icon: "pi pi-check-circle",
  },
  [ReturnStatus.PROCESSED]: {
    label: "Procesado",
    severity: "success",
    icon: "pi pi-check",
  },
  [ReturnStatus.REJECTED]: {
    label: "Rechazado",
    severity: "danger",
    icon: "pi pi-times-circle",
  },
  [ReturnStatus.CANCELLED]: {
    label: "Cancelado",
    severity: "secondary",
    icon: "pi pi-ban",
  },
};

// ============================================================================
// RETURN TYPE CONFIG
// ============================================================================

export const RETURN_TYPE_CONFIG = {
  [ReturnType.SUPPLIER_RETURN]: {
    label: "Devolución a Proveedor",
    icon: "pi pi-truck",
    color: "#3B82F6",
  },
  [ReturnType.WORKSHOP_RETURN]: {
    label: "Devolución de Taller",
    icon: "pi pi-cog",
    color: "#F59E0B",
  },
  [ReturnType.CUSTOMER_RETURN]: {
    label: "Devolución de Cliente",
    icon: "pi pi-user",
    color: "#10B981",
  },
};

// ============================================================================
// SERVICE
// ============================================================================

const returnService = {
  /**
   * Get all returns with pagination and filters
   */
  async getAll(
    page: number = 1,
    limit: number = 20,
    filters?: {
      status?: ReturnStatus;
      type?: ReturnType;
      warehouseId?: string;
    },
  ): Promise<PaginatedResponse<ReturnOrder>> {
    const params: Record<string, any> = { page, limit };
    if (filters?.status) params.status = filters.status;
    if (filters?.type) params.type = filters.type;
    if (filters?.warehouseId) params.warehouseId = filters.warehouseId;

    const response = await apiClient.get<PaginatedResponse<ReturnOrder>>(
      `/inventory/returns`,
      { params },
    );
    return response.data;
  },

  /**
   * Get a single return by ID
   */
  async getById(id: string): Promise<ApiResponse<ReturnOrder>> {
    const response = await apiClient.get<ApiResponse<ReturnOrder>>(
      `/inventory/returns/${id}`,
    );
    return response.data;
  },

  /**
   * Create a new return
   */
  async create(input: CreateReturnInput): Promise<ApiResponse<ReturnOrder>> {
    const response = await apiClient.post<ApiResponse<ReturnOrder>>(
      `/inventory/returns`,
      input,
    );
    return response.data;
  },

  /**
   * Update an existing return (only draft returns)
   */
  async update(
    id: string,
    input: UpdateReturnInput,
  ): Promise<ApiResponse<ReturnOrder>> {
    const response = await apiClient.put<ApiResponse<ReturnOrder>>(
      `/inventory/returns/${id}`,
      input,
    );
    return response.data;
  },

  /**
   * Submit a draft return for approval
   */
  async submit(id: string): Promise<ApiResponse<ReturnOrder>> {
    const response = await apiClient.patch<ApiResponse<ReturnOrder>>(
      `/inventory/returns/${id}/submit`,
      {},
    );
    return response.data;
  },

  /**
   * Approve a pending return
   */
  async approve(id: string): Promise<ApiResponse<ReturnOrder>> {
    const response = await apiClient.patch<ApiResponse<ReturnOrder>>(
      `/inventory/returns/${id}/approve`,
      {},
    );
    return response.data;
  },

  /**
   * Process an approved return (add items back to stock)
   */
  async process(id: string): Promise<ApiResponse<ReturnOrder>> {
    const response = await apiClient.patch<ApiResponse<ReturnOrder>>(
      `/inventory/returns/${id}/process`,
      {},
    );
    return response.data;
  },

  /**
   * Reject a pending return
   */
  async reject(id: string): Promise<ApiResponse<ReturnOrder>> {
    const response = await apiClient.patch<ApiResponse<ReturnOrder>>(
      `/inventory/returns/${id}/reject`,
      {},
    );
    return response.data;
  },

  /**
   * Cancel a return (except processed or rejected)
   */
  async cancel(id: string): Promise<ApiResponse<ReturnOrder>> {
    const response = await apiClient.patch<ApiResponse<ReturnOrder>>(
      `/inventory/returns/${id}/cancel`,
      {},
    );
    return response.data;
  },

  /**
   * Get returns by status
   */
  async getByStatus(
    status: ReturnStatus,
  ): Promise<PaginatedResponse<ReturnOrder>> {
    return this.getAll(1, 50, { status });
  },

  /**
   * Get returns by type
   */
  async getByType(type: ReturnType): Promise<PaginatedResponse<ReturnOrder>> {
    return this.getAll(1, 50, { type });
  },

  /**
   * Get returns by warehouse
   */
  async getByWarehouse(
    warehouseId: string,
  ): Promise<PaginatedResponse<ReturnOrder>> {
    return this.getAll(1, 50, { warehouseId });
  },
};

export default returnService;
