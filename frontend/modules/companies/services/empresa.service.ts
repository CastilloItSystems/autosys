import apiClient from "@/app/api/apiClient";
import type {
  AuditLogsResponse,
  Empresa,
  EmpresaCreate,
  EmpresasResponse,
  EmpresaUpdate,
} from "../interfaces/empresa.interface";

export type {
  AuditLog,
  AuditLogsResponse,
  AuditUser,
  Empresa,
  EmpresaCreate,
  EmpresasResponse,
  EmpresaUpdate,
} from "../interfaces/empresa.interface";

export const getEmpresa = async (id: string): Promise<Empresa> => {
  const response = await apiClient.get(`/empresas/${id}`);
  return response.data;
};

export const getEmpresas = async (): Promise<EmpresasResponse> => {
  const response = await apiClient.get("/empresas");
  return response.data;
};

export const getEmpresaPredeterminada = async (): Promise<Empresa> => {
  const response = await apiClient.get("/empresas/predeterminada");
  return response.data;
};

export const createEmpresa = async (
  data: EmpresaCreate,
): Promise<Empresa> => {
  const response = await apiClient.post("/empresas", data);
  return response.data;
};

export const updateEmpresa = async (
  id: string,
  data: EmpresaUpdate,
): Promise<Empresa> => {
  const response = await apiClient.put(`/empresas/${id}`, data);
  return response.data;
};

export const uploadEmpresaLogo = async (
  id: string,
  file: File,
): Promise<Empresa> => {
  const formData = new FormData();
  formData.append("image", file);
  const response = await apiClient.post<Empresa>(
    `/empresas/${id}/logo`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return response.data;
};

export const deleteEmpresa = async (
  id: string,
): Promise<{ message: string }> => {
  const response = await apiClient.delete(`/empresas/${id}`);
  return response.data;
};

export const getAuditLogsForEmpresa = async (
  id: string,
): Promise<AuditLogsResponse> => {
  const response = await apiClient.get(`/empresas/${id}/audit-logs`);
  return response.data;
};
