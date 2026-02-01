import apiClient from "./apiClient";

export const getOperador = async (id: string) => {
  const response = await apiClient.get(`/operador/${id}`);
  return response.data;
};
export const getOperadors = async () => {
  const response = await apiClient.get("/operador");
  return response.data;
};
export const createOperador = async (data: any) => {
  const response = await apiClient.post("/operador", data);
  return response.data;
};
export const updateOperador = async (id: string, data: any) => {
  const response = await apiClient.put(`/operador/${id}`, data);
  return response.data;
};
export const deleteOperador = async (id: string) => {
  const response = await apiClient.delete(`/operador/${id}`);
  return response.data;
};
