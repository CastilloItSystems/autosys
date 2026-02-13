// backend/src/features/inventory/items/search/search.service.ts

import prisma from '../../../../services/prisma.service'
import {
  ISearchQuery,
  ISearchResult,
  IPaginatedSearchResult,
  ISearchAggregation,
  ISearchSuggestion,
  ICreateSearchIndexInput,
  IUpdateSearchIndexInput,
  ISearchIndexFilters,
  ISearchIndex,
} from './search.interface'
import {
  NotFoundError,
  BadRequestError,
} from '../../../../shared/utils/ApiError'
import { PaginationHelper } from '../../../../shared/utils/pagination'
import { INVENTORY_MESSAGES } from '../../shared/constants/messages'
import { logger } from '../../../../shared/utils/logger'

export class SearchService {
  async search(searchQuery: ISearchQuery): Promise<IPaginatedSearchResult> {
    if (!searchQuery.query || searchQuery.query.trim().length === 0) {
      throw new BadRequestError(INVENTORY_MESSAGES.search.queryRequired)
    }

    const { skip, take, page, limit } = PaginationHelper.validateAndParse({
      page: searchQuery.page ?? 1,
      limit: searchQuery.limit ?? 10,
    })

    // Construir query de búsqueda
    const where: any = {
      OR: [
        { sku: { contains: searchQuery.query, mode: 'insensitive' } },
        { name: { contains: searchQuery.query, mode: 'insensitive' } },
        { description: { contains: searchQuery.query, mode: 'insensitive' } },
      ],
      isActive: true,
    }

    // Aplicar filtros
    if (searchQuery.filters) {
      if (searchQuery.filters.categoryId)
        where.categoryId = searchQuery.filters.categoryId
      if (searchQuery.filters.minPrice !== undefined)
        where.salePrice = { gte: searchQuery.filters.minPrice }
      if (searchQuery.filters.maxPrice !== undefined) {
        where.salePrice = where.salePrice
          ? { ...where.salePrice, lte: searchQuery.filters.maxPrice }
          : { lte: searchQuery.filters.maxPrice }
      }
      if (searchQuery.filters.inStock) where.stock = { gt: 0 }
      if (searchQuery.filters.isActive !== undefined)
        where.isActive = searchQuery.filters.isActive
    }

    const total = await prisma.item.count({ where })

    const items = await prisma.item.findMany({
      where,
      select: {
        id: true,
        sku: true,
        name: true,
        description: true,
        salePrice: true,
        isActive: true,
        category: {
          select: {
            name: true,
          },
        },
      },
      skip,
      take,
      orderBy: {
        name: searchQuery.sortOrder === 'asc' ? 'asc' : 'desc',
      },
    })

    // Calcular score de relevancia
    const results: ISearchResult[] = items.map((item: any) => {
      let score = 0
      const queryLower = searchQuery.query.toLowerCase()

      // SKU match exacto tiene mayor score
      if (item.sku.toLowerCase() === queryLower) score += 100
      else if (item.sku.toLowerCase().includes(queryLower)) score += 50

      // Nombre match
      if (item.name.toLowerCase() === queryLower) score += 80
      else if (item.name.toLowerCase().includes(queryLower)) score += 40

      // Descripción match
      if (item.description?.toLowerCase().includes(queryLower)) score += 20

      return {
        id: item.id,
        sku: item.sku,
        name: item.name,
        description: item.description,
        categoryName: item.category.name,
        salePrice: item.salePrice,
        isActive: item.isActive,
        score,
      }
    })

    // Ordenar por score si es búsqueda libre
    if (searchQuery.sortBy === 'relevance') {
      results.sort((a, b) => b.score - a.score)
    }

    const meta = PaginationHelper.getMeta(page, limit, total)

    return {
      data: results,
      ...meta,
    }
  }

  async advancedSearch(
    searchQuery: ISearchQuery
  ): Promise<IPaginatedSearchResult> {
    return this.search(searchQuery)
  }

