import apiClient from "../apiClient";
import { ApiResponse, PaginatedResponse } from "./types";

// ============================================================================
// ENUMS
// ============================================================================

export enum LoanStatus {
  DRAFT = "DRAFT",
  PENDING_APPROVAL = "PENDING_APPROVAL",
  APPROVED = "APPROVED",
  ACTIVE = "ACTIVE",
  RETURNED = "RETURNED",
  OVERDUE = "OVERDUE",
  CANCELLED = "CANCELLED",
}

// ============================================================================
// INTERFACES
// ============================================================================

export interface LoanItem {
  id: string;
  loanId: string;
  itemId: string;
  quantityLoaned: number;
  quantityReturned: number;
  unitCost: number;
  notes?: string;
  item?: {
    id: string;
    name: string;
    sku: string;
  };
}

export interface Loan {
  id: string;
  loanNumber: string;
  borrowerName: string;
  borrowerId?: string;
  warehouseId: string;
  status: LoanStatus;
  items: LoanItem[];
  approvedAt?: Date;
  approvedBy?: string;
  startDate: Date;
  dueDate: Date;
  returnedAt?: Date;
  purpose?: string;
  notes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLoanInput {
  borrowerName: string;
  borrowerId?: string;
  warehouseId: string;
  startDate: Date;
  dueDate: Date;
  purpose?: string;
  notes?: string;
  items: Array<{
    itemId: string;
    quantityLoaned: number;
    unitCost: number;
    notes?: string;
  }>;
}

export interface UpdateLoanInput {
  borrowerName?: string;
  borrowerId?: string;
  warehouseId?: string;
  startDate?: Date;
  dueDate?: Date;
  purpose?: string;
  notes?: string;
}

export interface ReturnItemsInput {
  items: Array<{
    itemId: string;
    quantityReturned: number;
  }>;
}

// ============================================================================
// LOAN STATUS CONFIG
// ============================================================================

export const LOAN_STATUS_CONFIG = {
  [LoanStatus.DRAFT]: {
    label: "Borrador",
    severity: "secondary",
    icon: "pi pi-file",
  },
  [LoanStatus.PENDING_APPROVAL]: {
    label: "Pendiente de Aprobación",
    severity: "warning",
    icon: "pi pi-clock",
  },
  [LoanStatus.APPROVED]: {
    label: "Aprobado",
    severity: "info",
    icon: "pi pi-check-circle",
  },
  [LoanStatus.ACTIVE]: {
    label: "Activo",
    severity: "success",
    icon: "pi pi-arrow-right-arrow-left",
  },
  [LoanStatus.RETURNED]: {
    label: "Devuelto",
    severity: "secondary",
    icon: "pi pi-undo",
  },
  [LoanStatus.OVERDUE]: {
    label: "Vencido",
    severity: "danger",
    icon: "pi pi-exclamation-triangle",
  },
  [LoanStatus.CANCELLED]: {
    label: "Cancelado",
    severity: "danger",
    icon: "pi pi-times-circle",
  },
};

// ============================================================================
// SERVICE
// ============================================================================

const loanService = {
  async getAll(
    page: number = 1,
    limit: number = 20,
    filters?: {
      status?: LoanStatus;
      borrowerName?: string;
      warehouseId?: string;
    },
  ): Promise<PaginatedResponse<Loan>> {
    try {
      const res = await apiClient.get<PaginatedResponse<Loan>>(
        "/inventory/loans",
        {
          params: {
            page,
            limit,
            status: filters?.status,
            borrowerName: filters?.borrowerName,
            warehouseId: filters?.warehouseId,
          },
        },
      );
      return res.data;
    } catch (error) {
      console.error("Error fetching loans:", error);
      throw error;
    }
  },

  async getById(id: string): Promise<ApiResponse<Loan>> {
    try {
      const res = await apiClient.get<ApiResponse<Loan>>(
        `/inventory/loans/${id}`,
      );
      return res.data;
    } catch (error) {
      console.error(`Error fetching loan ${id}:`, error);
      throw error;
    }
  },

  async create(input: CreateLoanInput): Promise<ApiResponse<Loan>> {
    try {
      const res = await apiClient.post<ApiResponse<Loan>>("/inventory/loans", {
        ...input,
        startDate: new Date(input.startDate),
        dueDate: new Date(input.dueDate),
      });
      return res.data;
    } catch (error) {
      console.error("Error creating loan:", error);
      throw error;
    }
  },

  async update(id: string, input: UpdateLoanInput): Promise<ApiResponse<Loan>> {
    try {
      const res = await apiClient.put<ApiResponse<Loan>>(
        `/inventory/loans/${id}`,
        {
          ...input,
          ...(input.startDate && { startDate: new Date(input.startDate) }),
          ...(input.dueDate && { dueDate: new Date(input.dueDate) }),
        },
      );
      return res.data;
    } catch (error) {
      console.error(`Error updating loan ${id}:`, error);
      throw error;
    }
  },

  async approve(id: string): Promise<ApiResponse<Loan>> {
    try {
      const res = await apiClient.patch<ApiResponse<Loan>>(
        `/inventory/loans/${id}/approve`,
        {},
      );
      return res.data;
    } catch (error) {
      console.error(`Error approving loan ${id}:`, error);
      throw error;
    }
  },

  async activate(id: string): Promise<ApiResponse<Loan>> {
    try {
      const res = await apiClient.patch<ApiResponse<Loan>>(
        `/inventory/loans/${id}/activate`,
        {},
      );
      return res.data;
    } catch (error) {
      console.error(`Error activating loan ${id}:`, error);
      throw error;
    }
  },

  async returnItems(
    id: string,
    input: ReturnItemsInput,
  ): Promise<ApiResponse<Loan>> {
    try {
      const res = await apiClient.patch<ApiResponse<Loan>>(
        `/inventory/loans/${id}/return`,
        input,
      );
      return res.data;
    } catch (error) {
      console.error(`Error returning loan items for ${id}:`, error);
      throw error;
    }
  },

  async cancel(id: string, reason?: string): Promise<ApiResponse<Loan>> {
    try {
      const res = await apiClient.patch<ApiResponse<Loan>>(
        `/inventory/loans/${id}/cancel`,
        { reason },
      );
      return res.data;
    } catch (error) {
      console.error(`Error cancelling loan ${id}:`, error);
      throw error;
    }
  },

  async getByBorrower(borrowerName: string): Promise<PaginatedResponse<Loan>> {
    return this.getAll(1, 50, { borrowerName });
  },

  async getByWarehouse(warehouseId: string): Promise<PaginatedResponse<Loan>> {
    return this.getAll(1, 50, { warehouseId });
  },

  async getByStatus(status: LoanStatus): Promise<PaginatedResponse<Loan>> {
    return this.getAll(1, 50, { status });
  },
};

export default loanService;
