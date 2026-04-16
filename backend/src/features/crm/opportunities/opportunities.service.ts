import { PrismaClient, Prisma } from '../../../generated/prisma/client.js'
import { logger } from '../../../shared/utils/logger.js'
import { PaginationHelper } from '../../../shared/utils/pagination.js'
import { BadRequestError, NotFoundError } from '../../../shared/utils/apiError.js'
import {
  CloseOpportunityDTO,
  CreateOpportunityDTO,
  UpdateOpportunityDTO,
  UpdateOpportunityStageDTO,
} from './opportunities.dto.js'
import { IOpportunity, IOpportunityFilters } from './opportunities.interface.js'

type PrismaClientType = PrismaClient | Prisma.TransactionClient

const DEFAULT_STAGE_FLOW: Record<string, string[]> = {
  REPUESTOS: ['DISCOVERY', 'QUOTED', 'NEGOTIATION', 'COMMITTED'],
  TALLER: ['DIAGNOSIS', 'VALUATION', 'QUOTE_SENT', 'APPROVAL_PENDING'],
  VEHICULOS: ['CONTACT', 'TEST_DRIVE', 'PROPOSAL', 'NEGOTIATION'],
}

function defaultFirstStage(channel: string): string {
  return DEFAULT_STAGE_FLOW[channel]?.[0] ?? 'DISCOVERY'
}

class OpportunitiesService {
  private async resolveStageFlow(
    db: PrismaClientType,
    empresaId: string,
    channel: string
  ): Promise<string[]> {
    const configs = await (db as PrismaClient).opportunityStageConfig.findMany({
      where: { empresaId, channel: channel as any, isActive: true },
      orderBy: { position: 'asc' },
      select: { code: true },
    })

    if (configs.length > 0) return configs.map((c) => c.code)
    return DEFAULT_STAGE_FLOW[channel] ?? ['DISCOVERY', 'QUALIFIED', 'NEGOTIATION']
  }

  private validateStageTransition(flow: string[], from: string, to: string): void {
    const fromIdx = flow.indexOf(from)
    const toIdx = flow.indexOf(to)
    if (fromIdx === -1 || toIdx === -1) {
      throw new BadRequestError(`Etapa inválida. Etapas permitidas: ${flow.join(', ')}`)
    }
    if (toIdx < fromIdx) {
      throw new BadRequestError('No se permite retroceder de etapa en este flujo')
    }
    if (toIdx === fromIdx) {
      throw new BadRequestError('La oportunidad ya se encuentra en esa etapa')
    }
  }

  async create(
    db: PrismaClientType,
    empresaId: string,
    userId: string,
    dto: CreateOpportunityDTO
  ): Promise<IOpportunity> {
    if (!dto.nextActivityAt) {
      throw new BadRequestError('nextActivityAt es obligatorio')
    }

    const flow = await this.resolveStageFlow(db, empresaId, dto.channel)
    const stageCode = dto.stageCode ?? defaultFirstStage(dto.channel)

    if (!flow.includes(stageCode)) {
      throw new BadRequestError(`stageCode inválido para canal ${dto.channel}`)
    }

    if (dto.leadId) {
      const lead = await (db as PrismaClient).lead.findFirst({ where: { id: dto.leadId, empresaId } })
      if (!lead) throw new NotFoundError('Lead no encontrado')
      const existingOpportunity = await (db as PrismaClient).opportunity.findFirst({
        where: { leadId: dto.leadId, empresaId },
      })
      if (existingOpportunity) {
        throw new BadRequestError('El lead ya fue convertido en oportunidad')
      }
    }

    const created = await (db as PrismaClient).opportunity.create({
      data: {
        empresaId,
        leadId: dto.leadId ?? null,
        customerId: dto.customerId ?? null,
        campaignId: dto.campaignId ?? null,
        channel: dto.channel as any,
        stageCode,
        status: 'OPEN',
        title: dto.title,
        description: dto.description ?? null,
        amount: dto.amount ?? null,
        currency: dto.currency ?? 'USD',
          ownerId: dto.ownerId || userId,
        nextActivityAt: new Date(dto.nextActivityAt),
        expectedCloseAt: dto.expectedCloseAt ? new Date(dto.expectedCloseAt) : null,
        createdBy: userId,
        stageHistory: {
          create: {
            empresaId,
            fromStage: null,
            toStage: stageCode,
            changedBy: userId,
            notes: 'Creación de oportunidad',
          },
        },
      },
    })

    logger.info(`CRM - Oportunidad creada: ${created.id}`, { empresaId, channel: dto.channel })
    return created as unknown as IOpportunity
  }

