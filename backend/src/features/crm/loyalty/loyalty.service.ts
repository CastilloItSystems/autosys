import { PrismaClient, Prisma } from '../../../generated/prisma/client.js'
import { PaginationHelper } from '../../../shared/utils/pagination.js'
import { CreateLoyaltyRecordDTO } from './loyalty.dto.js'

type PrismaClientType = PrismaClient | Prisma.TransactionClient

class LoyaltyService {
  async create(
    db: PrismaClientType,
    empresaId: string,
    userId: string,
    dto: CreateLoyaltyRecordDTO
  ): Promise<{ kind: 'event' | 'survey'; data: unknown }> {
    if (dto.type === 'EVENT') {
      const row = await (db as PrismaClient).loyaltyEvent.create({
        data: {
          empresaId,
          customerId: dto.customerId,
          type: (dto.eventType as any) ?? 'FOLLOW_UP',
          status: (dto.status as any) ?? 'PENDING',
          title: dto.title ?? 'Evento de fidelización',
          description: dto.description ?? null,
          suggestedAction: dto.suggestedAction ?? null,
          dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
          createdBy: userId,
        },
      })
      return { kind: 'event', data: row }
    }

    const row = await (db as PrismaClient).customerSurvey.create({
      data: {
        empresaId,
        customerId: dto.customerId,
        source: dto.source ?? 'NPS',
        score: dto.score ?? null,
        feedback: dto.feedback ?? null,
        createdBy: userId,
      },
    })

    return { kind: 'survey', data: row }
  }

  async getOverview(
    db: PrismaClientType,
    empresaId: string,
    filters: { customerId?: string; status?: string; type?: string },
    page: number,
    limit: number
  ): Promise<Record<string, unknown>> {
    const { skip, take } = PaginationHelper.validateAndParse({ page, limit })

    const eventWhere: Prisma.LoyaltyEventWhereInput = { empresaId }
    if (filters.customerId) eventWhere.customerId = filters.customerId
    if (filters.status) eventWhere.status = filters.status as any
    if (filters.type) eventWhere.type = filters.type as any

    const [events, eventsTotal, surveys, npsAvgAgg, pendingReactivation] = await Promise.all([
      (db as PrismaClient).loyaltyEvent.findMany({
        where: eventWhere,
        include: { customer: { select: { id: true, name: true, code: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      (db as PrismaClient).loyaltyEvent.count({ where: eventWhere }),
      (db as PrismaClient).customerSurvey.findMany({
        where: { empresaId, customerId: filters.customerId || undefined },
        include: { customer: { select: { id: true, name: true, code: true } } },
        orderBy: { submittedAt: 'desc' },
        take: 20,
      }),
      (db as PrismaClient).customerSurvey.aggregate({
        where: { empresaId, score: { not: null } },
        _avg: { score: true },
      }),
      (db as PrismaClient).loyaltyEvent.findMany({
        where: { empresaId, type: 'REACTIVATION_CONTACT', status: 'PENDING' },
        include: { customer: { select: { id: true, name: true, code: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ])

    const suggestedTasks = pendingReactivation.map((e) => ({
      id: e.id,
      label: `Reactivar cliente ${e.customer.name}`,
      dueAt: e.dueAt,
      customerId: e.customerId,
    }))

    return {
      events,
      surveys,
      metrics: {
        npsAverage: npsAvgAgg._avg.score ?? null,
        pendingEvents: events.filter((e) => e.status === 'PENDING').length,
      },
      suggestedTasks,
      meta: {
        page,
        limit,
        total: eventsTotal,
        totalPages: Math.ceil(eventsTotal / limit),
      },
    }
  }
}

export default new LoyaltyService()
