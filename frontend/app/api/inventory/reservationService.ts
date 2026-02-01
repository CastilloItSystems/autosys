import apiClient from "../apiClient";

export const getReservation = async (id: string) => {
  const response = await apiClient.get(`/inventory/reservations/${id}`);
  return response.data;
};

export const getReservations = async () => {
  const response = await apiClient.get("/inventory/reservations");
  return response.data;
};

export const createReservation = async (data: any) => {
  const response = await apiClient.post("/inventory/reservations", data);
  return response.data;
};

export const updateReservation = async (id: string, data: any) => {
  const response = await apiClient.put(`/inventory/reservations/${id}`, data);
  return response.data;
};

export const deleteReservation = async (id: string) => {
  const response = await apiClient.delete(`/inventory/reservations/${id}`);
  return response.data;
};

// Obtener reservas activas
export const getActiveReservations = async () => {
  const response = await apiClient.get("/inventory/reservations/active");
  return response.data;
};

// Obtener reservas por item
export const getReservationsByItem = async (itemId: string) => {
  const response = await apiClient.get(`/inventory/reservations/item/${itemId}`);
  return response.data;
};

// Obtener reservas por almacén
export const getReservationsByWarehouse = async (warehouseId: string) => {
  const response = await apiClient.get(
    `/inventory/reservations/warehouse/${warehouseId}`
  );
  return response.data;
};

// Obtener reservas por usuario
export const getReservationsByUser = async (userId: string) => {
  const response = await apiClient.get(`/inventory/reservations/user/${userId}`);
  return response.data;
};

// Liberar reserva
export const releaseReservation = async (id: string) => {
  const response = await apiClient.post(`/inventory/reservations/${id}/release`);
  return response.data;
};

// Consumir reserva
export const consumeReservation = async (id: string, cantidad?: number) => {
  const response = await apiClient.post(`/inventory/reservations/${id}/consume`, {
    cantidad,
  });
  return response.data;
};

// Cancelar reserva
export const cancelReservation = async (id: string) => {
  const response = await apiClient.post(`/inventory/reservations/${id}/cancel`);
  return response.data;
};
