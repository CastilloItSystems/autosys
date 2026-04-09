// backend/src/features/crm/customers/customers.service.ts

import { PrismaClient, Prisma } from '../../../generated/prisma/client.js'
import { logger } from '../../../shared/utils/logger.js'
import { PaginationHelper } from '../../../shared/utils/pagination.js'
import { NotFoundError, BadRequestError } from '../../../shared/utils/apiError.js'
import { CreateCustomerDTO, UpdateCustomerDTO } from './customers.dto.js'
import { ICustomer, ICustomerFilters } from './customers.interface.js'

type PrismaClientType = PrismaClient | Prisma.TransactionClient

class CustomersService {
  // ---------------------------------------------------------------------------
  // CREATE
  // ---------------------------------------------------------------------------

  async create(
    data: CreateCustomerDTO,
    empresaId: string,
    db: PrismaClientType
  ): Promise<ICustomer> {
    const existing = await (db as PrismaClient).customer.findFirst({
      where: { code: data.code, empresaId },
    })
    if (existing) {
      throw new BadRequestError(`Ya existe un cliente con código ${data.code}`)
    }

    if (data.taxId) {
      const existingTax = await (db as PrismaClient).customer.findFirst({
        where: { taxId: data.taxId, empresaId },
      })
      if (existingTax) {
        throw new BadRequestError(`Ya existe un cliente con RIF/Cédula ${data.taxId}`)
      }
    }

    const customer = await (db as PrismaClient).customer.create({
      data: {
        code: data.code,
        name: data.name,
        taxId: data.taxId ?? null,
        email: data.email ?? null,
        phone: data.phone ?? null,
        mobile: data.mobile ?? null,
        website: data.website ?? null,
        contactPerson: data.contactPerson ?? null,
        address: data.address ?? null,
        shippingAddress: data.shippingAddress ?? null,
        billingAddress: data.billingAddress ?? null,
        type: (data.type as any) ?? 'INDIVIDUAL',
        isSpecialTaxpayer: data.isSpecialTaxpayer ?? false,
        priceList: data.priceList ?? 1,
        creditLimit: data.creditLimit ?? 0,
        creditDays: data.creditDays ?? 0,
        defaultDiscount: data.defaultDiscount ?? 0,
        segment: (data.segment as any) ?? 'PROSPECT',
        preferredChannel: (data.preferredChannel as any) ?? 'ALL',
        assignedSellerId: data.assignedSellerId ?? null,
        customerSince: data.customerSince ? new Date(data.customerSince) : null,
        referredById: data.referredById ?? null,
        notes: data.notes ?? null,
        metadata: data.metadata ?? null,
        empresaId,
      },
    })

    logger.info(`CRM - Cliente creado: ${customer.id}`, { code: customer.code, empresaId })
    return customer as unknown as ICustomer
  }

  // ---------------------------------------------------------------------------
  // READ
  // ---------------------------------------------------------------------------

