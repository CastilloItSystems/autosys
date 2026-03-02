import apiClient from "../apiClient";

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

export interface LoansResponse {
  success: boolean;
  data: Loan[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface LoanResponse {
  success: boolean;
  data: Loan;
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
// SERVICE CLASS
// ============================================================================

class LoanService {
  private baseUrl = "/inventory/loans";

  /**
   * Get all loans with pagination and filters
   */
  async getLoans(
    page: number = 1,
    limit: number = 20,
    filters?: {
      status?: LoanStatus;
      borrowerName?: string;
      warehouseId?: string;
    },
  ): Promise<LoansResponse> {
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      if (filters?.status) params.append("status", filters.status);
      if (filters?.borrowerName)
        params.append("borrowerName", filters.borrowerName);
      if (filters?.warehouseId)
        params.append("warehouseId", filters.warehouseId);

      const response = await apiClient.get<LoansResponse>(
        `${this.baseUrl}?${params.toString()}`,
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching loans:", error);
      throw error;
    }
  }

  /**
   * Get a single loan by ID
   */
  async getLoanById(id: string): Promise<LoanResponse> {
    try {
      const response = await apiClient.get<LoanResponse>(
        `${this.baseUrl}/${id}`,
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching loan ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new loan
   */
  async createLoan(input: CreateLoanInput): Promise<LoanResponse> {
    try {
      const response = await apiClient.post<LoanResponse>(this.baseUrl, {
        ...input,
        startDate: new Date(input.startDate),
        dueDate: new Date(input.dueDate),
      });
      return response.data;
    } catch (error) {
      console.error("Error creating loan:", error);
      throw error;
    }
  }

  /**
   * Update an existing loan
   */
  async updateLoan(id: string, input: UpdateLoanInput): Promise<LoanResponse> {
    try {
      const response = await apiClient.put<LoanResponse>(
        `${this.baseUrl}/${id}`,
        {
          ...input,
          ...(input.startDate && { startDate: new Date(input.startDate) }),
          ...(input.dueDate && { dueDate: new Date(input.dueDate) }),
        },
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating loan ${id}:`, error);
      throw error;
    }
  }

  /**
   * Approve a draft loan
   */
  async approveLoan(id: string): Promise<LoanResponse> {
    try {
      const response = await apiClient.patch<LoanResponse>(
        `${this.baseUrl}/${id}/approve`,
        {},
      );
      return response.data;
    } catch (error) {
      console.error(`Error approving loan ${id}:`, error);
      throw error;
    }
  }

  /**
   * Activate an approved loan
   */
  async activateLoan(id: string): Promise<LoanResponse> {
    try {
      const response = await apiClient.patch<LoanResponse>(
        `${this.baseUrl}/${id}/activate`,
        {},
      );
      return response.data;
    } catch (error) {
      console.error(`Error activating loan ${id}:`, error);
      throw error;
    }
  }

  /**
   * Return items from a loan
   */
  async returnLoanItems(
    id: string,
    input: ReturnItemsInput,
  ): Promise<LoanResponse> {
    try {
      const response = await apiClient.patch<LoanResponse>(
        `${this.baseUrl}/${id}/return`,
        input,
      );
      return response.data;
    } catch (error) {
      console.error(`Error returning loan items for ${id}:`, error);
      throw error;
    }
  }

  /**
   * Cancel a loan
   */
  async cancelLoan(id: string, reason?: string): Promise<LoanResponse> {
    try {
      const response = await apiClient.patch<LoanResponse>(
        `${this.baseUrl}/${id}/cancel`,
        { reason },
      );
      return response.data;
    } catch (error) {
      console.error(`Error cancelling loan ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get loans by borrower name (search)
   */
  async getLoansByBorrower(borrowerName: string): Promise<LoansResponse> {
    return this.getLoans(1, 50, { borrowerName });
  }

  /**
   * Get loans by warehouse
   */
  async getLoansByWarehouse(warehouseId: string): Promise<LoansResponse> {
    return this.getLoans(1, 50, { warehouseId });
  }

  /**
   * Get loans by status
   */
  async getLoansByStatus(status: LoanStatus): Promise<LoansResponse> {
    return this.getLoans(1, 50, { status });
  }
}

export default new LoanService();
