// backend/src/features/inventory/items/pricing/pricing.controller.ts

import { Request, Response } from 'express'
import { PricingService } from './pricing.service'
import { ApiResponse } from '../../../../shared/utils/ApiResponse'
import { asyncHandler } from '../../../../shared/middleware/asyncHandler.middleware'
import { PricingResponseDTO, PricingTierResponseDTO } from './pricing.dto'

const pricingService = new PricingService()

export class PricingController {
  create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const pricing = await pricingService.create(req.body)
    const response = new PricingResponseDTO(pricing)
    ApiResponse.success(
      res,
      response,
      'Información de precios creada correctamente',
      201
    )
  })

  getAll = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { page = 1, limit = 10, ...filters } = req.query
    const result = await pricingService.findAll(
      filters,
      Number(page),
      Number(limit)
    )
    const data = result.data.map((p) => new PricingResponseDTO(p))
    ApiResponse.paginated(
      res,
      data,
      Number(page),
      Number(limit),
      result.total,
      'Información de precios obtenida correctamente'
    )
  })

  getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as { id: string }
    const pricing = await pricingService.findById(id)
    const response = new PricingResponseDTO(pricing)
    ApiResponse.success(
      res,
      response,
      'Información de precios obtenida correctamente'
    )
  })

  getByItem = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { itemId } = req.params as { itemId: string }
      const pricing = await pricingService.findByItem(itemId)
      const response = new PricingResponseDTO(pricing)
      ApiResponse.success(
        res,
        response,
        'Información de precios del artículo obtenida correctamente'
      )
    }
  )

  update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as { id: string }
    const pricing = await pricingService.update(id, req.body)
    const response = new PricingResponseDTO(pricing)
    ApiResponse.success(
      res,
      response,
      'Información de precios actualizada correctamente'
    )
  })

  delete = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as { id: string }
    await pricingService.delete(id)
    ApiResponse.success(
      res,
      null,
      'Información de precios eliminada correctamente'
    )
  })

  // Pricing Tier endpoints
  createTier = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const tier = await pricingService.createTier(req.body)
      const response = new PricingTierResponseDTO(tier)
      ApiResponse.success(
        res,
        response,
        'Tier de precio creado correctamente',
        201
      )
    }
  )

  getTiers = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { page = 1, limit = 10, ...filters } = req.query
      const result = await pricingService.findTiers(
        filters,
        Number(page),
        Number(limit)
      )
      const tiersDTO = result.data.map(
        (tier) => new PricingTierResponseDTO(tier)
      )
      ApiResponse.paginated(
        res,
        tiersDTO,
        Number(page),
        Number(limit),
        result.total,
        'Tiers de precio obtenidos correctamente'
      )
    }
  )

  getTierById = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { tierId } = req.params as { tierId: string }
      const tier = await pricingService.findTierById(tierId)
      const response = new PricingTierResponseDTO(tier)
      ApiResponse.success(
        res,
        response,
        'Tier de precio obtenido correctamente'
      )
    }
  )

  updateTier = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { tierId } = req.params as { tierId: string }
      const tier = await pricingService.updateTier(tierId, req.body)
      const response = new PricingTierResponseDTO(tier)
      ApiResponse.success(
        res,
        response,
        'Tier de precio actualizado correctamente'
      )
    }
  )

  deleteTier = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { tierId } = req.params as { tierId: string }
      await pricingService.deleteTier(tierId)
      ApiResponse.success(res, null, 'Tier de precio eliminado correctamente')
    }
  )

  // Validación de márgenes
  calculateTierPrice = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { costPrice, salePrice } = req.body
      const calculation = pricingService.calculateMargin(costPrice, salePrice)
      ApiResponse.success(res, calculation, 'Cálculo de margen completado')
    }
  )
}
