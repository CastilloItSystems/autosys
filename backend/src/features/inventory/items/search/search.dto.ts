// backend/src/features/inventory/items/search/search.dto.ts

import {
  ISearchQuery,
  ISearchResult,
  IPaginatedSearchResult,
  ISearchAggregation,
  ISearchSuggestion,
  ICreateSearchIndexInput,
  IUpdateSearchIndexInput,
  ISearchIndex,
} from './search.interface'

export class SearchQueryDTO {
  query: string
  filters?: any
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number

  constructor(data: ISearchQuery) {
    this.query = data.query
    this.page = data.page ?? 1
    this.limit = data.limit ?? 10
    this.sortBy = data.sortBy ?? 'relevance'
    this.sortOrder = data.sortOrder ?? 'desc'

    if (data.filters !== undefined) this.filters = data.filters
  }
}

export class SearchResultDTO {
  id: string
  sku: string
  name: string
  description?: string
  categoryName: string
  salePrice: number
  isActive: boolean
  score: number

  constructor(data: ISearchResult) {
    this.id = data.id
    this.sku = data.sku
    this.name = data.name
    this.categoryName = data.categoryName
    this.salePrice = data.salePrice
    this.isActive = data.isActive
    this.score = data.score

    if (data.description !== undefined) this.description = data.description
  }
}

export class PaginatedSearchResultDTO {
  data: SearchResultDTO[]
  page: number
  limit: number
  total: number
  totalPages: number

  constructor(data: IPaginatedSearchResult) {
    this.data = data.data.map((item) => new SearchResultDTO(item))
    this.page = data.page
    this.limit = data.limit
    this.total = data.total
    this.totalPages = Math.ceil(data.total / data.limit)
  }
}

export class SearchAggregationDTO {
  categories: any[]
  brands: any[]
  priceRanges: any[]
  tags: any[]

  constructor(data: ISearchAggregation) {
    this.categories = data.categories
    this.brands = data.brands
    this.priceRanges = data.priceRanges
    this.tags = data.tags
  }
}

export class SearchSuggestionDTO {
  text: string
  count: number

  constructor(data: ISearchSuggestion) {
    this.text = data.text
    this.count = data.count
  }
}

export class CreateSearchIndexDTO {
  itemId: string
  content: string
  keywords?: string[]

  constructor(data: ICreateSearchIndexInput) {
    this.itemId = data.itemId
    this.content = data.content

    if (data.keywords !== undefined) this.keywords = data.keywords
  }
}

export class UpdateSearchIndexDTO {
  content?: string
  keywords?: string[]

  constructor(data: IUpdateSearchIndexInput) {
    if (data.content !== undefined) this.content = data.content
    if (data.keywords !== undefined) this.keywords = data.keywords
  }
}

export class SearchIndexResponseDTO {
  itemId: string
  content: string
  keywords: string[]
  lastIndexed: Date

  constructor(data: ISearchIndex) {
    this.itemId = data.itemId
    this.content = data.content
    this.keywords = data.keywords
    this.lastIndexed = data.lastIndexed
  }
}
