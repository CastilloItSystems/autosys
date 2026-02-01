import apiClient from "./apiClient";

export const getCuenta = async (id: string) => {
  const response = await apiClient.get(`/cuenta/${id}`);
  return response.data;
};
export const getCuentas = async () => {
  const response = await apiClient.get("/cuenta");
  return response.data;
};
export const createCuenta = async (data: any) => {
  const response = await apiClient.post("/cuenta", data);
  return response.data;
};
export const updateCuenta = async (id: string, data: any) => {
  const response = await apiClient.put(`/cuenta/${id}`, data);
  return response.data;
};
export const deleteCuenta = async (id: string) => {
  const response = await apiClient.delete(`/cuenta/${id}`);
  return response.data;
};
export const obtenerCuentaPorRefineria = async (refineriaId: string) => {
  const response = await apiClient.get(`/cuenta/refineria/${refineriaId}`);
  return response.data;
};
