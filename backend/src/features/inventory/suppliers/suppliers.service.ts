// backend/src/features/inventory/suppliers/suppliers.service.ts

import { PrismaClient, Prisma } from '../../../generated/prisma/client.js'
import { logger } from '../../../shared/utils/logger.js'
import { PaginationHelper } from '../../../shared/utils/pagination.js'
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
} from '../../../shared/utils/apiError.js'
import { INVENTORY_MESSAGES } from '../shared/constants/messages.js'
import {
  ISupplier,
  ICreateSupplierInput,
  IUpdateSupplierInput,
  ISupplierFilters,
} from './suppliers.interface.js'

type PrismaClientType = PrismaClient | Prisma.TransactionClient

const MSG = INVENTORY_MESSAGES.supplier

class SupplierService {
  async create(
    data: ICreateSupplierInput,
    empresaId: string,
    userId: string,
    db: PrismaClientType
  ): Promise<ISupplier> {
    const code = data.code.toUpperCase()

    const existing = await (db as PrismaClient).supplier.findFirst({
      where: { code, empresaId },
    })
    if (existing) throw new ConflictError(MSG.codeExists)

    if (data.taxId) {
      const existingTax = await (db as PrismaClient).supplier.findFirst({
        where: { taxId: data.taxId, empresaId },
      })
      if (existingTax) throw new ConflictError(`Ya existe un proveedor con RIF/NIT ${data.taxId}`)
    }

    const supplier = await (db as PrismaClient).supplier.create({
      data: {
        code,
        name: data.name,
        empresaId,
        ...(data.contactName != null ? { contactName: data.contactName } : {}),
        ...(data.email != null ? { email: data.email } : {}),
        ...(data.phone != null ? { phone: data.phone } : {}),
        ...(data.mobile != null ? { mobile: data.mobile } : {}),
        ...(data.website != null ? { website: data.website } : {}),
        ...(data.address != null ? { address: data.address } : {}),
        ...(data.taxId != null ? { taxId: data.taxId } : {}),
        ...(data.type != null ? { type: data.type } : {}),
        ...(data.isSpecialTaxpayer != null
          ? { isSpecialTaxpayer: data.isSpecialTaxpayer }
          : {}),
        ...(data.creditDays != null ? { creditDays: data.creditDays } : {}),
        ...(data.currency != null ? { currency: data.currency } : {}),
        ...(data.notes != null ? { notes: data.notes } : {}),
        ...(data.metadata != null ? { metadata: data.metadata } : {}),
      },
    })

    logger.info(`Proveedor creado: ${supplier.id}`, {
      code: supplier.code,
      name: supplier.name,
      empresaId,
      userId,
    })

    return supplier as ISupplier
  }

  async findById(
    id: string,
    empresaId: string,
    db: PrismaClientType
  ): Promise<ISupplier> {
    const supplier = await (db as PrismaClient).supplier.findFirst({
      where: { id, empresaId },
    })
    if (!supplier) throw new NotFoundError(MSG.notFound)
    return supplier as ISupplier
  }

  async findByCode(
    code: string,
    empresaId: string,
    db: PrismaClientType
  ): Promise<ISupplier> {
    const supplier = await (db as PrismaClient).supplier.findFirst({
      where: { code: code.toUpperCase(), empresaId },
    })
    if (!supplier) throw new NotFoundError(MSG.notFound)
    return supplier as ISupplier
  }

  async findAll(
    filters: ISupplierFilters = {},
    page: number = 1,
    limit: number = 20,
    sortBy: string = 'name',
    sortOrder: 'asc' | 'desc' = 'asc',
    empresaId: string,
    db: PrismaClientType
  ): Promise<{
    items: ISupplier[]
    total: number
    page: number
    limit: number
  }> {
    const { skip, take } = PaginationHelper.validateAndParse({ page, limit })

    const SORT_WHITELIST = new Set(['name', 'code', 'createdAt', 'isActive'])
    const orderField = SORT_WHITELIST.has(sortBy) ? sortBy : 'name'

    const where: Prisma.SupplierWhereInput = { empresaId }
    if (filters.code)
      where.code = { contains: filters.code, mode: 'insensitive' }
    if (filters.name)
      where.name = { contains: filters.name, mode: 'insensitive' }
    if (filters.isActive !== undefined) where.isActive = filters.isActive

    const [total, suppliers] = await Promise.all([
      (db as PrismaClient).supplier.count({ where }),
      (db as PrismaClient).supplier.findMany({
        where,
        skip,
        take,
        orderBy: { [orderField]: sortOrder },
      }),
    ])

    return { items: suppliers as ISupplier[], total, page, limit }
  }

