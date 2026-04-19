import { BrandType, Prisma, PrismaClient, UnitType } from '../../../generated/prisma/client.js'
import { BadRequestError, ConflictError, NotFoundError } from '../../../shared/utils/apiError.js'
import { logger } from '../../../shared/utils/logger.js'
import { PaginationHelper } from '../../../shared/utils/pagination.js'
import { CreateDealerUnitDTO, UpdateDealerUnitDTO } from './units.dto.js'
import { IDealerUnit, IDealerUnitFilters } from './units.interface.js'

type PrismaClientType = PrismaClient | Prisma.TransactionClient

const UNIT_INCLUDE = {
  brand: { select: { id: true, code: true, name: true, type: true } },
  model: { select: { id: true, code: true, name: true, year: true } },
  item: { select: { id: true, code: true, sku: true, name: true } },
  warehouse: { select: { id: true, code: true, name: true } },
} as const

class DealerUnitsService {
  private async assertBrandValid(brandId: string, empresaId: string, db: PrismaClientType): Promise<void> {
    const brand = await (db as PrismaClient).brand.findFirst({
      where: { id: brandId, empresaId, isActive: true },
    })
    if (!brand) throw new NotFoundError('Marca no encontrada')
    if (brand.type !== BrandType.VEHICLE && brand.type !== BrandType.BOTH) {
      throw new BadRequestError('La marca debe ser de tipo VEHICLE o BOTH')
    }
  }

  private async assertModelValid(modelId: string, empresaId: string, db: PrismaClientType): Promise<void> {
    const model = await (db as PrismaClient).model.findFirst({
      where: { id: modelId, empresaId, type: 'VEHICLE', isActive: true },
    })
    if (!model) throw new NotFoundError('Modelo de vehículo no encontrado')
  }

  private async assertItemValid(itemId: string, empresaId: string, db: PrismaClientType): Promise<void> {
    const item = await (db as PrismaClient).item.findFirst({
      where: { id: itemId, empresaId, isActive: true },
      select: { id: true },
    })
    if (!item) throw new NotFoundError('Ítem fiscal no encontrado')
  }

  private async assertWarehouseValid(warehouseId: string, empresaId: string, db: PrismaClientType): Promise<void> {
    const warehouse = await (db as PrismaClient).warehouse.findFirst({
      where: { id: warehouseId, empresaId, isActive: true },
      select: { id: true },
    })
    if (!warehouse) throw new NotFoundError('Almacén fiscal no encontrado')
  }

  private buildAutoItemCode(data: CreateDealerUnitDTO): string {
    const token =
      (data.vin && data.vin.trim()) ||
      (data.code && data.code.trim()) ||
      `DU-${Date.now().toString(36).toUpperCase()}`
    return `VEH-${token.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 30)}`
  }

  private async ensureVehicleCategoryAndUnit(
    empresaId: string,
    db: PrismaClientType
  ): Promise<{ categoryId: string; unitId: string }> {
    const [category, unit] = await Promise.all([
      (db as PrismaClient).category.findFirst({
        where: { empresaId, code: 'VEHICLE' },
        select: { id: true },
      }),
      (db as PrismaClient).unit.findFirst({
        where: { empresaId, code: 'UND' },
        select: { id: true },
      }),
    ])

    const ensuredCategory =
      category ??
      (await (db as PrismaClient).category.create({
        data: {
          empresaId,
          code: 'VEHICLE',
          name: 'Vehículos',
          description: 'Categoría autogenerada para unidades de concesionario',
          isActive: true,
        },
        select: { id: true },
      }))

    const ensuredUnit =
      unit ??
      (await (db as PrismaClient).unit.create({
        data: {
          empresaId,
          code: 'UND',
          name: 'Unidad',
          abbreviation: 'UND',
          type: UnitType.COUNTABLE,
          isActive: true,
        },
        select: { id: true },
      }))

    return { categoryId: ensuredCategory.id, unitId: ensuredUnit.id }
  }

