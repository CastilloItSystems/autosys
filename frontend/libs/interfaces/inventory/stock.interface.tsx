export interface Stock {
  id: string;
  item: string; // Item id (o Item poblado)
  warehouse: string; // Warehouse id (o poblado)
  cantidad?: number; // default: 0
  costoPromedio?: number; // default: 0
  lote?: string;
  ubicacionZona?: string;
  reservado?: number; // default: 0
  eliminado?: boolean;
  createdBy?: string;
  historial?: any[];
  createdAt?: string;
  updatedAt?: string;
}
