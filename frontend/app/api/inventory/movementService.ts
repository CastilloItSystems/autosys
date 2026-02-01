import apiClient from "../apiClient";

export const getMovement = async (id: string) => {
  const response = await apiClient.get(`/inventory/movements/${id}`);
  return response.data;
};

export const getMovements = async () => {
  const response = await apiClient.get("/inventory/movements");
  return response.data;
};

export const createMovement = async (data: any) => {
  const response = await apiClient.post("/inventory/movements", data);
  return response.data;
};

export const updateMovement = async (id: string, data: any) => {
  const response = await apiClient.put(`/inventory/movements/${id}`, data);
  return response.data;
};

export const deleteMovement = async (id: string) => {
  const response = await apiClient.delete(`/inventory/movements/${id}`);
  return response.data;
};

// Obtener movimientos por tipo
export const getMovementsByType = async (
  tipo: "entrada" | "salida" | "transferencia" | "ajuste"
) => {
  const response = await apiClient.get(`/inventory/movements/type/${tipo}`);
  return response.data;
};

// Obtener movimientos por item
export const getMovementsByItem = async (itemId: string) => {
  const response = await apiClient.get(`/inventory/movements/item/${itemId}`);
  return response.data;
};

// Obtener movimientos por almacén
export const getMovementsByWarehouse = async (warehouseId: string) => {
  const response = await apiClient.get(
    `/inventory/movements/warehouse/${warehouseId}`
  );
  return response.data;
};

// Obtener movimientos por rango de fechas
export const getMovementsByDateRange = async (
  fechaInicio: string,
  fechaFin: string
) => {
  const response = await apiClient.get(
    `/inventory/movements/date-range?start=${fechaInicio}&end=${fechaFin}`
  );
  return response.data;
};

// Crear movimiento de entrada
export const createEntrada = async (data: any) => {
  const response = await apiClient.post("/inventory/movements/entrada", data);
  return response.data;
};

// Crear movimiento de salida
export const createSalida = async (data: any) => {
  const response = await apiClient.post("/inventory/movements/salida", data);
  return response.data;
};

// Crear movimiento de transferencia
export const createTransferencia = async (data: any) => {
  const response = await apiClient.post(
    "/inventory/movements/transferencia",
    data
  );
  return response.data;
};

// Crear movimiento de ajuste
export const createAjuste = async (data: any) => {
  const response = await apiClient.post("/inventory/movements/ajuste", data);
  return response.data;
};