  private async createAutoItemForUnit(
    data: CreateDealerUnitDTO,
    empresaId: string,
    db: PrismaClientType
  ): Promise<string> {
    const { categoryId, unitId } = await this.ensureVehicleCategoryAndUnit(empresaId, db)
    const baseCode = this.buildAutoItemCode(data)

    let suffix = 0
    while (suffix < 50) {
      const finalCode = suffix === 0 ? baseCode : `${baseCode}-${suffix}`
      const existing = await (db as PrismaClient).item.findFirst({
        where: { empresaId, OR: [{ code: finalCode }, { sku: finalCode }] },
        select: { id: true },
      })
      if (!existing) {
        const created = await (db as PrismaClient).item.create({
          data: {
            empresaId,
            sku: finalCode,
            code: finalCode,
            name: data.version || data.code || data.vin || `Unidad ${new Date().getFullYear()}`,
            description: `Unidad concesionario${data.vin ? ` VIN ${data.vin}` : ''}`,
            brandId: data.brandId,
            modelId: data.modelId ?? null,
            categoryId,
            unitId,
            costPrice: (data.listPrice ?? data.promoPrice ?? 0) as never,
            salePrice: (data.promoPrice ?? data.listPrice ?? 0) as never,
            minStock: 0,
            maxStock: 1,
            reorderPoint: 0,
            isSerialized: true,
            isActive: true,
            tags: ['dealer', 'vehicle'],
          },
          select: { id: true },
        })
        return created.id
      }
      suffix += 1
    }

    throw new ConflictError('No se pudo generar un código único para el ítem fiscal de la unidad')
  }

  async create(
    data: CreateDealerUnitDTO,
    empresaId: string,
    userId: string,
    db: PrismaClientType
  ): Promise<IDealerUnit> {
    await this.assertBrandValid(data.brandId, empresaId, db)
    await this.assertWarehouseValid(data.warehouseId, empresaId, db)
    if (data.modelId) await this.assertModelValid(data.modelId, empresaId, db)
    if (data.itemId) await this.assertItemValid(data.itemId, empresaId, db)

    if (data.vin) {
      const duplicateVin = await (db as PrismaClient).dealerUnit.findFirst({
        where: { empresaId, vin: data.vin },
      })
      if (duplicateVin) throw new ConflictError('Ya existe una unidad con ese VIN')
    }

    const created = await (db as PrismaClient).$transaction(async (tx) => {
      const itemId = data.itemId ?? (await this.createAutoItemForUnit(data, empresaId, tx))
      return tx.dealerUnit.create({
        data: {
          empresaId,
          brandId: data.brandId,
          itemId,
          warehouseId: data.warehouseId,
          modelId: data.modelId ?? null,
          code: data.code ?? null,
          version: data.version ?? null,
          year: data.year ?? null,
          vin: data.vin ?? null,
          engineSerial: data.engineSerial ?? null,
          plate: data.plate ?? null,
          condition: (data.condition as any) ?? undefined,
          status: (data.status as any) ?? undefined,
          mileage: data.mileage ?? null,
          colorExterior: data.colorExterior ?? null,
          colorInterior: data.colorInterior ?? null,
          fuelType: data.fuelType ?? null,
          transmission: data.transmission ?? null,
          listPrice: data.listPrice ?? null,
          promoPrice: data.promoPrice ?? null,
          location: data.location ?? null,
          description: data.description ?? null,
          isPublished: data.isPublished ?? false,
          isActive: data.isActive ?? true,
          ...(data.specifications != null ? { specifications: data.specifications as Prisma.InputJsonValue } : {}),
        },
        include: UNIT_INCLUDE,
      })
    })

    logger.info('Dealer unit creada', { id: created.id, empresaId, userId })
    return created as unknown as IDealerUnit
  }

  async findById(id: string, empresaId: string, db: PrismaClientType): Promise<IDealerUnit> {
    const unit = await (db as PrismaClient).dealerUnit.findFirst({
      where: { id, empresaId },
      include: UNIT_INCLUDE,
    })
    if (!unit) throw new NotFoundError('Unidad no encontrada')
    return unit as unknown as IDealerUnit
  }

