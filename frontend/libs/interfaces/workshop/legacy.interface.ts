import type {
  ServiceOrder,
  ServiceOrderFilters,
  ServiceOrderItem,
  ServiceOrderStatus,
} from "./serviceOrder.interface";
import type {
  ServiceType,
  ServiceTypeFilters,
} from "./serviceType.interface";
import type {
  WorkshopBay,
  WorkshopBayFilters,
} from "./workshopBay.interface";
import type { WorkshopPagedResponse } from "./shared.interface";
import type { Invoice as SalesInvoice } from "../sales/invoice.interface";
import type { Payment as SalesPayment } from "../sales/payment.interface";

export type Service = ServiceType & {
  _id?: string;
  activo?: boolean;
  basePrice?: number;
  price?: number;
  categoryId?: string | null;
};

export type ServiceFilters = ServiceTypeFilters;

export interface ServiceResponse {
  success: boolean;
  data: Service[];
  meta?: WorkshopPagedResponse<Service>["meta"];
}

export interface ServiceCategory {
  id: string;
  _id?: string;
  code: string;
  name: string;
  description?: string | null;
  isActive?: boolean;
}

export interface ServiceCategoryFilters {
  search?: string;
  isActive?: "true" | "false";
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface ServiceCategoryResponse {
  success: boolean;
  data: ServiceCategory[];
  meta?: WorkshopPagedResponse<ServiceCategory>["meta"];
}

export interface ServiceSubcategory {
  id: string;
  _id?: string;
  categoryId?: string | null;
  code: string;
  name: string;
  description?: string | null;
  isActive?: boolean;
}

export interface ServiceSubcategoryFilters {
  categoryId?: string;
  search?: string;
  isActive?: "true" | "false";
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface ServiceSubcategoryResponse {
  success: boolean;
  data: ServiceSubcategory[];
  meta?: WorkshopPagedResponse<ServiceSubcategory>["meta"];
}

export type WorkOrder = ServiceOrder & {
  _id?: string;
  estado?: { nombre?: string };
};

export type WorkOrderItem = ServiceOrderItem;
export type WorkOrderFilters = ServiceOrderFilters;

export interface WorkOrderResponse {
  success: boolean;
  data: WorkOrder[];
  meta?: WorkshopPagedResponse<WorkOrder>["meta"];
}

export interface WorkOrderStatus {
  id?: string;
  _id?: string;
  nombre: string;
  color?: string;
  tipo?: "inicial" | "intermedio" | "final" | "cancelado";
  activo?: boolean;
  orden?: number;
}

export interface WorkOrderStatusFilters {
  activo?: boolean;
  tipo?: "inicial" | "intermedio" | "final" | "cancelado";
  page?: number;
  limit?: number;
}

export interface WorkOrderStatusResponse {
  success: boolean;
  data: WorkOrderStatus[];
  meta?: WorkshopPagedResponse<WorkOrderStatus>["meta"];
}

export interface WorkOrderStatusSingleResponse {
  success: boolean;
  data: WorkOrderStatus;
}

export type BayArea = "mecanica" | "electrica" | "latoneria" | "detailing";
export type BayStatus = "disponible" | "ocupado" | "mantenimiento";

export type ServiceBay = WorkshopBay & {
  _id?: string;
  area?: BayArea | string;
  status?: BayStatus | string;
  maxTechnicians: number;
  currentTechnicians: Array<{
    technicianId?: string;
    role?: "principal" | "asistente";
  }>;
  eliminado?: boolean;
};

export type ServiceBayFilters = WorkshopBayFilters & {
  status?: BayStatus | string;
  area?: BayArea | string;
};

export interface CreateServiceBayDto {
  code: string;
  name: string;
  description?: string;
  area?: BayArea | string;
  maxTechnicians?: number;
}

export interface UpdateServiceBayDto {
  code?: string;
  name?: string;
  description?: string | null;
  area?: BayArea | string;
  status?: BayStatus | string;
  maxTechnicians?: number;
}

export type Invoice = SalesInvoice & {
  _id?: string;
  issueDate?: string;
  dueDate?: string;
  paidAmount?: number;
  balance?: number;
  customer?:
    | string
    | (NonNullable<SalesInvoice["customer"]> & { nombre?: string })
    | null;
  items?: Array<
    SalesInvoice["items"][number] & {
      description?: string;
      total?: number;
    }
  >;
};

export type Payment = SalesPayment & {
  _id?: string;
  date?: string;
};
