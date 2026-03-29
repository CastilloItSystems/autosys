// backend/src/features/crm/interactions/interactions.service.ts

import { PrismaClient, Prisma } from '../../../generated/prisma/client.js'
import { logger } from '../../../shared/utils/logger.js'
import { PaginationHelper } from '../../../shared/utils/pagination.js'
import { NotFoundError, BadRequestError } from '../../../shared/utils/apiError.js'
import { CreateInteractionDTO, UpdateInteractionDTO } from './interactions.dto.js'
import { IInteraction, IInteractionFilters } from './interactions.interface.js'

type PrismaClientType = PrismaClient | Prisma.TransactionClient

class InteractionsService {
  // ---------------------------------------------------------------------------
  // CREATE
  // ---------------------------------------------------------------------------

  async create(
    data: CreateInteractionDTO,
    empresaId: string,
    userId: string,
    db: PrismaClientType
  ): Promise<IInteraction> {
    const interaction = await (db as PrismaClient).interaction.create({
      data: {
        customerId: data.customerId,
        type: (data.type as any),
        notes: data.notes,
        channel: (data.channel as any) ?? 'GENERAL',
        direction: (data.direction as any) ?? 'OUTBOUND',
        subject: data.subject ?? null,
        outcome: data.outcome ?? null,
        nextAction: data.nextAction ?? null,
        nextActionAt: data.nextActionAt ? new Date(data.nextActionAt) : null,
        leadId: data.leadId ?? null,
        createdBy: userId,
        empresaId,
      },
    })

    logger.info(`CRM - Interacción creada: ${interaction.id}`, { customerId: data.customerId, empresaId })
    return interaction as unknown as IInteraction
  }

  // ---------------------------------------------------------------------------
  // READ
  // ---------------------------------------------------------------------------

  async findById(id: string, empresaId: string, db: PrismaClientType): Promise<IInteraction> {
    const interaction = await (db as PrismaClient).interaction.findFirst({
      where: { id, empresaId },
    })
    if (!interaction) throw new NotFoundError('Interacción no encontrada')
    return interaction as unknown as IInteraction
  }

  async findAll(
    filters: IInteractionFilters,
    page: number,
    limit: number,
    empresaId: string,
    db: PrismaClientType,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ data: IInteraction[]; total: number }> {
    const { skip, take } = PaginationHelper.validateAndParse({ page, limit })

    const where: Prisma.InteractionWhereInput = { empresaId }
    if (filters.customerId) where.customerId = filters.customerId
    if (filters.leadId) where.leadId = filters.leadId
    if (filters.type) where.type = filters.type as any
    if (filters.channel) where.channel = filters.channel as any
    if (filters.createdBy) where.createdBy = filters.createdBy
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {}
      if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom)
      if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo)
    }

    const validSortFields = new Set(['createdAt', 'type', 'channel'])
    const safeSortBy = validSortFields.has(sortBy) ? sortBy : 'createdAt'

    const [data, total] = await Promise.all([
      (db as PrismaClient).interaction.findMany({
        where,
        orderBy: { [safeSortBy]: sortOrder },
        skip,
        take,
      }),
      (db as PrismaClient).interaction.count({ where }),
    ])

    return { data: data as unknown as IInteraction[], total }
  }

  // ---------------------------------------------------------------------------
  // UPDATE
  // ---------------------------------------------------------------------------

  async update(
    id: string,
    data: UpdateInteractionDTO,
    empresaId: string,
    db: PrismaClientType
  ): Promise<IInteraction> {
    const interaction = await (db as PrismaClient).interaction.findFirst({
      where: { id, empresaId },
    })
    if (!interaction) throw new NotFoundError('Interacción no encontrada')

    const updateData: Record<string, unknown> = {}
    if (data.type !== undefined) updateData.type = data.type
    if (data.notes !== undefined) updateData.notes = data.notes
    if (data.channel !== undefined) updateData.channel = data.channel
    if (data.direction !== undefined) updateData.direction = data.direction
    if (data.subject !== undefined) updateData.subject = data.subject || null
    if (data.outcome !== undefined) updateData.outcome = data.outcome || null
    if (data.nextAction !== undefined) updateData.nextAction = data.nextAction || null
    if (data.nextActionAt !== undefined)
      updateData.nextActionAt = data.nextActionAt ? new Date(data.nextActionAt) : null
    if (data.leadId !== undefined) updateData.leadId = data.leadId || null

    const updated = await (db as PrismaClient).interaction.update({
      where: { id },
      data: updateData,
    })

    logger.info(`CRM - Interacción actualizada: ${id}`, { empresaId })
    return updated as unknown as IInteraction
  }

  // ---------------------------------------------------------------------------
  // DELETE
  // ---------------------------------------------------------------------------

  async delete(
    id: string,
    empresaId: string,
    db: PrismaClientType
  ): Promise<{ success: boolean; id: string }> {
    const interaction = await (db as PrismaClient).interaction.findFirst({
      where: { id, empresaId },
    })
    if (!interaction) throw new NotFoundError('Interacción no encontrada')

    await (db as PrismaClient).interaction.delete({ where: { id } })

    logger.info(`CRM - Interacción eliminada: ${id}`, { empresaId })
    return { success: true, id }
  }
}

export default new InteractionsService()
