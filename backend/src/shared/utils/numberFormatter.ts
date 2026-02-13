// backend/src/shared/utils/numberFormatter.ts

export class NumberFormatter {
  static readonly CURRENCY_SYMBOL = 'Bs.'
  static readonly DECIMAL_SEPARATOR = ','
  static readonly THOUSANDS_SEPARATOR = '.'
  static readonly DECIMALS = 2

  static formatCurrency(
    value: number | string,
    decimals: number = this.DECIMALS
  ): string {
    const num = typeof value === 'string' ? parseFloat(value) : value

    if (isNaN(num)) {
      return `${this.CURRENCY_SYMBOL} 0${this.DECIMAL_SEPARATOR}00`
    }

    const formatted = this.formatNumber(num, decimals)
    return `${this.CURRENCY_SYMBOL} ${formatted}`
  }

  static formatNumber(
    value: number | string,
    decimals: number = this.DECIMALS
  ): string {
    const num = typeof value === 'string' ? parseFloat(value) : value

    if (isNaN(num)) {
      return '0'
    }

    const parts = num.toFixed(decimals).split('.')
    const integerPart = parts[0].replace(
      /\B(?=(\d{3})+(?!\d))/g,
      this.THOUSANDS_SEPARATOR
    )
    const decimalPart = parts[1] || '00'

    return `${integerPart}${this.DECIMAL_SEPARATOR}${decimalPart}`
  }

  static parseNumber(value: string): number {
    // Remover símbolos de moneda y separadores
    const cleaned = value
      .replace(this.CURRENCY_SYMBOL, '')
      .replace(new RegExp(`\\${this.THOUSANDS_SEPARATOR}`, 'g'), '')
      .replace(this.DECIMAL_SEPARATOR, '.')
      .trim()

    return parseFloat(cleaned)
  }

  static formatPercentage(value: number, decimals: number = 2): string {
    return `${this.formatNumber(value, decimals)}%`
  }

  static formatQuantity(value: number): string {
    return this.formatNumber(value, 0)
  }

  static roundToDecimals(
    value: number,
    decimals: number = this.DECIMALS
  ): number {
    const multiplier = Math.pow(10, decimals)
    return Math.round(value * multiplier) / multiplier
  }

  static calculatePercentage(value: number, total: number): number {
    if (total === 0) return 0
    return this.roundToDecimals((value / total) * 100)
  }

  static calculateDiscount(price: number, discount: number): number {
    return this.roundToDecimals(price - (price * discount) / 100)
  }

  static calculateTax(subtotal: number, taxRate: number): number {
    return this.roundToDecimals(subtotal * (taxRate / 100))
  }
}
