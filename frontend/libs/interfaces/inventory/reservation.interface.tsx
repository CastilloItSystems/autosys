export type ReservationStatus =
  | "activo"
  | "liberado"
  | "consumido"
  | "cancelado";

export interface Reservation {
  id: string;
  item: string; // Item id
  warehouse: string; // Warehouse id
  cantidad: number; // required, min 1
  reservadoPor?: string; // user id
  motivo?: string;
  estado?: ReservationStatus; // default 'activo'
  eliminado?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