  async getAggregations(query?: string): Promise<ISearchAggregation> {
    const where: any = { isActive: true }

    if (query && query.trim().length > 0) {
      where.OR = [
        { sku: { contains: query, mode: 'insensitive' } },
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ]
    }

    // Obtener categorías
    const categories = await prisma.item.groupBy({
      by: ['categoryId'],
      where,
      _count: true,
    })

    // Obtener brands (si está disponible en el modelo)
    // NOTE: Brand aggregation requires a proper brand field in item model
    // const brandAgg = await prisma.item.groupBy({
    //   by: [],
    //   where,
    //   _count: {
    //     id: true,
    //   },
    // })

    // Obtener rangos de precios
    const priceAgg = await prisma.item.aggregate({
      where,
      _min: {
        salePrice: true,
      },
      _max: {
        salePrice: true,
      },
    })

    return {
      categories: categories.map((cat: any) => ({
        name: cat.categoryId,
        count: cat._count,
        value: cat.categoryId,
      })),
      brands: [],
      priceRanges: [
        {
          name: 'Bajo',
          count: 0,
          value: '0-50',
        },
        {
          name: 'Medio',
          count: 0,
          value: '50-100',
        },
        {
          name: 'Alto',
          count: 0,
          value: '100-500',
        },
        {
          name: 'Premium',
          count: 0,
          value: '500-10000',
        },
      ],
      tags: [],
    }
  }

  async getSuggestions(
    query: string,
    limit = 10
  ): Promise<ISearchSuggestion[]> {
    if (!query || query.trim().length < 2) {
      return []
    }

    const items = await prisma.item.findMany({
      where: {
        OR: [
          { sku: { contains: query, mode: 'insensitive' } },
          { name: { contains: query, mode: 'insensitive' } },
        ],
        isActive: true,
      },
      select: {
        name: true,
      },
      take: limit,
    })

    // Extraer sugerencias únicas
    const suggestions = new Map<string, number>()

    items.forEach((item: any) => {
      const current = suggestions.get(item.name) || 0
      suggestions.set(item.name, current + 1)
    })

    return Array.from(suggestions.entries()).map(([text, count]) => ({
      text,
      count,
    }))
  }

  // Search Index Management
  async createIndex(data: ICreateSearchIndexInput): Promise<ISearchIndex> {
    // Validar que el artículo existe
    const item = await prisma.item.findUnique({
      where: { id: data.itemId },
    })

    if (!item) {
      throw new NotFoundError(INVENTORY_MESSAGES.search.itemNotFound)
    }

    // NOTE: SearchIndex model not yet available in Prisma schema
    // TODO: Implement proper search indexing with searchIndex model
    return {
      id: '00000000-0000-0000-0000-000000000000',
      itemId: data.itemId,
      content: data.content,
      keywords: data.keywords ?? [],
      lastIndexed: new Date(),
    } as ISearchIndex
  }

  async findAllIndexes(filters: ISearchIndexFilters, page = 1, limit = 10) {
    // NOTE: SearchIndex model not yet available in Prisma schema
    // TODO: Implement proper indexing retrieval
    return {
      data: [] as ISearchIndex[],
      page,
      limit,
      total: 0,
    }
  }

  async updateIndex(
    itemId: string,
    data: IUpdateSearchIndexInput
  ): Promise<ISearchIndex> {
    // NOTE: SearchIndex model not yet available in Prisma schema
    // TODO: Implement proper indexing update
    return {
      id: '00000000-0000-0000-0000-000000000000',
      itemId,
      content: data.content ?? '',
      keywords: data.keywords ?? [],
      lastIndexed: new Date(),
    } as ISearchIndex
  }

  async deleteIndex(itemId: string): Promise<void> {
    // NOTE: SearchIndex model not yet available in Prisma schema
    // TODO: Implement proper index deletion
  }

  async reindexAll(): Promise<{ reindexed: number }> {
    // NOTE: SearchIndex model not yet available in Prisma schema
    // TODO: Implement proper full reindexing
    return { reindexed: 0 }
  }
}
