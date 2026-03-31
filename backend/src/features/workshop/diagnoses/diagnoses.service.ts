// backend/src/features/workshop/diagnoses/diagnoses.service.ts
import type { PrismaClient, Prisma } from '../../../generated/prisma/client.js'
import { NotFoundError, ConflictError } from '../../../shared/utils/apiError.js'
import type {
  ICreateDiagnosisInput,
  IUpdateDiagnosisInput,
  ICreateDiagnosisFindingInput,
  ICreateDiagnosisSuggestedOpInput,
  ICreateDiagnosisSuggestedPartInput,
} from './diagnoses.interface.js'

type Db =
  | PrismaClient
  | Omit<
      PrismaClient,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
    >

export async function findAllDiagnoses(
  db: Db,
  empresaId: string,
  page: number = 1,
  limit: number = 10,
  serviceOrderId?: string
) {
  const skip = (page - 1) * limit
  const where: Prisma.ServiceDiagnosisWhereInput = { empresaId }
  if (serviceOrderId) where.serviceOrderId = serviceOrderId

  const [data, total] = await Promise.all([
    (db as PrismaClient).serviceDiagnosis.findMany({
      where,
      include: {
        findings: true,
        suggestedOperations: { include: { operation: true } },
        suggestedParts: { include: { item: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    (db as PrismaClient).serviceDiagnosis.count({ where }),
  ])

  return { data, total, page, limit }
}

export async function findDiagnosisById(db: Db, id: string, empresaId: string) {
  const item = await (db as PrismaClient).serviceDiagnosis.findFirst({
    where: { id, empresaId },
    include: {
      findings: true,
      evidences: true,
      suggestedOperations: { include: { operation: true } },
      suggestedParts: { include: { item: true } },
    },
  })
  if (!item) throw new NotFoundError('Diagnóstico no encontrado')
  return item
}

export async function findDiagnosisByServiceOrder(
  db: Db,
  serviceOrderId: string,
  empresaId: string
) {
  return (db as PrismaClient).serviceDiagnosis.findFirst({
    where: { serviceOrderId, empresaId },
    include: {
      findings: true,
      evidences: true,
      suggestedOperations: { include: { operation: true } },
      suggestedParts: { include: { item: true } },
    },
  })
}

export async function createDiagnosis(
  db: Db,
  empresaId: string,
  userId: string,
  data: ICreateDiagnosisInput
) {
  return (db as PrismaClient).serviceDiagnosis.create({
    data: {
      empresaId,
      createdBy: userId,
      receptionId: data.receptionId,
      serviceOrderId: data.serviceOrderId,
      technicianId: data.technicianId,
      generalNotes: data.generalNotes,
      severity: data.severity || 'LOW',
      status: 'DRAFT',
      startedAt: new Date(),
    },
  })
}

export async function updateDiagnosis(
  db: Db,
  id: string,
  empresaId: string,
  data: IUpdateDiagnosisInput
) {
  const existing = await findDiagnosisById(db, id, empresaId)
  return (db as PrismaClient).serviceDiagnosis.update({
    where: { id: existing.id },
    data,
  })
}

export async function addDiagnosisFinding(
  db: Db,
  diagnosisId: string,
  empresaId: string,
  data: ICreateDiagnosisFindingInput
) {
  const diagnosis = await findDiagnosisById(db, diagnosisId, empresaId)
  return (db as PrismaClient).diagnosisFinding.create({
    data: {
      empresaId,
      diagnosisId: diagnosis.id,
      category: data.category,
      description: data.description,
      severity: data.severity || 'MEDIUM',
      requiresClientAuth: data.requiresClientAuth ?? true,
      observation: data.observation,
    },
  })
}

export async function addDiagnosisSuggestedOp(
  db: Db,
  diagnosisId: string,
  empresaId: string,
  data: ICreateDiagnosisSuggestedOpInput
) {
  const diagnosis = await findDiagnosisById(db, diagnosisId, empresaId)
  return (db as PrismaClient).diagnosisSuggestedOperation.create({
    data: {
      empresaId,
      diagnosisId: diagnosis.id,
      operationId: data.operationId,
      description: data.description,
      estimatedMins: data.estimatedMins || 0,
      estimatedPrice: data.estimatedPrice || 0,
    },
  })
}

export async function addDiagnosisSuggestedPart(
  db: Db,
  diagnosisId: string,
  empresaId: string,
  data: ICreateDiagnosisSuggestedPartInput
) {
  const diagnosis = await findDiagnosisById(db, diagnosisId, empresaId)
  return (db as PrismaClient).diagnosisSuggestedPart.create({
    data: {
      empresaId,
      diagnosisId: diagnosis.id,
      itemId: data.itemId,
      description: data.description,
      quantity: data.quantity || 1,
      estimatedCost: data.estimatedCost || 0,
      estimatedPrice: data.estimatedPrice || 0,
    },
  })
}

export async function removeDiagnosisFinding(
  db: Db,
  findingId: string,
  empresaId: string
) {
  const item = await (db as PrismaClient).diagnosisFinding.findFirst({
    where: { id: findingId, empresaId },
  })
  if (!item) throw new NotFoundError('Hallazgo no encontrado')
  return (db as PrismaClient).diagnosisFinding.delete({
    where: { id: item.id },
  })
}
