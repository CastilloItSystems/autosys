import apiClient from "@/app/api/apiClient";

import type {
  UsersResponse,
  AuditLogsResponse,
  MembershipsResponse,
  MembershipEmpresasResponse,
  User,
  Membership,
  MembershipCompanyRole,
  MembershipPermissionsResponse,
  MembershipPermissionOverride,
  CreateUserRequest,
  UpdateUserRequest,
  CreateMembershipRequest,
  UpdateMembershipRequest,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
} from "../interfaces/user.interface";

export type {
  UserStatus,
  AccessType,
  MembershipStatus,
  MembershipRole,
  MembershipEmpresa,
  Membership,
  MembershipCompanyRole,
  MembershipEmpresasResponse,
  User,
  AuditUser,
  AuditLog,
  UsersResponse,
  UserResponse,
  AuditLogsResponse,
  MembershipsResponse,
  MembershipResponse,
  CreateUserRequest,
  UpdateUserRequest,
  CreateMembershipRequest,
  UpdateMembershipRequest,
  PermissionAction,
  MembershipPermissionOverride,
  MembershipPermissionsResponse,
  LoginRequest,
  LoginEmpresa,
  LoginUser,
  LoginResponse,
  RegisterRequest,
} from "../interfaces/user.interface";

// ── Usuarios globales SaaS ──────────────────────────────────────────────────

export const getUsers = async (): Promise<UsersResponse> => {
  const response = await apiClient.get("/users");
  return response.data;
};

export const getUser = async (id: string): Promise<User> => {
  const response = await apiClient.get(`/users/${id}`);
  return response.data;
};

export const createUser = async (data: CreateUserRequest): Promise<User> => {
  const response = await apiClient.post("/users", data);
  return response.data;
};

export const updateUser = async (
  id: string,
  data: UpdateUserRequest,
): Promise<User> => {
  const response = await apiClient.put(`/users/${id}`, data);
  return response.data;
};

export const uploadUserProfilePicture = async (
  id: string,
  file: File,
): Promise<User> => {
  const formData = new FormData();
  formData.append("image", file);
  const response = await apiClient.post<User>(
    `/users/${id}/profile-picture`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return response.data;
};

export const deleteUser = async (id: string): Promise<void> => {
  await apiClient.delete(`/users/${id}`);
};

export const getAuditLogsForUser = async (
  id: string,
): Promise<AuditLogsResponse> => {
  const response = await apiClient.get(`/users/${id}/audit-logs`);
  return response.data;
};

// ── Memberships ─────────────────────────────────────────────────────────────

export const getMembershipsByEmpresa =
  async (): Promise<MembershipsResponse> => {
    const response = await apiClient.get("/memberships");
    return response.data;
  };

export const getMembershipsByUser = async (
  userId: string,
): Promise<MembershipsResponse> => {
  const response = await apiClient.get(`/memberships/user/${userId}`);
  return response.data;
};

export const getMembershipEmpresas =
  async (): Promise<MembershipEmpresasResponse> => {
    const response = await apiClient.get("/empresas");
    return response.data;
  };

export const getMembershipCompanyRoles = async (
  empresaId: string,
): Promise<MembershipCompanyRole[]> => {
  const response = await apiClient.get(`/empresas/${empresaId}/roles`);
  return response.data.roles ?? [];
};

export const createMembership = async (
  data: CreateMembershipRequest,
): Promise<Membership> => {
  const response = await apiClient.post("/memberships", data);
  return response.data;
};

export const updateMembership = async (
  id: string,
  data: UpdateMembershipRequest,
): Promise<Membership> => {
  const response = await apiClient.put(`/memberships/${id}`, data);
  return response.data;
};

export const deleteMembership = async (id: string): Promise<void> => {
  await apiClient.delete(`/memberships/${id}`);
};

// ── Membership Permission Overrides ─────────────────────────────────────────

export const getMembershipPermissions = async (
  membershipId: string,
): Promise<MembershipPermissionsResponse> => {
  const response = await apiClient.get(
    `/memberships/${membershipId}/permissions`,
  );
  return response.data;
};

export const setMembershipPermissions = async (
  membershipId: string,
  overrides: MembershipPermissionOverride[],
): Promise<void> => {
  await apiClient.put(`/memberships/${membershipId}/permissions`, {
    overrides,
  });
};

// ── Auth ────────────────────────────────────────────────────────────────────

export const loginUser = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await apiClient.post("/auth/login", data);
  return response.data;
};

export const googleSingIn = async <T = unknown>(data: T) => {
  const response = await apiClient.post("/auth/google", data);
  return response.data;
};

export const registerUser = async (
  data: RegisterRequest,
): Promise<LoginResponse> => {
  const response = await apiClient.post("/auth/register", data);
  return response.data;
};
