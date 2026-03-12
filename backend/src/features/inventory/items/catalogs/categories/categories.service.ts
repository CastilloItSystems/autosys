// backend/src/features/inventory/items/catalogs/categories/categories.service.ts

import { PrismaClient, Prisma } from '../../../../../generated/prisma/client.js'
import {
  ICreateCategoryInput,
  IUpdateCategoryInput,
  ICategoryFilters,
  ICategoryWithRelations,
  ICategoryTree,
} from './categories.interface.js'
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
} from '../../../../../shared/utils/apiError.js'
import { PaginationHelper } from '../../../../../shared/utils/pagination.js'
import { INVENTORY_MESSAGES } from '../../../shared/constants/messages.js'
import { logger } from '../../../../../shared/utils/logger.js'

type PrismaClientType = PrismaClient | Prisma.TransactionClient

const MSG = INVENTORY_MESSAGES.category

const CATEGORY_INCLUDE = {
  parent: true,
  children: {
    include: { _count: { select: { items: true, children: true } } },
    orderBy: { name: 'asc' as const },
  },
  _count: { select: { items: true, children: true } },
} as const

// ---------------------------------------------------------------------------
// Tree helpers (tenant-aware, sin prisma global)
// ---------------------------------------------------------------------------

async function getDescendants(
  categoryId: string,
  db: PrismaClientType
): Promise<Array<{ id: string }>> {
  const descendants: Array<{ id: string }> = []
  const queue = [categoryId]

  while (queue.length > 0) {
    const currentId = queue.shift()!
    const children = await (db as PrismaClient).category.findMany({
      where: { parentId: currentId },
      select: { id: true },
    })
    descendants.push(...children)
    queue.push(...children.map((c) => c.id))
  }

  return descendants
}

async function getAncestors(
  categoryId: string,
  db: PrismaClientType
): Promise<ICategoryWithRelations[]> {
  const ancestors: ICategoryWithRelations[] = []
  let currentId: string | null = categoryId

  while (currentId) {
    const currentCategory: any = await (db as PrismaClient).category.findUnique(
      {
        where: { id: currentId },
        include: {
          parent: true,
          _count: { select: { items: true, children: true } },
        },
      }
    )
    if (!currentCategory || !currentCategory.parentId) break
    ancestors.unshift(currentCategory as ICategoryWithRelations)
    currentId = currentCategory.parentId
  }

  return ancestors
}

async function hasCircularReference(
  categoryId: string,
  newParentId: string,
  db: PrismaClientType
): Promise<boolean> {
  if (categoryId === newParentId) return true
  const descendants = await getDescendants(categoryId, db)
  return descendants.some((d) => d.id === newParentId)
}

