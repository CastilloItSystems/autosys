// backend/src/features/inventory/items/images/images.interface.ts

export interface IItemImage {
  id: string
  itemId: string
  url: string
  isPrimary: boolean
  order: number
  createdAt: Date
}

export interface IItemImageWithItem extends IItemImage {
  item?: {
    id: string
    sku: string
    name: string
  }
}

export interface ICreateImageInput {
  itemId: string
  url: string
  isPrimary?: boolean
}

export interface IUpdateImageInput {
  url?: string
  isPrimary?: boolean
  order?: number
}

export interface IImageFilters {
  itemId?: string
  url?: string
  isPrimary?: boolean
  order?: number
}
