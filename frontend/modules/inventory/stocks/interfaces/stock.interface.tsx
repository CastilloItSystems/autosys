/**
 * Stock – interfaz alineada al backend (Prisma + DTO).
 * Para la interfaz rica con item/warehouse incluidos, usar
 * el tipo `Stock` exportado desde `stockService.ts`.
 */
export interface Stock {
  id: string;
  itemId: string;
  warehouseId: string;
  quantityReal: number;
  quantityReserved: number;
  quantityAvailable: number;
  averageCost: number;
  lastMovementAt?: string | null;
  item?: {
    id: string;
    sku: string;
    name: string;
    minStock: number;
    isActive: boolean;
  };
  warehouse?: {
    id: string;
    code: string;
    name: string;
    type: string;
    isActive: boolean;
  };
  createdAt?: string;
  updatedAt?: string;
}
