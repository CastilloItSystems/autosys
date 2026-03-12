// backend/src/features/inventory/shared/utils/movementNumberGenerator.ts

/**
 * Generador de números únicos para entidades de inventario.
 *
 * Patrón: PREFIX-YEAR-TIMESTAMP+RANDOM
 * Ejemplo: MOV-2025-LB4K2QR
 *
 * SIN consultas a base de datos — elimina race conditions por completo.
 * La unicidad viene de la combinación timestamp (base36) + random (3 chars).
 * La probabilidad de colisión es 1 en ~46,000 por milisegundo.
 */
export class MovementNumberGenerator {
  private static build(prefix: string): string {
    const year = new Date().getFullYear()
    const ts = Date.now().toString(36).toUpperCase()
    const rnd = Math.random().toString(36).substring(2, 5).toUpperCase()
    return `${prefix}-${year}-${ts}${rnd}`
  }

  /** MOV-2025-LB4K2QR */
  static generate(prefix: string = 'MOV'): string {
    return this.build(prefix)
  }

  /** MOV-2025-LB4K2QR */
  static generateMovementNumber(): string {
    return this.build('MOV')
  }

  /** REC-2025-LB4K2QR */
  static generateReceiveNumber(): string {
    return this.build('REC')
  }

  /** NS-2025-LB4K2QR */
  static generateExitNoteNumber(type?: string): string {
    const prefix = type ? `NS-${type}` : 'NS'
    return this.build(prefix)
  }

  /** RSV-2025-LB4K2QR */
  static generateReservationNumber(): string {
    return this.build('RSV')
  }

  /** LOAN-2025-LB4K2QR */
  static generateLoanNumber(): string {
    return this.build('LOAN')
  }

  /** PO-2025-LB4K2QR */
  static generatePurchaseOrderNumber(): string {
    return this.build('PO')
  }

  /** ADJ-2025-LB4K2QR */
  static generateAdjustmentNumber(): string {
    return this.build('ADJ')
  }

  /** TRF-2025-LB4K2QR */
  static generateTransferNumber(): string {
    return this.build('TRF')
  }
}
