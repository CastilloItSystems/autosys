import apiClient from "../apiClient";

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

export interface ReturnsResponse {
  success: boolean;
  data: ReturnOrder[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface ReturnResponse {
  success: boolean;
  data: ReturnOrder;
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
// SERVICE CLASS
// ============================================================================

class ReturnService {
  private baseUrl = "/inventory/returns";

  /**
   * Get all returns with pagination and filters
   */
  async getReturns(
    page: number = 1,
    limit: number = 20,
    filters?: {
      status?: ReturnStatus;
      type?: ReturnType;
      warehouseId?: string;
    },
  ): Promise<ReturnsResponse> {
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      if (filters?.status) params.append("status", filters.status);
      if (filters?.type) params.append("type", filters.type);
      if (filters?.warehouseId)
        params.append("warehouseId", filters.warehouseId);

      const response = await apiClient.get<ReturnsResponse>(
        `${this.baseUrl}?${params.toString()}`,
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching returns:", error);
      throw error;
    }
  }

  /**
   * Get a single return by ID
   */
  async getReturnById(id: string): Promise<ReturnResponse> {
    try {
      const response = await apiClient.get<ReturnResponse>(
        `${this.baseUrl}/${id}`,
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching return ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new return
   */
  async createReturn(input: CreateReturnInput): Promise<ReturnResponse> {
    try {
      const response = await apiClient.post<ReturnResponse>(
        this.baseUrl,
        input,
      );
      return response.data;
    } catch (error) {
      console.error("Error creating return:", error);
      throw error;
    }
  }

  /**
   * Update an existing return (only draft returns)
   */
  async updateReturn(
    id: string,
    input: UpdateReturnInput,
  ): Promise<ReturnResponse> {
    try {
      const response = await apiClient.put<ReturnResponse>(
        `${this.baseUrl}/${id}`,
        input,
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating return ${id}:`, error);
      throw error;
    }
  }

  /**
   * Submit a draft return for approval
   */
  async submitReturn(id: string): Promise<ReturnResponse> {
    try {
      const response = await apiClient.patch<ReturnResponse>(
        `${this.baseUrl}/${id}/submit`,
        {},
      );
      return response.data;
    } catch (error) {
      console.error(`Error submitting return ${id}:`, error);
      throw error;
    }
  }

  /**
   * Approve a pending return
   */
  async approveReturn(id: string): Promise<ReturnResponse> {
    try {
      const response = await apiClient.patch<ReturnResponse>(
        `${this.baseUrl}/${id}/approve`,
        {},
      );
      return response.data;
    } catch (error) {
      console.error(`Error approving return ${id}:`, error);
      throw error;
    }
  }

  /**
   * Process an approved return (add items back to stock)
   */
  async processReturn(id: string): Promise<ReturnResponse> {
    try {
      const response = await apiClient.patch<ReturnResponse>(
        `${this.baseUrl}/${id}/process`,
        {},
      );
      return response.data;
    } catch (error) {
      console.error(`Error processing return ${id}:`, error);
      throw error;
    }
  }

  /**
   * Reject a pending return
   */
  async rejectReturn(id: string): Promise<ReturnResponse> {
    try {
      const response = await apiClient.patch<ReturnResponse>(
        `${this.baseUrl}/${id}/reject`,
        {},
      );
      return response.data;
    } catch (error) {
      console.error(`Error rejecting return ${id}:`, error);
      throw error;
    }
  }

  /**
   * Cancel a return (except processed or rejected)
   */
  async cancelReturn(id: string): Promise<ReturnResponse> {
    try {
      const response = await apiClient.patch<ReturnResponse>(
        `${this.baseUrl}/${id}/cancel`,
        {},
      );
      return response.data;
    } catch (error) {
      console.error(`Error cancelling return ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get returns by status
   */
  async getReturnsByStatus(status: ReturnStatus): Promise<ReturnsResponse> {
    return this.getReturns(1, 50, { status });
  }

  /**
   * Get returns by type
   */
  async getReturnsByType(type: ReturnType): Promise<ReturnsResponse> {
    return this.getReturns(1, 50, { type });
  }

  /**
   * Get returns by warehouse
   */
  async getReturnsByWarehouse(warehouseId: string): Promise<ReturnsResponse> {
    return this.getReturns(1, 50, { warehouseId });
  }
}

export default new ReturnService();
