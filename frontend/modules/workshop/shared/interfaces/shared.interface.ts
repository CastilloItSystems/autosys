// libs/interfaces/workshop/shared.interface.ts
export interface CustomerRef {
  id: string;
  name: string;
  code: string;
  phone?: string | null;
  mobile?: string | null;
}

export interface VehicleRef {
  id: string;
  plate: string;
  vin?: string | null;
  year?: number | null;
  color?: string | null;
  brand?: { name: string } | null;
  vehicleModel?: { name: string } | null;
}

export interface OrderRef {
  id: string;
  folio: string;
  status: string;
  receivedAt?: string | null;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Shape returned by workshop list endpoints */
export interface WorkshopPagedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  meta: PaginationMeta;
}

export interface WorkshopResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
