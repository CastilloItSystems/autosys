// backend/src/features/inventory/items/catalogs/categories/categories.interface.ts

export interface ICategory {
  id: string
  code: string
  name: string
  description?: string | null
  parentId?: string | null
  defaultMargin?: number | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ICategoryWithRelations extends ICategory {
  parent?: ICategory | null
  children?: ICategory[]
  _count?: {
    items: number
    children: number
  }
}

export interface ICategoryTree extends ICategory {
  children: ICategoryTree[]
  level: number
  path: string[]
  _count?: {
    items: number
    children: number
  }
}

export interface ICreateCategoryInput {
  code: string
  name: string
  description?: string
  parentId?: string
  defaultMargin?: number
  isActive?: boolean
}

export interface IUpdateCategoryInput {
  code?: string
  name?: string
  description?: string
  parentId?: string
  defaultMargin?: number
  isActive?: boolean
}

export interface ICategoryFilters {
  search?: string
  isActive?: boolean
  parentId?: string | null
  hasParent?: boolean
}
