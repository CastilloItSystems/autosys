// backend/src/features/workshop/deliveries/deliveries.service.ts
import type { PrismaClient, Prisma } from '../../../generated/prisma/client.js'
import { NotFoundError, ConflictError } from '../../../shared/utils/apiError.js'
import type { ICreateDeliveryInput } from './deliveries.interface.js'

type Db =
  | PrismaClient
  | Omit<
      PrismaClient,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
    >

export async function findAllDeliveries(
  db: Db,
  empresaId: string,
  filters: any = {}
) {
  const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = filters ?? {}
  const skip = (page - 1) * limit
  const [data, total] = await Promise.all([
    (db as PrismaClient).vehicleDelivery.findMany({
      where: { empresaId },
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: { serviceOrder: { select: { id: true, folio: true, status: true } } },
    }),
    (db as PrismaClient).vehicleDelivery.count({ where: { empresaId } }),
  ])
  return { data, page, limit, total }
}

export async function createDelivery(
  db: Db,
  empresaId: string,
  userId: string,
  data: ICreateDeliveryInput
) {
  const existing = await (db as PrismaClient).vehicleDelivery.findFirst({
    where: { serviceOrderId: data.serviceOrderId, empresaId },
  })
  if (existing)
    throw new ConflictError(
      'La orden de trabajo ya tiene una entrega registrada'
    )

  return (db as PrismaClient).vehicleDelivery.create({
    data: {
      empresaId,
      serviceOrderId: data.serviceOrderId,
      deliveredBy: data.deliveredBy || userId,
      receivedByName: data.receivedByName,
      clientConformity: data.clientConformity ?? true,
      clientSignature: data.clientSignature,
      observations: data.observations,
      nextVisitDate: data.nextVisitDate ? new Date(data.nextVisitDate) : null,
    },
  })
}

export async function findDeliveryByServiceOrder(
  db: Db,
  serviceOrderId: string,
  empresaId: string
) {
  return (db as PrismaClient).vehicleDelivery.findFirst({
    where: { serviceOrderId, empresaId },
  })
}
