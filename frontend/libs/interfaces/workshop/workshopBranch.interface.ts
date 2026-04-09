export interface WorkshopBranch {
  id: string;
  code: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  managerUserId?: string | null;
  isActive: boolean;
  empresaId: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkshopBranchFilters {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: "true" | "false";
}

export interface CreateWorkshopBranchInput {
  code: string;
  name: string;
  address?: string;
  phone?: string;
  managerUserId?: string;
}

export interface UpdateWorkshopBranchInput {
  name?: string;
  address?: string;
  phone?: string;
  managerUserId?: string;
  isActive?: boolean;
}
