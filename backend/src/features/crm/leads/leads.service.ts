// backend/src/features/crm/leads/leads.service.ts

import { PrismaClient, Prisma } from '../../../generated/prisma/client.js'
import { logger } from '../../../shared/utils/logger.js'
import { PaginationHelper } from '../../../shared/utils/pagination.js'
import { NotFoundError, BadRequestError } from '../../../shared/utils/apiError.js'
import { domainEventBus } from '../../../shared/events/domain-event-bus.js'
import { toDomainEvent } from '../../../shared/events/domain-events.js'
import { CreateLeadDTO, UpdateLeadDTO } from './leads.dto.js'
import { ILead, ILeadFilters } from './leads.interface.js'
import { ConvertLeadDTO } from './leads.dto.js'

type PrismaClientType = PrismaClient | Prisma.TransactionClient

// Transiciones válidas por canal — cada canal tiene su pipeline
const CHANNEL_TRANSITIONS: Record<string, Record<string, string[]>> = {
  // TALLER: Solicitado → Diagnosticado → Valorado → Presupuestado → Aprobado → Cerrado
  TALLER: {
    NEW:         ['CONTACTED', 'PROPOSAL', 'WON', 'LOST'],
    CONTACTED:   ['QUALIFIED', 'PROPOSAL', 'WON', 'LOST'],
    QUALIFIED:   ['PROPOSAL', 'WON', 'LOST'],
    PROPOSAL:    ['NEGOTIATION', 'WON', 'LOST'],
    NEGOTIATION: ['WON', 'LOST'],
    WON: [], LOST: [],
  },
  // REPUESTOS: Nuevo → Contactado → Cotizado → Confirmado → Surtido
  REPUESTOS: {
    NEW:         ['CONTACTED', 'PROPOSAL', 'WON', 'LOST'],
    CONTACTED:   ['QUALIFIED', 'PROPOSAL', 'WON', 'LOST'],
    QUALIFIED:   ['PROPOSAL', 'WON', 'LOST'],
    PROPOSAL:    ['NEGOTIATION', 'WON', 'LOST'],
    NEGOTIATION: ['WON', 'LOST'],
    WON: [], LOST: [],
  },
  // VEHICULOS: Interesado → Contactado → Prueba → Propuesta → Negociación → Cerrado
  VEHICULOS: {
    NEW:         ['CONTACTED', 'LOST'],
    CONTACTED:   ['QUALIFIED', 'PROPOSAL', 'LOST'],
    QUALIFIED:   ['PROPOSAL', 'LOST'],
    PROPOSAL:    ['NEGOTIATION', 'WON', 'LOST'],
    NEGOTIATION: ['WON', 'LOST'],
    WON: [], LOST: [],
  },
}

// Fallback genérico
const DEFAULT_TRANSITIONS: Record<string, string[]> = {
  NEW:         ['CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'],
  CONTACTED:   ['QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'],
  QUALIFIED:   ['PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'],
  PROPOSAL:    ['NEGOTIATION', 'WON', 'LOST'],
  NEGOTIATION: ['WON', 'LOST'],
  WON: [], LOST: [],
}

function getAllowedTransitions(channel: string, currentStatus: string): string[] {
  return (CHANNEL_TRANSITIONS[channel] ?? DEFAULT_TRANSITIONS)[currentStatus] ?? []
}

class LeadsService {
  // ---------------------------------------------------------------------------
  // CREATE
  // ---------------------------------------------------------------------------

  async create(
    data: CreateLeadDTO,
    empresaId: string,
    db: PrismaClientType
  ): Promise<ILead> {
    const lead = await (db as PrismaClient).lead.create({
      data: {
        title: data.title,
        channel: (data.channel as any),
        source: (data.source as any),
        status: 'NEW',
        customerId: data.customerId ?? null,
        description: data.description ?? null,
        estimatedValue: data.estimatedValue ?? null,
        currency: data.currency ?? 'USD',
        assignedTo: data.assignedTo ?? null,
        expectedCloseAt: data.expectedCloseAt ? new Date(data.expectedCloseAt) : null,
        empresaId,
      },
    })

    logger.info(`CRM - Lead creado: ${lead.id}`, { title: lead.title, empresaId })

    try {
      await domainEventBus.publish(
        toDomainEvent({
          empresaId,
          eventCode: 'crm.lead.created',
          module: 'crm',
          title: `Lead creado: ${lead.title}`,
          message: `Se creó el lead ${lead.title}.`,
          type: 'info',
          entityType: 'LEAD',
          entityId: lead.id,
          priority: 'MEDIUM',
          severity: 'INFO',
          link: `/empresa/crm/leads/${lead.id}`,
          source: 'crm.leads',
          dedupKey: `crm.lead.created:${lead.id}`,
          metadata: {
            leadId: lead.id,
            title: lead.title,
            status: lead.status,
          },
          createdById: 'SYSTEM',
          createdByName: 'Sistema',
        })
      )
    } catch (publishError) {
      logger.error('Error publicando evento crm.lead.created', {
        leadId: lead.id,
        empresaId,
        error: publishError,
      })
    }

    return lead as unknown as ILead
  }

