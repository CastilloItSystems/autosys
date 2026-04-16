import { BrandType, Prisma, PrismaClient } from '../../../generated/prisma/client.js'
import { BadRequestError, ConflictError, NotFoundError } from '../../../shared/utils/apiError.js'
import { logger } from '../../../shared/utils/logger.js'
import { PaginationHelper } from '../../../shared/utils/pagination.js'
import { CreateDealerUnitDTO, UpdateDealerUnitDTO } from './units.dto.js'
import { IDealerUnit, IDealerUnitFilters } from './units.interface.js'

type PrismaClientType = PrismaClient | Prisma.TransactionClient

const UNIT_INCLUDE = {
  brand: { select: { id: true, code: true, name: true, type: true } },
  model: { select: { id: true, code: true, name: true, year: true } },
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

  async create(
    data: CreateDealerUnitDTO,
    empresaId: string,
    userId: string,
    db: PrismaClientType
  ): Promise<IDealerUnit> {
    await this.assertBrandValid(data.brandId, empresaId, db)
    if (data.modelId) await this.assertModelValid(data.modelId, empresaId, db)

    if (data.vin) {
      const duplicateVin = await (db as PrismaClient).dealerUnit.findFirst({
        where: { empresaId, vin: data.vin },
      })
      if (duplicateVin) throw new ConflictError('Ya existe una unidad con ese VIN')
    }

    const created = await (db as PrismaClient).dealerUnit.create({
      data: {
        empresaId,
        brandId: data.brandId,
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
    if (data.modelId) await this.assertModelValid(data.modelId, empresaId, db)

    if (data.vin) {
      const duplicateVin = await (db as PrismaClient).dealerUnit.findFirst({
        where: { empresaId, vin: data.vin, id: { not: id } },
      })
      if (duplicateVin) throw new ConflictError('Ya existe una unidad con ese VIN')
    }

    const updateData: Prisma.DealerUnitUpdateInput = {}
    if (data.brandId !== undefined) updateData.brand = { connect: { id: data.brandId } }
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

    const updated = await (db as PrismaClient).dealerUnit.update({
      where: { id },
      data: updateData,
      include: UNIT_INCLUDE,
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

