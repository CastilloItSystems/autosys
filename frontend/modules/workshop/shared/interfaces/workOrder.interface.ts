// Workshop interfaces for work orders, services, invoices and payments

// Base interfaces for audit
export interface UserReference {
  _id: string;
  nombre: string;
  correo: string;
}

export interface HistorialCambio {
  _id: string;
  fecha: string;
  modificadoPor: UserReference;
  cambios: Record<string, { from: any; to: any }>;
}

// Work Order Status
export interface WorkOrderStatus {
  _id?: string;
  nombre: string;
  descripcion?: string;
  color?: string;
  orden: number;
  estado: "activo" | "inactivo";
  createdAt?: Date;
  updatedAt?: Date;
}

// Service
export interface Service {
  _id?: string;
  name: string;
  description: string;
  price: number;
  category: string;
  estimatedHours?: number;
  estado: "activo" | "inactivo";
  createdAt?: Date;
  updatedAt?: Date;
}

// Work Order Item
export interface WorkOrderItem {
  _id?: string;
  service?: Service | string;
  item?: any; // Reference to inventory item
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  type: "service" | "part";
  estado: "activo" | "inactivo";
  createdAt?: Date;
  updatedAt?: Date;
}

// Work Order
export interface WorkOrder {
  _id?: string;
  workOrderNumber: string;
  customer: any; // Reference to customer
  vehicle: any; // Reference to vehicle
  technician?: UserReference;
  status: WorkOrderStatus | string;
  priority: "low" | "medium" | "high" | "urgent";
  description: string;
  estimatedCompletionDate?: Date;
  actualCompletionDate?: Date;
  totalAmount: number;
  items: WorkOrderItem[];
  notes?: string;
  estado: "activo" | "inactivo";
  createdAt?: Date;
  updatedAt?: Date;
  createdBy: UserReference;
  modificadoPor?: UserReference;
  historial: HistorialCambio[];
}

// Invoice
export interface Invoice {
  _id?: string;
  invoiceNumber: string;
  workOrder?: WorkOrder | string;
  customer: any; // Reference to customer
  issueDate: Date;
  dueDate: Date;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status:
    | "borrador"
    | "emitida"
    | "pagada_parcial"
    | "pagada_total"
    | "vencida"
    | "cancelada";
  items: InvoiceItem[];
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy: UserReference;
  modificadoPor?: UserReference;
}

// Invoice Item (embedded in Invoice)
export interface InvoiceItem {
  _id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  type: "service" | "part";
  reference?: string; // ID of service or item
}

// Payment
export interface Payment {
  _id?: string;
  invoice: Invoice | string;
  amount: number;
  paymentDate: Date;
  paymentMethod: "efectivo" | "tarjeta" | "transferencia" | "cheque";
  reference?: string;
  notes?: string;
  status: "confirmado" | "pendiente" | "rechazado" | "cancelado";
  createdAt?: Date;
  updatedAt?: Date;
  createdBy: UserReference;
  modificadoPor?: UserReference;
}

// Filter interfaces for API queries
export interface WorkOrderFilters {
  status?: string;
  priority?: string;
  customer?: string;
  technician?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface InvoiceFilters {
  status?: string;
  customer?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface PaymentFilters {
  invoice?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
}

// Response interfaces
export interface WorkOrderWithHistory extends WorkOrder {
  history: HistorialCambio[];
}

export interface AccountsReceivableReport {
  customer: any;
  totalInvoices: number;
  totalPaid: number;
  totalPending: number;
  overdueAmount: number;
  invoices: Invoice[];
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