  async findById(db: PrismaClientType, empresaId: string, id: string): Promise<IOpportunity> {
    const row = await (db as PrismaClient).opportunity.findFirst({
      where: { id, empresaId },
      include: {
        customer: { select: { id: true, name: true, code: true } },
        lead: { select: { id: true, title: true, status: true } },
        campaign: { select: { id: true, name: true, status: true } },
        lostReason: { select: { id: true, code: true, label: true } },
        stageHistory: { orderBy: { changedAt: 'desc' }, take: 25 },
        activityLinks: {
          include: { activity: { select: { id: true, title: true, status: true, dueAt: true } } },
          take: 25,
          orderBy: { linkedAt: 'desc' },
        },
      },
    })
    if (!row) throw new NotFoundError('Oportunidad no encontrada')
    return row as unknown as IOpportunity
  }

  async findAll(
    db: PrismaClientType,
    empresaId: string,
    filters: IOpportunityFilters,
    page: number,
    limit: number,
    sortBy: string,
    sortOrder: 'asc' | 'desc'
  ): Promise<{ data: IOpportunity[]; total: number }> {
    const { skip, take } = PaginationHelper.validateAndParse({ page, limit })

    const where: Prisma.OpportunityWhereInput = { empresaId }
    if (filters.channel) where.channel = filters.channel as any
    if (filters.stageCode) where.stageCode = filters.stageCode
    if (filters.status) where.status = filters.status as any
    if (filters.ownerId) where.ownerId = filters.ownerId
    if (filters.customerId) where.customerId = filters.customerId
    if (filters.campaignId) where.campaignId = filters.campaignId
    if (filters.amountMin !== undefined || filters.amountMax !== undefined) {
      where.amount = {}
      if (filters.amountMin !== undefined) where.amount.gte = filters.amountMin
      if (filters.amountMax !== undefined) where.amount.lte = filters.amountMax
    }
    if (filters.expectedFrom || filters.expectedTo) {
      where.expectedCloseAt = {}
      if (filters.expectedFrom) where.expectedCloseAt.gte = new Date(filters.expectedFrom)
      if (filters.expectedTo) where.expectedCloseAt.lte = new Date(filters.expectedTo)
    }
    if (filters.search) {
      const search = filters.search.trim()
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const validSortFields = new Set(['createdAt', 'updatedAt', 'expectedCloseAt', 'amount', 'title'])
    const safeSortBy = validSortFields.has(sortBy) ? sortBy : 'createdAt'

    const [data, total] = await Promise.all([
      (db as PrismaClient).opportunity.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, code: true } },
          lead: { select: { id: true, title: true } },
          campaign: { select: { id: true, name: true } },
        },
        orderBy: { [safeSortBy]: sortOrder },
        skip,
        take,
      }),
      (db as PrismaClient).opportunity.count({ where }),
    ])

    return { data: data as unknown as IOpportunity[], total }
  }

  async update(
    db: PrismaClientType,
    empresaId: string,
    id: string,
    dto: UpdateOpportunityDTO
  ): Promise<IOpportunity> {
    const row = await (db as PrismaClient).opportunity.findFirst({ where: { id, empresaId } })
    if (!row) throw new NotFoundError('Oportunidad no encontrada')

    if (row.status === 'OPEN') {
      const nextOwner = dto.ownerId ?? row.ownerId
      const nextActivity = dto.nextActivityAt ? new Date(dto.nextActivityAt) : row.nextActivityAt
      if (!nextOwner || !nextActivity) {
        throw new BadRequestError('Las oportunidades activas requieren owner y nextActivityAt')
      }
    }

    const updateData: Record<string, unknown> = {}
    if (dto.customerId !== undefined) updateData.customerId = dto.customerId || null
    if (dto.campaignId !== undefined) updateData.campaignId = dto.campaignId || null
    if (dto.title !== undefined) updateData.title = dto.title
    if (dto.description !== undefined) updateData.description = dto.description || null
    if (dto.amount !== undefined) updateData.amount = dto.amount ?? null
    if (dto.currency !== undefined) updateData.currency = dto.currency || 'USD'
    if (dto.ownerId !== undefined) updateData.ownerId = dto.ownerId
    if (dto.nextActivityAt !== undefined) updateData.nextActivityAt = new Date(dto.nextActivityAt)
    if (dto.expectedCloseAt !== undefined)
      updateData.expectedCloseAt = dto.expectedCloseAt ? new Date(dto.expectedCloseAt) : null

    if (dto.stageCode !== undefined) {
      const flow = await this.resolveStageFlow(db, empresaId, row.channel as string)
      if (!flow.includes(dto.stageCode)) throw new BadRequestError('stageCode inválido para el canal')
      updateData.stageCode = dto.stageCode
    }

    const updated = await (db as PrismaClient).opportunity.update({
      where: { id },
      data: updateData,
    })

    return updated as unknown as IOpportunity
  }

  async updateStage(
    db: PrismaClientType,
    empresaId: string,
    id: string,
    userId: string,
    dto: UpdateOpportunityStageDTO
  ): Promise<IOpportunity> {
    const row = await (db as PrismaClient).opportunity.findFirst({ where: { id, empresaId } })
    if (!row) throw new NotFoundError('Oportunidad no encontrada')
    if (row.status !== 'OPEN') throw new BadRequestError('Solo se puede mover etapa en oportunidades abiertas')

    const flow = await this.resolveStageFlow(db, empresaId, row.channel as string)
    this.validateStageTransition(flow, row.stageCode, dto.stageCode)

    const updated = await (db as PrismaClient).opportunity.update({
      where: { id },
      data: {
        stageCode: dto.stageCode,
        stageHistory: {
          create: {
            empresaId,
            fromStage: row.stageCode,
            toStage: dto.stageCode,
            changedBy: userId,
            notes: dto.notes ?? null,
          },
        },
      },
    })

    return updated as unknown as IOpportunity
  }

  async close(
    db: PrismaClientType,
    empresaId: string,
    id: string,
    userId: string,
    dto: CloseOpportunityDTO
  ): Promise<IOpportunity> {
    const row = await (db as PrismaClient).opportunity.findFirst({ where: { id, empresaId } })
    if (!row) throw new NotFoundError('Oportunidad no encontrada')
    if (row.status !== 'OPEN') throw new BadRequestError('La oportunidad ya está cerrada')

    if (dto.result === 'LOST' && !dto.lostReasonText) {
      throw new BadRequestError('lostReasonText es requerido cuando el resultado es LOST')
    }

    if (dto.lostReasonId) {
      const reason = await (db as PrismaClient).opportunityLossReason.findFirst({
        where: { id: dto.lostReasonId, empresaId, isActive: true },
      })
      if (!reason) throw new NotFoundError('Motivo de pérdida no encontrado')
    }

    const status = dto.result as 'WON' | 'LOST'
    const now = new Date()

    const updated = await (db as PrismaClient).opportunity.update({
      where: { id },
      data: {
        status,
        wonAt: status === 'WON' ? now : null,
        lostAt: status === 'LOST' ? now : null,
        lostReasonId: status === 'LOST' ? dto.lostReasonId ?? null : null,
        lostReasonText: status === 'LOST' ? dto.lostReasonText ?? null : null,
        stageHistory: {
          create: {
            empresaId,
            fromStage: row.stageCode,
            toStage: status,
            changedBy: userId,
            notes: dto.notes ?? null,
          },
        },
      },
    })

    return updated as unknown as IOpportunity
  }

  async getStageConfigs(db: PrismaClientType, empresaId: string, channel?: string): Promise<unknown[]> {
    const rows = await (db as PrismaClient).opportunityStageConfig.findMany({
      where: {
        empresaId,
        channel: channel ? (channel as any) : undefined,
      },
      orderBy: [{ channel: 'asc' }, { position: 'asc' }],
    })
    return rows
  }

  async createStageConfig(
    db: PrismaClientType,
    empresaId: string,
    data: { channel: string; code: string; label: string; position: number; isTerminal?: boolean }
  ): Promise<unknown> {
    return (db as PrismaClient).opportunityStageConfig.create({
      data: {
        empresaId,
        channel: data.channel as any,
        code: data.code,
        label: data.label,
        position: data.position,
        isTerminal: data.isTerminal ?? false,
      },
    })
  }

  async getLossReasons(db: PrismaClientType, empresaId: string): Promise<unknown[]> {
    return (db as PrismaClient).opportunityLossReason.findMany({
      where: { empresaId },
      orderBy: { label: 'asc' },
    })
  }

  async createLossReason(
    db: PrismaClientType,
    empresaId: string,
    data: { code: string; label: string; isActive?: boolean }
  ): Promise<unknown> {
    return (db as PrismaClient).opportunityLossReason.create({
      data: {
        empresaId,
        code: data.code,
        label: data.label,
        isActive: data.isActive ?? true,
      },
    })
  }
}

export default new OpportunitiesService()
