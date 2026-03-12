// backend/src/features/inventory/items/pricing/pricing.service.ts

import prisma from '../../../../services/prisma.service.js'
import {
  ICreatePricingInput,
  IUpdatePricingInput,
  IPricingFilters,
  ICreatePricingTierInput,
  IUpdatePricingTierInput,
  IPricingTierFilters,
  IPricingCalculation,
  IPricingWithItem,
  IPricingTier,
} from './pricing.interface.js'
import {
  NotFoundError,
  BadRequestError,
  ConflictError,
} from '../../../../shared/utils/apiError.js'
import { PaginationHelper } from '../../../../shared/utils/pagination.js'
import { INVENTORY_MESSAGES } from '../../shared/constants/messages.js'
import { logger } from '../../../../shared/utils/logger.js'

export class PricingService {
  async create(data: ICreatePricingInput): Promise<IPricingWithItem> {
    // Validar que el artículo existe
    const item = await prisma.item.findUnique({
      where: { id: data.itemId },
    })

    if (!item) {
      throw new NotFoundError(INVENTORY_MESSAGES.item.notFound)
    }

    // Validar márgenes
    if (data.minMargin < 0 || data.maxMargin < 0) {
      throw new BadRequestError(INVENTORY_MESSAGES.pricing.negativeMargins)
    }

    if (data.minMargin > data.maxMargin) {
      throw new BadRequestError(INVENTORY_MESSAGES.pricing.minAboveMax)
    }

    // Validar precios
    if (data.costPrice < 0 || data.salePrice < 0) {
      throw new BadRequestError(INVENTORY_MESSAGES.pricing.negativePrices)
    }

    if (data.salePrice < data.costPrice) {
      throw new BadRequestError(INVENTORY_MESSAGES.pricing.saleBelowCost)
    }

    // Verificar si ya existe pricing para este artículo
    const existingPricing = await prisma.pricing.findFirst({
      where: { itemId: data.itemId },
    })

    if (existingPricing) {
      throw new ConflictError(INVENTORY_MESSAGES.pricing.alreadyExists)
    }

    const createData: any = {
      itemId: data.itemId,
      costPrice: data.costPrice,
      salePrice: data.salePrice,
      minMargin: data.minMargin,
      maxMargin: data.maxMargin,
      discountPercentage: data.discountPercentage ?? 0,
      isActive: true,
    }

    // Solo incluir campos opcionales si están definidos
    if (data.wholesalePrice !== undefined)
      createData.wholesalePrice = data.wholesalePrice
    if (data.notes !== undefined) createData.notes = data.notes

    const pricing = await prisma.pricing.create({
      data: createData,
      include: {
        item: {
          select: {
            id: true,
            sku: true,
            name: true,
          },
        },
      },
    })

    logger.info('Pricing created', {
      pricingId: pricing.id,
      itemId: data.itemId,
    })

    return pricing as IPricingWithItem
  }

  async findAll(filters: IPricingFilters, page = 1, limit = 10) {
    const {
      skip,
      take,
      page: validPage,
      limit: validLimit,
    } = PaginationHelper.validateAndParse({ page, limit })
    const where: any = {}

    if (filters.itemId) where.itemId = filters.itemId
    if (filters.isActive !== undefined) where.isActive = filters.isActive

    const [pricings, total] = await Promise.all([
      prisma.pricing.findMany({
        where,
        include: {
          item: {
            select: {
              id: true,
              sku: true,
              name: true,
            },
          },
        },
        skip,
        take,
      }),
      prisma.pricing.count({ where }),
    ])

    const meta = PaginationHelper.getMeta(validPage, validLimit, total)

    return {
      data: pricings as IPricingWithItem[],
      ...meta,
    }
  }

  async findById(id: string): Promise<IPricingWithItem> {
    const pricing = await prisma.pricing.findUnique({
      where: { id },
      include: {
        item: {
          select: {
            id: true,
            sku: true,
            name: true,
          },
        },
      },
    })

    if (!pricing) {
      throw new NotFoundError(INVENTORY_MESSAGES.pricing.notFound)
    }

    return pricing as IPricingWithItem
  }

