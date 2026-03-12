// backend/src/features/inventory/items/catalogs/units/units.service.ts

import { PrismaClient, Prisma } from '../../../../../generated/prisma/client.js'
import {
  ICreateUnitInput,
  IUpdateUnitInput,
  IUnitFilters,
  IUnitWithRelations,
  IUnitGroupedByType,
  UnitType,
} from './units.interface.js'
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
} from '../../../../../shared/utils/apiError.js'
import { PaginationHelper } from '../../../../../shared/utils/pagination.js'
import { INVENTORY_MESSAGES } from '../../../shared/constants/messages.js'
import { UNIT_TYPE_LABELS } from '../../../shared/constants/inventory.constants.js'
import { logger } from '../../../../../shared/utils/logger.js'

type PrismaClientType = PrismaClient | Prisma.TransactionClient

const MSG = INVENTORY_MESSAGES.unit

const UNIT_INCLUDE = {
  _count: { select: { items: true } },
} as const

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

class UnitService {
  // -------------------------------------------------------------------------
  // CREATE
  // -------------------------------------------------------------------------

  async create(
    empresaId: string,
    data: ICreateUnitInput,
    userId: string,
    db: PrismaClientType
  ): Promise<IUnitWithRelations> {
    const code = data.code.toUpperCase()

    const existingCode = await (db as PrismaClient).unit.findFirst({
      where: { empresaId, code },
    })
    if (existingCode) throw new ConflictError(MSG.codeExists)

    const existingAbbr = await (db as PrismaClient).unit.findFirst({
      where: { empresaId, abbreviation: data.abbreviation },
    })
    if (existingAbbr) throw new ConflictError('La abreviación ya existe')

    const unit = await (db as PrismaClient).unit.create({
      data: {
        empresaId,
        code,
        name: data.name,
        abbreviation: data.abbreviation,
        type: data.type,
        isActive: data.isActive ?? true,
      },
      include: UNIT_INCLUDE,
    })

    logger.info('Unidad creada', { unitId: unit.id, code, empresaId, userId })

    return unit as unknown as IUnitWithRelations
  }

  // -------------------------------------------------------------------------
  // READ
  // -------------------------------------------------------------------------

  async findAll(
    empresaId: string,
    filters: IUnitFilters,
    page: number,
    limit: number,
    db: PrismaClientType
  ): Promise<{
    units: IUnitWithRelations[]
    page: number
    limit: number
    total: number
    totalPages: number
  }> {
    const { skip, take } = PaginationHelper.validateAndParse({ page, limit })

    const where: Prisma.UnitWhereInput = { empresaId }

    if (filters.search) {
      where.OR = [
        { code: { contains: filters.search, mode: 'insensitive' } },
        { name: { contains: filters.search, mode: 'insensitive' } },
        { abbreviation: { contains: filters.search, mode: 'insensitive' } },
      ]
    }
    if (filters.type) where.type = filters.type
    if (filters.isActive !== undefined) where.isActive = filters.isActive

    const [total, units] = await Promise.all([
      (db as PrismaClient).unit.count({ where }),
      (db as PrismaClient).unit.findMany({
        where,
        skip,
        take,
        orderBy: [{ type: 'asc' }, { name: 'asc' }],
        include: UNIT_INCLUDE,
      }),
    ])

    const meta = PaginationHelper.getMeta(page, limit, total)

    return {
      units: units as unknown as IUnitWithRelations[],
      page: meta.page,
      limit: meta.limit,
      total: meta.total,
      totalPages: meta.totalPages,
    }
  }

  async findById(
    empresaId: string,
    id: string,
    db: PrismaClientType
  ): Promise<IUnitWithRelations> {
    const unit = await (db as PrismaClient).unit.findFirst({
      where: { id, empresaId },
      include: UNIT_INCLUDE,
    })
    if (!unit) throw new NotFoundError(MSG.notFound)
    return unit as unknown as IUnitWithRelations
  }

  async findByType(
    empresaId: string,
    type: UnitType,
    db: PrismaClientType
  ): Promise<IUnitWithRelations[]> {
    const units = await (db as PrismaClient).unit.findMany({
      where: { empresaId, type },
      orderBy: { name: 'asc' },
      include: UNIT_INCLUDE,
    })
    return units as unknown as IUnitWithRelations[]
  }

  async findGroupedByType(
    empresaId: string,
    db: PrismaClientType
  ): Promise<IUnitGroupedByType[]> {
    const types: UnitType[] = ['COUNTABLE', 'WEIGHT', 'VOLUME', 'LENGTH']
    const grouped: IUnitGroupedByType[] = []

    for (const type of types) {
      const units = await this.findByType(empresaId, type, db)
      if (units.length > 0) {
        grouped.push({
          type,
          typeLabel: UNIT_TYPE_LABELS[type],
          units,
          count: units.length,
        })
      }
    }

    return grouped
  }

