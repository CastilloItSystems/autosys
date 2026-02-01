import { VehicleBrand, VehicleModel, Vehicle } from "./vehicle.interface";

export interface Customer {
  id: string;
  _id: string;
  nombre: string;
  tipo: "persona" | "empresa";
  telefono?: string;
  correo?: string;
  direccion?: string;
  rif?: string;
  razonSocial?: string;
  notas?: string;
  estado?: "activo" | "inactivo";
  eliminado?: boolean;
  nombreCompleto?: string;
  vehicles?: Vehicle[];
  createdBy?: string;
  historial?: any[];
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}
