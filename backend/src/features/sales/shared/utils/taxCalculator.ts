// backend/src/features/sales/shared/utils/taxCalculator.ts

export interface TaxBreakdown {
  subtotal: number
  iva: number
  igtf: number
  totalTax: number
  total: number
}

export class TaxCalculator {
  static readonly IVA_RATE = 16 // IVA en Venezuela
  static readonly IGTF_RATE = 3 // Impuesto a las Grandes Transacciones Financieras

  /**
   * Calcula IVA
   */
  static calculateIVA(amount: number, rate: number = this.IVA_RATE): number {
    return this.roundToDecimals(amount * (rate / 100))
  }

  /**
   * Calcula IGTF (para pagos en moneda extranjera)
   */
  static calculateIGTF(amount: number, rate: number = this.IGTF_RATE): number {
    return this.roundToDecimals(amount * (rate / 100))
  }

  /**
   * Calcula desglose completo de impuestos
   */
  static calculateTaxBreakdown(
    subtotal: number,
    includeIGTF: boolean = false,
    ivaRate: number = this.IVA_RATE,
    igtfRate: number = this.IGTF_RATE
  ): TaxBreakdown {
    const iva = this.calculateIVA(subtotal, ivaRate)
    const igtf = includeIGTF ? this.calculateIGTF(subtotal + iva, igtfRate) : 0
    const totalTax = iva + igtf
    const total = subtotal + totalTax

    return {
      subtotal: this.roundToDecimals(subtotal),
      iva: this.roundToDecimals(iva),
      igtf: this.roundToDecimals(igtf),
      totalTax: this.roundToDecimals(totalTax),
      total: this.roundToDecimals(total),
    }
  }

  /**
   * Calcula el subtotal desde un total con IVA incluido
   */
  static calculateSubtotalFromTotal(
    totalWithTax: number,
    ivaRate: number = this.IVA_RATE
  ): number {
    return this.roundToDecimals(totalWithTax / (1 + ivaRate / 100))
  }

  /**
   * Verifica si un cliente está exento de IVA
   */
  static isExempt(customerTaxId: string): boolean {
    // Lógica para determinar si un cliente está exento
    // Por ejemplo, según su RIF o tipo de cliente
    // Esta es una implementación de ejemplo
    return customerTaxId.startsWith('G-') // Empresas gubernamentales
  }

  /**
   * Calcula impuestos considerando exención
   */
  static calculateTaxWithExemption(
    subtotal: number,
    isExempt: boolean,
    includeIGTF: boolean = false
  ): TaxBreakdown {
    if (isExempt) {
      return {
        subtotal: this.roundToDecimals(subtotal),
        iva: 0,
        igtf: includeIGTF ? this.calculateIGTF(subtotal, this.IGTF_RATE) : 0,
        totalTax: includeIGTF
          ? this.calculateIGTF(subtotal, this.IGTF_RATE)
          : 0,
        total: this.roundToDecimals(
          subtotal +
            (includeIGTF ? this.calculateIGTF(subtotal, this.IGTF_RATE) : 0)
        ),
      }
    }

    return this.calculateTaxBreakdown(subtotal, includeIGTF)
  }

  /**
   * Redondea a 2 decimales
   */
  static roundToDecimals(value: number, decimals: number = 2): number {
    const multiplier = Math.pow(10, decimals)
    return Math.round(value * multiplier) / multiplier
  }

  /**
   * Formatea monto con símbolo de moneda
   */
  static formatCurrency(amount: number): string {
    return `Bs. ${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`
  }
}
