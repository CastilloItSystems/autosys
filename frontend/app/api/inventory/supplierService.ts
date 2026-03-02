import apiClient from "../apiClient";

// Tipos
export interface Supplier {
  id: string;
  code: string;
  name: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  taxId?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Response con paginación estándar
export interface SuppliersResponse {
  data: Supplier[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Single supplier response
interface SupplierResponse {
  data: Supplier;
}

// DTOs
export interface CreateSupplierRequest {
  code: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
}

export interface UpdateSupplierRequest {
  code?: string;
  name?: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  taxId?: string | null;
  isActive?: boolean;
}

// Métodos estándar
export const getSuppliers = async (
  page = 1,
  limit = 20,
  search?: string,
  isActive?: boolean,
): Promise<SuppliersResponse> => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (search) params.append("name", search);
  if (isActive !== undefined) params.append("isActive", String(isActive));

  const response = await apiClient.get(`/inventory/suppliers?${params}`);
  return response.data;
};

export const getActiveSuppliers = async (): Promise<SuppliersResponse> => {
  const response = await apiClient.get("/inventory/suppliers/active");
  // getActive retorna ApiResponse.success → { data: [...] } sin pagination
  const data = response.data;
  const items = data.data || [];
  return {
    data: items,
    pagination: {
      total: items.length,
      page: 1,
      limit: items.length,
      totalPages: 1,
    },
  };
};

export const searchSuppliers = async (
  query: string,
): Promise<SuppliersResponse> => {
  const response = await apiClient.get(
    `/inventory/suppliers?name=${encodeURIComponent(query)}`,
  );
  return response.data;
};

export const getSupplier = async (id: string): Promise<SupplierResponse> => {
  const response = await apiClient.get(`/inventory/suppliers/${id}`);
  return response.data;
};

export const getSupplierByCode = async (
  code: string,
): Promise<SupplierResponse> => {
  const response = await apiClient.get(`/inventory/suppliers/code/${code}`);
  return response.data;
};

export const createSupplier = async (
  data: CreateSupplierRequest,
): Promise<SupplierResponse> => {
  const response = await apiClient.post("/inventory/suppliers", data);
  return response.data;
};

export const updateSupplier = async (
  id: string,
  data: UpdateSupplierRequest,
): Promise<SupplierResponse> => {
  const response = await apiClient.put(`/inventory/suppliers/${id}`, data);
  return response.data;
};

export const toggleSupplier = async (id: string): Promise<SupplierResponse> => {
  const response = await apiClient.patch(`/inventory/suppliers/${id}/toggle`);
  return response.data;
};

export const deleteSupplier = async (id: string): Promise<void> => {
  await apiClient.delete(`/inventory/suppliers/${id}`);
};