  async findAll(
    filters: IDealerUnitFilters,
    page: number,
    limit: number,
    empresaId: string,
    db: PrismaClientType,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ data: IDealerUnit[]; total: number }> {
    const { skip, take } = PaginationHelper.validateAndParse({ page, limit })

    const where: Prisma.DealerUnitWhereInput = { empresaId }
    if (filters.brandId) where.brandId = filters.brandId
    if (filters.modelId) where.modelId = filters.modelId
    if (filters.year !== undefined) where.year = filters.year
    if (filters.isActive !== undefined) where.isActive = filters.isActive
    if (filters.status) where.status = filters.status as any
    if (filters.condition) where.condition = filters.condition as any
    if (filters.search) {
      const search = filters.search.trim()
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { version: { contains: search, mode: 'insensitive' } },
        { vin: { contains: search, mode: 'insensitive' } },
        { plate: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { brand: { name: { contains: search, mode: 'insensitive' } } },
        { model: { name: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const validSortFields = new Set(['createdAt', 'updatedAt', 'year', 'status', 'condition', 'listPrice'])
    const safeSortBy = validSortFields.has(sortBy) ? sortBy : 'createdAt'

    const [data, total] = await Promise.all([
      (db as PrismaClient).dealerUnit.findMany({
        where,
        include: UNIT_INCLUDE,
        orderBy: { [safeSortBy]: sortOrder },
        skip,
        take,
      }),
      (db as PrismaClient).dealerUnit.count({ where }),
    ])

    return { data: data as unknown as IDealerUnit[], total }
  }

  async update(
    id: string,
    data: UpdateDealerUnitDTO,
    empresaId: string,
    userId: string,
    db: PrismaClientType
  ): Promise<IDealerUnit> {
    await this.findById(id, empresaId, db)

    if (data.brandId) await this.assertBrandValid(data.brandId, empresaId, db)
    if (data.itemId) await this.assertItemValid(data.itemId, empresaId, db)
    if (data.warehouseId) await this.assertWarehouseValid(data.warehouseId, empresaId, db)
    if (data.modelId) await this.assertModelValid(data.modelId, empresaId, db)

    if (data.vin) {
      const duplicateVin = await (db as PrismaClient).dealerUnit.findFirst({
        where: { empresaId, vin: data.vin, id: { not: id } },
      })
      if (duplicateVin) throw new ConflictError('Ya existe una unidad con ese VIN')
    }

    const updateData: Prisma.DealerUnitUpdateInput = {}
    if (data.brandId !== undefined) updateData.brand = { connect: { id: data.brandId } }
    if (data.itemId !== undefined) updateData.item = { connect: { id: data.itemId } }
    if (data.warehouseId !== undefined) updateData.warehouse = { connect: { id: data.warehouseId } }
    if (data.modelId !== undefined) {
      updateData.model = data.modelId ? { connect: { id: data.modelId } } : { disconnect: true }
    }
    if (data.code !== undefined) updateData.code = data.code || null
    if (data.version !== undefined) updateData.version = data.version || null
    if (data.year !== undefined) updateData.year = data.year ?? null
    if (data.vin !== undefined) updateData.vin = data.vin || null
    if (data.engineSerial !== undefined) updateData.engineSerial = data.engineSerial || null
    if (data.plate !== undefined) updateData.plate = data.plate || null
    if (data.condition !== undefined) updateData.condition = data.condition as any
    if (data.status !== undefined) updateData.status = data.status as any
    if (data.mileage !== undefined) updateData.mileage = data.mileage ?? null
    if (data.colorExterior !== undefined) updateData.colorExterior = data.colorExterior || null
    if (data.colorInterior !== undefined) updateData.colorInterior = data.colorInterior || null
    if (data.fuelType !== undefined) updateData.fuelType = data.fuelType || null
    if (data.transmission !== undefined) updateData.transmission = data.transmission || null
    if (data.listPrice !== undefined) updateData.listPrice = data.listPrice ?? null
    if (data.promoPrice !== undefined) updateData.promoPrice = data.promoPrice ?? null
    if (data.location !== undefined) updateData.location = data.location || null
    if (data.description !== undefined) updateData.description = data.description || null
    if (data.isPublished !== undefined) updateData.isPublished = data.isPublished
    if (data.isActive !== undefined) updateData.isActive = data.isActive
    if (data.specifications !== undefined)
      updateData.specifications = (data.specifications ?? Prisma.JsonNull) as Prisma.InputJsonValue

    const updated = await (db as PrismaClient).$transaction(async (tx) => {
      const record = await tx.dealerUnit.update({
        where: { id },
        data: updateData,
        include: UNIT_INCLUDE,
      })

      const priceUpdate: Record<string, unknown> = {}
      if (data.promoPrice !== undefined || data.listPrice !== undefined) {
        const newSale = data.promoPrice ?? data.listPrice
        const newCost = data.listPrice ?? data.promoPrice
        if (newSale != null) priceUpdate.salePrice = newSale
        if (newCost != null) priceUpdate.costPrice = newCost
      }

      await tx.item.update({
        where: { id: record.itemId },
        data: {
          ...(data.brandId !== undefined ? { brandId: data.brandId } : {}),
          ...(data.modelId !== undefined ? { modelId: data.modelId || null } : {}),
          ...(data.version !== undefined || data.code !== undefined || data.vin !== undefined
            ? { name: data.version || data.code || data.vin || record.item.name }
            : {}),
          ...priceUpdate,
        },
      })

      return record
    })

    logger.info('Dealer unit actualizada', { id, empresaId, userId })
    return updated as unknown as IDealerUnit
  }

  async delete(id: string, empresaId: string, userId: string, db: PrismaClientType): Promise<{ success: boolean; id: string }> {
    await this.findById(id, empresaId, db)
    await (db as PrismaClient).dealerUnit.update({
      where: { id },
      data: { isActive: false },
    })

    logger.info('Dealer unit desactivada', { id, empresaId, userId })
    return { success: true, id }
  }
}

export default new DealerUnitsService()
