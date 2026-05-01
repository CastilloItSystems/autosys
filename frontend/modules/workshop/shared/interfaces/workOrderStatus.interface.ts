// Workshop Work Order Status Interface

export interface WorkOrderStatus {
  _id?: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  color?: string;
  icono?: string;
  orden?: number;
  tipo?: "inicial" | "intermedio" | "final" | "cancelado";
  transicionesPermitidas?: string[];
  requiereAprobacion?: boolean;
  requiereDocumentacion?: boolean;
  notificarCliente?: boolean;
  notificarTecnico?: boolean;
  activo?: boolean;
  eliminado?: boolean;
  collapsed?: boolean;
  __v?: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  id?: string;
}

export interface WorkOrderStatusReference {
  _id: string;
  codigo: string;
  nombre: string;
  color?: string;
  icono?: string;
  id: string;
}

// API Response interfaces
export interface WorkOrderStatusResponse {
  success: boolean;
  data: WorkOrderStatus[];
}

export interface WorkOrderStatusSingleResponse {
  success: boolean;
  data: WorkOrderStatus;
}

// Filters interface
export interface WorkOrderStatusFilters {
  activo?: boolean;
  tipo?: "inicial" | "intermedio" | "final" | "cancelado";
  codigo?: string;
  nombre?: string;
}
