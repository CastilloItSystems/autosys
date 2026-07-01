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

/**
 * Cliente mínimo requerido para consultar el último correlativo.
 * Compatible con PrismaClient y con el TransactionClient de $transaction.
 */
type SequentialNoteClient = {
  entryNote: {
    findFirst: (args: unknown) => Promise<{ entryNoteNumber: string } | null>
  }
  exitNote: {
    findFirst: (args: unknown) => Promise<{ exitNoteNumber: string } | null>
  }
}

/**
 * Próximo correlativo secuencial POR EMPRESA para notas de entrada.
 * Formato: ENT-YYYY-#### (reinicia por empresa y por año).
 * Debe invocarse dentro de una transacción; la unicidad final la garantiza
 * el índice compuesto @@unique([empresaId, entryNoteNumber]) — reintentar
 * ante colisión (P2002).
 */
export async function nextEntryNoteNumber(
  tx: SequentialNoteClient,
  empresaId: string
): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `ENT-${year}-`
  const last = await tx.entryNote.findFirst({
    where: { empresaId, entryNoteNumber: { startsWith: prefix } },
    orderBy: { entryNoteNumber: 'desc' },
    select: { entryNoteNumber: true },
  })
  const seq = last
    ? parseInt(last.entryNoteNumber.slice(prefix.length), 10) || 0
    : 0
  return `${prefix}${String(seq + 1).padStart(4, '0')}`
}

/**
 * Próximo correlativo secuencial POR EMPRESA para notas de salida.
 * Formato: SAL-YYYY-#### (reinicia por empresa y por año).
 */
export async function nextExitNoteNumber(
  tx: SequentialNoteClient,
  empresaId: string
): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `SAL-${year}-`
  const last = await tx.exitNote.findFirst({
    where: { empresaId, exitNoteNumber: { startsWith: prefix } },
    orderBy: { exitNoteNumber: 'desc' },
    select: { exitNoteNumber: true },
  })
  const seq = last
    ? parseInt(last.exitNoteNumber.slice(prefix.length), 10) || 0
    : 0
  return `${prefix}${String(seq + 1).padStart(4, '0')}`
}

/** Detecta violación de restricción única (Prisma error P2002). */
export function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: string }).code === 'P2002'
  )
}

/** Reintentos máximos ante colisión del correlativo secuencial (P2002). */
export const NOTE_NUMBER_MAX_RETRIES = 5

/**
 * Ejecuta `fn` reintentando cuando el correlativo secuencial colisiona con el
 * índice único compuesto por empresa. Cada reintento debe recalcular el número
 * dentro de la propia `fn`.
 */
export async function withNoteNumberRetry<T>(fn: () => Promise<T>): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn()
    } catch (error) {
      if (isUniqueViolation(error) && attempt < NOTE_NUMBER_MAX_RETRIES)
        continue
      throw error
    }
  }
}
