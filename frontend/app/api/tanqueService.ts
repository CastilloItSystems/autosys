import apiClient from "./apiClient";

export const getTanque = async (id: string) => {
  const response = await apiClient.get(`/tanque/${id}`);
  return response.data;
};
export const getTanques = async () => {
  const response = await apiClient.get("/tanque");
  return response.data;
};
export const createTanque = async (data: any) => {
  const response = await apiClient.post("/tanque", data);
  return response.data;
};
export const updateTanque = async (id: string, data: any) => {
  const response = await apiClient.put(`/tanque/${id}`, data);
  return response.data;
};
export const deleteTanque = async (id: string) => {
  const response = await apiClient.delete(`/tanque/${id}`);
  return response.data;
};
export const obtenerTanquesPorRefineria = async (idRefineria: string) => {
  const { data } = await apiClient.get(`/tanque/refineria/${idRefineria}`);
  return data; // { total: number, tanques: Tanque[] }
};
