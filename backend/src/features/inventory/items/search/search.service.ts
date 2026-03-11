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
} from '../../../../shared/utils/apiError'
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
        costPrice: true,
        minStock: true,
        reorderPoint: true,
        isActive: true,
        tags: true,
        category: {
          select: {
            name: true,
          },
        },
        brand: {
          select: {
            name: true,
          },
        },
        images: {
          select: {
            url: true,
            isPrimary: true,
          },
          orderBy: {
            order: 'asc',
          },
          take: 1,
        },
        // Asumiendo que hay un campo quantity o calculo de stock, si no está directo en item,
        // habría que ver cómo lo obtiene el getAll. Por ahora agrego lo que es seguro del modelo.
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

      // Brand match
      if (item.brand?.name?.toLowerCase().includes(queryLower)) score += 30

      return {
        id: item.id,
        sku: item.sku,
        name: item.name,
        description: item.description,
        categoryName: item.category?.name,
        brandName: item.brand?.name,
        salePrice: Number(item.salePrice),
        costPrice: Number(item.costPrice),
        minStock: item.minStock,
        reorderPoint: item.reorderPoint,
        isActive: item.isActive,
        tags: item.tags,
        images: item.images,
        quantity: 0, // Placeholder, populate if logic exists for stock calculation
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

    // Obtener categorías con nombres
    const categoriesAgg = await prisma.item.groupBy({
      by: ['categoryId'],
      where,
      _count: true,
    })

    const categoriesData = await Promise.all(
      categoriesAgg.map(async (cat: any) => {
        const categoryInfo = await prisma.category.findUnique({
          where: { id: cat.categoryId },
          select: { name: true },
        })
        return {
          name: categoryInfo?.name || 'Unknown',
          count: cat._count,
          value: cat.categoryId,
        }
      })
    )

    // Obtener brands con nombres
    const brandsAgg = await prisma.item.groupBy({
      by: ['brandId'],
      where,
      _count: true,
    })

    const brandsData = await Promise.all(
      brandsAgg.map(async (brand: any) => {
        const brandInfo = await prisma.brand.findUnique({
          where: { id: brand.brandId },
          select: { name: true },
        })
        return {
          name: brandInfo?.name || 'Unknown',
          count: brand._count,
          value: brand.brandId,
        }
      })
    )

    // Obtener rangos de precios con conteos reales
    const priceAgg = await prisma.item.aggregate({
      where,
      _min: {
        salePrice: true,
      },
      _max: {
        salePrice: true,
      },
    })

    // Definir rangos de precios y contar items en cada rango
    const priceRanges = [
      { min: 0, max: 50, name: 'Bajo (0-50)', value: '0-50' },
      { min: 50, max: 100, name: 'Medio (50-100)', value: '50-100' },
      { min: 100, max: 500, name: 'Alto (100-500)', value: '100-500' },
      { min: 500, max: 10000, name: 'Premium (500+)', value: '500-10000' },
    ]

    const priceRangesData = await Promise.all(
      priceRanges.map(async (range) => {
        const count = await prisma.item.count({
          where: {
            ...where,
            salePrice: {
              gte: range.min,
              lt: range.max,
            },
          },
        })
        return {
          name: range.name,
          count,
          value: range.value,
        }
      })
    )

    // Obtener tags únicos si existen
    const allItems = await prisma.item.findMany({
      where,
      select: { tags: true },
    })

    const tagsMap = new Map<string, number>()
    allItems.forEach((item: any) => {
      if (item.tags && Array.isArray(item.tags)) {
        item.tags.forEach((tag: string) => {
          tagsMap.set(tag, (tagsMap.get(tag) || 0) + 1)
        })
      }
    })

    const tagsData = Array.from(tagsMap.entries())
      .map(([name, count]) => ({
        name,
        count,
        value: name.toLowerCase(),
      }))
      .sort((a, b) => b.count - a.count)

    return {
      categories: categoriesData,
      brands: brandsData,
      priceRanges: priceRangesData,
      tags: tagsData,
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
