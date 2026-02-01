import apiClient from "./apiClient";

export const getRefinacionSalida = async (id: string) => {
  const response = await apiClient.get(`/refinacionSalida/${id}`);
  return response.data;
};
export const getRefinacionSalidas = async () => {
  const response = await apiClient.get("/refinacionSalida");
  return response.data;
};
export const createRefinacionSalida = async (data: any) => {
  const response = await apiClient.post("/refinacionSalida", data);
  return response.data;
};
export const updateRefinacionSalida = async (id: string, data: any) => {
  const response = await apiClient.put(`/refinacionSalida/${id}`, data);
  return response.data;
};
export const deleteRefinacionSalida = async (id: string) => {
  const response = await apiClient.delete(`/refinacionSalida/${id}`);
  return response.data;
};
