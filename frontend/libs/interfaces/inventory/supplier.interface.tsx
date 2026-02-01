export interface Supplier {
  id: string;
  nombre: string; // required
  contacto?: string;
  telefono?: string;
  correo?: string;
  direccion?: string;
  condicionesPago?: string;
  estado?: "activo" | "inactivo";
  eliminado?: boolean;
  createdBy?: string;
  historial?: any[];
  createdAt?: string;
  updatedAt?: string;
}
