// backend/src/features/inventory/items/catalogs/categories/categories.service.ts

import prisma from '../../../../../services/prisma.service'

import {
  ICreateCategoryInput,
  IUpdateCategoryInput,
  ICategoryFilters,
  ICategoryWithRelations,
  ICategoryTree,
} from './categories.interface'
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
} from '../../../../../shared/utils/apiError'
import { PaginationHelper } from '../../../../../shared/utils/pagination'
import { INVENTORY_MESSAGES } from '../../../shared/constants/messages'
import { logger } from '../../../../../shared/utils/logger'
import { CategoryTreeHelper } from './utils/categoryTree'

export class CategoryService {
  /**
   * Crear una nueva categoría
   */
  async create(
    data: ICreateCategoryInput,
    userId?: string
  ): Promise<ICategoryWithRelations> {
    try {
      // Verificar si el código ya existe
      const existingCategory = await prisma.category.findUnique({
        where: { code: data.code.toUpperCase() },
      })

      if (existingCategory) {
        throw new ConflictError(INVENTORY_MESSAGES.category.codeExists)
      }

      // Si tiene padre, verificar que existe
      if (data.parentId) {
        const parent = await prisma.category.findUnique({
          where: { id: data.parentId },
        })

        if (!parent) {
          throw new NotFoundError('Categoría padre no encontrada')
        }

        if (!parent.isActive) {
          throw new BadRequestError('La categoría padre no está activa')
        }
      }

      // Crear categoría
      const createData: any = {
        code: data.code.toUpperCase(),
        name: data.name,
        isActive: data.isActive ?? true,
      }
      if (data.description !== undefined)
        createData.description = data.description
      if (data.parentId !== undefined) createData.parentId = data.parentId
      if (data.defaultMargin !== undefined)
        createData.defaultMargin = data.defaultMargin

      const category = await prisma.category.create({
        data: createData,
        include: {
          parent: true,
          children: true,
          _count: {
            select: {
              items: true,
              children: true,
            },
          },
        },
      })

      logger.info('Category created', {
        categoryId: category.id,
        code: category.code,
        parentId: category.parentId,
        userId,
      })

      return category as any
    } catch (error) {
      logger.error('Error creating category', { error, data, userId })
      throw error
    }
  }

  /**
   * Obtener todas las categorías con paginación y filtros
   */
  async findAll(
    filters: ICategoryFilters,
    page: number = 1,
    limit: number = 10,
    prismaClient?: any
  ) {
    try {
      const db = prismaClient || prisma
      const { skip, take } = PaginationHelper.validateAndParse({ page, limit })

      // Construir filtros
      const where: any = {}

      if (filters.search) {
        where.OR = [
          { code: { contains: filters.search, mode: 'insensitive' } },
          { name: { contains: filters.search, mode: 'insensitive' } },
        ]
      }

      if (filters.isActive !== undefined) {
        where.isActive = filters.isActive
      }

      if (filters.parentId !== undefined) {
        where.parentId = filters.parentId === 'null' ? null : filters.parentId
      }

      if (filters.hasParent !== undefined) {
        where.parentId = filters.hasParent ? { not: null } : null
      }

      // Ejecutar consultas en paralelo
      const [categories, total] = await Promise.all([
        db.category.findMany({
          where,
          skip,
          take,
          orderBy: { name: 'asc' },
          include: {
            parent: true,
            children: true,
            _count: {
              select: {
                items: true,
                children: true,
              },
            },
          },
        }),
        db.category.count({ where }),
      ])

      const meta = PaginationHelper.getMeta(page, limit, total)

      return {
        categories,
        ...meta,
      }
    } catch (error) {
      logger.error('Error finding categories', { error, filters })
      throw error
    }
  }