  async findActive(
    empresaId: string,
    db: PrismaClientType
  ): Promise<IUnitWithRelations[]> {
    const units = await (db as PrismaClient).unit.findMany({
      where: { empresaId, isActive: true },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
      include: UNIT_INCLUDE,
    })
    return units as unknown as IUnitWithRelations[]
  }

  async search(
    empresaId: string,
    term: string,
    limit: number,
    db: PrismaClientType
  ): Promise<IUnitWithRelations[]> {
    const units = await (db as PrismaClient).unit.findMany({
      where: {
        empresaId,
        isActive: true,
        OR: [
          { code: { contains: term, mode: 'insensitive' } },
          { name: { contains: term, mode: 'insensitive' } },
          { abbreviation: { contains: term, mode: 'insensitive' } },
        ],
      },
      take: limit,
      orderBy: { name: 'asc' },
      include: UNIT_INCLUDE,
    })
    return units as unknown as IUnitWithRelations[]
  }

  // -------------------------------------------------------------------------
  // UPDATE
  // -------------------------------------------------------------------------

  async update(
    empresaId: string,
    id: string,
    data: IUpdateUnitInput,
    userId: string,
    db: PrismaClientType
  ): Promise<IUnitWithRelations> {
    await this.findById(empresaId, id, db) // throws 404 if not found

    if (data.code) {
      const existing = await (db as PrismaClient).unit.findFirst({
        where: { empresaId, code: data.code.toUpperCase(), id: { not: id } },
      })
      if (existing) throw new ConflictError(MSG.codeExists)
    }

    if (data.abbreviation) {
      const existing = await (db as PrismaClient).unit.findFirst({
        where: { empresaId, abbreviation: data.abbreviation, id: { not: id } },
      })
      if (existing) throw new ConflictError('La abreviación ya existe')
    }

    const updateData: Record<string, unknown> = {}
    if (data.code !== undefined) updateData.code = data.code.toUpperCase()
    if (data.name !== undefined) updateData.name = data.name
    if (data.abbreviation !== undefined)
      updateData.abbreviation = data.abbreviation
    if (data.type !== undefined) updateData.type = data.type
    if (data.isActive !== undefined) updateData.isActive = data.isActive

    const unit = await (db as PrismaClient).unit.update({
      where: { id },
      data: updateData as never,
      include: UNIT_INCLUDE,
    })

    logger.info('Unidad actualizada', { unitId: id, empresaId, userId })

    return unit as unknown as IUnitWithRelations
  }

  async toggleActive(
    empresaId: string,
    id: string,
    userId: string,
    db: PrismaClientType
  ): Promise<IUnitWithRelations> {
    const unit = await this.findById(empresaId, id, db)

    const updated = await (db as PrismaClient).unit.update({
      where: { id },
      data: { isActive: !unit.isActive },
      include: UNIT_INCLUDE,
    })

    logger.info('Estado de unidad cambiado', {
      unitId: id,
      isActive: updated.isActive,
      empresaId,
      userId,
    })

    return updated as unknown as IUnitWithRelations
  }

  // -------------------------------------------------------------------------
  // DELETE
  // -------------------------------------------------------------------------

  async delete(
    empresaId: string,
    id: string,
    userId: string,
    db: PrismaClientType
  ): Promise<void> {
    const unit = await this.findById(empresaId, id, db)

    if (unit._count && unit._count.items > 0) {
      throw new BadRequestError(MSG.hasItems)
    }

    await (db as PrismaClient).unit.update({
      where: { id },
      data: { isActive: false },
    })

    logger.info('Unidad eliminada (soft)', { unitId: id, empresaId, userId })
  }

  async hardDelete(
    empresaId: string,
    id: string,
    userId: string,
    db: PrismaClientType
  ): Promise<void> {
    const unit = await this.findById(empresaId, id, db)

    if (unit._count && unit._count.items > 0) {
      throw new BadRequestError(MSG.hasItems)
    }

    await (db as PrismaClient).unit.delete({ where: { id } })

    logger.warn('Unidad eliminada permanentemente', {
      unitId: id,
      empresaId,
      userId,
    })
  }

  // -------------------------------------------------------------------------
  // BULK
  // -------------------------------------------------------------------------

  async bulkCreate(
    empresaId: string,
    units: ICreateUnitInput[],
    userId: string,
    db: PrismaClientType
  ): Promise<{
    success: IUnitWithRelations[]
    errors: Array<{ code: string; error: string }>
  }> {
    const results: {
      success: IUnitWithRelations[]
      errors: Array<{ code: string; error: string }>
    } = { success: [], errors: [] }

    for (const unitData of units) {
      try {
        const unit = await this.create(empresaId, unitData, userId, db)
        results.success.push(unit)
      } catch (error: unknown) {
        results.errors.push({
          code: unitData.code,
          error: error instanceof Error ? error.message : 'Error desconocido',
        })
      }
    }

    logger.info('Bulk creación de unidades', {
      total: units.length,
      success: results.success.length,
      errors: results.errors.length,
      empresaId,
      userId,
    })

    return results
  }
}

export default new UnitService()
