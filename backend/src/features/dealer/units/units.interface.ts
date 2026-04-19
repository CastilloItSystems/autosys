import { DealerUnitCondition, DealerUnitStatus } from '../../../generated/prisma/client.js'

export interface IDealerUnitBrand {
  id: string
  code: string
  name: string
  type: string
}

export interface IDealerUnitModel {
  id: string
  code?: string | null
  name: string
  year?: number | null
}

export interface IDealerUnitItem {
  id: string
  code: string
  sku: string
  name: string
}

export interface IDealerUnitWarehouse {
  id: string
  code: string
  name: string
}

export interface IDealerUnit {
  id: string
  empresaId: string
  brandId: string
  itemId: string
  warehouseId: string
  modelId?: string | null
  code?: string | null
  version?: string | null
  year?: number | null
  vin?: string | null
  engineSerial?: string | null
  plate?: string | null
  condition: DealerUnitCondition
  status: DealerUnitStatus
  mileage?: number | null
  colorExterior?: string | null
  colorInterior?: string | null
  fuelType?: string | null
  transmission?: string | null
  listPrice?: any | null
  promoPrice?: any | null
  location?: string | null
  description?: string | null
  specifications?: unknown
  isPublished: boolean
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  brand: IDealerUnitBrand
  model?: IDealerUnitModel | null
  item: IDealerUnitItem
  warehouse: IDealerUnitWarehouse
}

export interface IDealerUnitFilters {
  brandId?: string
  modelId?: string
  year?: number
  status?: string
  condition?: string
  isActive?: boolean
  search?: string
}
