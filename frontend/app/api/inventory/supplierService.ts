import apiClient from "../apiClient";

export const getSupplier = async (id: string) => {
  const response = await apiClient.get(`/inventory/suppliers/${id}`);
  return response.data;
};

export const getSuppliers = async () => {
  const response = await apiClient.get("/inventory/suppliers");
  return response.data;
};

export const createSupplier = async (data: any) => {
  const response = await apiClient.post("/inventory/suppliers", data);
  return response.data;
};

export const updateSupplier = async (id: string, data: any) => {
  const response = await apiClient.put(`/inventory/suppliers/${id}`, data);
  return response.data;
};

export const deleteSupplier = async (id: string) => {
  const response = await apiClient.delete(`/inventory/suppliers/${id}`);
  return response.data;
};

// Buscar proveedores
export const searchSuppliers = async (query: string) => {
  const response = await apiClient.get(
    `/inventory/suppliers/search?q=${query}`
  );
  return response.data;
};

// Obtener proveedores activos
export const getActiveSuppliers = async () => {
  const response = await apiClient.get("/inventory/suppliers/active");
  return response.data;
};

// Obtener historial de compras por proveedor
export const getSupplierPurchaseHistory = async (supplierId: string) => {
  const response = await apiClient.get(
    `/inventory/suppliers/${supplierId}/purchases`
  );
  return response.data;
};
