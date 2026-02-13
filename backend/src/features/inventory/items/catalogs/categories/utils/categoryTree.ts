// backend/src/features/inventory/items/catalogs/categories/utils/categoryTree.ts

import prisma from '../../../../../../services/prisma.service'

export interface TreeNode {
  id: string
  code: string
  name: string
  parentId: string | null
  children: TreeNode[]
  level: number
  path: string[]
  fullPath: string
}

export class CategoryTreeHelper {
  /**
   * Construir árbol de categorías desde una lista plana
   */
  static buildTree(
    categories: any[],
    parentId: string | null = null,
    level: number = 0,
    path: string[] = []
  ): TreeNode[] {
    return categories
      .filter((cat) => cat.parentId === parentId)
      .map((cat) => {
        const currentPath = [...path, cat.id]
        return {
          id: cat.id,
          code: cat.code,
          name: cat.name,
          parentId: cat.parentId,
          level,
          path: currentPath,
          fullPath: this.buildFullPath(categories, currentPath),
          children: this.buildTree(categories, cat.id, level + 1, currentPath),
          ...cat, // Incluir otros datos
        }
      })
  }

  /**
   * Construir path completo (nombres) de una categoría
   */
  static buildFullPath(categories: any[], idPath: string[]): string {
    return idPath
      .map((id) => {
        const cat = categories.find((c) => c.id === id)
        return cat?.name || ''
      })
      .filter(Boolean)
      .join(' > ')
  }

  /**
   * Obtener todos los ancestros de una categoría
   */
  static async getAncestors(categoryId: string): Promise<any[]> {
    const ancestors: any[] = []
    let currentId: string | null = categoryId

    while (currentId) {
      const category = (await prisma.category.findUnique({
        where: { id: currentId },
        include: { parent: true },
      })) as any

      if (!category) break

      if (category.parent) {
        ancestors.unshift(category.parent)
        currentId = category.parentId
      } else {
        break
      }
    }

    return ancestors
  }

  /**
   * Obtener todos los descendientes de una categoría
   */
  static async getDescendants(categoryId: string): Promise<any[]> {
    const descendants: any[] = []
    const queue = [categoryId]

    while (queue.length > 0) {
      const currentId = queue.shift()!

      const children = await prisma.category.findMany({
        where: { parentId: currentId },
      })

      descendants.push(...children)
      queue.push(...children.map((c) => c.id))
    }

    return descendants
  }

  /**
   * Obtener la profundidad (nivel) de una categoría
   */
  static async getLevel(categoryId: string): Promise<number> {
    const ancestors = await this.getAncestors(categoryId)
    return ancestors.length
  }

  /**
   * Obtener el path completo de una categoría
   */
  static async getPath(categoryId: string): Promise<string[]> {
    const ancestors = await this.getAncestors(categoryId)
    return [...ancestors.map((a) => a.id), categoryId]
  }

  /**
   * Verificar si hay referencia circular
   */
  static async hasCircularReference(
    categoryId: string,
    newParentId: string
  ): Promise<boolean> {
    if (categoryId === newParentId) return true

    const descendants = await this.getDescendants(categoryId)
    return descendants.some((d) => d.id === newParentId)
  }

  /**
   * Obtener categorías raíz (sin padre)
   */
  static async getRootCategories() {
    return await prisma.category.findMany({
      where: { parentId: null },
      include: {
        _count: {
          select: {
            children: true,
            items: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })
  }

  /**
   * Aplanar árbol de categorías
   */
  static flattenTree(tree: TreeNode[]): TreeNode[] {
    const result: TreeNode[] = []

    const flatten = (nodes: TreeNode[]) => {
      nodes.forEach((node) => {
        result.push(node)
        if (node.children && node.children.length > 0) {
          flatten(node.children)
        }
      })
    }

    flatten(tree)
    return result
  }

  /**
   * Buscar categoría en el árbol por ID
   */
  static findInTree(tree: TreeNode[], categoryId: string): TreeNode | null {
    for (const node of tree) {
      if (node.id === categoryId) return node

      if (node.children && node.children.length > 0) {
        const found = this.findInTree(node.children, categoryId)
        if (found) return found
      }
    }

    return null
  }

  /**
   * Contar total de descendientes
   */
  static countDescendants(node: TreeNode): number {
    let count = node.children.length

    node.children.forEach((child) => {
      count += this.countDescendants(child)
    })

    return count
  }
}
