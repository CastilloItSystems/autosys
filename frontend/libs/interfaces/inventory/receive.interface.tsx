export interface ReceiveItem {
  id: string;
  receiveId: string;
  itemId: string;
  quantityReceived: number;
  unitCost: number;
  batchNumber?: string | null;
  expiryDate?: string | null;
  item?: {
    id: string;
    sku: string;
    name: string;
  };
  createdAt?: string;
}

export interface Receive {
  id: string;
  receiveNumber: string;
  purchaseOrderId: string;
  warehouseId: string;
  notes?: string | null;
  receivedBy?: string | null;
  receivedByName?: string | null;
  receivedAt?: string;
  purchaseOrder?: {
    id: string;
    orderNumber: string;
    supplierId: string;
    supplier?: { id: string; name: string };
  };
  warehouse?: {
    id: string;
    code: string;
    name: string;
    type?: string;
  };
  items?: ReceiveItem[];
  createdAt?: string;
  updatedAt?: string;
}
