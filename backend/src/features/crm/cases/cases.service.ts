// backend/src/features/crm/cases/cases.service.ts

import { PrismaClient, Prisma } from '../../../generated/prisma/client.js'
import { logger } from '../../../shared/utils/logger.js'
import { PaginationHelper } from '../../../shared/utils/pagination.js'
import { NotFoundError, BadRequestError } from '../../../shared/utils/apiError.js'
import { CreateCaseDTO, UpdateCaseDTO, UpdateCaseStatusDTO, AddCommentDTO } from './cases.dto.js'
import { ICase, ICaseFilters } from './cases.interface.js'

type PrismaClientType = PrismaClient | Prisma.TransactionClient

// ── SLA hours by priority ─────────────────────────────────────────────────────

const SLA_HOURS: Record<string, number> = {
  CRITICAL: 4,
  HIGH: 24,
  MEDIUM: 72,
  LOW: 168,
}

// ── Valid status transitions ──────────────────────────────────────────────────

const STATUS_TRANSITIONS: Record<string, string[]> = {
  OPEN: ['IN_ANALYSIS', 'IN_PROGRESS', 'WAITING_CLIENT', 'ESCALATED', 'RESOLVED', 'CLOSED', 'REJECTED'],
  IN_ANALYSIS: ['IN_PROGRESS', 'WAITING_CLIENT', 'ESCALATED', 'RESOLVED', 'CLOSED', 'REJECTED'],
  IN_PROGRESS: ['WAITING_CLIENT', 'ESCALATED', 'RESOLVED', 'CLOSED', 'REJECTED'],
  WAITING_CLIENT: ['IN_PROGRESS', 'ESCALATED', 'RESOLVED', 'CLOSED', 'REJECTED'],
  ESCALATED: ['IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED'],
  RESOLVED: ['CLOSED'],
  CLOSED: [],
  REJECTED: [],
}

// ── Terminal statuses ─────────────────────────────────────────────────────────

const TERMINAL_STATUSES = new Set(['CLOSED', 'REJECTED'])

// ── Helpers ───────────────────────────────────────────────────────────────────

async function generateCaseNumber(db: PrismaClientType, empresaId: string): Promise<string> {
  const last = await (db as PrismaClient).case.findFirst({
    where: { empresaId },
    orderBy: { caseNumber: 'desc' },
    select: { caseNumber: true },
  })

  let nextNum = 1
  if (last?.caseNumber) {
    const match = last.caseNumber.match(/^CASE-(\d+)$/)
    if (match) {
      nextNum = parseInt(match[1], 10) + 1
    }
  }

  return `CASE-${String(nextNum).padStart(4, '0')}`
}

function calcSlaDeadline(priority: string): Date {
  const hours = SLA_HOURS[priority] ?? 72
  const deadline = new Date()
  deadline.setHours(deadline.getHours() + hours)
  return deadline
}

// ── Service ───────────────────────────────────────────────────────────────────

class CasesService {
  // ---------------------------------------------------------------------------
  // CREATE
  // ---------------------------------------------------------------------------

  async create(
    db: PrismaClientType,
    empresaId: string,
    userId: string,
    dto: CreateCaseDTO
  ): Promise<ICase> {
    // Validate customer belongs to empresa
    const customer = await (db as PrismaClient).customer.findFirst({
      where: { id: dto.customerId, empresaId },
    })
    if (!customer) throw new NotFoundError('Cliente no encontrado')

    // Validate customerVehicle if provided
    if (dto.customerVehicleId) {
      const vehicle = await (db as PrismaClient).customerVehicle.findFirst({
        where: { id: dto.customerVehicleId, empresaId },
      })
      if (!vehicle) throw new NotFoundError('Vehículo del cliente no encontrado')
    }

    // Validate lead if provided
    if (dto.leadId) {
      const lead = await (db as PrismaClient).lead.findFirst({
        where: { id: dto.leadId, empresaId },
      })
      if (!lead) throw new NotFoundError('Lead no encontrado')
    }

    const caseNumber = await generateCaseNumber(db, empresaId)
    const priority = (dto.priority ?? 'MEDIUM') as string
    const slaDeadline = calcSlaDeadline(priority)

    const caseRecord = await (db as PrismaClient).case.create({
      data: {
        caseNumber,
        type: dto.type as any,
        priority: priority as any,
        status: 'OPEN',
        customerId: dto.customerId,
        customerVehicleId: dto.customerVehicleId ?? null,
        leadId: dto.leadId ?? null,
        refDocType: dto.refDocType ?? null,
        refDocId: dto.refDocId ?? null,
        refDocNumber: dto.refDocNumber ?? null,
        title: dto.title,
        description: dto.description,
        slaDeadline,
        assignedTo: dto.assignedTo ?? null,
        createdBy: userId,
        empresaId,
      },
      include: {
        customer: { select: { id: true, name: true, code: true } },
        customerVehicle: { select: { id: true, plate: true } },
        lead: { select: { id: true, title: true, channel: true } },
      },
    })

    logger.info(`CRM - Caso creado: ${caseRecord.id}`, { caseNumber, empresaId })
    return caseRecord as unknown as ICase
  }

