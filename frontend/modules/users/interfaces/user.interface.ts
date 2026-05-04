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

export interface MembershipCompanyRole {
  id: string;
  name: string;
  description?: string | null;
  empresaId: string;
  permissions: string[];
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { userEmpresaRoles?: number; memberships?: number };
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
  isTechnician: boolean;
  createdAt: string;
  updatedAt: string;
  memberships?: Membership[];
  // Legacy compatibility fields (from API response)
  empresas?: Membership[];
  rol?: string;
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

export interface MembershipEmpresasResponse {
  total: number;
  empresas: MembershipEmpresa[];
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
  isTechnician?: boolean;
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

// ── Membership Permission Overrides ─────────────────────────────────────────

export type PermissionAction = "GRANT" | "REVOKE";

export interface MembershipPermissionOverride {
  permissionCode: string;
  action: PermissionAction;
  reason?: string | null;
}

export interface MembershipPermissionsResponse {
  membershipId: string;
  user: { id: string; nombre: string; correo: string };
  empresa: { id_empresa: string; nombre: string };
  roleName: string;
  rolePermissions: string[];
  overrides: MembershipPermissionOverride[];
  effectivePermissions: string[];
}

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
