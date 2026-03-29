// backend/src/features/crm/customerVehicles/customerVehicles.service.ts

import { PrismaClient, Prisma } from '../../../generated/prisma/client.js'
import { logger } from '../../../shared/utils/logger.js'
import { PaginationHelper } from '../../../shared/utils/pagination.js'
import { NotFoundError, BadRequestError } from '../../../shared/utils/apiError.js'
import { CreateCustomerVehicleDTO, UpdateCustomerVehicleDTO } from './customerVehicles.dto.js'
import { ICustomerVehicle, ICustomerVehicleFilters } from './customerVehicles.interface.js'

type PrismaClientType = PrismaClient | Prisma.TransactionClient

// Include para traer brand y model relacionados
const vehicleInclude = {
  brand: { select: { id: true, name: true, code: true } },
  vehicleModel: { select: { id: true, name: true, year: true } },
} as const

class CustomerVehiclesService {
  // ---------------------------------------------------------------------------
  // CREATE
  // ---------------------------------------------------------------------------

  async create(
    data: CreateCustomerVehicleDTO,
    customerId: string,
    empresaId: string,
    db: PrismaClientType
  ): Promise<ICustomerVehicle> {
    const existing = await (db as PrismaClient).customerVehicle.findFirst({
      where: { plate: data.plate, empresaId },
    })
    if (existing) {
      throw new BadRequestError(`Ya existe un vehículo con la placa ${data.plate}`)
    }

    // Validar que brandId pertenece a la empresa si se provee
    if (data.brandId) {
      const brand = await (db as PrismaClient).brand.findFirst({
        where: { id: data.brandId, empresaId },
      })
      if (!brand) throw new BadRequestError('La marca seleccionada no existe')
    }

    // Validar que modelId pertenece a la empresa si se provee
    if (data.modelId) {
      const model = await (db as PrismaClient).model.findFirst({
        where: { id: data.modelId, empresaId },
      })
      if (!model) throw new BadRequestError('El modelo seleccionado no existe')
    }

    const vehicle = await (db as PrismaClient).customerVehicle.create({
      data: {
        plate: data.plate,
        brandId: data.brandId ?? null,
        modelId: data.modelId ?? null,
        vin: data.vin ?? null,
        year: data.year ?? null,
        color: data.color ?? null,
        fuelType: (data.fuelType as any) ?? null,
        transmission: (data.transmission as any) ?? null,
        mileage: data.mileage ?? null,
        purchasedHere: data.purchasedHere ?? false,
        notes: data.notes ?? null,
        customerId,
        empresaId,
      },
      include: vehicleInclude,
    })

    logger.info(`CRM - Vehículo creado: ${vehicle.id}`, { plate: vehicle.plate, customerId, empresaId })
    return vehicle as unknown as ICustomerVehicle
  }

  // ---------------------------------------------------------------------------
  // READ
  // ---------------------------------------------------------------------------

  async findById(id: string, empresaId: string, db: PrismaClientType): Promise<ICustomerVehicle> {
    const vehicle = await (db as PrismaClient).customerVehicle.findFirst({
      where: { id, empresaId },
      include: vehicleInclude,
    })
    if (!vehicle) throw new NotFoundError('Vehículo no encontrado')
    return vehicle as unknown as ICustomerVehicle
  }