  // ---------------------------------------------------------------------------
  // FIND ALL
  // ---------------------------------------------------------------------------

  async findAll(
    db: PrismaClientType,
    empresaId: string,
    filters: ICaseFilters
  ): Promise<{ data: ICase[]; total: number }> {
    const page = filters.page ?? 1
    const limit = filters.limit ?? 20
    const { skip, take } = PaginationHelper.validateAndParse({ page, limit })

    const where: Prisma.CaseWhereInput = { empresaId }

    if (filters.type) where.type = filters.type as any
    if (filters.priority) where.priority = filters.priority as any
    if (filters.status) where.status = filters.status as any
    if (filters.customerId) where.customerId = filters.customerId
    if (filters.assignedTo) where.assignedTo = filters.assignedTo

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { caseNumber: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {}
      if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom)
      if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo)
    }

    const validSortFields = new Set(['createdAt', 'slaDeadline', 'priority', 'status'])
    const safeSortBy = validSortFields.has(filters.sortBy ?? '') ? filters.sortBy! : 'createdAt'
    const sortOrder = filters.sortOrder ?? 'desc'

    const [data, total] = await Promise.all([
      (db as PrismaClient).case.findMany({
        where,
        orderBy: { [safeSortBy]: sortOrder },
        skip,
        take,
        include: {
          customer: { select: { id: true, name: true, code: true } },
        },
      }),
      (db as PrismaClient).case.count({ where }),
    ])

    return { data: data as unknown as ICase[], total }
  }

  // ---------------------------------------------------------------------------
  // FIND BY ID
  // ---------------------------------------------------------------------------

  async findById(db: PrismaClientType, id: string, empresaId: string): Promise<ICase> {
    const caseRecord = await (db as PrismaClient).case.findFirst({
      where: { id, empresaId },
      include: {
        customer: { select: { id: true, name: true, code: true, phone: true, mobile: true } },
        customerVehicle: { select: { id: true, plate: true } },
        lead: { select: { id: true, title: true, channel: true } },
        comments: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!caseRecord) throw new NotFoundError('Caso no encontrado')
    return caseRecord as unknown as ICase
  }

  // ---------------------------------------------------------------------------
  // UPDATE
  // ---------------------------------------------------------------------------

  async update(
    db: PrismaClientType,
    id: string,
    empresaId: string,
    dto: UpdateCaseDTO
  ): Promise<ICase> {
    const caseRecord = await (db as PrismaClient).case.findFirst({
      where: { id, empresaId },
    })
    if (!caseRecord) throw new NotFoundError('Caso no encontrado')

    if (TERMINAL_STATUSES.has(caseRecord.status as string)) {
      throw new BadRequestError(
        `No se puede editar un caso en estado terminal: ${caseRecord.status}`
      )
    }

    // Validate customerVehicle if changed
    if (dto.customerVehicleId) {
      const vehicle = await (db as PrismaClient).customerVehicle.findFirst({
        where: { id: dto.customerVehicleId, empresaId },
      })
      if (!vehicle) throw new NotFoundError('Vehículo del cliente no encontrado')
    }

    // Validate lead if changed
    if (dto.leadId) {
      const lead = await (db as PrismaClient).lead.findFirst({
        where: { id: dto.leadId, empresaId },
      })
      if (!lead) throw new NotFoundError('Lead no encontrado')
    }

    const updateData: Record<string, unknown> = {}
    if (dto.title !== undefined) updateData.title = dto.title
    if (dto.description !== undefined) updateData.description = dto.description
    if (dto.priority !== undefined) updateData.priority = dto.priority
    if (dto.assignedTo !== undefined) updateData.assignedTo = dto.assignedTo ?? null
    if (dto.customerVehicleId !== undefined) updateData.customerVehicleId = dto.customerVehicleId ?? null
    if (dto.leadId !== undefined) updateData.leadId = dto.leadId ?? null
    if (dto.refDocType !== undefined) updateData.refDocType = dto.refDocType ?? null
    if (dto.refDocId !== undefined) updateData.refDocId = dto.refDocId ?? null
    if (dto.refDocNumber !== undefined) updateData.refDocNumber = dto.refDocNumber ?? null

    const updated = await (db as PrismaClient).case.update({
      where: { id },
      data: updateData,
      include: {
        customer: { select: { id: true, name: true, code: true } },
        customerVehicle: { select: { id: true, plate: true } },
        lead: { select: { id: true, title: true, channel: true } },
      },
    })

    logger.info(`CRM - Caso actualizado: ${id}`, { empresaId })
    return updated as unknown as ICase
  }

  // ---------------------------------------------------------------------------
  // UPDATE STATUS
  // ---------------------------------------------------------------------------

  async updateStatus(
    db: PrismaClientType,
    id: string,
    empresaId: string,
    dto: UpdateCaseStatusDTO
  ): Promise<ICase> {
    const caseRecord = await (db as PrismaClient).case.findFirst({
      where: { id, empresaId },
    })
    if (!caseRecord) throw new NotFoundError('Caso no encontrado')

    const currentStatus = caseRecord.status as string
    const allowedNext = STATUS_TRANSITIONS[currentStatus] ?? []

    if (!allowedNext.includes(dto.status)) {
      throw new BadRequestError(
        `No se puede cambiar el estado de ${currentStatus} a ${dto.status}. ` +
        `Transiciones válidas: ${allowedNext.length ? allowedNext.join(', ') : 'ninguna (estado terminal)'}`
      )
    }

    // Require resolution text when resolving or closing
    if ((dto.status === 'RESOLVED' || dto.status === 'CLOSED') && !dto.resolution) {
      throw new BadRequestError(
        `El campo "resolution" es requerido al cambiar el estado a ${dto.status}`
      )
    }

    const updateData: Record<string, unknown> = { status: dto.status }

    if (dto.resolution !== undefined) updateData.resolution = dto.resolution ?? null
    if (dto.rootCause !== undefined) updateData.rootCause = dto.rootCause ?? null

    if (dto.status === 'RESOLVED') {
      updateData.resolvedAt = new Date()
    }

    if (dto.status === 'CLOSED') {
      updateData.closedAt = new Date()
    }

    const updated = await (db as PrismaClient).case.update({
      where: { id },
      data: updateData,
      include: {
        customer: { select: { id: true, name: true, code: true } },
        customerVehicle: { select: { id: true, plate: true } },
        lead: { select: { id: true, title: true, channel: true } },
      },
    })

    logger.info(`CRM - Caso estado actualizado: ${id} → ${dto.status}`, { empresaId })
    return updated as unknown as ICase
  }

  // ---------------------------------------------------------------------------
  // ADD COMMENT
  // ---------------------------------------------------------------------------

  async addComment(
    db: PrismaClientType,
    id: string,
    empresaId: string,
    userId: string,
    dto: AddCommentDTO
  ): Promise<{ id: string; caseId: string; comment: string; isInternal: boolean; createdBy: string; createdAt: Date }> {
    const caseRecord = await (db as PrismaClient).case.findFirst({
      where: { id, empresaId },
    })
    if (!caseRecord) throw new NotFoundError('Caso no encontrado')

    const comment = await (db as PrismaClient).caseComment.create({
      data: {
        caseId: id,
        comment: dto.comment,
        isInternal: dto.isInternal ?? false,
        createdBy: userId,
      },
    })

    logger.info(`CRM - Comentario agregado al caso: ${id}`, { empresaId })
    return comment
  }

  // ---------------------------------------------------------------------------
  // DELETE
  // ---------------------------------------------------------------------------

  async delete(
    db: PrismaClientType,
    id: string,
    empresaId: string
  ): Promise<{ success: boolean; id: string }> {
    const caseRecord = await (db as PrismaClient).case.findFirst({
      where: { id, empresaId },
    })
    if (!caseRecord) throw new NotFoundError('Caso no encontrado')

    if ((caseRecord.status as string) !== 'OPEN') {
      throw new BadRequestError(
        `Solo se pueden eliminar casos en estado OPEN. Estado actual: ${caseRecord.status}`
      )
    }

    await (db as PrismaClient).case.delete({ where: { id } })

    logger.info(`CRM - Caso eliminado: ${id}`, { empresaId })
    return { success: true, id }
  }
}

export default new CasesService()