  // ---------------------------------------------------------------------------
  // READ
  // ---------------------------------------------------------------------------

  async findById(id: string, empresaId: string, db: PrismaClientType): Promise<ILead> {
    const lead = await (db as PrismaClient).lead.findFirst({
      where: { id, empresaId },
      include: {
        customer: {
          select: { id: true, name: true, code: true },
        },
        interactions: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        activities: {
          where: { status: { in: ['PENDING', 'IN_PROGRESS'] as any } },
          orderBy: { dueAt: 'asc' },
        },
      },
    })
    if (!lead) throw new NotFoundError('Lead no encontrado')
    return lead as unknown as ILead
  }

  async findAll(
    filters: ILeadFilters,
    page: number,
    limit: number,
    empresaId: string,
    db: PrismaClientType,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ data: ILead[]; total: number }> {
    const { skip, take } = PaginationHelper.validateAndParse({ page, limit })

    const where: Prisma.LeadWhereInput = { empresaId }
    if (filters.channel) where.channel = filters.channel as any
    if (filters.status) where.status = filters.status as any
    if (filters.assignedTo) where.assignedTo = filters.assignedTo
    if (filters.customerId) where.customerId = filters.customerId
    if (filters.search) {
      const search = filters.search.trim()
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {}
      if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom)
      if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo)
    }

    const validSortFields = new Set(['createdAt', 'expectedCloseAt', 'estimatedValue', 'title'])
    const safeSortBy = validSortFields.has(sortBy) ? sortBy : 'createdAt'

    const [data, total] = await Promise.all([
      (db as PrismaClient).lead.findMany({
        where,
        orderBy: { [safeSortBy]: sortOrder },
        skip,
        take,
        include: {
          customer: { select: { id: true, name: true, code: true } },
        },
      }),
      (db as PrismaClient).lead.count({ where }),
    ])

    return { data: data as unknown as ILead[], total }
  }

  // ---------------------------------------------------------------------------
  // UPDATE STATUS
  // ---------------------------------------------------------------------------

  async updateStatus(
    id: string,
    status: string,
    lostReason: string | undefined,
    closedAt: string | undefined,
    empresaId: string,
    db: PrismaClientType
  ): Promise<ILead> {
    const lead = await (db as PrismaClient).lead.findFirst({
      where: { id, empresaId },
    })
    if (!lead) throw new NotFoundError('Lead no encontrado')

    const currentStatus = lead.status as string
    const allowed = getAllowedTransitions(lead.channel as string, currentStatus)
    if (!allowed.includes(status)) {
      throw new BadRequestError(
        `No se puede cambiar el estado de ${currentStatus} a ${status}`
      )
    }

    const updateData: Record<string, unknown> = { status }
    if (status === 'WON' || status === 'LOST') {
      updateData.closedAt = closedAt ? new Date(closedAt) : new Date()
    }
    if (status === 'LOST' && lostReason) {
      updateData.lostReason = lostReason
    }

    const updated = await (db as PrismaClient).lead.update({
      where: { id },
      data: updateData,
    })

    logger.info(`CRM - Lead estado actualizado: ${id} → ${status}`, { empresaId })

    try {
      await domainEventBus.publish(
        toDomainEvent({
          empresaId,
          eventCode: 'crm.lead.status_changed',
          module: 'crm',
          title: `Lead actualizado: ${updated.title}`,
          message: `El lead ${updated.title} cambió de ${currentStatus} a ${status}.`,
          type: 'info',
          entityType: 'LEAD',
          entityId: updated.id,
          priority: 'MEDIUM',
          severity: 'INFO',
          link: `/empresa/crm/leads/${updated.id}`,
          source: 'crm.leads',
          dedupKey: `crm.lead.status_changed:${updated.id}:${status}`,
          metadata: {
            leadId: updated.id,
            previousStatus: currentStatus,
            status,
          },
          createdById: 'SYSTEM',
          createdByName: 'Sistema',
        })
      )
    } catch (publishError) {
      logger.error('Error publicando evento crm.lead.status_changed', {
        leadId: updated.id,
        empresaId,
        error: publishError,
      })
    }

    return updated as unknown as ILead
  }

  // ---------------------------------------------------------------------------
  // UPDATE
  // ---------------------------------------------------------------------------

  async update(
    id: string,
    data: UpdateLeadDTO,
    empresaId: string,
    db: PrismaClientType
  ): Promise<ILead> {
    const lead = await (db as PrismaClient).lead.findFirst({
      where: { id, empresaId },
    })
    if (!lead) throw new NotFoundError('Lead no encontrado')

    const updateData: Record<string, unknown> = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.channel !== undefined) updateData.channel = data.channel
    if (data.source !== undefined) updateData.source = data.source
    if (data.customerId !== undefined) updateData.customerId = data.customerId || null
    if (data.description !== undefined) updateData.description = data.description || null
    if (data.estimatedValue !== undefined) updateData.estimatedValue = data.estimatedValue ?? null
    if (data.currency !== undefined) updateData.currency = data.currency || 'USD'
    if (data.assignedTo !== undefined) updateData.assignedTo = data.assignedTo || null
    if (data.expectedCloseAt !== undefined)
      updateData.expectedCloseAt = data.expectedCloseAt ? new Date(data.expectedCloseAt) : null
    if (data.lostReason !== undefined) updateData.lostReason = data.lostReason || null
    if (data.closedAt !== undefined)
      updateData.closedAt = data.closedAt ? new Date(data.closedAt) : null

    const updated = await (db as PrismaClient).lead.update({
      where: { id },
      data: updateData,
    })

    logger.info(`CRM - Lead actualizado: ${id}`, { empresaId })
    return updated as unknown as ILead
  }

  // ---------------------------------------------------------------------------
  // DELETE
  // ---------------------------------------------------------------------------

  async delete(
    id: string,
    empresaId: string,
    db: PrismaClientType
  ): Promise<{ success: boolean; id: string }> {
    const lead = await (db as PrismaClient).lead.findFirst({
      where: { id, empresaId },
    })
    if (!lead) throw new NotFoundError('Lead no encontrado')

    const status = lead.status as string
    if (status !== 'NEW' && status !== 'LOST') {
      throw new BadRequestError(
        `No se puede eliminar un lead con estado ${status}. Solo se pueden eliminar leads en estado NEW o LOST.`
      )
    }

    await (db as PrismaClient).lead.delete({ where: { id } })

    logger.info(`CRM - Lead eliminado: ${id}`, { empresaId })
    return { success: true, id }
  }

  async convertToOpportunity(
    id: string,
    dto: ConvertLeadDTO,
    empresaId: string,
    userId: string,
    db: PrismaClientType
  ): Promise<Record<string, unknown>> {
    const lead = await (db as PrismaClient).lead.findFirst({
      where: { id, empresaId },
    })
    if (!lead) throw new NotFoundError('Lead no encontrado')

    const existing = await (db as PrismaClient).opportunity.findFirst({
      where: { leadId: id, empresaId },
      select: { id: true },
    })
    if (existing) {
      throw new BadRequestError('El lead ya fue convertido previamente')
    }

    const stageCode = dto.stageCode || 'DISCOVERY'
    const now = new Date()

    const created = await (db as PrismaClient).$transaction(async (tx) => {
      const opportunity = await tx.opportunity.create({
        data: {
          empresaId,
          leadId: lead.id,
          customerId: lead.customerId ?? null,
          campaignId: dto.campaignId ?? lead.campaignId ?? null,
          channel: lead.channel as any,
          stageCode,
          status: 'OPEN',
          title: lead.title,
          description: dto.notes ?? lead.description ?? null,
          amount: dto.amount ?? lead.estimatedValue ?? null,
          currency: lead.currency ?? 'USD',
          ownerId: dto.ownerId || userId,
          nextActivityAt: new Date(dto.nextActivityAt),
          expectedCloseAt: dto.expectedCloseAt
            ? new Date(dto.expectedCloseAt)
            : lead.expectedCloseAt ?? null,
          createdBy: userId,
          stageHistory: {
            create: {
              empresaId,
              fromStage: null,
              toStage: stageCode,
              changedBy: userId,
              notes: 'Conversión desde lead',
            },
          },
        },
      })

      await tx.lead.update({
        where: { id: lead.id },
        data: {
          status: 'WON',
          closedAt: now,
          campaignId: dto.campaignId ?? lead.campaignId ?? null,
        },
      })

      return opportunity
    })

    logger.info(`CRM - Lead convertido a oportunidad: ${id}`, {
      empresaId,
      opportunityId: created.id,
    })

    try {
      await domainEventBus.publish(
        toDomainEvent({
          empresaId,
          eventCode: 'crm.lead.converted',
          module: 'crm',
          title: `Lead convertido: ${lead.title}`,
          message: `El lead ${lead.title} se convirtió en oportunidad.`,
          type: 'success',
          entityType: 'LEAD',
          entityId: id,
          priority: 'MEDIUM',
          severity: 'SUCCESS',
          link: `/empresa/crm/oportunidades/${created.id}`,
          source: 'crm.leads',
          dedupKey: `crm.lead.converted:${id}`,
          metadata: {
            leadId: id,
            opportunityId: created.id,
          },
          createdById: userId,
          createdByName: 'Sistema',
        })
      )
    } catch (publishError) {
      logger.error('Error publicando evento crm.lead.converted', {
        leadId: id,
        empresaId,
        error: publishError,
      })
    }

    return {
      leadId: id,
      opportunityId: created.id,
      status: 'converted',
    }
  }
}

export default new LeadsService()