  /**
   * Obtener categoría por ID
   */
  async findById(id: string): Promise<ICategoryWithRelations> {
    try {
      const category = await prisma.category.findUnique({
        where: { id },
        include: {
          parent: true,
          children: {
            include: {
              _count: {
                select: {
                  items: true,
                  children: true,
                },
              },
            },
            orderBy: { name: 'asc' },
          },
          _count: {
            select: {
              items: true,
              children: true,
            },
          },
        },
      })

      if (!category) {
        throw new NotFoundError(INVENTORY_MESSAGES.category.notFound)
      }

      return category as any
    } catch (error) {
      logger.error('Error finding category by ID', { error, id })
      throw error
    }
  }

  /**
   * Obtener categoría por código
   */
  async findByCode(code: string): Promise<ICategoryWithRelations | null> {
    try {
      const category = await prisma.category.findUnique({
        where: { code: code.toUpperCase() },
        include: {
          parent: true,
          children: true,
          _count: {
            select: {
              items: true,
              children: true,
            },
          },
        },
      })

      return category as any
    } catch (error) {
      logger.error('Error finding category by code', { error, code })
      throw error
    }
  }

  /**
   * Obtener árbol completo de categorías
   */
  async getTree(): Promise<ICategoryTree[]> {
    try {
      // Obtener todas las categorías
      const allCategories = await prisma.category.findMany({
        where: { isActive: true },
        include: {
          _count: {
            select: {
              items: true,
              children: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      })

      // Construir árbol
      const tree = CategoryTreeHelper.buildTree(allCategories)

      return tree as any
    } catch (error) {
      logger.error('Error getting category tree', { error })
      throw error
    }
  }

  /**
   * Obtener subárbol de una categoría
   */
  async getSubTree(categoryId: string): Promise<ICategoryTree> {
    try {
      const category = await this.findById(categoryId)

      // Obtener todos los descendientes
      const descendants = await CategoryTreeHelper.getDescendants(categoryId)

      // Construir árbol con la categoría y sus descendientes
      const allCategories = [category, ...descendants]
      const tree = CategoryTreeHelper.buildTree(allCategories, null)

      return tree[0] as any
    } catch (error) {
      logger.error('Error getting category subtree', { error, categoryId })
      throw error
    }
  }

  /**
   * Obtener categorías raíz (sin padre)
   */
  async getRootCategories(): Promise<ICategoryWithRelations[]> {
    try {
      const categories = await CategoryTreeHelper.getRootCategories()
      return categories as any
    } catch (error) {
      logger.error('Error getting root categories', { error })
      throw error
    }
  }

  /**
   * Obtener hijos de una categoría
   */
  async getChildren(categoryId: string): Promise<ICategoryWithRelations[]> {
    try {
      await this.findById(categoryId) // Verificar que existe

      const children = await prisma.category.findMany({
        where: { parentId: categoryId },
        include: {
          _count: {
            select: {
              items: true,
              children: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      })

      return children as any
    } catch (error) {
      logger.error('Error getting category children', { error, categoryId })
      throw error
    }
  }

  /**
   * Obtener ancestros de una categoría
   */
  async getAncestors(categoryId: string): Promise<ICategoryWithRelations[]> {
    try {
      await this.findById(categoryId) // Verificar que existe

      const ancestors = await CategoryTreeHelper.getAncestors(categoryId)
      return ancestors as any
    } catch (error) {
      logger.error('Error getting category ancestors', { error, categoryId })
      throw error
    }
  }

  /**
   * Obtener path completo de una categoría
   */
  async getPath(categoryId: string): Promise<ICategoryWithRelations[]> {
    try {
      const category = await this.findById(categoryId)
      const ancestors = await this.getAncestors(categoryId)

      return [...ancestors, category]
    } catch (error) {
      logger.error('Error getting category path', { error, categoryId })
      throw error
    }
  }

  /**
   * Actualizar categoría
   */
  async update(
    id: string,
    data: IUpdateCategoryInput,
    userId?: string
  ): Promise<ICategoryWithRelations> {
    try {
      // Verificar que existe
      await this.findById(id)

      // Si se actualiza el código, verificar que no exista otro con ese código
      if (data.code) {
        const existingCategory = await prisma.category.findUnique({
          where: { code: data.code.toUpperCase() },
        })

        if (existingCategory && existingCategory.id !== id) {
          throw new ConflictError(INVENTORY_MESSAGES.category.codeExists)
        }
      }

      // Si se cambia el padre, verificar referencias circulares
      if (data.parentId !== undefined) {
        if (data.parentId) {
          // Verificar que el padre existe
          const parent = await prisma.category.findUnique({
            where: { id: data.parentId },
          })

          if (!parent) {
            throw new NotFoundError('Categoría padre no encontrada')
          }

          // Verificar referencias circulares
          const hasCircular = await CategoryTreeHelper.hasCircularReference(
            id,
            data.parentId
          )

          if (hasCircular) {
            throw new BadRequestError(
              INVENTORY_MESSAGES.category.circularReference
            )
          }
        }
      }

      // Actualizar
      const category = await prisma.category.update({
        where: { id },
        data: {
          ...(data.code && { code: data.code.toUpperCase() }),
          ...(data.name && { name: data.name }),
          ...(data.description !== undefined && {
            description: data.description,
          }),
          ...(data.parentId !== undefined && { parentId: data.parentId }),
          ...(data.defaultMargin !== undefined && {
            defaultMargin: data.defaultMargin,
          }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
        include: {
          parent: true,
          children: true,
          _count: {
            select: {
              items: true,
              children: true,
            },
          },
        },
      })

      logger.info('Category updated', { categoryId: id, userId })

      return category as any
    } catch (error) {
      logger.error('Error updating category', { error, id, data, userId })
      throw error
    }
  }

  /**
   * Eliminar categoría (soft delete)
   */
  async delete(id: string, userId?: string): Promise<void> {
    try {
      const category = await this.findById(id)

      // Verificar que no tenga items asociados
      if (category._count && category._count.items > 0) {
        throw new BadRequestError(INVENTORY_MESSAGES.category.hasItems)
      }

      // Verificar que no tenga subcategorías
      if (category._count && category._count.children > 0) {
        throw new BadRequestError(INVENTORY_MESSAGES.category.hasChildren)
      }

      // Soft delete (marcar como inactivo)
      await prisma.category.update({
        where: { id },
        data: { isActive: false },
      })

      logger.info('Category soft deleted', { categoryId: id, userId })
    } catch (error) {
      logger.error('Error deleting category', { error, id, userId })
      throw error
    }
  }

  /**
   * Eliminar categoría permanentemente
   */
  async hardDelete(id: string, userId?: string): Promise<void> {
    try {
      const category = await this.findById(id)

      // Verificar que no tenga items asociados
      if (category._count && category._count.items > 0) {
        throw new BadRequestError(INVENTORY_MESSAGES.category.hasItems)
      }

      // Verificar que no tenga subcategorías
      if (category._count && category._count.children > 0) {
        throw new BadRequestError(INVENTORY_MESSAGES.category.hasChildren)
      }

      // Eliminar permanentemente
      await prisma.category.delete({
        where: { id },
      })

      logger.info('Category hard deleted', { categoryId: id, userId })
    } catch (error) {
      logger.error('Error hard deleting category', { error, id, userId })
      throw error
    }
  }

  /**
   * Mover categoría a otro padre
   */
  async move(
    id: string,
    newParentId: string | null,
    userId?: string
  ): Promise<ICategoryWithRelations> {
    try {
      // Verificar que la categoría existe
      await this.findById(id)

      // Si hay nuevo padre, verificarlo
      if (newParentId) {
        const parent = await prisma.category.findUnique({
          where: { id: newParentId },
        })

        if (!parent) {
          throw new NotFoundError('Categoría padre no encontrada')
        }

        // Verificar referencias circulares
        const hasCircular = await CategoryTreeHelper.hasCircularReference(
          id,
          newParentId
        )

        if (hasCircular) {
          throw new BadRequestError(
            INVENTORY_MESSAGES.category.circularReference
          )
        }
      }

      // Mover
      const category = await prisma.category.update({
        where: { id },
        data: { parentId: newParentId },
        include: {
          parent: true,
          children: true,
          _count: {
            select: {
              items: true,
              children: true,
            },
          },
        },
      })

      logger.info('Category moved', {
        categoryId: id,
        oldParentId: category.parentId,
        newParentId,
        userId,
      })

      return category as any
    } catch (error) {
      logger.error('Error moving category', { error, id, newParentId, userId })
      throw error
    }
  }

  /**
   * Activar/Desactivar categoría
   */
  async toggleActive(
    id: string,
    userId?: string
  ): Promise<ICategoryWithRelations> {
    try {
      const category = await this.findById(id)

      const updated = await prisma.category.update({
        where: { id },
        data: { isActive: !category.isActive },
        include: {
          parent: true,
          children: true,
          _count: {
            select: {
              items: true,
              children: true,
            },
          },
        },
      })

      logger.info('Category active status toggled', {
        categoryId: id,
        newStatus: updated.isActive,
        userId,
      })

      return updated as any
    } catch (error) {
      logger.error('Error toggling category active status', {
        error,
        id,
        userId,
      })
      throw error
    }
  }

  /**
   * Obtener estadísticas de una categoría
   */
  async getStats(id: string) {
    try {
      const category = await this.findById(id)
      const descendants = await CategoryTreeHelper.getDescendants(id)
      const level = await CategoryTreeHelper.getLevel(id)

      const [directItems, totalItems, activeItems] = await Promise.all([
        prisma.item.count({ where: { categoryId: id } }),
        prisma.item.count({
          where: {
            categoryId: {
              in: [id, ...descendants.map((d) => d.id)],
            },
          },
        }),
        prisma.item.count({
          where: {
            categoryId: {
              in: [id, ...descendants.map((d) => d.id)],
            },
            isActive: true,
          },
        }),
      ])

      return {
        category: {
          id: category.id,
          code: category.code,
          name: category.name,
        },
        stats: {
          level,
          directChildren: category._count?.children || 0,
          totalDescendants: descendants.length,
          directItems,
          totalItems,
          activeItems,
          inactiveItems: totalItems - activeItems,
        },
      }
    } catch (error) {
      logger.error('Error getting category stats', { error, id })
      throw error
    }
  }

  /**
   * Obtener categorías activas (para selects)
   */
  async findActive(prismaClient?: any): Promise<ICategoryWithRelations[]> {
    try {
      const db = prismaClient || prisma
      const categories = await db.category.findMany({
        where: { isActive: true },
        include: {
          parent: true,
          _count: {
            select: {
              items: true,
              children: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      })

      return categories as any
    } catch (error) {
      logger.error('Error finding active categories', { error })
      throw error
    }
  }

  /**
   * Buscar categorías
   */
  async search(
    term: string,
    limit: number = 10,
    prismaClient?: any
  ): Promise<ICategoryWithRelations[]> {
    try {
      const db = prismaClient || prisma
      const categories = await db.category.findMany({
        where: {
          OR: [
            { code: { contains: term, mode: 'insensitive' } },
            { name: { contains: term, mode: 'insensitive' } },
          ],
          isActive: true,
        },
        take: limit,
        include: {
          parent: true,
          _count: {
            select: {
              items: true,
              children: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      })

      return categories as any
    } catch (error) {
      logger.error('Error searching categories', { error, term })
      throw error
    }
  }

  /**
   * Importación masiva de categorías
   */
  async bulkCreate(categories: ICreateCategoryInput[], userId?: string) {
    try {
      const results = {
        success: [] as any[],
        errors: [] as any[],
      }

      for (const categoryData of categories) {
        try {
          const category = await this.create(categoryData, userId)
          results.success.push(category)
        } catch (error: any) {
          results.errors.push({
            code: categoryData.code,
            error: error.message,
          })
        }
      }

      logger.info('Bulk category creation completed', {
        total: categories.length,
        success: results.success.length,
        errors: results.errors.length,
        userId,
      })

      return results
    } catch (error) {
      logger.error('Error in bulk category creation', { error, userId })
      throw error
    }
  }
}

export default new CategoryService()
