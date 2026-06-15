// backend/src/features/workshop/postRepairScans/postRepairScans.service.ts
import type { PrismaClient, Prisma } from '../../../generated/prisma/client.js'
import {
  NotFoundError,
  BadRequestError,
} from '../../../shared/utils/apiError.js'
import type {
  ICreatePostRepairScan,
  IUpdatePostRepairScan,
} from './postRepairScans.interface.js'

type Db = PrismaClient | Prisma.TransactionClient

export async function list(
  db: Db,
  empresaId: string,
  filters: { serviceOrderId?: string; result?: string; page?: number; limit?: number }
) {
  const { serviceOrderId, result, page = 1, limit = 20 } = filters
  const where: any = { empresaId }
  if (serviceOrderId) where.serviceOrderId = serviceOrderId
  if (result) where.result = result
  const skip = (page - 1) * limit
  const [data, total] = await Promise.all([
    (db as PrismaClient).postRepairScan.findMany({
      where,
      skip,
      take: limit,
      orderBy: { performedAt: 'desc' },
      include: {
        serviceOrder: { select: { id: true, folio: true } },
      },
    }),
    (db as PrismaClient).postRepairScan.count({ where }),
  ])
  return { data, page, limit, total }
}

export async function getById(db: Db, id: string, empresaId: string) {
  const sc = await (db as PrismaClient).postRepairScan.findFirst({
    where: { id, empresaId },
    include: {
      serviceOrder: { select: { id: true, folio: true } },
    },
  })
  if (!sc) throw new NotFoundError('Escaneo no encontrado')
  return sc
}

export async function create(
  db: Db,
  empresaId: string,
  userId: string,
  data: ICreatePostRepairScan
) {
  const so = await (db as PrismaClient).serviceOrder.findFirst({
    where: { id: data.serviceOrderId, empresaId },
    select: { id: true },
  })
  if (!so) throw new NotFoundError('Orden de servicio no encontrada')
  return (db as PrismaClient).postRepairScan.create({
    data: {
      serviceOrderId: data.serviceOrderId,
      technicianId: data.technicianId,
      technicianName: data.technicianName ?? null,
      dtcCodesCleared: data.dtcCodesCleared ?? null,
      parametersVerified: data.parametersVerified ?? null,
      result: data.result,
      reportUrl: data.reportUrl ?? null,
      reportPrinted: data.reportPrinted ?? false,
      observations: data.observations ?? null,
      empresaId,
      createdBy: userId,
    },
  })
}

export async function update(
  db: Db,
  id: string,
  empresaId: string,
  data: IUpdatePostRepairScan
) {
  await getById(db, id, empresaId)
  return (db as PrismaClient).postRepairScan.update({
    where: { id },
    data: data as any,
  })
}

export async function remove(db: Db, id: string, empresaId: string) {
  await getById(db, id, empresaId)
  await (db as PrismaClient).postRepairScan.delete({ where: { id } })
}

// §19 helper: verificar que existe al menos un scan PASS para la OS
export async function assertScanCompleted(db: Db, serviceOrderId: string) {
  const scan = await (db as PrismaClient).postRepairScan.findFirst({
    where: { serviceOrderId, result: 'PASS' },
    select: { id: true },
  })
  if (!scan) {
    throw new BadRequestError(
      'Esta orden requiere escaneo electrónico post-reparación con resultado PASS antes de continuar'
    )
  }
}
