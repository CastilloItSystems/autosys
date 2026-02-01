// Workshop Work Order Interface
import {
  WorkOrderStatus,
  WorkOrderStatusReference,
} from "./workOrderStatus.interface";

// Customer Reference (from CRM)
export interface CustomerReference {
  _id: string;
  nombre: string;
  telefono?: string;
  correo?: string;
  nombreCompleto?: string;
  id: string;
}

// Vehicle Reference (from CRM)
export interface VehicleReference {
  _id: string;
  placa: string;
  id: string;
}

// Technician Reference (User)
export interface TechnicianReference {
  _id: string;
  nombre: string;
  id: string;
}

// Service Reference
export interface ServiceReference {
  _id: string;
  nombre: string;
  descripcion?: string;
  precioBase: number;
  tiempoEstimadoMinutos: number;
}

// Repuesto Reference
export interface RepuestoReference {
  codigo: string;
  nombre: string;
  id: string;
  _id: string;
}

// Work Order Item Interface
export interface WorkOrderItem {
  _id?: string;
  workOrder?: string;
  tipo: "servicio" | "repuesto";
  servicio?: ServiceReference;
  repuesto?: RepuestoReference;
  nombre: string;
  descripcion?: string;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
  tiempoEstimado?: number;
  numeroParte?: string;
  estado: "pendiente" | "en_proceso" | "completado" | "cancelado";
  eliminado?: boolean;
  precioTotal: number;
  precioFinal: number;
  reserva?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  __v?: number;
}

// Work Order Main Interface
export interface WorkOrder {
  _id?: string;
  id?: string;
  numeroOrden: string;
  customer: CustomerReference | string;
  vehicle: VehicleReference | string;
  motivo: string;
  kilometraje: number;
  tecnicoAsignado?: TechnicianReference | string;
  estado: WorkOrderStatus | WorkOrderStatusReference | string;
  prioridad: "baja" | "normal" | "alta" | "urgente";
  descripcionProblema?: string;
  subtotalRepuestos: number;
  subtotalServicios: number;
  descuento: number;
  impuesto: number;
  costoTotal: number;
  fechaApertura: Date | string;
  fechaEstimadaEntrega?: Date | string;
  fechaEntregaReal?: Date | string;
  observaciones?: string;
  eliminado?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  __v?: number;
  diasTranscurridos?: number;
  items?: WorkOrderItem[];
}

// Work Order Filters
export interface WorkOrderFilters {
  estado?: string;
  prioridad?: string;
  customer?: string;
  tecnicoAsignado?: string;
  startDate?: Date | string;
  endDate?: Date | string;
}

// Work Order Response with Pagination
export interface WorkOrderResponse {
  success: boolean;
  data: WorkOrder[];
  pagination?: {
    total: number;
    page: number;
    pages: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Work Order History
export interface WorkOrderHistory {
  _id: string;
  workOrder: {
    _id: string;
    numeroOrden: string;
    diasTranscurridos: number | null;
    id: string;
  };
  tipo:
    | "cambio_estado"
    | "modificado_item"
    | "completado_item"
    | "eliminado_item"
    | "actualizacion_costos"
    | "creado"
    | "actualizado";
  descripcion: string;
  usuario: {
    _id: string;
    nombre: string;
    id: string;
  };
  detalles?: any;
  estadoAnterior?: any;
  estadoNuevo?: any;
  notas?: string;
  fecha: string;
  itemAfectado?: {
    _id: string;
    tipo: string;
    cantidad?: number;
  };
  costoAdicional?: number;
  eliminado: boolean;
  archivosAdjuntos?: any[];
  createdAt: string;
  updatedAt: string;
  __v?: number;
}
