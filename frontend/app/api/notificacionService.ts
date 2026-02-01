import apiClient from "./apiClient";

export const getNotificacion = async (id: string) => {
  const response = await apiClient.get(`/notification/${id}`);
  return response.data;
};
export const getNotificacions = async () => {
  const response = await apiClient.get("/notification");
  return response.data;
};
export const createNotificacion = async (data: any) => {
  const response = await apiClient.post("/notification", data);
  return response.data;
};
export const updateNotificacion = async (id: string, data: any) => {
  const response = await apiClient.put(`/notification/${id}`, data);
  return response.data;
};
export const deleteNotificacion = async (id: string) => {
  const response = await apiClient.delete(`/notification/${id}`);
  return response.data;
};

export const marcarNotificacionLeida = async (id: string) => {
  const response = await apiClient.put(`/notification/${id}/marcar-leida`);
  return response.data;
};