  async findById(id: string, empresaId: string, db: PrismaClientType): Promise<ICustomer> {
    const customer = await (db as PrismaClient).customer.findFirst({
      where: { id, empresaId },
      include: {
        contacts: { where: { isActive: true } },
        vehicles: { where: { isActive: true } },
        _count: {
          select: { orders: true, leads: true, interactions: true },
        },
      },
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
    if (filters.segment) where.segment = filters.segment as any
    if (filters.preferredChannel) where.preferredChannel = filters.preferredChannel as any
    if (filters.isActive !== undefined) where.isActive = filters.isActive
    if (filters.assignedSellerId) where.assignedSellerId = filters.assignedSellerId
    if (filters.search) {
      const search = filters.search.trim()
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { taxId: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { mobile: { contains: search, mode: 'insensitive' } },
      ]
    }

    const validSortFields = new Set(['createdAt', 'name', 'code', 'taxId', 'segment'])
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

  // Vista 360° del cliente: historial unificado de todos los módulos
  async getTimeline(
    id: string,
    empresaId: string,
    db: PrismaClientType
  ): Promise<Record<string, unknown>> {
    const customer = await (db as PrismaClient).customer.findFirst({
      where: { id, empresaId },
    })
    if (!customer) throw new NotFoundError('Cliente no encontrado')

    const [orders, leads, interactions, activities, vehicles, serviceOrders] = await Promise.all([
      (db as PrismaClient).order.findMany({
        where: { customerId: id, empresaId },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: { id: true, orderNumber: true, status: true, total: true, createdAt: true },
      }),
      (db as PrismaClient).lead.findMany({
        where: { customerId: id, empresaId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, title: true, channel: true, status: true,
          estimatedValue: true, createdAt: true, closedAt: true,
        },
      }),
      (db as PrismaClient).interaction.findMany({
        where: { customerId: id, empresaId },
        orderBy: { createdAt: 'desc' },
        take: 30,
        select: {
          id: true, type: true, channel: true, subject: true,
          notes: true, outcome: true, createdAt: true, createdBy: true,
        },
      }),
      (db as PrismaClient).activity.findMany({
        where: { customerId: id, empresaId },
        orderBy: { dueAt: 'asc' },
        select: {
          id: true, type: true, title: true, status: true,
          assignedTo: true, dueAt: true, completedAt: true,
        },
      }),
      (db as PrismaClient).customerVehicle.findMany({
        where: { customerId: id, empresaId },
        select: {
          id: true, plate: true, year: true, color: true, mileage: true,
          brand: { select: { id: true, name: true } },
          vehicleModel: { select: { id: true, name: true, year: true } },
        },
      }),
      (db as PrismaClient).serviceOrder.findMany({
        where: { customerId: id, empresaId },
        orderBy: { receivedAt: 'desc' },
        take: 20,
        select: {
          id: true, folio: true, status: true, vehiclePlate: true, vehicleDesc: true,
          mileageIn: true, mileageOut: true, total: true, receivedAt: true, deliveredAt: true,
          customerVehicleId: true,
        },
      }),
    ])

    return { customer, orders, leads, interactions, activities, vehicles, serviceOrders }
  }

  // ---------------------------------------------------------------------------
  // UPDATE
  // ---------------------------------------------------------------------------

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

    if (data.code && data.code !== customer.code) {
      const existing = await (db as PrismaClient).customer.findFirst({
        where: { code: data.code, empresaId, id: { not: id } },
      })
      if (existing) {
        throw new BadRequestError(`Ya existe un cliente con código ${data.code}`)
      }
    }

    if (data.taxId && data.taxId !== customer.taxId) {
      const existing = await (db as PrismaClient).customer.findFirst({
        where: { taxId: data.taxId, empresaId, id: { not: id } },
      })
      if (existing) {
        throw new BadRequestError(`Ya existe un cliente con RIF/Cédula ${data.taxId}`)
      }
    }

    const updateData: Record<string, unknown> = {}
    if (data.code !== undefined) updateData.code = data.code
    if (data.name !== undefined) updateData.name = data.name
    if (data.taxId !== undefined) updateData.taxId = data.taxId || null
    if (data.email !== undefined) updateData.email = data.email || null
    if (data.phone !== undefined) updateData.phone = data.phone || null
    if (data.mobile !== undefined) updateData.mobile = data.mobile || null
    if (data.website !== undefined) updateData.website = data.website || null
    if (data.contactPerson !== undefined) updateData.contactPerson = data.contactPerson || null
    if (data.address !== undefined) updateData.address = data.address || null
    if (data.shippingAddress !== undefined) updateData.shippingAddress = data.shippingAddress || null
    if (data.billingAddress !== undefined) updateData.billingAddress = data.billingAddress || null
    if (data.type !== undefined) updateData.type = data.type
    if (data.isSpecialTaxpayer !== undefined) updateData.isSpecialTaxpayer = data.isSpecialTaxpayer
    if (data.priceList !== undefined) updateData.priceList = data.priceList
    if (data.creditLimit !== undefined) updateData.creditLimit = data.creditLimit
    if (data.creditDays !== undefined) updateData.creditDays = data.creditDays
    if (data.defaultDiscount !== undefined) updateData.defaultDiscount = data.defaultDiscount
    if (data.segment !== undefined) updateData.segment = data.segment
    if (data.preferredChannel !== undefined) updateData.preferredChannel = data.preferredChannel
    if (data.assignedSellerId !== undefined) updateData.assignedSellerId = data.assignedSellerId || null
    if (data.customerSince !== undefined)
      updateData.customerSince = data.customerSince ? new Date(data.customerSince) : null
    if (data.referredById !== undefined) updateData.referredById = data.referredById || null
    if (data.notes !== undefined) updateData.notes = data.notes || null
    if (data.metadata !== undefined) updateData.metadata = data.metadata || null
    if (data.isActive !== undefined) updateData.isActive = data.isActive

    const updated = await (db as PrismaClient).customer.update({
      where: { id },
      data: updateData,
    })

    logger.info(`CRM - Cliente actualizado: ${id}`, { empresaId })
    return updated as unknown as ICustomer
  }

  // ---------------------------------------------------------------------------
  // DELETE (soft delete)
  // ---------------------------------------------------------------------------

  async delete(
    id: string,
    empresaId: string,
    db: PrismaClientType
  ): Promise<{ success: boolean; id: string }> {
    const customer = await (db as PrismaClient).customer.findFirst({
      where: { id, empresaId },
    })
    if (!customer) throw new NotFoundError('Cliente no encontrado')

    const orderCount = await (db as PrismaClient).order.count({ where: { customerId: id } })
    if (orderCount > 0) {
      throw new BadRequestError(
        `No se puede eliminar el cliente porque tiene ${orderCount} órdenes. Desactívelo en su lugar.`
      )
    }

    await (db as PrismaClient).customer.delete({ where: { id } })

    logger.info(`CRM - Cliente eliminado: ${id}`, { empresaId })
    return { success: true, id }
  }
}

export default new CustomersService()
