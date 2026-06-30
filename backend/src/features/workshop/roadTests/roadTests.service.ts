// backend/src/features/workshop/roadTests/roadTests.service.ts
import type { PrismaClient, Prisma } from '../../../generated/prisma/client.js'
import {
  NotFoundError,
  BadRequestError,
  ConflictError,
} from '../../../shared/utils/apiError.js'
import type {
  ICreateRoadTest,
  IUpdateRoadTest,
  IAuthorizeInput,
  IClientAuthorizeInput,
  IDepartInput,
  IReturnInput,
} from './roadTests.interface.js'

type Db = PrismaClient | Prisma.TransactionClient

export async function list(
  db: Db,
  empresaId: string,
  filters: { serviceOrderId?: string; status?: string; page?: number; limit?: number }
) {
  const { serviceOrderId, status, page = 1, limit = 20 } = filters
  const where: any = { empresaId }
  if (serviceOrderId) where.serviceOrderId = serviceOrderId
  if (status) where.status = status
  const skip = (page - 1) * limit
  const [data, total] = await Promise.all([
    (db as PrismaClient).roadTest.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        serviceOrder: { select: { id: true, folio: true } },
      },
    }),
    (db as PrismaClient).roadTest.count({ where }),
  ])
  return { data, page, limit, total }
}

export async function getById(db: Db, id: string, empresaId: string) {
  const rt = await (db as PrismaClient).roadTest.findFirst({
    where: { id, empresaId },
    include: {
      serviceOrder: { select: { id: true, folio: true } },
    },
  })
  if (!rt) throw new NotFoundError('Prueba de carretera no encontrada')
  return rt
}

export async function create(
  db: Db,
  empresaId: string,
  userId: string,
  data: ICreateRoadTest
) {
  const so = await (db as PrismaClient).serviceOrder.findFirst({
    where: { id: data.serviceOrderId, empresaId },
    select: { id: true },
  })
  if (!so) throw new NotFoundError('Orden de servicio no encontrada')

  return (db as PrismaClient).roadTest.create({
    data: {
      serviceOrderId: data.serviceOrderId,
      motive: data.motive,
      driverId: data.driverId,
      driverName: data.driverName ?? null,
      technicianId: data.technicianId,
      technicianName: data.technicianName ?? null,
      exitPassRef: data.exitPassRef ?? null,
      notes: data.notes ?? null,
      status: 'DRAFT',
      empresaId,
      createdBy: userId,
    },
  })
}

export async function update(
  db: Db,
  id: string,
  empresaId: string,
  data: IUpdateRoadTest
) {
  const rt = await getById(db, id, empresaId)
  if (rt.status !== 'DRAFT') {
    throw new BadRequestError(
      'Solo puede editarse en estado DRAFT antes de autorizaciones'
    )
  }
  return (db as PrismaClient).roadTest.update({
    where: { id },
    data: {
      motive: data.motive ?? rt.motive,
      notes: data.notes ?? rt.notes,
      exitPassRef: data.exitPassRef ?? rt.exitPassRef,
    },
  })
}

export async function authorize(
  db: Db,
  id: string,
  empresaId: string,
  input: IAuthorizeInput
) {
  const rt = await getById(db, id, empresaId)
  if (rt.status !== 'DRAFT' && rt.status !== 'AUTHORIZED') {
    throw new BadRequestError(
      'Las autorizaciones se registran antes de la salida'
    )
  }
  const data: any = {}
  if (input.role === 'MANAGER') {
    data.authManagerId = input.userId
    data.authManagerAt = new Date()
  } else if (input.role === 'ADVISOR') {
    data.authAdvisorId = input.userId
    data.authAdvisorAt = new Date()
  } else if (input.role === 'SHOP_FOREMAN') {
    data.authShopForemanId = input.userId
    data.authShopForemanAt = new Date()
  }
  const updated = await (db as PrismaClient).roadTest.update({
    where: { id },
    data,
  })
  // Si las 3 firmas + cliente OK → AUTHORIZED
  if (
    updated.authManagerId &&
    updated.authAdvisorId &&
    updated.authShopForemanId &&
    updated.clientAuthorized &&
    updated.status === 'DRAFT'
  ) {
    return (db as PrismaClient).roadTest.update({
      where: { id },
      data: { status: 'AUTHORIZED' },
    })
  }
  return updated
}

