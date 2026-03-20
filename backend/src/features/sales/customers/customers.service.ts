// backend/src/features/sales/customers/customers.service.ts

import { PrismaClient, Prisma } from '../../../generated/prisma/client.js'
import { logger } from '../../../shared/utils/logger.js'
import { PaginationHelper } from '../../../shared/utils/pagination.js'
import {
  NotFoundError,
  BadRequestError,
} from '../../../shared/utils/apiError.js'
import {
  CreateCustomerDTO,
  UpdateCustomerDTO,
} from './customers.dto.js'
import {
  ICustomer,
  CustomerType,
  ICustomerFilters,
} from './customers.interface.js'

type PrismaClientType = PrismaClient | Prisma.TransactionClient

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

class CustomersService {
  // -------------------------------------------------------------------------
  // CREATE
  // -------------------------------------------------------------------------

  async create(
    data: CreateCustomerDTO,
    empresaId: string,
    db: PrismaClientType
  ): Promise<ICustomer> {
    // Check unique code within empresa
    const existing = await (db as PrismaClient).customer.findFirst({
      where: { code: data.code, empresaId },
    })
    if (existing) {
      throw new BadRequestError(`Ya existe un cliente con código ${data.code}`)
    }

    // Check unique taxId within empresa (if provided)
    if (data.taxId) {
      const existingTax = await (db as PrismaClient).customer.findFirst({
        where: { taxId: data.taxId, empresaId },
      })
      if (existingTax) {
        throw new BadRequestError(
          `Ya existe un cliente con RIF/Cédula ${data.taxId}`
        )
      }
    }

    const customer = await (db as PrismaClient).customer.create({
      data: {
        code: data.code,
        taxId: data.taxId ?? null,
        name: data.name,
        email: data.email ?? null,
        phone: data.phone ?? null,
        address: data.address ?? null,
        type: (data.type as CustomerType) ?? CustomerType.INDIVIDUAL,
        empresaId,
      },
    })

    logger.info(`Cliente creado: ${customer.id}`, {
      code: customer.code,
      empresaId,
    })

    return customer as unknown as ICustomer
  }

  // -------------------------------------------------------------------------
  // READ
  // -------------------------------------------------------------------------

  async findById(
    id: string,
    empresaId: string,
    db: PrismaClientType
  ): Promise<ICustomer> {
    const customer = await (db as PrismaClient).customer.findFirst({
      where: { id, empresaId },
    })
    if (!customer) throw new NotFoundError('Cliente no encontrado')
    return customer as unknown as ICustomer
  }

  async findAll(
    filters: ICustomerFilters,
    page: number,
    limit: number,
    empresaId: string,
    db: PrismaClientType,
    sortBy: string = 'name',
    sortOrder: 'asc' | 'desc' = 'asc'
  ): Promise<{ data: ICustomer[]; total: number }> {
    const { skip, take } = PaginationHelper.validateAndParse({ page, limit })

    const where: Prisma.CustomerWhereInput = { empresaId }
    if (filters.type) where.type = filters.type as any
    if (filters.isActive !== undefined) where.isActive = filters.isActive
    if (filters.search) {
      const search = filters.search.trim()
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { taxId: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ]
    }

    const validSortFields = new Set(['createdAt', 'name', 'code', 'taxId'])
    const safeSortBy = validSortFields.has(sortBy) ? sortBy : 'name'

    const [data, total] = await Promise.all([
      (db as PrismaClient).customer.findMany({
        where,
        orderBy: { [safeSortBy]: sortOrder },
        skip,
        take,
      }),
      (db as PrismaClient).customer.count({ where }),
    ])

    return { data: data as unknown as ICustomer[], total }
  }

  // -------------------------------------------------------------------------
  // UPDATE
  // -------------------------------------------------------------------------

  async update(
    id: string,
    data: UpdateCustomerDTO,
    empresaId: string,
    db: PrismaClientType
  ): Promise<ICustomer> {
    const customer = await (db as PrismaClient).customer.findFirst({
      where: { id, empresaId },
    })
    if (!customer) throw new NotFoundError('Cliente no encontrado')

    // Check unique code if changing
    if (data.code && data.code !== customer.code) {
      const existing = await (db as PrismaClient).customer.findFirst({
        where: { code: data.code, empresaId, id: { not: id } },
      })
      if (existing) {
        throw new BadRequestError(
          `Ya existe un cliente con código ${data.code}`
        )
      }
    }

    // Check unique taxId if changing
    if (data.taxId && data.taxId !== customer.taxId) {
      const existing = await (db as PrismaClient).customer.findFirst({
        where: { taxId: data.taxId, empresaId, id: { not: id } },
      })
      if (existing) {
        throw new BadRequestError(
          `Ya existe un cliente con RIF/Cédula ${data.taxId}`
        )
      }
    }

    const updateData: Record<string, unknown> = {}
    if (data.code !== undefined) updateData.code = data.code
    if (data.name !== undefined) updateData.name = data.name
    if (data.taxId !== undefined) updateData.taxId = data.taxId || null
    if (data.email !== undefined) updateData.email = data.email || null
    if (data.phone !== undefined) updateData.phone = data.phone || null
    if (data.address !== undefined) updateData.address = data.address || null
    if (data.type !== undefined) updateData.type = data.type
    if (data.isActive !== undefined) updateData.isActive = data.isActive

    const updated = await (db as PrismaClient).customer.update({
      where: { id },
      data: updateData,
    })

    logger.info(`Cliente actualizado: ${id}`, { empresaId })

    return updated as unknown as ICustomer
  }

  // -------------------------------------------------------------------------
  // DELETE
  // -------------------------------------------------------------------------

  async delete(
    id: string,
    empresaId: string,
    db: PrismaClientType
  ): Promise<{ success: boolean; id: string }> {
    const customer = await (db as PrismaClient).customer.findFirst({
      where: { id, empresaId },
    })
    if (!customer) throw new NotFoundError('Cliente no encontrado')

    // Check if customer has orders
    const orderCount = await (db as PrismaClient).order.count({
      where: { customerId: id },
    })
    if (orderCount > 0) {
      throw new BadRequestError(
        `No se puede eliminar el cliente porque tiene ${orderCount} órdenes asociadas. Desactívelo en su lugar.`
      )
    }

    await (db as PrismaClient).customer.delete({ where: { id } })

    logger.info(`Cliente eliminado: ${id}`, { empresaId })

    return { success: true, id }
  }
}

export default new CustomersService()
