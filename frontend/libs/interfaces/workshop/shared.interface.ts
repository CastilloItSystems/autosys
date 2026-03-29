// libs/interfaces/workshop/shared.interface.ts
export interface CustomerRef {
  id: string
  name: string
  code: string
  phone?: string | null
}

export interface VehicleRef {
  id: string
  plate: string
  vin?: string | null
  year?: number | null
  color?: string | null
}

export interface OrderRef {
  id: string
  folio: string
  status: string
  receivedAt?: string | null
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

/** Shape returned by workshop list endpoints: ApiResponse.success wrapping { data, pagination } */
export interface WorkshopPagedResponse<T> {
  success: boolean
  message: string
  data: {
    data: T[]
    pagination: PaginationMeta
  }
}

export interface WorkshopResponse<T> {
  success: boolean
  message: string
  data: T
}