function buildTree(
  categories: any[],
  parentId: string | null = null,
  level = 0,
  path: string[] = []
): any[] {
  return categories
    .filter((c) => c.parentId === parentId)
    .map((c) => {
      const currentPath = [...path, c.id]
      return {
        ...c,
        level,
        path: currentPath,
        children: buildTree(categories, c.id, level + 1, currentPath),
      }
    })
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

class CategoryService {
  // -------------------------------------------------------------------------
  // CREATE
  // -------------------------------------------------------------------------

  async create(
    empresaId: string,
    data: ICreateCategoryInput,
    userId: string,
    db: PrismaClientType
  ): Promise<ICategoryWithRelations> {
    const code = data.code.toUpperCase()

    const existing = await (db as PrismaClient).category.findFirst({
      where: { empresaId, code },
    })
    if (existing) throw new ConflictError(MSG.codeExists)

    if (data.parentId) {
      const parent = await (db as PrismaClient).category.findFirst({
        where: { id: data.parentId, empresaId },
      })
      if (!parent) throw new NotFoundError('Categoría padre no encontrada')
      if (!parent.isActive)
        throw new BadRequestError('La categoría padre no está activa')
    }

    const createData: Record<string, unknown> = {
      empresaId,
      code,
      name: data.name,
      isActive: data.isActive ?? true,
    }
    if (data.description !== undefined)
      createData.description = data.description
    if (data.parentId !== undefined) createData.parentId = data.parentId
    if (data.defaultMargin !== undefined)
      createData.defaultMargin = data.defaultMargin

    const category = await (db as PrismaClient).category.create({
      data: createData as never,
      include: CATEGORY_INCLUDE,
    })

    logger.info('Categoría creada', {
      categoryId: category.id,
      code,
      empresaId,
      userId,
    })

    return category as unknown as ICategoryWithRelations
  }

  // -------------------------------------------------------------------------
  // READ
  // -------------------------------------------------------------------------

  async findAll(
    empresaId: string,
    filters: ICategoryFilters,
    page: number = 1,
    limit: number = 10,
    db: PrismaClientType
  ) {
    const {
      skip,
      take,
      page: validPage,
      limit: validLimit,
    } = PaginationHelper.validateAndParse({ page, limit })

    const where: Prisma.CategoryWhereInput = { empresaId }

    if (filters.search) {
      where.OR = [
        { code: { contains: filters.search, mode: 'insensitive' } },
        { name: { contains: filters.search, mode: 'insensitive' } },
      ]
    }
    if (filters.isActive !== undefined) where.isActive = filters.isActive
    if (filters.parentId !== undefined) {
      where.parentId = filters.parentId === 'null' ? null : filters.parentId
    }
    if (filters.hasParent !== undefined) {
      where.parentId = filters.hasParent ? { not: null } : null
    }

    const [total, categories] = await Promise.all([
      (db as PrismaClient).category.count({ where }),
      (db as PrismaClient).category.findMany({
        where,
        skip,
        take,
        orderBy: { name: 'asc' },
        include: CATEGORY_INCLUDE,
      }),
    ])

    const meta = PaginationHelper.getMeta(validPage, validLimit, total)
    return {
      categories: categories as unknown as ICategoryWithRelations[],
      ...meta,
    }
  }

  async findById(
    empresaId: string,
    id: string,
    db: PrismaClientType
  ): Promise<ICategoryWithRelations> {
    const category = await (db as PrismaClient).category.findFirst({
      where: { id, empresaId },
      include: CATEGORY_INCLUDE,
    })
    if (!category) throw new NotFoundError(MSG.notFound)
    return category as unknown as ICategoryWithRelations
  }

  async findActive(
    empresaId: string,
    db: PrismaClientType
  ): Promise<ICategoryWithRelations[]> {
    const categories = await (db as PrismaClient).category.findMany({
      where: { empresaId, isActive: true },
      include: {
        parent: true,
        _count: { select: { items: true, children: true } },
      },
      orderBy: { name: 'asc' },
    })
    return categories as unknown as ICategoryWithRelations[]
  }

  async search(
    empresaId: string,
    term: string,
    db: PrismaClientType,
    limit: number = 10
  ): Promise<ICategoryWithRelations[]> {
    const categories = await (db as PrismaClient).category.findMany({
      where: {
        empresaId,
        isActive: true,
        OR: [
          { code: { contains: term, mode: 'insensitive' } },
          { name: { contains: term, mode: 'insensitive' } },
        ],
      },
      take: limit,
      include: {
        parent: true,
        _count: { select: { items: true, children: true } },
      },
      orderBy: { name: 'asc' },
    })
    return categories as unknown as ICategoryWithRelations[]
  }

  async getTree(
    empresaId: string,
    db: PrismaClientType
  ): Promise<ICategoryTree[]> {
    const categories = await (db as PrismaClient).category.findMany({
      where: { empresaId, isActive: true },
      include: { _count: { select: { items: true, children: true } } },
      orderBy: { name: 'asc' },
    })
    return buildTree(categories) as ICategoryTree[]
  }

  async getSubTree(
    empresaId: string,
    categoryId: string,
    db: PrismaClientType
  ): Promise<ICategoryTree> {
    const category = await this.findById(empresaId, categoryId, db)
    const descendants = await getDescendants(categoryId, db)

    const descendantIds = descendants.map((d) => d.id)
    const allCategories = await (db as PrismaClient).category.findMany({
      where: { id: { in: [categoryId, ...descendantIds] } },
      include: { _count: { select: { items: true, children: true } } },
    })

    const tree = buildTree(allCategories as any[], null)
    return (tree[0] ?? category) as unknown as ICategoryTree
  }

  async getRootCategories(
    empresaId: string,
    db: PrismaClientType
  ): Promise<ICategoryWithRelations[]> {
    const categories = await (db as PrismaClient).category.findMany({
      where: { empresaId, parentId: null },
      include: { _count: { select: { items: true, children: true } } },
      orderBy: { name: 'asc' },
    })
    return categories as unknown as ICategoryWithRelations[]
  }

  async getChildren(
    empresaId: string,
    categoryId: string,
    db: PrismaClientType
  ): Promise<ICategoryWithRelations[]> {
    await this.findById(empresaId, categoryId, db) // throws 404

    const children = await (db as PrismaClient).category.findMany({
      where: { parentId: categoryId, empresaId },
      include: { _count: { select: { items: true, children: true } } },
      orderBy: { name: 'asc' },
    })
    return children as unknown as ICategoryWithRelations[]
  }

  async getAncestors(
    empresaId: string,
    categoryId: string,
    db: PrismaClientType
  ): Promise<ICategoryWithRelations[]> {
    await this.findById(empresaId, categoryId, db) // throws 404
    return getAncestors(categoryId, db)
  }

  async getPath(
    empresaId: string,
    categoryId: string,
    db: PrismaClientType
  ): Promise<ICategoryWithRelations[]> {
    const [category, ancestors] = await Promise.all([
      this.findById(empresaId, categoryId, db),
      getAncestors(categoryId, db),
    ])
    return [...ancestors, category]
  }

  async getStats(empresaId: string, id: string, db: PrismaClientType) {
    const category = await this.findById(empresaId, id, db)
    const descendants = await getDescendants(id, db)
    const level = (await getAncestors(id, db)).length

    const descendantIds = descendants.map((d) => d.id)
    const allIds = [id, ...descendantIds]

    const [directItems, totalItems, activeItems] = await Promise.all([
      (db as PrismaClient).item.count({ where: { categoryId: id } }),
      (db as PrismaClient).item.count({
        where: { categoryId: { in: allIds } },
      }),
      (db as PrismaClient).item.count({
        where: { categoryId: { in: allIds }, isActive: true },
      }),
    ])

    return {
      category: { id: category.id, code: category.code, name: category.name },
      stats: {
        level,
        directChildren: category._count?.children ?? 0,
        totalDescendants: descendants.length,
        directItems,
        totalItems,
        activeItems,
        inactiveItems: totalItems - activeItems,
      },
    }
  }

  // -------------------------------------------------------------------------
  // UPDATE
  // -------------------------------------------------------------------------

  async update(
    empresaId: string,
    id: string,
    data: IUpdateCategoryInput,
    userId: string,
    db: PrismaClientType
  ): Promise<ICategoryWithRelations> {
    await this.findById(empresaId, id, db) // throws 404

    if (data.code) {
      const conflict = await (db as PrismaClient).category.findFirst({
        where: { empresaId, code: data.code.toUpperCase(), id: { not: id } },
      })
      if (conflict) throw new ConflictError(MSG.codeExists)
    }

    if (data.parentId) {
      const parent = await (db as PrismaClient).category.findFirst({
        where: { id: data.parentId, empresaId },
      })
      if (!parent) throw new NotFoundError('Categoría padre no encontrada')

      if (await hasCircularReference(id, data.parentId, db)) {
        throw new BadRequestError(MSG.circularReference)
      }
    }

    const updateData: Record<string, unknown> = {}
    if (data.code !== undefined) updateData.code = data.code.toUpperCase()
    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined)
      updateData.description = data.description ?? null
    if (data.parentId !== undefined) updateData.parentId = data.parentId ?? null
    if (data.defaultMargin !== undefined)
      updateData.defaultMargin = data.defaultMargin ?? null
    if (data.isActive !== undefined) updateData.isActive = data.isActive

    const category = await (db as PrismaClient).category.update({
      where: { id },
      data: updateData as never,
      include: CATEGORY_INCLUDE,
    })

    logger.info('Categoría actualizada', { categoryId: id, empresaId, userId })
    return category as unknown as ICategoryWithRelations
  }

  async move(
    empresaId: string,
    id: string,
    newParentId: string | null,
    userId: string,
    db: PrismaClientType
  ): Promise<ICategoryWithRelations> {
    await this.findById(empresaId, id, db) // throws 404

    if (newParentId) {
      const parent = await (db as PrismaClient).category.findFirst({
        where: { id: newParentId, empresaId },
      })
      if (!parent) throw new NotFoundError('Categoría padre no encontrada')

      if (await hasCircularReference(id, newParentId, db)) {
        throw new BadRequestError(MSG.circularReference)
      }
    }

    const category = await (db as PrismaClient).category.update({
      where: { id },
      data: { parentId: newParentId },
      include: CATEGORY_INCLUDE,
    })

    logger.info('Categoría movida', {
      categoryId: id,
      newParentId,
      empresaId,
      userId,
    })
    return category as unknown as ICategoryWithRelations
  }

  async toggleActive(
    empresaId: string,
    id: string,
    userId: string,
    db: PrismaClientType
  ): Promise<ICategoryWithRelations> {
    const category = await this.findById(empresaId, id, db)

    const updated = await (db as PrismaClient).category.update({
      where: { id },
      data: { isActive: !category.isActive },
      include: CATEGORY_INCLUDE,
    })

    logger.info('Estado de categoría cambiado', {
      categoryId: id,
      isActive: updated.isActive,
      empresaId,
      userId,
    })
    return updated as unknown as ICategoryWithRelations
  }

  // -------------------------------------------------------------------------
  // DELETE
  // -------------------------------------------------------------------------

  async delete(
    empresaId: string,
    id: string,
    userId: string,
    db: PrismaClientType
  ): Promise<void> {
    const category = await this.findById(empresaId, id, db)

    if (category._count && category._count.items > 0)
      throw new BadRequestError(MSG.hasItems)
    if (category._count && category._count.children > 0)
      throw new BadRequestError(MSG.hasChildren)

    await (db as PrismaClient).category.update({
      where: { id },
      data: { isActive: false },
    })

    logger.info('Categoría eliminada (soft)', {
      categoryId: id,
      empresaId,
      userId,
    })
  }

  async hardDelete(
    empresaId: string,
    id: string,
    userId: string,
    db: PrismaClientType
  ): Promise<void> {
    const category = await this.findById(empresaId, id, db)

    if (category._count && category._count.items > 0)
      throw new BadRequestError(MSG.hasItems)
    if (category._count && category._count.children > 0)
      throw new BadRequestError(MSG.hasChildren)

    await (db as PrismaClient).category.delete({ where: { id } })

    logger.warn('Categoría eliminada permanentemente', {
      categoryId: id,
      empresaId,
      userId,
    })
  }

  // -------------------------------------------------------------------------
  // BULK
  // -------------------------------------------------------------------------

  async bulkCreate(
    empresaId: string,
    categories: ICreateCategoryInput[],
    userId: string,
    db: PrismaClientType
  ) {
    const results = {
      success: [] as ICategoryWithRelations[],
      errors: [] as Array<{ code: string; error: string }>,
    }

    for (const data of categories) {
      try {
        const category = await this.create(empresaId, data, userId, db)
        results.success.push(category)
      } catch (error: unknown) {
        results.errors.push({
          code: data.code,
          error: (error as Error).message,
        })
      }
    }

    logger.info('Importación masiva de categorías completada', {
      total: categories.length,
      success: results.success.length,
      errors: results.errors.length,
      empresaId,
      userId,
    })

    return results
  }
}

export default new CategoryService()
