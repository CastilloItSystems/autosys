// backend/src/features/inventory/shared/utils/movementNumberGenerator.ts

import { PrismaClient } from '../../../../generated/prisma'

const prisma = new PrismaClient()

export class MovementNumberGenerator {
  /**
   * Genera número de movimiento: MOV-2024-00001
   */
  static async generateMovementNumber(prefix: string = 'MOV'): Promise<string> {
    const year = new Date().getFullYear()
    const basePattern = `${prefix}-${year}-`

    // Obtener el último número
    const lastMovement = await prisma.movement.findFirst({
      where: {
        movementNumber: {
          startsWith: basePattern,
        },
      },
      orderBy: {
        movementNumber: 'desc',
      },
    })

    let nextNumber = 1

    if (lastMovement) {
      const lastNumber = parseInt(lastMovement.movementNumber.split('-')[2])
      nextNumber = lastNumber + 1
    }

    return `${basePattern}${String(nextNumber).padStart(5, '0')}`
  }

  /**
   * Genera número de recepción: REC-2024-00001
   */
  static async generateReceiveNumber(): Promise<string> {
    return this.generateMovementNumber('REC')
  }

  /**
   * Genera número de nota de salida: NS-2024-00001
   */
  static async generateExitNoteNumber(type?: string): Promise<string> {
    const prefix = type ? `NS-${type}` : 'NS'
    return this.generateMovementNumber(prefix)
  }

  /**
   * Genera número de reserva: RSV-2024-00001
   */
  static async generateReservationNumber(): Promise<string> {
    const year = new Date().getFullYear()
    const basePattern = `RSV-${year}-`

    const lastReservation = await prisma.reservation.findFirst({
      where: {
        reservationNumber: {
          startsWith: basePattern,
        },
      },
      orderBy: {
        reservationNumber: 'desc',
      },
    })

    let nextNumber = 1

    if (lastReservation) {
      const lastNumber = parseInt(
        lastReservation.reservationNumber.split('-')[2]
      )
      nextNumber = lastNumber + 1
    }

    return `${basePattern}${String(nextNumber).padStart(5, '0')}`
  }

  /**
   * Genera número de préstamo: LOAN-2024-00001
   */
  static async generateLoanNumber(): Promise<string> {
    const year = new Date().getFullYear()
    const basePattern = `LOAN-${year}-`

    const lastLoan = await prisma.loan.findFirst({
      where: {
        loanNumber: {
          startsWith: basePattern,
        },
      },
      orderBy: {
        loanNumber: 'desc',
      },
    })

    let nextNumber = 1

    if (lastLoan) {
      const lastNumber = parseInt(lastLoan.loanNumber.split('-')[2])
      nextNumber = lastNumber + 1
    }

    return `${basePattern}${String(nextNumber).padStart(5, '0')}`
  }

  /**
   * Genera número de orden de compra: PO-2024-00001
   */
  static async generatePurchaseOrderNumber(): Promise<string> {
    const year = new Date().getFullYear()
    const basePattern = `PO-${year}-`

    const lastPO = await prisma.purchaseOrder.findFirst({
      where: {
        orderNumber: {
          startsWith: basePattern,
        },
      },
      orderBy: {
        orderNumber: 'desc',
      },
    })

    let nextNumber = 1

    if (lastPO) {
      const lastNumber = parseInt(lastPO.orderNumber.split('-')[2])
      nextNumber = lastNumber + 1
    }

    return `${basePattern}${String(nextNumber).padStart(5, '0')}`
  }
}
