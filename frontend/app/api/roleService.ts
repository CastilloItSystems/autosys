import apiClient from "./apiClient";

export interface CompanyRole {
  id: string;
  name: string;
  description?: string | null;
  empresaId: string;
  permissions: string[];
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { memberships: number };
}

// ── CRUD de roles por empresa ──────────────────────────────────────────────

export const getCompanyRoles = async (
  empresaId: string,
): Promise<CompanyRole[]> => {
  const response = await apiClient.get(`/empresas/${empresaId}/roles`);
  return response.data.roles;
};

export const createCompanyRole = async (
  empresaId: string,
  data: { name: string; description?: string; permissionCodes: string[] },
): Promise<CompanyRole> => {
  const response = await apiClient.post(`/empresas/${empresaId}/roles`, data);
  return response.data.role;
};

export const updateCompanyRole = async (
  empresaId: string,
  roleId: string,
  data: { name?: string; description?: string; permissionCodes?: string[] },
): Promise<CompanyRole> => {
  const response = await apiClient.put(
    `/empresas/${empresaId}/roles/${roleId}`,
    data,
  );
  return response.data.role;
};

export const deleteCompanyRole = async (
  empresaId: string,
  roleId: string,
): Promise<void> => {
  await apiClient.delete(`/empresas/${empresaId}/roles/${roleId}`);
};
