import apiClient from "./apiClient";

// ── Tipos base ──────────────────────────────────────────────────────────────

export interface Empresa {
  id_empresa: string;
  nombre: string;
  direccion?: string | null;
  telefonos?: string | null;
  fax?: string | null;
  numerorif?: string | null;
  numeronit?: string | null;
  website?: string | null;
  email?: string | null;
  contacto?: string | null;
  predeter: boolean;
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
  logo_url?: string | null;
  eliminado: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuditUser {
  id: string;
  nombre: string;
  correo: string;
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
  empresas: Empresa[];
}

export interface AuditLogsResponse {
  total: number;
  auditLogs: AuditLog[];
}

// ── DTOs ────────────────────────────────────────────────────────────────────

export interface CreateEmpresaRequest {
  nombre: string;
  direccion?: string;
  telefonos?: string;
  fax?: string;
  numerorif?: string;
  numeronit?: string;
  website?: string;
  email?: string;
  contacto?: string;
  predeter?: boolean;
  soporte1?: string;
  soporte2?: string;
  soporte3?: string;
  data_usaweb?: boolean;
  data_servidor?: string;
  data_usuario?: string;
  data_password?: string;
  data_port?: string;
  licencia?: string;
  historizada?: boolean;
  masinfo?: string;
  usa_prefijo?: boolean;
  name_prefijo?: string;
  dprefijobd?: string;
  dprefijosrv?: string;
  dprefijousr?: string;
  logo_url?: string;
}

export interface UpdateEmpresaRequest {
  nombre?: string;
  direccion?: string | null;
  telefonos?: string | null;
  fax?: string | null;
  numerorif?: string | null;
  numeronit?: string | null;
  website?: string | null;
  email?: string | null;
  contacto?: string | null;
  predeter?: boolean;
  soporte1?: string | null;
  soporte2?: string | null;
  soporte3?: string | null;
  data_usaweb?: boolean;
  data_servidor?: string | null;
  data_usuario?: string | null;
  data_password?: string | null;
  data_port?: string | null;
  licencia?: string | null;
  historizada?: boolean;
  masinfo?: string | null;
  usa_prefijo?: boolean;
  name_prefijo?: string | null;
  dprefijobd?: string | null;
  dprefijosrv?: string | null;
  dprefijousr?: string | null;
  eliminado?: boolean;
}

// ── Métodos ─────────────────────────────────────────────────────────────────

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
  data: CreateEmpresaRequest,
): Promise<Empresa> => {
  const response = await apiClient.post("/empresas", data);
  return response.data;
};

export const updateEmpresa = async (
  id: string,
  data: UpdateEmpresaRequest,
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
