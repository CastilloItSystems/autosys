export interface WorkOrderHistory {
  id: string;
  _id?: string;
  workOrderId: string;
  fromStatus?: string | null;
  toStatus?: string | null;
  notes?: string | null;
  createdAt: string;
  createdBy?: {
    id?: string;
    nombre?: string;
  } | null;
}
