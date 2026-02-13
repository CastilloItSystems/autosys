// backend/src/features/inventory/shared/utils/priceCalculator.ts

export interface PriceCalculationResult {
  subtotal: number
  discount: number
  subtotalAfterDiscount: number
  tax: number
  total: number
}

export interface PriceItem {
  quantity: number
  unitPrice: number
  discount?: number // Porcentaje o monto
}

export class PriceCalculator {
  static readonly DEFAULT_TAX_RATE = 16 // IVA Venezuela

  /**
   * Calcula el subtotal de un item
   */
  static calculateItemSubtotal(quantity: number, unitPrice: number): number {
    return this.roundToDecimals(quantity * unitPrice)
  }

  /**
   * Calcula el descuento
   */
  static calculateDiscount(
    subtotal: number,
    discount: number,
    isPercentage: boolean = true
  ): number {
    if (isPercentage) {
      return this.roundToDecimals(subtotal * (discount / 100))
    }
    return this.roundToDecimals(discount)
  }

  /**
   * Calcula el impuesto
   */
  static calculateTax(
    amount: number,
    taxRate: number = this.DEFAULT_TAX_RATE
  ): number {
    return this.roundToDecimals(amount * (taxRate / 100))
  }

  /**
   * Calcula el precio total de un item con descuento e impuesto
   */
  static calculateItemTotal(
    item: PriceItem,
    taxRate: number = this.DEFAULT_TAX_RATE
  ): PriceCalculationResult {
    const subtotal = this.calculateItemSubtotal(item.quantity, item.unitPrice)

    const discount = item.discount
      ? this.calculateDiscount(subtotal, item.discount, true)
      : 0

    const subtotalAfterDiscount = subtotal - discount
    const tax = this.calculateTax(subtotalAfterDiscount, taxRate)
    const total = subtotalAfterDiscount + tax

    return {
      subtotal,
      discount,
      subtotalAfterDiscount,
      tax,
      total,
    }
  }

  /**
   * Calcula el total de múltiples items
   */
  static calculateOrderTotal(
    items: PriceItem[],
    taxRate: number = this.DEFAULT_TAX_RATE
  ): PriceCalculationResult {
    const totals = items.map((item) => this.calculateItemTotal(item, taxRate))

    const subtotal = totals.reduce((sum, t) => sum + t.subtotal, 0)
    const discount = totals.reduce((sum, t) => sum + t.discount, 0)
    const subtotalAfterDiscount = subtotal - discount
    const tax = this.calculateTax(subtotalAfterDiscount, taxRate)
    const total = subtotalAfterDiscount + tax

    return {
      subtotal: this.roundToDecimals(subtotal),
      discount: this.roundToDecimals(discount),
      subtotalAfterDiscount: this.roundToDecimals(subtotalAfterDiscount),
      tax: this.roundToDecimals(tax),
      total: this.roundToDecimals(total),
    }
  }

  /**
   * Calcula el margen de ganancia
   */
  static calculateMargin(costPrice: number, salePrice: number): number {
    if (costPrice === 0) return 0
    return this.roundToDecimals(((salePrice - costPrice) / costPrice) * 100)
  }

  /**
   * Calcula el precio de venta con margen
   */
  static calculateSalePriceWithMargin(
    costPrice: number,
    marginPercentage: number
  ): number {
    return this.roundToDecimals(costPrice * (1 + marginPercentage / 100))
  }

  /**
   * Calcula el precio de costo desde precio de venta y margen
   */
  static calculateCostPriceFromMargin(
    salePrice: number,
    marginPercentage: number
  ): number {
    return this.roundToDecimals(salePrice / (1 + marginPercentage / 100))
  }

  /**
   * Aplica descuento por volumen
   */
  static applyVolumeDiscount(quantity: number, unitPrice: number): number {
    let discountRate = 0

    if (quantity >= 100) {
      discountRate = 15 // 15% de descuento
    } else if (quantity >= 50) {
      discountRate = 10 // 10% de descuento
    } else if (quantity >= 20) {
      discountRate = 5 // 5% de descuento
    }

    const discount = this.calculateDiscount(unitPrice, discountRate, true)
    return unitPrice - discount
  }

  /**
   * Redondea a 2 decimales
   */
  static roundToDecimals(value: number, decimals: number = 2): number {
    const multiplier = Math.pow(10, decimals)
    return Math.round(value * multiplier) / multiplier
  }
}
