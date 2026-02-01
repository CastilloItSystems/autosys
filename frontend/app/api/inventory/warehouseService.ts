import apiClient from "../apiClient";

export const getWarehouse = async (id: string) => {
  const response = await apiClient.get(`/inventory/warehouses/${id}`);
  return response.data;
};

export const getWarehouses = async () => {
  const response = await apiClient.get("/inventory/warehouses");
  return response.data;
};

export const createWarehouse = async (data: any) => {
  const response = await apiClient.post("/inventory/warehouses", data);
  return response.data;
};

export const updateWarehouse = async (id: string, data: any) => {
  const response = await apiClient.put(`/inventory/warehouses/${id}`, data);
  return response.data;
};

export const deleteWarehouse = async (id: string) => {
  const response = await apiClient.delete(`/inventory/warehouses/${id}`);
  return response.data;
};

// Obtener almacenes por tipo
export const getWarehousesByType = async (
  tipo: "almacen" | "bodega" | "taller" | "otro"
) => {
  const response = await apiClient.get(`/inventory/warehouses/type/${tipo}`);
  return response.data;
};

// Obtener almacenes activos
export const getActiveWarehouses = async () => {
  const response = await apiClient.get("/inventory/warehouses/active");
  return response.data;
};

// Obtener inventario completo de un almacén
export const getWarehouseInventory = async (warehouseId: string) => {
  const response = await apiClient.get(`/inventory/warehouses/${warehouseId}/inventory`);
  return response.data;
};

// Obtener capacidad disponible de un almacén
export const getWarehouseCapacity = async (warehouseId: string) => {
  const response = await apiClient.get(`/inventory/warehouses/${warehouseId}/capacity`);
  return response.data;
};
