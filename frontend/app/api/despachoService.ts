import apiClient from "./apiClient";

export const getDespacho = async (id: string) => {
  const response = await apiClient.get(`/despacho/${id}`);
  return response.data;
};
export const getDespachos = async () => {
  const response = await apiClient.get("/despacho");
  return response.data;
};
export const createDespacho = async (data: any) => {
  const response = await apiClient.post("/despacho", data);
  return response.data;
};
export const updateDespacho = async (id: string, data: any) => {
  const response = await apiClient.put(`/despacho/${id}`, data);
  return response.data;
};
export const deleteDespacho = async (id: string) => {
  const response = await apiClient.delete(`/despacho/${id}`);
  return response.data;
};
export const obtenerDespachosPorRefineria = async (idRefineria: string) => {
  const { data } = await apiClient.get(`/despacho/refineria/${idRefineria}`);
  return data; // { total: number, despachos: Despacho[] }
};
