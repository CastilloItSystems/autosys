import apiClient from "../apiClient";

// Tipos
export type WarehouseType = "PRINCIPAL" | "SUCURSAL" | "TRANSITO";

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  type: WarehouseType;
  address?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Response con paginación estándar
export interface WarehousesResponse {
  data: Warehouse[];
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
}

// Single warehouse response
interface WarehouseResponse {
  data: Warehouse;
}

// DTOs
export interface CreateWarehouseRequest {
  code: string;
  name: string;
  type?: WarehouseType;
  address?: string;
}

export interface UpdateWarehouseRequest {
  code?: string;
  name?: string;
  type?: WarehouseType;
  address?: string | null;
  isActive?: boolean;
}

// Métodos estándar
export const getWarehouses = async (
  page = 1,
  limit = 20,
  search?: string,
  type?: WarehouseType,
  isActive?: boolean,
): Promise<WarehousesResponse> => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (search) params.append("search", search);
  if (type) params.append("type", type);
  if (isActive !== undefined) params.append("isActive", String(isActive));

  const response = await apiClient.get(`/inventory/warehouses?${params}`);
  return response.data;
};

export const getActiveWarehouses = async (): Promise<WarehousesResponse> => {
  const response = await apiClient.get("/inventory/warehouses/active");
  return response.data;
};

export const searchWarehouses = async (
  query: string,
): Promise<WarehousesResponse> => {
  const response = await apiClient.get(
    `/inventory/warehouses/search?term=${encodeURIComponent(query)}`,
  );
  return response.data;
};

export const getWarehouse = async (id: string): Promise<WarehouseResponse> => {
  const response = await apiClient.get(`/inventory/warehouses/${id}`);
  return response.data;
};

export const createWarehouse = async (
  data: CreateWarehouseRequest,
): Promise<WarehouseResponse> => {
  const response = await apiClient.post("/inventory/warehouses", data);
  return response.data;
};

export const updateWarehouse = async (
  id: string,
  data: UpdateWarehouseRequest,
): Promise<WarehouseResponse> => {
  const response = await apiClient.put(`/inventory/warehouses/${id}`, data);
  return response.data;
};

export const activateWarehouse = async (
  id: string,
): Promise<WarehouseResponse> => {
  const response = await apiClient.patch(
    `/inventory/warehouses/${id}/activate`,
  );
  return response.data;
};

export const deactivateWarehouse = async (
  id: string,
): Promise<WarehouseResponse> => {
  const response = await apiClient.patch(
    `/inventory/warehouses/${id}/deactivate`,
  );
  return response.data;
};

export const deleteWarehouse = async (id: string): Promise<void> => {
  await apiClient.delete(`/inventory/warehouses/${id}`);
};

// Legacy functions para backward compatibility
export const getWarehousesByType = async (tipo: string) => {
  const response = await apiClient.get(`/inventory/warehouses?type=${tipo}`);
  return response.data;
};

export const getWarehouseInventory = async (warehouseId: string) => {
  const response = await apiClient.get(`/inventory/warehouses/${warehouseId}`);
  return response.data;
};

export const getWarehouseCapacity = async (warehouseId: string) => {
  const response = await apiClient.get(`/inventory/warehouses/${warehouseId}`);
  return response.data;
};
