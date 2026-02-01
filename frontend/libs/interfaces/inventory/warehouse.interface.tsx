export type WarehouseType = "almacen" | "bodega" | "taller" | "otro";
export type WarehouseStatus = "activo" | "inactivo";

export interface Warehouse {
  id: string;
  nombre: string; // required, unique
  ubicacion?: string;
  tipo?: WarehouseType; // default: 'almacen'
  capacidad?: number;
  estado?: WarehouseStatus; // default: 'activo'
  eliminado?: boolean;
  createdBy?: string;
  historial?: any[];
  createdAt?: string;
  updatedAt?: string;
}
