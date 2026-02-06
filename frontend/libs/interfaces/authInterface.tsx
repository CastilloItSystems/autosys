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

export interface Usuario {
  id: string;
  nombre: string;
  correo: string;
  rol: string;
  acceso: string;
  estado: string;
  createdBy: UserReference;
  modificadoPor: UserReference;
  createdAt: string;
  historial: HistorialCambio[];
  idWorkshop?: Workshop[];
  idRefineria?: Refineria[];
  idAutoSys?: AutoSys[];
  empresas?: Empresa[];

  departamento?: string[];

  img?: string;
  telefono: string;
}
