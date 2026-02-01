export type MovementType = "entrada" | "salida" | "transferencia" | "ajuste";

export interface Movement {
  id: string;
  tipo: MovementType; // required
  referencia?: string;
  item: string; // Item id (required)
  cantidad: number; // required
  costoUnitario?: number;
  warehouseFrom?: string;
  warehouseTo?: string;
  lote?: string;
  usuario?: string;
  metadata?: any;
  eliminado?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
