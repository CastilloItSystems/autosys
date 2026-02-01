import { HistorialCambio, UserReference } from "./configRefineriaInterface";

export interface AutoSys {
  id: string | undefined;
  nombre: string;
  estado: string;
  createdAt: string;
  updatedAt: string;
  createdBy: UserReference;
  modificadoPor: UserReference;
  historial: HistorialCambio[];
  rif: string;
  img: string;
  ubicacion: string;
  telefono?: string;
  procesamientoDia?: number;
  legal?: string;
}

// Definir tipo de usuario para auditoría
// export interface UserReference {
//   _id: string;
//   id: string;
//   nombre: string;
//   correo: string;
// }

// // Definir tipo de historial de cambios
// export interface HistorialCambio {
//   _id: string;
//   fecha: string;
//   modificadoPor: UserReference;
//   cambios: Record<string, { from: any; to: any }>;
// }