  async findAllByCustomer(
    customerId: string,
    filters: ICustomerVehicleFilters,
    page: number,
    limit: number,
    empresaId: string,
    db: PrismaClientType,
    sortBy: string = 'plate',
    sortOrder: 'asc' | 'desc' = 'asc'
  ): Promise<{ data: ICustomerVehicle[]; total: number }> {
    const { skip, take } = PaginationHelper.validateAndParse({ page, limit })

    const where: Prisma.CustomerVehicleWhereInput = { customerId, empresaId }
    if (filters.brandId) where.brandId = filters.brandId
    if (filters.isActive !== undefined) where.isActive = filters.isActive
    if (filters.search) {
      const search = filters.search.trim()
      where.OR = [
        { plate: { contains: search, mode: 'insensitive' } },
        { vin: { contains: search, mode: 'insensitive' } },
        { color: { contains: search, mode: 'insensitive' } },
        { brand: { name: { contains: search, mode: 'insensitive' } } },
        { vehicleModel: { name: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const validSortFields = new Set(['plate', 'createdAt'])
    const safeSortBy = validSortFields.has(sortBy) ? sortBy : 'plate'

    const [data, total] = await Promise.all([
      (db as PrismaClient).customerVehicle.findMany({
        where,
        orderBy: { [safeSortBy]: sortOrder },
        include: vehicleInclude,
        skip,
        take,
      }),
      (db as PrismaClient).customerVehicle.count({ where }),
    ])

    return { data: data as unknown as ICustomerVehicle[], total }
  }

  // ---------------------------------------------------------------------------
  // UPDATE
  // ---------------------------------------------------------------------------

  async update(
    id: string,
    data: UpdateCustomerVehicleDTO,
    empresaId: string,
    db: PrismaClientType
  ): Promise<ICustomerVehicle> {
    const vehicle = await (db as PrismaClient).customerVehicle.findFirst({
      where: { id, empresaId },
    })
    if (!vehicle) throw new NotFoundError('Vehículo no encontrado')

    if (data.plate && data.plate !== vehicle.plate) {
      const existing = await (db as PrismaClient).customerVehicle.findFirst({
        where: { plate: data.plate, empresaId, id: { not: id } },
      })
      if (existing) {
        throw new BadRequestError(`Ya existe un vehículo con la placa ${data.plate}`)
      }
    }

    if (data.brandId) {
      const brand = await (db as PrismaClient).brand.findFirst({
        where: { id: data.brandId, empresaId },
      })
      if (!brand) throw new BadRequestError('La marca seleccionada no existe')
    }

    if (data.modelId) {
      const model = await (db as PrismaClient).model.findFirst({
        where: { id: data.modelId, empresaId },
      })
      if (!model) throw new BadRequestError('El modelo seleccionado no existe')
    }

    const updateData: Record<string, unknown> = {}
    if (data.plate !== undefined) updateData.plate = data.plate
    if (data.brandId !== undefined) updateData.brandId = data.brandId ?? null
    if (data.modelId !== undefined) updateData.modelId = data.modelId ?? null
    if (data.vin !== undefined) updateData.vin = data.vin || null
    if (data.year !== undefined) updateData.year = data.year ?? null
    if (data.color !== undefined) updateData.color = data.color || null
    if (data.fuelType !== undefined) updateData.fuelType = data.fuelType || null
    if (data.transmission !== undefined) updateData.transmission = data.transmission || null
    if (data.mileage !== undefined) updateData.mileage = data.mileage ?? null
    if (data.purchasedHere !== undefined) updateData.purchasedHere = data.purchasedHere
    if (data.notes !== undefined) updateData.notes = data.notes || null
    if (data.isActive !== undefined) updateData.isActive = data.isActive

    const updated = await (db as PrismaClient).customerVehicle.update({
      where: { id },
      data: updateData,
      include: vehicleInclude,
    })

    logger.info(`CRM - Vehículo actualizado: ${id}`, { empresaId })
    return updated as unknown as ICustomerVehicle
  }

  // ---------------------------------------------------------------------------
  // DELETE
  // ---------------------------------------------------------------------------

  async delete(
    id: string,
    empresaId: string,
    db: PrismaClientType
  ): Promise<{ success: boolean; id: string }> {
    const vehicle = await (db as PrismaClient).customerVehicle.findFirst({
      where: { id, empresaId },
    })
    if (!vehicle) throw new NotFoundError('Vehículo no encontrado')

    await (db as PrismaClient).customerVehicle.delete({ where: { id } })

    logger.info(`CRM - Vehículo eliminado: ${id}`, { empresaId })
    return { success: true, id }
  }

  // ---------------------------------------------------------------------------
  // SERVICE HISTORY
  // ---------------------------------------------------------------------------

  async getServiceHistory(
    id: string,
    empresaId: string,
    db: PrismaClientType
  ): Promise<Record<string, unknown>> {
    const vehicle = await (db as PrismaClient).customerVehicle.findFirst({
      where: { id, empresaId },
      include: vehicleInclude,
    })
    if (!vehicle) throw new NotFoundError('Vehículo no encontrado')

    const serviceOrders = await (db as PrismaClient).serviceOrder.findMany({
      where: { customerVehicleId: id, empresaId },
      orderBy: { receivedAt: 'desc' },
      select: {
        id: true, folio: true, status: true,
        mileageIn: true, mileageOut: true,
        diagnosisNotes: true, observations: true,
        laborTotal: true, partsTotal: true, total: true,
        receivedAt: true, estimatedDelivery: true, deliveredAt: true,
        assignedTechnicianId: true,
        items: {
          select: { id: true, type: true, description: true, quantity: true, unitPrice: true, total: true },
        },
      },
    })

    return { vehicle, serviceOrders }
  }
}

export default new CustomerVehiclesService()