export async function authorizeClient(
  db: Db,
  id: string,
  empresaId: string,
  input: IClientAuthorizeInput
) {
  const rt = await getById(db, id, empresaId)
  if (rt.status !== 'DRAFT' && rt.status !== 'AUTHORIZED') {
    throw new BadRequestError(
      'La autorización del cliente se registra antes de la salida'
    )
  }
  const updated = await (db as PrismaClient).roadTest.update({
    where: { id },
    data: {
      clientAuthorized: true,
      clientAuthorizedAt: new Date(),
      clientAuthName: input.clientName,
      clientAuthSignature: input.signatureUrl ?? null,
    },
  })
  if (
    updated.authManagerId &&
    updated.authAdvisorId &&
    updated.authShopForemanId &&
    updated.clientAuthorized &&
    updated.status === 'DRAFT'
  ) {
    return (db as PrismaClient).roadTest.update({
      where: { id },
      data: { status: 'AUTHORIZED' },
    })
  }
  return updated
}

export async function depart(
  db: Db,
  id: string,
  empresaId: string,
  input: IDepartInput
) {
  const rt = await getById(db, id, empresaId)
  // §20.3 — verificar autorización triple + cliente
  if (
    !rt.authManagerId ||
    !rt.authAdvisorId ||
    !rt.authShopForemanId ||
    !rt.clientAuthorized
  ) {
    throw new BadRequestError(
      'No se permite salida sin autorización triple (Gerente + Asesor + Jefe Taller) y autorización del cliente'
    )
  }
  if (rt.status !== 'AUTHORIZED') {
    throw new BadRequestError('Solo se puede salir desde estado AUTHORIZED')
  }
  // Transición atómica protegida contra carrera: solo cambia si sigue en AUTHORIZED.
  const result = await (db as PrismaClient).roadTest.updateMany({
    where: { id, empresaId, status: 'AUTHORIZED' },
    data: {
      status: 'IN_PROGRESS',
      kmDeparture: input.kmDeparture,
      departedAt: new Date(),
    },
  })
  if (result.count !== 1) {
    throw new ConflictError(
      'La prueba ya fue despachada o cambió de estado; no se puede registrar la salida'
    )
  }
  return getById(db, id, empresaId)
}

export async function returnVehicle(
  db: Db,
  id: string,
  empresaId: string,
  input: IReturnInput
) {
  const rt = await getById(db, id, empresaId)
  if (rt.status !== 'IN_PROGRESS') {
    throw new BadRequestError('Solo se puede reingresar desde IN_PROGRESS')
  }
  if (rt.kmDeparture != null && input.kmReturn < rt.kmDeparture) {
    throw new BadRequestError(
      'El kilometraje de reingreso no puede ser menor al de salida'
    )
  }
  const finalStatus =
    input.result === 'FAIL'
      ? 'FAILED'
      : 'COMPLETED'
  return (db as PrismaClient).roadTest.update({
    where: { id },
    data: {
      status: finalStatus,
      kmReturn: input.kmReturn,
      returnedAt: new Date(),
      leaksDetected: input.leaksDetected ?? false,
      integrityVerified: input.integrityVerified ?? false,
      result: input.result,
      observations: input.observations ?? null,
    },
  })
}

export async function cancel(db: Db, id: string, empresaId: string) {
  const rt = await getById(db, id, empresaId)
  if (rt.status === 'COMPLETED' || rt.status === 'FAILED') {
    throw new BadRequestError('No se puede cancelar una prueba completada')
  }
  return (db as PrismaClient).roadTest.update({
    where: { id },
    data: { status: 'CANCELLED' },
  })
}
