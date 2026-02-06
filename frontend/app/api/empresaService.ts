import apiClient from "./apiClient";

export const getEmpresa = async (id: string) => {
  const response = await apiClient.get(`/empresas/${id}`);
  return response.data;
};

export const getEmpresas = async () => {
  const response = await apiClient.get("/empresas");
  return response.data;
};

export const getEmpresaPredeterminada = async () => {
  const response = await apiClient.get("/empresas/predeterminada");
  return response.data;
};

export const createEmpresa = async (data: any) => {
  const response = await apiClient.post("/empresas", data);
  return response.data;
};

export const updateEmpresa = async (id: string, data: any) => {
  const response = await apiClient.put(`/empresas/${id}`, data);
  return response.data;
};

export const deleteEmpresa = async (id: string) => {
  const response = await apiClient.delete(`/empresas/${id}`);
  return response.data;
};

export const getAuditLogsForEmpresa = async (id: string) => {
  const response = await apiClient.get(`/empresas/${id}/audit-logs`);
  return response.data;
};
