export interface AuthContextProps {
  children: React.ReactNode;
}

export interface AuthState {
  status: "checking" | "authenticated" | "not-authenticated";
  user: User | null;
  token: string | null;
}

interface User {
  uid: string;
  name: string;
  email: string;
}

// Dynamic role info per company for a user
export interface UserEmpresaRoleInfo {
  empresaId: string;
  company: { id: string; name: string };
  role: { id: string; name: string; permissions: string[] };
}
export interface MembershipRole {
  id: string;
  name: string;
  description?: string | null;
}

export interface MembershipEmpresa {
  id: string;
  name: string;
}

export interface Membership {
  id: string;
  userId: string;
  empresaId: string;
  roleId: string;
  status: "invited" | "active" | "suspended";
  assignedBy?: string | null;
  assignedAt: string;
  updatedAt: string;
  empresa?: MembershipEmpresa;
  role?: MembershipRole;
}

/** Shape returned by the backend in user.companies[] */
export interface EmpresaResumen {
  membershipId: string;
  empresaId: string;
  name: string;
  role: MembershipRole;
  permissions: string[];
}

export interface Usuario {
  id: string;
  img?: string | null;
  name: string;
  email: string;
  phone?: string | null;
  departments: string[];
  access: "limited" | "full" | "none";
  status: "pending" | "active" | "suspended";
  deleted: boolean;
  online: boolean;
  fcmTokens: string[];
  google: boolean;
  createdAt: string;
  updatedAt: string;
  /** Companies with role and permissions (returned with the token) */
  empresas?: EmpresaResumen[];
  /** Legacy alias — may not be present depending on endpoint */
  memberships?: Membership[];
}
