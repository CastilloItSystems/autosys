// backend/src/features/inventory/items/catalogs/categories/categories.dto.ts

export class CreateCategoryDTO {
  code: string
  name: string
  description?: string
  parentId?: string
  defaultMargin?: number
  isActive?: boolean

  constructor(data: any) {
    this.code = data.code
    this.name = data.name
    this.description = data.description
    this.parentId = data.parentId
    this.defaultMargin = data.defaultMargin
    this.isActive = data.isActive ?? true
  }
}

export class UpdateCategoryDTO {
  code?: string
  name?: string
  description?: string
  parentId?: string
  defaultMargin?: number
  isActive?: boolean

  constructor(data: any) {
    if (data.code !== undefined) this.code = data.code
    if (data.name !== undefined) this.name = data.name
    if (data.description !== undefined) this.description = data.description
    if (data.parentId !== undefined) this.parentId = data.parentId
    if (data.defaultMargin !== undefined)
      this.defaultMargin = data.defaultMargin
    if (data.isActive !== undefined) this.isActive = data.isActive
  }
}

export class CategoryResponseDTO {
  id: string
  code: string
  name: string
  description?: string | null
  parentId?: string | null
  defaultMargin?: number | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date

  // Relaciones
  parent?: CategoryResponseDTO | null
  children?: CategoryResponseDTO[]

  // Contadores
  itemsCount?: number
  childrenCount?: number

  // Para árbol
  level?: number
  path?: string[]

  constructor(
    category: any,
    options?: { includeRelations?: boolean; level?: number }
  ) {
    this.id = category.id
    this.code = category.code
    this.name = category.name
    this.description = category.description
    this.parentId = category.parentId
    this.defaultMargin = category.defaultMargin
      ? Number(category.defaultMargin)
      : null
    this.isActive = category.isActive
    this.createdAt = category.createdAt
    this.updatedAt = category.updatedAt

    // Relaciones
    if (options?.includeRelations) {
      if (category.parent) {
        this.parent = new CategoryResponseDTO(category.parent, {
          includeRelations: false,
        })
      }

      if (category.children) {
        this.children = category.children.map(
          (child: any) =>
            new CategoryResponseDTO(child, { includeRelations: false })
        )
      }
    }

    // Contadores
    if (category._count) {
      this.itemsCount = category._count.items || 0
      this.childrenCount = category._count.children || 0
    }

    // Para árbol
    if (options?.level !== undefined) {
      this.level = options.level
    }
  }
}

export class CategoryTreeResponseDTO extends CategoryResponseDTO {
  children: CategoryTreeResponseDTO[]

  constructor(category: any, level: number = 0) {
    super(category, { includeRelations: true, level })

    this.children =
      category.children?.map(
        (child: any) => new CategoryTreeResponseDTO(child, level + 1)
      ) || []
  }
}

export class CategoryListResponseDTO {
  categories: CategoryResponseDTO[]
  total: number
  page: number
  limit: number
  totalPages: number

  constructor(data: any) {
    this.categories = data.categories.map(
      (cat: any) => new CategoryResponseDTO(cat, { includeRelations: true })
    )
    this.total = data.total
    this.page = data.page
    this.limit = data.limit
    this.totalPages = data.totalPages
  }
}
