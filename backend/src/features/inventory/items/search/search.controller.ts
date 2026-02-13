// backend/src/features/inventory/items/search/search.controller.ts

import { Request, Response } from 'express'
import { SearchService } from './search.service'
import { ApiResponse } from '../../../../shared/utils/ApiResponse'
import { asyncHandler } from '../../../../shared/middleware/asyncHandler.middleware'

const searchService = new SearchService()

export class SearchController {
  search = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { query, filters, sortBy, sortOrder, page = 1, limit = 10 } = req.body
    const result = await searchService.search({
      query,
      filters,
      sortBy,
      sortOrder,
      page: Number(page),
      limit: Number(limit),
    })
    ApiResponse.paginated(
      res,
      result.data,
      Number(page),
      Number(limit),
      result.total,
      'Búsqueda completada'
    )
  })

  advancedSearch = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const {
        query,
        filters,
        sortBy,
        sortOrder,
        page = 1,
        limit = 10,
      } = req.body
      const result = await searchService.advancedSearch({
        query,
        filters,
        sortBy,
        sortOrder,
        page: Number(page),
        limit: Number(limit),
      })
      ApiResponse.paginated(
        res,
        result.data,
        Number(page),
        Number(limit),
        result.total,
        'Búsqueda avanzada completada'
      )
    }
  )

  getAggregations = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { query } = req.query
      const aggregations = await searchService.getAggregations(query as string)
      ApiResponse.success(res, aggregations, 'Agregaciones obtenidas')
    }
  )

  getSuggestions = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { query, limit = 10 } = req.query
      const suggestions = await searchService.getSuggestions(
        query as string,
        Number(limit)
      )
      ApiResponse.success(res, suggestions, 'Sugerencias obtenidas')
    }
  )

  // Index Management
  createIndex = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const index = await searchService.createIndex(req.body)
      ApiResponse.success(
        res,
        index,
        'Índice de búsqueda creado correctamente',
        201
      )
    }
  )

  getIndexes = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { page = 1, limit = 10, ...filters } = req.query
      const result = await searchService.findAllIndexes(
        filters,
        Number(page),
        Number(limit)
      )
      ApiResponse.paginated(
        res,
        result.data,
        Number(page),
        Number(limit),
        result.total,
        'Índices obtenidos'
      )
    }
  )

  updateIndex = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { itemId } = req.params as { itemId: string }
      const index = await searchService.updateIndex(itemId, req.body)
      ApiResponse.success(res, index, 'Índice actualizado correctamente')
    }
  )

  deleteIndex = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { itemId } = req.params as { itemId: string }
      await searchService.deleteIndex(itemId)
      ApiResponse.success(res, null, 'Índice eliminado correctamente')
    }
  )

  reindexAll = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const result = await searchService.reindexAll()
      ApiResponse.success(res, result, 'Reindexación completada')
    }
  )
}
