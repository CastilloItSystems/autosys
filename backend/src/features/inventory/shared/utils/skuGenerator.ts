// backend/src/features/inventory/shared/utils/skuGenerator.ts

import prisma from '../../../../services/prisma.service.js'

export class SKUGenerator {
  /**
   * Genera un SKU único basado en categoría y marca
   * Formato: CAT-BRD-0001
   */
  static async generate(
    categoryCode: string,
    brandCode: string
  ): Promise<string> {
    const prefix = `${categoryCode.toUpperCase()}-${brandCode.toUpperCase()}`

    // Buscar el último SKU con ese prefijo
    const lastItem = await prisma.item.findFirst({
      where: {
        sku: {
          startsWith: prefix,
        },
      },
      orderBy: {
        sku: 'desc',
      },
    })

    let nextNumber = 1

    if (lastItem) {
      const lastSku = lastItem.sku
      const parts = lastSku.split('-')
      const lastNumber = parseInt(parts[parts.length - 1] as string)
      nextNumber = lastNumber + 1
    }

    return `${prefix}-${String(nextNumber).padStart(4, '0')}`
  }

  /**
   * Valida formato de SKU
   */
  static isValid(sku: string): boolean {
    // Patrón: CAT-BRD-0001 o CAT-BRD-CUSTOM
    const pattern = /^[A-Z0-9]+-[A-Z0-9]+-[A-Z0-9]+$/
    return pattern.test(sku)
  }

  /**
   * Verifica si un SKU ya existe
   */
  static async exists(sku: string): Promise<boolean> {
    const item = await prisma.item.findFirst({
      where: { sku },
    })

    return item !== null
  }

  /**
   * Genera un SKU personalizado
   */
  static async generateCustom(parts: string[]): Promise<string> {
    const sku = parts.map((p) => p.toUpperCase()).join('-')

    if (!this.isValid(sku)) {
      throw new Error('Formato de SKU inválido')
    }

    // Si ya existe, agregar sufijo numérico
    if (await this.exists(sku)) {
      let counter = 1
      let newSku = `${sku}-${counter}`

      while (await this.exists(newSku)) {
        counter++
        newSku = `${sku}-${counter}`
      }

      return newSku
    }

    return sku
  }

  /**
   * Parsea un SKU en sus componentes
   */
  static parse(
    sku: string
  ): { category: string; brand: string; sequence: string } | null {
    if (!this.isValid(sku)) return null

    const parts = sku.split('-')

    if (parts.length < 3) return null

    return {
      category: parts[0] as string,
      brand: parts[1] as string,
      sequence: parts.slice(2).join('-'),
    }
  }
}
