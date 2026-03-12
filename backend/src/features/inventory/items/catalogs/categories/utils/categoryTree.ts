// backend/src/features/inventory/items/catalogs/categories/utils/categoryTree.ts
// NOTA: Este archivo ya no es necesario. La lógica de árbol fue movida al service
// con soporte multi-tenant. Se mantiene solo como referencia de las utilidades síncronas.

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
   * Construir árbol desde lista plana (síncrono, sin DB)
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
          ...cat,
          level,
          path: currentPath,
          fullPath: this.buildFullPath(categories, currentPath),
          children: this.buildTree(categories, cat.id, level + 1, currentPath),
        }
      })
  }

  static buildFullPath(categories: any[], idPath: string[]): string {
    return idPath
      .map((id) => categories.find((c) => c.id === id)?.name || '')
      .filter(Boolean)
      .join(' > ')
  }

  static flattenTree(tree: TreeNode[]): TreeNode[] {
    const result: TreeNode[] = []
    const flatten = (nodes: TreeNode[]) => {
      nodes.forEach((node) => {
        result.push(node)
        if (node.children.length > 0) flatten(node.children)
      })
    }
    flatten(tree)
    return result
  }

  static findInTree(tree: TreeNode[], categoryId: string): TreeNode | null {
    for (const node of tree) {
      if (node.id === categoryId) return node
      if (node.children.length > 0) {
        const found = this.findInTree(node.children, categoryId)
        if (found) return found
      }
    }
    return null
  }

  static countDescendants(node: TreeNode): number {
    return node.children.reduce(
      (count, child) => count + 1 + this.countDescendants(child),
      0
    )
  }
}
