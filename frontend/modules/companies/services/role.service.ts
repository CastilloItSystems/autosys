import apiClient from "@/app/api/apiClient";

export interface CompanyRole {
  id: string;
  name: string;
  description?: string | null;
  empresaId: string;
  permissions: string[];
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
  // Prisma returns counts in `_count`. backend selects `userEmpresaRoles`.
  _count?: { userEmpresaRoles?: number; memberships?: number };
}

// ── CRUD de roles por empresa ──────────────────────────────────────────────

export const getCompanyRoles = async (
  companyId: string,
): Promise<CompanyRole[]> => {
  const response = await apiClient.get(`/companies/${companyId}/roles`);
  console.log("response", response);
  return response.data.data.roles;
};

export const createCompanyRole = async (
  companyId: string,
  data: { name: string; description?: string; permissionCodes: string[] },
): Promise<CompanyRole> => {
  const response = await apiClient.post(`/companies/${companyId}/roles`, data);
  return response.data.data.role;
};

export const updateCompanyRole = async (
  companyId: string,
  roleId: string,
  data: { name?: string; description?: string; permissionCodes?: string[] },
): Promise<CompanyRole> => {
  const response = await apiClient.put(
    `/companies/${companyId}/roles/${roleId}`,
    data,
  );
  return response.data.data.role;
};

export const deleteCompanyRole = async (
  companyId: string,
  roleId: string,
): Promise<void> => {
  await apiClient.delete(`/companies/${companyId}/roles/${roleId}`);
};
