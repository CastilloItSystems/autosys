import apiClient from "@/app/api/apiClient";

// ── Tipos base ──────────────────────────────────────────────────────────────

export interface Empresa {
  id: string;
  name: string;
  address?: string | null;
  phones?: string | null;
  fax?: string | null;
  numerorif?: string | null;
  numeronit?: string | null;
  website?: string | null;
  email?: string | null;
  contact?: string | null;
  isDefault: boolean;
  soporte1?: string | null;
  soporte2?: string | null;
  soporte3?: string | null;
  data_usaweb: boolean;
  data_servidor?: string | null;
  data_usuario?: string | null;
  data_password?: string | null;
  data_port?: string | null;
  licencia?: string | null;
  historizada: boolean;
  masinfo?: string | null;
  usa_prefijo: boolean;
  name_prefijo?: string | null;
  dprefijobd?: string | null;
  dprefijosrv?: string | null;
  dprefijousr?: string | null;
  logoUrl?: string | null;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuditUser {
  id: string;
  name: string;
  email: string;
}

export interface AuditLog {
  id: string;
  entity: string;
  entityId: string;
  action: string;
  userId?: string | null;
  user?: AuditUser | null;
  changes: unknown;
  metadata?: unknown;
  createdAt: string;
}

// ── Responses ───────────────────────────────────────────────────────────────

export interface EmpresasResponse {
  total: number;
  companies: Empresa[];
}

export interface AuditLogsResponse {
  total: number;
  auditLogs: AuditLog[];
}

// ── DTOs ────────────────────────────────────────────────────────────────────

export interface CreateEmpresaRequest {
  name: string;
  address?: string | null;
  phones?: string | null;
  fax?: string | null;
  rif?: string | null;
  nit?: string | null;
  website?: string | null;
  email?: string | null;
  contact?: string | null;
  isDefault?: boolean;
  support1?: string | null;
  support2?: string | null;
  support3?: string | null;
  usesWeb?: boolean;
  dbServer?: string | null;
  dbUser?: string | null;
  dbPassword?: string | null;
  dbPort?: string | null;
  license?: string | null;
  archived?: boolean;
  additionalInfo?: string | null;
  usesPrefix?: boolean;
  prefixName?: string | null;
  dbPrefix?: string | null;
  serverPrefix?: string | null;
  userPrefix?: string | null;
  logoUrl?: string | null;
}

export interface UpdateEmpresaRequest {
  name?: string;
  address?: string | null;
  phones?: string | null;
  fax?: string | null;
  rif?: string | null;
  nit?: string | null;
  website?: string | null;
  email?: string | null;
  contact?: string | null;
  isDefault?: boolean;
  support1?: string | null;
  support2?: string | null;
  support3?: string | null;
  usesWeb?: boolean;
  dbServer?: string | null;
  dbUser?: string | null;
  dbPassword?: string | null;
  dbPort?: string | null;
  license?: string | null;
  archived?: boolean;
  additionalInfo?: string | null;
  usesPrefix?: boolean;
  prefixName?: string | null;
  dbPrefix?: string | null;
  serverPrefix?: string | null;
  userPrefix?: string | null;
  logoUrl?: string | null;
  deleted?: boolean;
}

// ── Métodos ─────────────────────────────────────────────────────────────────

export const getEmpresa = async (id: string): Promise<Empresa> => {
  const response = await apiClient.get(`/companies/${id}`);
  return response.data.data;
};

export const getEmpresas = async (): Promise<EmpresasResponse> => {
  const response = await apiClient.get("/companies");
  return response.data.data;
};

export const getEmpresaPredeterminada = async (): Promise<Empresa> => {
  const response = await apiClient.get("/companies/default");
  return response.data.data;
};

export const createEmpresa = async (
  data: CreateEmpresaRequest,
): Promise<Empresa> => {
  const response = await apiClient.post("/companies", data);
  return response.data.data;
};

export const updateEmpresa = async (
  id: string,
  data: UpdateEmpresaRequest,
): Promise<Empresa> => {
  const response = await apiClient.put(`/companies/${id}`, data);
  return response.data.data;
};

export const uploadEmpresaLogo = async (
  id: string,
  file: File,
): Promise<Empresa> => {
  const formData = new FormData();
  formData.append("image", file);
  const response = await apiClient.post<Empresa>(
    `/companies/${id}/logo`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return (response.data as any).data ?? response.data;
};

export const deleteEmpresa = async (
  id: string,
): Promise<{ message: string }> => {
  const response = await apiClient.delete(`/companies/${id}`);
  return response.data;
};

export const getAuditLogsForEmpresa = async (
  id: string,
): Promise<AuditLogsResponse> => {
  const response = await apiClient.get(`/companies/${id}/audit-logs`);
  return response.data.data;
};