  async findByItem(itemId: string): Promise<IPricingWithItem> {
    const item = await prisma.item.findUnique({
      where: { id: itemId },
    })

    if (!item) {
      throw new NotFoundError(INVENTORY_MESSAGES.item.notFound)
    }

    const pricing = await prisma.pricing.findFirst({
      where: { itemId },
      include: {
        item: {
          select: {
            id: true,
            sku: true,
            name: true,
          },
        },
      },
    })

    if (!pricing) {
      throw new NotFoundError(INVENTORY_MESSAGES.pricing.notFoundForItem)
    }

    return pricing as IPricingWithItem
  }

  async update(
    id: string,
    data: IUpdatePricingInput
  ): Promise<IPricingWithItem> {
    const pricing = await prisma.pricing.findUnique({
      where: { id },
    })

    if (!pricing) {
      throw new NotFoundError(INVENTORY_MESSAGES.pricing.notFound)
    }

    // Validar datos actualización
    const costPrice = data.costPrice ?? pricing.costPrice
    const salePrice = data.salePrice ?? pricing.salePrice

    // Convertir a número para comparación
    const costPriceNum =
      typeof costPrice === 'number' ? costPrice : costPrice.toNumber()
    const salePriceNum =
      typeof salePrice === 'number' ? salePrice : salePrice.toNumber()

    if (costPriceNum < 0 || salePriceNum < 0) {
      throw new BadRequestError(INVENTORY_MESSAGES.pricing.negativePrices)
    }

    if (salePriceNum < costPriceNum) {
      throw new BadRequestError(INVENTORY_MESSAGES.pricing.saleBelowCost)
    }

    if (data.minMargin !== undefined && data.minMargin < 0) {
      throw new BadRequestError(INVENTORY_MESSAGES.pricing.negativeMinMargin)
    }

    if (data.maxMargin !== undefined && data.maxMargin < 0) {
      throw new BadRequestError(INVENTORY_MESSAGES.pricing.negativeMaxMargin)
    }

    const minMargin = data.minMargin ?? pricing.minMargin
    const maxMargin = data.maxMargin ?? pricing.maxMargin

    if (minMargin > maxMargin) {
      throw new BadRequestError(INVENTORY_MESSAGES.pricing.minAboveMax)
    }

    const updateData: any = {
      minMargin,
      maxMargin,
      discountPercentage: data.discountPercentage,
      isActive: data.isActive,
    }

    // Solo incluir campos opcionales si están definidos
    if (data.costPrice !== undefined) updateData.costPrice = data.costPrice
    if (data.salePrice !== undefined) updateData.salePrice = data.salePrice
    if (data.wholesalePrice !== undefined)
      updateData.wholesalePrice = data.wholesalePrice
    if (data.notes !== undefined) updateData.notes = data.notes

    const updated = await prisma.pricing.update({
      where: { id },
      data: updateData,
      include: {
        item: {
          select: {
            id: true,
            sku: true,
            name: true,
          },
        },
      },
    })

    logger.info('Pricing updated', { pricingId: id })

    return updated as IPricingWithItem
  }

  async delete(id: string): Promise<void> {
    const pricing = await prisma.pricing.findUnique({
      where: { id },
    })

    if (!pricing) {
      throw new NotFoundError(INVENTORY_MESSAGES.pricing.notFound)
    }

    // Eliminar tiers primero
    await prisma.pricingTier.deleteMany({
      where: { pricingId: id },
    })

    await prisma.pricing.delete({
      where: { id },
    })

    logger.info('Pricing deleted', { pricingId: id })
  }

