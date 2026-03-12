import apiClient from "./apiClient";

// ── Tipos base ──────────────────────────────────────────────────────────────

export type UserStatus = "pendiente" | "activo" | "suspendido";
export type AccessType = "limitado" | "completo" | "ninguno";
export type MembershipStatus = "invited" | "active" | "suspended";

export interface MembershipRole {
  id: string;
  name: string;
  description?: string | null;
}

export interface MembershipEmpresa {
  id_empresa: string;
  nombre: string;
}

export interface Membership {
  id: string;
  userId: string;
  empresaId: string;
  roleId: string;
  status: MembershipStatus;
  assignedBy?: string | null;
  assignedAt: string;
  updatedAt: string;
  empresa?: MembershipEmpresa;
  role?: MembershipRole;
}

export interface User {
  id: string;
  img?: string | null;
  nombre: string;
  correo: string;
  telefono?: string | null;
  departamento: string[];
  acceso: AccessType;
  estado: UserStatus;
  eliminado: boolean;
  online: boolean;
  fcmTokens: string[];
  google: boolean;
  createdAt: string;
  updatedAt: string;
  memberships?: Membership[];
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

export interface UsersResponse {
  total: number;
  users: User[];
}

export interface UserResponse {
  data?: User;
  user?: User;
}

export interface AuditLogsResponse {
  total: number;
  auditLogs: AuditLog[];
}

export interface MembershipsResponse {
  total: number;
  memberships: Membership[];
}

export interface MembershipResponse {
  data?: Membership;
  membership?: Membership;
}

// ── DTOs Usuarios ───────────────────────────────────────────────────────────

export interface CreateUserRequest {
  nombre: string;
  correo: string;
  password: string;
  telefono?: string;
  departamento: string[];
  acceso?: AccessType;
  estado?: UserStatus;
  img?: string | null;
}

export interface UpdateUserRequest {
  nombre?: string;
  correo?: string;
  password?: string;
  telefono?: string | null;
  departamento?: string[];
  acceso?: AccessType;
  estado?: UserStatus;
  img?: string | null;
  online?: boolean;
}

// ── DTOs Memberships ────────────────────────────────────────────────────────

export interface CreateMembershipRequest {
  userId: string;
  empresaId: string;
  roleId: string;
  status?: MembershipStatus;
}

export interface UpdateMembershipRequest {
  roleId?: string;
  status?: MembershipStatus;
}

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

// ── Auth ────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  correo: string;
  password: string;
}

export interface LoginEmpresa {
  membershipId: string;
  empresaId: string;
  nombre: string;
  role: {
    id: string;
    name: string;
    description?: string | null;
  };
  permissions: string[];
}

export interface LoginUser {
  id: string;
  img?: string | null;
  nombre: string;
  correo: string;
  telefono?: string | null;
  departamento: string[];
  acceso: AccessType;
  estado: UserStatus;
  eliminado: boolean;
  online: boolean;
  fcmTokens: string[];
  google: boolean;
  createdAt: string;
  updatedAt: string;
  empresas: LoginEmpresa[];
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: LoginUser;
  };
  timestamp: string;
}

export interface RegisterRequest {
  nombre: string;
  correo: string;
  password: string;
  telefono?: string;
  departamento: string[] | string;
  acceso?: AccessType;
}

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
