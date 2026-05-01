// Invoice interfaces
import { CustomerReference } from "./workOrderMain.interface";

// Reference types for populated fields
export interface WorkOrderReference {
  _id: string;
  customer: string;
  vehicle: string;
  diasTranscurridos: number | null;
  id: string;
}

export interface UserReference {
  _id: string;
  nombre: string;
  id: string;
}

// Re-export CustomerReference for convenience
export type { CustomerReference };

// Tax interface
export interface InvoiceTax {
  name: string;
  rate: number;
  amount: number;
}

// Invoice Item interface
export interface InvoiceItem {
  _id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  service?: string;
  repuesto?: string;
}

// Invoice main interface
export interface Invoice {
  _id?: string;
  invoiceNumber: string;
  workOrder: WorkOrderReference | string;
  customer: CustomerReference | string;
  issueDate: string | Date;
  dueDate: string | Date;
  status:
    | "borrador"
    | "emitida"
    | "pagada_parcial"
    | "pagada_total"
    | "vencida"
    | "cancelada";
  subtotal: number;
  total: number;
  notes?: string;
  paymentTerms?: string;
  paidAmount: number;
  balance: number;
  createdBy?: UserReference | string;
  eliminado?: boolean;
  taxes: InvoiceTax[];
  items: InvoiceItem[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
  __v?: number;
}

// Filters for invoices
export interface InvoiceFilters {
  workOrder?: string;
  customer?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  eliminado?: boolean;
  search?: string;
}

// Response structure for invoices (with pagination from mongoose-paginate-v2)
export interface InvoiceResponse {
  success: boolean;
  data: {
    docs: Invoice[];
    totalDocs: number;
    limit: number;
    totalPages: number;
    page: number;
    pagingCounter: number;
    hasPrevPage: boolean;
    hasNextPage: boolean;
    prevPage: number | null;
    nextPage: number | null;
  };
}
