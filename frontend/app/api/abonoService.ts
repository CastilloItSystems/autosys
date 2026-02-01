import apiClient from "./apiClient";

export const getAbono = async (id: string) => {
  const response = await apiClient.get(`/abono/${id}`);
  return response.data;
};
export const getAbonos = async () => {
  const response = await apiClient.get("/abono");
  return response.data;
};
export const createAbono = async (data: any) => {
  const response = await apiClient.post("/abono", data);
  return response.data;
};
export const updateAbono = async (id: string, data: any) => {
  const response = await apiClient.put(`/abono/${id}`, data);
  return response.data;
};
export const deleteAbono = async (id: string) => {
  const response = await apiClient.delete(`/abono/${id}`);
  return response.data;
};
export const obtenerAbonosporRefineria = async (refineriaId: string) => {
  const response = await apiClient.get(`/abono/refineria/${refineriaId}`);
  return response.data;
};
