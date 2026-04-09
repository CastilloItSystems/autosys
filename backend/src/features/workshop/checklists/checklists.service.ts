// backend/src/features/workshop/checklists/checklists.service.ts
import { PrismaClient, Prisma } from '../../../generated/prisma/client.js'
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
} from '../../../shared/utils/apiError.js'
import { PaginationHelper } from '../../../shared/utils/pagination.js'
import { logger } from '../../../shared/utils/logger.js'
import type {
  IChecklistFilters,
  IChecklistListResult,
  IChecklistTemplateWithStats,
  ICreateChecklistTemplateInput,
  IUpdateChecklistTemplateInput,
} from './checklists.interface.js'

type PrismaClientType = PrismaClient | Prisma.TransactionClient

const TEMPLATE_INCLUDE = {
  items: { orderBy: { order: 'asc' } },
  _count: { select: { receptions: true, qualityChecks: true } },
} as const

class ChecklistService {
  async findAllChecklistTemplates(
    empresaId: string,
    filters: IChecklistFilters,
    db: PrismaClientType
  ): Promise<IChecklistListResult> {
    const {
      search,
      isActive,
      category,
      page = 1,
      limit = 20,
      sortBy = 'name',
      sortOrder = 'asc',
    } = filters

    const {
      skip,
      take,
      page: validPage,
      limit: validLimit,
    } = PaginationHelper.validateAndParse({ page, limit })

    const where: Prisma.ChecklistTemplateWhereInput = { empresaId }
    if (isActive !== undefined) where.isActive = isActive
    if (category !== undefined) where.category = category
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [total, data] = await Promise.all([
      (db as PrismaClient).checklistTemplate.count({ where }),
      (db as PrismaClient).checklistTemplate.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: TEMPLATE_INCLUDE,
      }),
    ])

    const meta = PaginationHelper.getMeta(validPage, validLimit, total)

    return {
      checklists: data as unknown as IChecklistTemplateWithStats[],
      ...meta,
    }
  }

  async findChecklistTemplateById(
    empresaId: string,
    id: string,
    db: PrismaClientType
  ): Promise<IChecklistTemplateWithStats> {
    const item = await (db as PrismaClient).checklistTemplate.findFirst({
      where: { id, empresaId },
      include: TEMPLATE_INCLUDE,
    })
    if (!item) throw new NotFoundError('Plantilla de checklist no encontrada')
    return item as unknown as IChecklistTemplateWithStats
  }

  async createChecklistTemplate(
    empresaId: string,
    userId: string,
    data: ICreateChecklistTemplateInput,
    db: PrismaClientType
  ): Promise<IChecklistTemplateWithStats> {
    const exists = await (db as PrismaClient).checklistTemplate.findFirst({
      where: { empresaId, code: data.code },
    })
    if (exists)
      throw new ConflictError(
        `Ya existe una plantilla con el código ${data.code}`
      )

    const template = await (db as PrismaClient).checklistTemplate.create({
      data: {
        empresaId,
        createdBy: userId,
        code: data.code,
        name: data.name,
        description: data.description,
        category: data.category,
        items: {
          create:
            data.items?.map((item) => ({
              empresaId,
              code: item.code,
              name: item.name,
              description: item.description,
              responseType: item.responseType || 'BOOLEAN',
              isRequired: item.isRequired || false,
              order: item.order || 0,
              options: item.options || null,
            })) || [],
        },
      },
      include: TEMPLATE_INCLUDE,
    })

    logger.info('Plantilla de checklist creada', {
      templateId: template.id,
      empresaId,
      userId,
    })

    return template as unknown as IChecklistTemplateWithStats
  }

  async updateChecklistTemplate(
    empresaId: string,
    id: string,
    data: IUpdateChecklistTemplateInput,
    userId: string,
    db: PrismaClientType
  ): Promise<IChecklistTemplateWithStats> {
    const template = await this.findChecklistTemplateById(empresaId, id, db)

    if (data.code && data.code !== template.code) {
      const exists = await (db as PrismaClient).checklistTemplate.findFirst({
        where: { empresaId, code: data.code },
      })
      if (exists)
        throw new ConflictError(
          `Ya existe una plantilla con el código ${data.code}`
        )
    }

    const result = await (db as PrismaClient).$transaction(async (tx) => {
      await tx.checklistTemplate.update({
        where: { id },
        data: {
          code: data.code !== undefined ? data.code : undefined,
          name: data.name !== undefined ? data.name : undefined,
          description:
            data.description !== undefined ? data.description : undefined,
          category: data.category !== undefined ? data.category : undefined,
          isActive: data.isActive !== undefined ? data.isActive : undefined,
        },
      })

      if (data.items) {
        const existingItems = await tx.checklistItem.findMany({
          where: { checklistTemplateId: id },
        })
        const itemIdsToKeep = data.items.filter((i) => i.id).map((i) => i.id)

        const itemsToDelete = existingItems.filter(
          (i) => !itemIdsToKeep.includes(i.id)
        )
        if (itemsToDelete.length > 0) {
          await tx.checklistItem.deleteMany({
            where: { id: { in: itemsToDelete.map((i) => i.id) } },
          })
        }

        for (const item of data.items) {
          if (item.id) {
            await tx.checklistItem.update({
              where: { id: item.id },
              data: {
                code: item.code,
                name: item.name,
                description: item.description,
                responseType: item.responseType,
                isRequired: item.isRequired,
                order: item.order,
                options: item.options,
                isActive: item.isActive,
              },
            })
          } else if (item.code && item.name) {
            await tx.checklistItem.create({
              data: {
                empresaId,
                checklistTemplateId: id,
                code: item.code,
                name: item.name,
                description: item.description,
                responseType: item.responseType || 'BOOLEAN',
                isRequired: item.isRequired || false,
                order: item.order || 0,
                options: item.options,
              },
            })
          }
        }
      }

      return tx.checklistTemplate.findUnique({
        where: { id },
        include: TEMPLATE_INCLUDE,
      })
    })

    logger.info('Plantilla de checklist actualizada', {
      templateId: id,
      empresaId,
      userId,
    })

    return result as unknown as IChecklistTemplateWithStats
  }

  async deleteChecklistTemplate(
    empresaId: string,
    id: string,
    userId: string,
    db: PrismaClientType
  ): Promise<void> {
    const template = await this.findChecklistTemplateById(empresaId, id, db)

    if (
      template._count &&
      (template._count.receptions > 0 || template._count.qualityChecks > 0)
    ) {
      throw new BadRequestError(
        'No se puede eliminar la plantilla porque ya está en uso en recepciones o controles de calidad. Intenta desactivarla.'
      )
    }

    await (db as PrismaClient).checklistTemplate.delete({
      where: { id: template.id },
    })
    logger.warn('Plantilla de checklist eliminada', {
      templateId: id,
      empresaId,
      userId,
    })
  }
}

export default new ChecklistService()
