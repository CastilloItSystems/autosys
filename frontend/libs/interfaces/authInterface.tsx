import { AutoSys } from "./autoSysInterface";
import {
  HistorialCambio,
  Refineria,
  UserReference,
} from "./configRefineriaInterface";
import { Empresa } from "./empresaInterface";
import { Workshop } from "./workshopInterface";

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

// Información de rol dinámico por empresa para un usuario
export interface UserEmpresaRoleInfo {
  empresaId: string;
  empresa: { id_empresa: string; nombre: string };
  role: { id: string; name: string; permissions: string[] };
}

// export interface Usuario {
//   id: string;
//   nombre: string;
//   correo: string;
//   rol?: string; // campo legacy — se mantiene durante transición
//   acceso: string;
//   estado: string;
//   createdBy: UserReference;
//   modificadoPor: UserReference;
//   createdAt: string;
//   historial: HistorialCambio[];
//   idWorkshop?: Workshop[];
//   idRefineria?: Refineria[];
//   idAutoSys?: AutoSys[];
//   empresas?: Empresa[];
//   userEmpresaRoles?: UserEmpresaRoleInfo[]; // NEW: roles dinámicos por empresa

//   departamento?: string[];

//   img?: string;
//   telefono: string;
// }
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
  status: "invited" | "active" | "suspended";
  assignedBy?: string | null;
  assignedAt: string;
  updatedAt: string;
  empresa?: MembershipEmpresa;
  role?: MembershipRole;
}

/** Estructura que devuelve el backend en user.empresas[] */
export interface EmpresaResumen {
  membershipId: string;
  empresaId: string;
  nombre: string;
  role: MembershipRole;
  permissions: string[];
}

export interface Usuario {
  id: string;
  img?: string | null;
  nombre: string;
  correo: string;
  telefono?: string | null;
  departamento: string[];
  acceso: "limitado" | "completo" | "ninguno";
  estado: "pendiente" | "activo" | "suspendido";
  eliminado: boolean;
  online: boolean;
  fcmTokens: string[];
  google: boolean;
  createdAt: string;
  updatedAt: string;
  /** Lista compacta de empresas con rol y permisos (devuelta con el token) */
  empresas?: EmpresaResumen[];
  /** Alias legacy — puede no estar presente según el endpoint */
  memberships?: Membership[];
}
