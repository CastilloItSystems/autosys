import apiClient from "./apiClient";

export const getUser = async (id: string) => {
  console.log(`Fetching user with ID: ${id}`);
  const response = await apiClient.get(`/users/${id}`);
  console.log(`User data fetched:`, response.data);
  return response.data;
};

export const getUsers = async () => {
  const response = await apiClient.get("/users");
  return response.data;
};

export const createUser = async (data: any) => {
  const response = await apiClient.post("/users", data);
  return response.data;
};

export const updateUser = async (id: string, data: any) => {
  const response = await apiClient.put(`/users/${id}`, data);
  return response.data;
};

export const deleteUser = async (id: string) => {
  const response = await apiClient.delete(`/users/${id}`);
  return response.data;
};

export const getAuditLogsForUser = async (id: string) => {
  const response = await apiClient.get(`/users/${id}/audit-logs`);
  return response.data;
};

// ── Permisos individuales ──────────────────────────────────────────────────

export interface PermissionOverride {
  id?: string;
  permission: string;
  action: "GRANT" | "REVOKE";
  reason?: string;
}

export interface UserPermissionsResponse {
  userId: string;
  userName: string;
  role: string;
  rolePermissions: string[];
  effectivePermissions: string[];
  overrides: PermissionOverride[];
  allPermissions: string[];
}

export const getUserPermissions = async (
  id: string
): Promise<UserPermissionsResponse> => {
  const response = await apiClient.get(`/users/${id}/permissions`);
  return response.data;
};

export const setUserPermissions = async (
  id: string,
  overrides: Omit<PermissionOverride, "id">[]
): Promise<{ effectivePermissions: string[]; overrides: PermissionOverride[] }> => {
  const response = await apiClient.put(`/users/${id}/permissions`, { overrides });
  return response.data;
};

export const loginUser = async (data: any) => {
  const response = await apiClient.post("/auth/login", data);
  return response.data;
};

export const googleSingIn = async (data: any) => {
  const response = await apiClient.post("/auth/google", data);
  return response.data;
};

export const registerUser = async (data: any) => {
  const response = await apiClient.post("/auth/register", data);
  return response.data;
};