  // Métodos para Pricing Tiers
  async createTier(data: ICreatePricingTierInput): Promise<IPricingTier> {
    const pricing = await prisma.pricing.findUnique({
      where: { id: data.pricingId },
    })

    if (!pricing) {
      throw new NotFoundError(INVENTORY_MESSAGES.pricing.notFound)
    }

    if (data.minQuantity < 0) {
      throw new BadRequestError(INVENTORY_MESSAGES.pricing.tier.negativeMinQty)
    }

    if (
      data.maxQuantity !== undefined &&
      data.maxQuantity !== null &&
      data.maxQuantity < data.minQuantity
    ) {
      throw new BadRequestError(INVENTORY_MESSAGES.pricing.tier.maxBelowMin)
    }

    if (data.tierPrice < 0) {
      throw new BadRequestError(INVENTORY_MESSAGES.pricing.tier.negativePrice)
    }

    // Verificar no hay solapamiento
    const overlapping = await prisma.pricingTier.findFirst({
      where: {
        pricingId: data.pricingId,
        OR: [
          {
            minQuantity: { lte: data.minQuantity },
            maxQuantity: { gte: data.minQuantity },
          },
          {
            minQuantity: { lte: data.maxQuantity ?? Number.MAX_VALUE },
            maxQuantity: { gte: data.maxQuantity ?? Number.MAX_VALUE },
          },
        ],
      },
    })

    if (overlapping) {
      throw new ConflictError(INVENTORY_MESSAGES.pricing.tier.overlapping)
    }

    const tier = await prisma.pricingTier.create({
      data: {
        pricingId: data.pricingId,
        minQuantity: data.minQuantity,
        maxQuantity: data.maxQuantity ?? null,
        tierPrice: data.tierPrice,
        discountPercentage: data.discountPercentage ?? null,
      },
    })

    logger.info('Pricing tier created', {
      tierId: tier.id,
      pricingId: data.pricingId,
    })

    return tier as IPricingTier
  }

  async findTiers(filters: IPricingTierFilters, page = 1, limit = 10) {
    const {
      skip,
      take,
      page: validPage,
      limit: validLimit,
    } = PaginationHelper.validateAndParse({ page, limit })
    const where: any = {}

    if (filters.pricingId) where.pricingId = filters.pricingId

    const [tiers, total] = await Promise.all([
      prisma.pricingTier.findMany({
        where,
        orderBy: { minQuantity: 'asc' },
        skip,
        take,
      }),
      prisma.pricingTier.count({ where }),
    ])

    const meta = PaginationHelper.getMeta(validPage, validLimit, total)

    return {
      data: tiers as IPricingTier[],
      ...meta,
    }
  }

  async findTierById(id: string): Promise<IPricingTier> {
    const tier = await prisma.pricingTier.findUnique({
      where: { id },
    })

    if (!tier) {
      throw new NotFoundError(INVENTORY_MESSAGES.pricing.tier.notFound)
    }

    return tier as IPricingTier
  }

  async updateTier(
    id: string,
    data: IUpdatePricingTierInput
  ): Promise<IPricingTier> {
    const tier = await prisma.pricingTier.findUnique({
      where: { id },
    })

    if (!tier) {
      throw new NotFoundError(INVENTORY_MESSAGES.pricing.tier.notFound)
    }

    const minQuantity = data.minQuantity ?? tier.minQuantity
    const maxQuantity = data.maxQuantity ?? tier.maxQuantity

    if (maxQuantity !== null && maxQuantity < minQuantity) {
      throw new BadRequestError(INVENTORY_MESSAGES.pricing.tier.maxBelowMin)
    }

    if (data.tierPrice !== undefined && data.tierPrice < 0) {
      throw new BadRequestError(INVENTORY_MESSAGES.pricing.tier.negativePrice)
    }

    const updateData: any = {
      minQuantity,
      maxQuantity,
    }

    if (data.tierPrice !== undefined) updateData.tierPrice = data.tierPrice
    if (data.discountPercentage !== undefined)
      updateData.discountPercentage = data.discountPercentage

    const updated = await prisma.pricingTier.update({
      where: { id },
      data: updateData,
    })

    logger.info('Pricing tier updated', { tierId: id })

    return updated as IPricingTier
  }

  async deleteTier(id: string): Promise<void> {
    const tier = await prisma.pricingTier.findUnique({
      where: { id },
    })

    if (!tier) {
      throw new NotFoundError(INVENTORY_MESSAGES.pricing.tier.notFound)
    }

    await prisma.pricingTier.delete({
      where: { id },
    })

    logger.info('Pricing tier deleted', { tierId: id })
  }

  // Cálculos de margen
  calculateMargin(costPrice: number, salePrice: number): IPricingCalculation {
    const profit = salePrice - costPrice
    const profitPercentage = (profit / costPrice) * 100
    const margin = costPrice > 0 ? profitPercentage : 0

    return {
      costPrice,
      salePrice,
      profit,
      profitPercentage,
      margin,
      withinMarginLimits: false,
    }
  }

  validateMargins(
    minMargin: number,
    maxMargin: number,
    calculation: IPricingCalculation
  ): boolean {
    return calculation.margin >= minMargin && calculation.margin <= maxMargin
  }
}
