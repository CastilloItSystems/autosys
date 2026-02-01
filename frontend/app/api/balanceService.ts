import apiClient from "./apiClient";

export const getBalance = async (id: string) => {
  const response = await apiClient.get(`/balance/${id}`);
  return response.data;
};
export const getBalances = async () => {
  const response = await apiClient.get("/balance");
  return response.data;
};
export const createBalance = async (data: any) => {
  const response = await apiClient.post("/balance", data);
  return response.data;
};
export const updateBalance = async (id: string, data: any) => {
  const response = await apiClient.put(`/balance/${id}`, data);
  return response.data;
};
export const deleteBalance = async (id: string) => {
  const response = await apiClient.delete(`/balance/${id}`);
  return response.data;
};
export const obtenerBalancesPorRefineria = async (idRefineria: string) => {
  const response = await apiClient.get(`/balance/refineria/${idRefineria}`);
  return response.data;
};