  async findActive(
    empresaId: string,
    db: PrismaClientType,
    limit: number = 20
  ): Promise<ISupplier[]> {
    const suppliers = await (db as PrismaClient).supplier.findMany({
      where: { isActive: true, empresaId },
      take: limit,
      orderBy: { name: 'asc' },
    })
    return suppliers as ISupplier[]
  }

  async update(
    id: string,
    data: IUpdateSupplierInput,
    userId: string,
    empresaId: string,
    db: PrismaClientType
  ): Promise<ISupplier> {
    const existing = await (db as PrismaClient).supplier.findFirst({
      where: { id, empresaId },
    })
    if (!existing) throw new NotFoundError(MSG.notFound)

    if (data.code && data.code.toUpperCase() !== existing.code) {
      const duplicate = await (db as PrismaClient).supplier.findFirst({
        where: { code: data.code.toUpperCase(), empresaId },
      })
      if (duplicate) throw new ConflictError(MSG.codeExists)
    }

    if (data.taxId && data.taxId !== existing.taxId) {
      const duplicateTax = await (db as PrismaClient).supplier.findFirst({
        where: { taxId: data.taxId, empresaId, id: { not: id } },
      })
      if (duplicateTax) throw new ConflictError(`Ya existe un proveedor con RIF/NIT ${data.taxId}`)
    }

    const updateData: Record<string, unknown> = {}
    if (data.code !== undefined) updateData.code = data.code.toUpperCase()
    if (data.name !== undefined) updateData.name = data.name
    if (data.contactName !== undefined)
      updateData.contactName = data.contactName ?? null
    if (data.email !== undefined) updateData.email = data.email ?? null
    if (data.phone !== undefined) updateData.phone = data.phone ?? null
    if (data.mobile !== undefined) updateData.mobile = data.mobile ?? null
    if (data.website !== undefined) updateData.website = data.website ?? null
    if (data.address !== undefined) updateData.address = data.address ?? null
    if (data.taxId !== undefined) updateData.taxId = data.taxId ?? null
    if (data.type !== undefined) updateData.type = data.type
    if (data.isSpecialTaxpayer !== undefined)
      updateData.isSpecialTaxpayer = data.isSpecialTaxpayer
    if (data.creditDays !== undefined) updateData.creditDays = data.creditDays
    if (data.currency !== undefined) updateData.currency = data.currency ?? null
    if (data.notes !== undefined) updateData.notes = data.notes ?? null
    if (data.metadata !== undefined) updateData.metadata = data.metadata ?? null
    if (data.isActive !== undefined) updateData.isActive = data.isActive

    const updated = await (db as PrismaClient).supplier.update({
      where: { id },
      data: updateData,
    })

    logger.info(`Proveedor actualizado: ${id}`, { userId, empresaId })

    return updated as ISupplier
  }

  async delete(
    id: string,
    userId: string,
    empresaId: string,
    db: PrismaClientType
  ): Promise<void> {
    const existing = await (db as PrismaClient).supplier.findFirst({
      where: { id, empresaId },
    })
    if (!existing) throw new NotFoundError(MSG.notFound)

    const poCount = await (db as PrismaClient).purchaseOrder.count({
      where: { supplierId: id },
    })
    if (poCount > 0) throw new BadRequestError(MSG.hasPurchaseOrders)

    await (db as PrismaClient).supplier.delete({ where: { id } })

    logger.info(`Proveedor eliminado: ${id}`, { userId, empresaId })
  }

  async toggleActive(
    id: string,
    userId: string,
    empresaId: string,
    db: PrismaClientType
  ): Promise<ISupplier> {
    const existing = await (db as PrismaClient).supplier.findFirst({
      where: { id, empresaId },
    })
    if (!existing) throw new NotFoundError(MSG.notFound)

    const updated = await (db as PrismaClient).supplier.update({
      where: { id },
      data: { isActive: !existing.isActive },
    })

    logger.info(`Estado proveedor actualizado: ${id}`, {
      isActive: updated.isActive,
      userId,
      empresaId,
    })

    return updated as ISupplier
  }
}

export default new SupplierService()
