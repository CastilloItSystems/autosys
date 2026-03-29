// backend/src/features/crm/activities/activities.service.ts

import { PrismaClient, Prisma } from '../../../generated/prisma/client.js'
import { logger } from '../../../shared/utils/logger.js'
import { PaginationHelper } from '../../../shared/utils/pagination.js'
import { NotFoundError, BadRequestError } from '../../../shared/utils/apiError.js'
import { CreateActivityDTO, UpdateActivityDTO } from './activities.dto.js'
import { IActivity, IActivityFilters } from './activities.interface.js'

type PrismaClientType = PrismaClient | Prisma.TransactionClient

class ActivitiesService {
  // ---------------------------------------------------------------------------
  // CREATE
  // ---------------------------------------------------------------------------

  async create(
    data: CreateActivityDTO,
    empresaId: string,
    userId: string,
    db: PrismaClientType
  ): Promise<IActivity> {
    const activity = await (db as PrismaClient).activity.create({
      data: {
        customerId: data.customerId,
        type: (data.type as any),
        title: data.title,
        assignedTo: data.assignedTo,
        dueAt: new Date(data.dueAt),
        status: 'PENDING',
        leadId: data.leadId ?? null,
        description: data.description ?? null,
        createdBy: userId,
        empresaId,
      },
    })

    logger.info(`CRM - Actividad creada: ${activity.id}`, { title: activity.title, customerId: data.customerId, empresaId })
    return activity as unknown as IActivity
  }

  // ---------------------------------------------------------------------------
  // READ
  // ---------------------------------------------------------------------------

  async findById(id: string, empresaId: string, db: PrismaClientType): Promise<IActivity> {
    const activity = await (db as PrismaClient).activity.findFirst({
      where: { id, empresaId },
    })
    if (!activity) throw new NotFoundError('Actividad no encontrada')
    return activity as unknown as IActivity
  }

  async findAll(
    filters: IActivityFilters,
    page: number,
    limit: number,
    empresaId: string,
    db: PrismaClientType,
    sortBy: string = 'dueAt',
    sortOrder: 'asc' | 'desc' = 'asc'
  ): Promise<{ data: IActivity[]; total: number }> {
    const { skip, take } = PaginationHelper.validateAndParse({ page, limit })

    const where: Prisma.ActivityWhereInput = { empresaId }
    if (filters.customerId) where.customerId = filters.customerId
    if (filters.leadId) where.leadId = filters.leadId
    if (filters.assignedTo) where.assignedTo = filters.assignedTo
    if (filters.status) where.status = filters.status as any
    if (filters.type) where.type = filters.type as any
    if (filters.dueBefore || filters.dueAfter) {
      where.dueAt = {}
      if (filters.dueAfter) where.dueAt.gte = new Date(filters.dueAfter)
      if (filters.dueBefore) where.dueAt.lte = new Date(filters.dueBefore)
    }

    const validSortFields = new Set(['dueAt', 'createdAt', 'title', 'status'])
    const safeSortBy = validSortFields.has(sortBy) ? sortBy : 'dueAt'

    const [data, total] = await Promise.all([
      (db as PrismaClient).activity.findMany({
        where,
        orderBy: { [safeSortBy]: sortOrder },
        skip,
        take,
      }),
      (db as PrismaClient).activity.count({ where }),
    ])

    return { data: data as unknown as IActivity[], total }
  }

  // ---------------------------------------------------------------------------
  // COMPLETE
  // ---------------------------------------------------------------------------

  async complete(
    id: string,
    outcome: string | undefined,
    completedAt: string | undefined,
    userId: string,
    empresaId: string,
    db: PrismaClientType
  ): Promise<IActivity> {
    const activity = await (db as PrismaClient).activity.findFirst({
      where: { id, empresaId },
    })
    if (!activity) throw new NotFoundError('Actividad no encontrada')

    if (activity.status === 'DONE') {
      throw new BadRequestError('La actividad ya está completada')
    }
    if (activity.status === 'CANCELLED') {
      throw new BadRequestError('No se puede completar una actividad cancelada')
    }

    const updated = await (db as PrismaClient).activity.update({
      where: { id },
      data: {
        status: 'DONE',
        completedAt: completedAt ? new Date(completedAt) : new Date(),
        completedBy: userId,
        outcome: outcome ?? null,
      },
    })

    logger.info(`CRM - Actividad completada: ${id}`, { empresaId })
    return updated as unknown as IActivity
  }

  // ---------------------------------------------------------------------------
  // UPDATE
  // ---------------------------------------------------------------------------

  async update(
    id: string,
    data: UpdateActivityDTO,
    empresaId: string,
    db: PrismaClientType
  ): Promise<IActivity> {
    const activity = await (db as PrismaClient).activity.findFirst({
      where: { id, empresaId },
    })
    if (!activity) throw new NotFoundError('Actividad no encontrada')

    const updateData: Record<string, unknown> = {}
    if (data.customerId !== undefined) updateData.customerId = data.customerId
    if (data.type !== undefined) updateData.type = data.type
    if (data.title !== undefined) updateData.title = data.title
    if (data.assignedTo !== undefined) updateData.assignedTo = data.assignedTo
    if (data.dueAt !== undefined) updateData.dueAt = new Date(data.dueAt)
    if (data.leadId !== undefined) updateData.leadId = data.leadId || null
    if (data.description !== undefined) updateData.description = data.description || null
    if (data.status !== undefined) updateData.status = data.status

    const updated = await (db as PrismaClient).activity.update({
      where: { id },
      data: updateData,
    })

    logger.info(`CRM - Actividad actualizada: ${id}`, { empresaId })
    return updated as unknown as IActivity
  }

  // ---------------------------------------------------------------------------
  // DELETE
  // ---------------------------------------------------------------------------

  async delete(
    id: string,
    empresaId: string,
    db: PrismaClientType
  ): Promise<{ success: boolean; id: string }> {
    const activity = await (db as PrismaClient).activity.findFirst({
      where: { id, empresaId },
    })
    if (!activity) throw new NotFoundError('Actividad no encontrada')

    const status = activity.status as string
    if (status !== 'PENDING' && status !== 'CANCELLED') {
      throw new BadRequestError(
        `No se puede eliminar una actividad con estado ${status}. Solo se pueden eliminar actividades en estado PENDING o CANCELLED.`
      )
    }

    await (db as PrismaClient).activity.delete({ where: { id } })

    logger.info(`CRM - Actividad eliminada: ${id}`, { empresaId })
    return { success: true, id }
  }
}

export default new ActivitiesService()
