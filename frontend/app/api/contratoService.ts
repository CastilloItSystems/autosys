import apiClient from "./apiClient";

export const getContrato = async (id: string) => {
  const response = await apiClient.get(`/contrato/${id}`);
  return response.data;
};
export const getContratos = async () => {
  const response = await apiClient.get("/contrato");
  return response.data;
};
export const createContrato = async (data: any) => {
  const response = await apiClient.post("/contrato", data);
  return response.data;
};
export const updateContrato = async (id: string, data: any) => {
  const response = await apiClient.put(`/contrato/${id}`, data);
  return response.data;
};
export const deleteContrato = async (id: string) => {
  const response = await apiClient.delete(`/contrato/${id}`);
  return response.data;
};
export const obtenerContratosPorRefineria = async (idRefineria: string) => {
  const { data } = await apiClient.get(`/contrato/refineria/${idRefineria}`);
  return data; // { total: number, contratos: Contrato[] }
};
