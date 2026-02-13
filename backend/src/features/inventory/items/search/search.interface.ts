// backend/src/features/inventory/items/search/search.interface.ts

export interface ISearchQuery {
  query: string
  filters?: ISearchFilters
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface ISearchFilters {
  categoryId?: string
  brandId?: string
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  isActive?: boolean
  tags?: string[]
}

export interface ISearchResult {
  id: string
  sku: string
  name: string
  description?: string
  categoryName: string
  salePrice: number
  isActive: boolean
  score: number // Relevance score for full-text search
}

export interface IPaginatedSearchResult {
  data: ISearchResult[]
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface ISearchFacet {
  name: string
  count: number
  value: string
}

export interface ISearchAggregation {
  categories: ISearchFacet[]
  brands: ISearchFacet[]
  priceRanges: ISearchFacet[]
  tags: ISearchFacet[]
}

export interface ISearchSuggestion {
  text: string
  count: number
}

export interface ISearchIndex {
  itemId: string
  content: string
  keywords: string[]
  lastIndexed: Date
}

export interface ICreateSearchIndexInput {
  itemId: string
  content: string
  keywords?: string[]
}

export interface IUpdateSearchIndexInput {
  content?: string
  keywords?: string[]
}

export interface ISearchIndexFilters {
  itemId?: string
  startDate?: Date
  endDate?: Date
}
