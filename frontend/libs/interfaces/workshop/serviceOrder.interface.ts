// libs/interfaces/workshop/serviceOrder.interface.ts
import type { CustomerRef, VehicleRef } from "./shared.interface";
import type { TaxType } from "../inventory/purchaseOrder.interface";

export type { TaxType };

export type ServiceOrderItemSourceType =
  | "MANUAL"
  | "MATERIAL"
  | "ADDITIONAL"
  | "TOT";

export type ServiceOrderStatus =
  | "DRAFT"
  | "OPEN"
  | "DIAGNOSING"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "IN_PROGRESS"
  | "PAUSED"
  | "WAITING_PARTS"
  | "WAITING_AUTH"
  | "QUALITY_CHECK"
  | "READY"
  | "DELIVERED"
  | "INVOICED"
  | "CLOSED"
  | "CANCELLED";

export type ServiceOrderPriority = "LOW" | "NORMAL" | "HIGH" | "ASAP";
export type ServiceOrderItemType = "LABOR" | "PART" | "OTHER";

export interface ServiceOrderItem {
  id?: string;
  type: ServiceOrderItemType;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPct: number;
  taxType: TaxType;
  taxRate: number;
  taxAmount: number;
  total: number;
  operationId?: string | null;
  itemId?: string | null;
  stockDeducted: boolean;
  sourceType?: ServiceOrderItemSourceType;
  sourceRefId?: string | null;
  notes?: string | null;
}

export interface ServiceOrderPreInvoiceSummary {
  id: string;
  preInvoiceNumber: string;
  status:
    | "PENDING_PREPARATION"
    | "IN_PREPARATION"
    | "READY_FOR_PAYMENT"
    | "PAID"
    | "CANCELLED";
  baseImponible: number;
  taxRate: number;
  taxAmount: number;
  igtfApplies: boolean;
  igtfRate: number;
  igtfAmount: number;
  total: number;
  createdAt: string;
}

export interface ServiceOrderInvoiceSummary {
  id: string;
  invoiceNumber: string;
  fiscalNumber?: string | null;
  status: string;
  total: number;
  createdAt: string;
}

export interface ServiceOrderQuotationItemSummary {
  id: string;
  type: "LABOR" | "PART" | "CONSUMABLE" | "EXTERNAL_SERVICE" | "COURTESY";
  referenceId: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  discountPct: number;
  taxType: "IVA" | "EXEMPT" | "REDUCED";
  taxRate: number;
  taxAmount: number;
  subtotal: number;
  total: number;
  approved: boolean;
  order: number;
}

export interface ServiceOrderQuotationApprovalSummary {
  id: string;
  type: "TOTAL" | "PARTIAL" | "REJECTION";
  channel: "PRESENTIAL" | "WHATSAPP" | "EMAIL" | "CALL" | "DIGITAL_SIGNATURE";
  approvedByName: string;
  notes: string | null;
  rejectionReason: string | null;
  approvedAt: string;
}

export interface ServiceOrderQuotationSummary {
  id: string;
  quotationNumber: string;
  status: string;
  version: number;
  validUntil: string | null;
  subtotal: number;
  discount: number;
  taxAmt: number;
  total: number;
  notes: string | null;
  internalNotes: string | null;
  createdAt: string;
  items: ServiceOrderQuotationItemSummary[];
  approvals: ServiceOrderQuotationApprovalSummary[];
}

export interface ServiceOrder {
  id: string;
  folio: string;
  status: ServiceOrderStatus;
  priority: ServiceOrderPriority;
  customerId: string;
  customer: CustomerRef | null;
  customerVehicleId: string | null;
  customerVehicle: VehicleRef | null;
  vehiclePlate: string | null;
  vehicleDesc: string | null;
  mileageIn: number | null;
  mileageOut: number | null;
  diagnosisNotes: string | null;
  observations: string | null;
  assignedTechnicianId: string | null;
  assignedAdvisorId: string | null;
  bayId: string | null;
  serviceTypeId: string | null;
  appointmentId: string | null;
  receptionId: string | null;
  receivedAt: string;
  estimatedDelivery: string | null;
  deliveredAt: string | null;
  closedAt: string | null;
  laborTotal: number;
  partsTotal: number;
  otherTotal: number;
  subtotal: number;
  taxAmt: number;
  total: number;
  items: ServiceOrderItem[];
  preInvoice?: ServiceOrderPreInvoiceSummary | null;
  consolidatedPreInvoice?: ServiceOrderPreInvoiceSummary | null;
  invoice?: ServiceOrderInvoiceSummary | null;
  quotations?: ServiceOrderQuotationSummary[];
  qualityCheck?: { id: string; status: string } | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceOrderFilters {
  status?: ServiceOrderStatus;
  priority?: ServiceOrderPriority;
  customerId?: string;
  assignedTechnicianId?: string;
  bayId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface CreateServiceOrderInput {
  customerId: string;
  priority?: ServiceOrderPriority;
  customerVehicleId?: string;
  vehiclePlate?: string;
  vehicleDesc?: string;
  mileageIn?: number;
  diagnosisNotes?: string;
  observations?: string;
  assignedTechnicianId?: string;
  bayId?: string;
  serviceTypeId?: string;
  receptionId?: string;
  estimatedDelivery?: string;
  items?: Array<{
    id?: string;
    type: ServiceOrderItemType;
    description: string;
    quantity: number;
    unitPrice: number;
    unitCost?: number;
    discountPct?: number;
    taxType?: TaxType;
    taxRate?: number;
    operationId?: string;
    itemId?: string;
  }>;
}

export interface UpdateServiceOrderInput {
  priority?: ServiceOrderPriority;
  customerVehicleId?: string | null;
  vehiclePlate?: string;
  vehicleDesc?: string;
  mileageIn?: number;
  mileageOut?: number;
  diagnosisNotes?: string;
  observations?: string;
  assignedTechnicianId?: string | null;
  assignedAdvisorId?: string | null;
  bayId?: string | null;
  serviceTypeId?: string | null;
  estimatedDelivery?: string | null;
  items?: CreateServiceOrderInput["items"];
}

export interface UpdateServiceOrderStatusInput {
  status: ServiceOrderStatus;
  mileageOut?: number;
  comment?: string;
}

export interface ServiceOrderStatusHistoryEntry {
  id: string;
  serviceOrderId: string;
  previousStatus: ServiceOrderStatus | null;
  newStatus: ServiceOrderStatus;
  comment: string | null;
  userId: string;
  createdAt: string;
}
