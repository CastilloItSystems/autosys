// backend/src/features/finance/supplierPayments/supplierPayments.service.ts

import { PrismaClient, Prisma } from '../../../generated/prisma/client.js'
import { PaginationHelper } from '../../../shared/utils/pagination.js'

function paginate<T>(data: T[], total: number, page: number, limit: number) {
  return { data, total, page, limit }
}
import { NotFoundError, BadRequestError } from '../../../shared/utils/apiError.js'
import { ICreateSupplierPaymentInput, ISupplierPaymentFilters } from './supplierPayments.interface.js'
import SupplierBillService from '../supplierBills/supplierBills.service.js'
import { domainEventBus } from '../../../shared/events/domain-event-bus.js'
import { toDomainEvent } from '../../../shared/events/domain-events.js'
import { logger } from '../../../shared/utils/logger.js'
import { recalculateBankBalance } from '../shared/recalculateBankBalance.js'

type PrismaClientType = PrismaClient | Prisma.TransactionClient

const IGTF_RATE = 0.03

const PAYMENT_INCLUDE = {
  supplier: { select: { id: true, name: true } },
  supplierBill: { select: { id: true, internalNumber: true, billNumber: true, status: true } },
  expense: { select: { id: true, expenseNumber: true, description: true } },
  bankAccount: { select: { id: true, name: true, type: true } },
} as const

function generatePaymentNumber(): string {
  const year = new Date().getFullYear()
  const ts = Date.now().toString(36).toUpperCase()
  const rnd = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `SP-${year}-${ts}${rnd}`
}

class SupplierPaymentService {
  private db: PrismaClientType

  constructor(db: PrismaClientType) {
    this.db = db
  }

  async findAll(empresaId: string, filters: ISupplierPaymentFilters = {}) {
    const { status, supplierId, supplierBillId, expenseId, from, to, page = 1, limit = 20 } = filters
    const where: Prisma.SupplierPaymentWhereInput = { empresaId }

    if (status) where.status = status
    if (supplierId) where.supplierId = supplierId
    if (supplierBillId) where.supplierBillId = supplierBillId
    if (expenseId) where.expenseId = expenseId
    if (from || to) {
      where.processedAt = {}
      if (from) where.processedAt.gte = new Date(from)
      if (to) where.processedAt.lte = new Date(to)
    }

    const db = this.db as PrismaClient
    const [total, data] = await Promise.all([
      db.supplierPayment.count({ where }),
      db.supplierPayment.findMany({
        where,
        include: PAYMENT_INCLUDE,
        orderBy: { processedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    return paginate(data, total, page, limit)
  }

  async findById(empresaId: string, id: string) {
    const db = this.db as PrismaClient
    const payment = await db.supplierPayment.findFirst({ where: { id, empresaId }, include: PAYMENT_INCLUDE })
    if (!payment) throw new NotFoundError('Pago a proveedor no encontrado')
    return payment
  }

  async create(empresaId: string, input: ICreateSupplierPaymentInput, userId?: string) {
    if (!input.supplierBillId && !input.expenseId) {
      throw new BadRequestError('Debe especificar una factura o un gasto al que aplicar el pago')
    }
    if (input.supplierBillId && input.expenseId) {
      throw new BadRequestError('No se puede aplicar el pago a factura y gasto al mismo tiempo')
    }

    // Validate mixed payment
    if (input.method === 'MIXED') {
      if (!input.details || input.details.length < 2) {
        throw new BadRequestError('Pago mixto requiere al menos 2 métodos de pago')
      }
      const detailsSum = Number(
        input.details.reduce((sum: number, d: any) => sum + Number(d.amount), 0).toFixed(2)
      )
      if (detailsSum !== Number(input.amount.toFixed(2))) {
        throw new BadRequestError(
          `La suma de los detalles ($${detailsSum}) no coincide con el monto total ($${input.amount})`
        )
      }
    }

    // IGTF solo sobre porción no-VES en pago mixto
    let igtfAmount = 0
    if (input.igtfApplies) {
      if (input.method === 'MIXED' && input.details) {
        const foreignAmount = input.details
          .filter((d: any) => (d.currency ?? input.currency ?? 'USD') !== 'VES')
          .reduce((sum: number, d: any) => sum + Number(d.amount), 0)
        igtfAmount = Number((foreignAmount * IGTF_RATE).toFixed(2))
      } else {
        igtfAmount = Number((input.amount * IGTF_RATE).toFixed(2))
      }
    }
    const totalWithIgtf = Number((input.amount + igtfAmount).toFixed(2))

    const db = this.db as PrismaClient
    if (input.supplierBillId) {
      const bill = await db.supplierBill.findFirst({
        where: { id: input.supplierBillId, empresaId },
      })
      if (!bill) throw new BadRequestError('Factura de proveedor no encontrada')
      if (bill.status === 'PENDING_INVOICE') {
        throw new BadRequestError(
          'Debe registrar la factura del proveedor antes de pagar esta cuenta por pagar'
        )
      }
      if (bill.status === 'CANCELLED') {
        throw new BadRequestError('No se puede pagar una factura cancelada')
      }
      if (bill.status === 'PAID') {
        throw new BadRequestError('La factura ya está pagada')
      }
      if (input.supplierId && bill.supplierId !== input.supplierId) {
        throw new BadRequestError('La factura no pertenece al proveedor seleccionado')
      }
      if (input.amount > Number(bill.pendingAmount)) {
        throw new BadRequestError('El monto del pago excede el saldo pendiente')
      }
    }

    if (input.expenseId) {
      const expense = await (db as any).expense.findFirst({
        where: { id: input.expenseId, empresaId },
      })
      if (!expense) throw new BadRequestError('Gasto no encontrado')
      if (expense.status === 'CANCELLED') throw new BadRequestError('No se puede pagar un gasto cancelado')
      if (expense.status === 'PAID') throw new BadRequestError('El gasto ya está pagado')
      if (input.amount > Number(expense.pendingAmount)) {
        throw new BadRequestError('El monto del pago excede el saldo pendiente del gasto')
      }
    }

    return db.$transaction(async (tx) => {
      // Fetch bank account to resolve currency conversion
      const bankAccount = await (tx as any).bankAccount.findFirst({
        where: { id: input.bankAccountId, empresaId },
        select: { id: true, currency: true },
      })
      if (!bankAccount) throw new BadRequestError('Cuenta bancaria no encontrada')

      // Compute how much to debit in the account's own currency
      let debitInAccountCurrency = totalWithIgtf
      const paymentCurrency = input.currency ?? 'USD'
      if (bankAccount.currency !== paymentCurrency) {
        const rate = Number(input.exchangeRate ?? 0)
        if (!rate || rate <= 0) {
          throw new BadRequestError(
            `Se requiere tasa de cambio para pagar una factura en ${paymentCurrency} desde una cuenta en ${bankAccount.currency}`
          )
        }
        // exchangeRate is always stored as Bs per 1 foreign-currency unit:
        //   VES bill → rate = Bs/USD;  EUR bill → rate = Bs/EUR
        // USD account paying VES bill: debit_USD = amount_VES / (Bs/USD)
        // VES account paying USD bill: debit_VES = amount_USD * (Bs/USD)
        // EUR account paying VES bill: debit_EUR = amount_VES / (Bs/EUR)
        // VES account paying EUR bill: debit_VES = amount_EUR * (Bs/EUR)
        const isSameSide = (
          (bankAccount.currency === 'USD' && paymentCurrency === 'VES') ||
          (bankAccount.currency === 'EUR' && paymentCurrency === 'VES')
        )
        const isInverse = (
          (bankAccount.currency === 'VES' && paymentCurrency === 'USD') ||
          (bankAccount.currency === 'VES' && paymentCurrency === 'EUR')
        )
        if (isSameSide) {
          debitInAccountCurrency = Number((totalWithIgtf / rate).toFixed(2))
        } else if (isInverse) {
          debitInAccountCurrency = Number((totalWithIgtf * rate).toFixed(2))
        } else {
          throw new BadRequestError(
            `Conversión directa de ${paymentCurrency} a ${bankAccount.currency} no soportada. Use VES como moneda de la factura.`
          )
        }
      }

      const payment = await (tx as any).supplierPayment.create({
        data: {
          paymentNumber: generatePaymentNumber(),
          status: 'COMPLETED',
          supplierId: input.supplierId ?? null,
          supplierBillId: input.supplierBillId ?? null,
          expenseId: input.expenseId ?? null,
          bankAccountId: input.bankAccountId,
          method: input.method as any,
          amount: input.amount,
          currency: input.currency as any,
          exchangeRate: input.exchangeRate ?? null,
          igtfApplies: input.igtfApplies ?? false,
          igtfAmount,
          totalWithIgtf,
          details: input.details ?? null,
          reference: input.reference ?? null,
          notes: input.notes ?? null,
          processedBy: userId ?? null,
          empresaId,
        },
        include: PAYMENT_INCLUDE,
      })

      // Registrar movimiento de caja en la moneda de la cuenta
      await (tx as any).cashTransaction.create({
        data: {
          bankAccountId: input.bankAccountId,
          type: 'OUTCOME',
          source: 'SUPPLIER_PAYMENT',
          sourceId: payment.id,
          amount: -debitInAccountCurrency,
          currency: bankAccount.currency as any,
          exchangeRate: input.exchangeRate ?? null,
          description: input.supplierBillId
            ? `Pago factura proveedor ${payment.paymentNumber}`
            : `Pago gasto ${payment.paymentNumber}`,
          empresaId,
        },
      })

      // Recalcular saldo de cuenta bancaria desde cashTransactions
      await recalculateBankBalance(tx, input.bankAccountId, empresaId)

      // Recalcular bill o expense
      const billSvc = new SupplierBillService(tx as PrismaClientType)
      if (input.supplierBillId) {
        await billSvc.recalculatePaidAmount(tx as PrismaClientType, empresaId, input.supplierBillId)
      }
      if (input.expenseId) {
        await this.recalculateExpensePaidAmount(tx as PrismaClientType, empresaId, input.expenseId)
      }

      return payment
    }).then(async (payment) => {
      try {
        const billRef = input.supplierBillId
          ? `factura ${payment.supplierBill?.billNumber ?? payment.supplierBill?.internalNumber ?? input.supplierBillId}`
          : `gasto ${payment.expense?.expenseNumber ?? input.expenseId}`
        await domainEventBus.publish(
          toDomainEvent({
            empresaId,
            eventCode: 'finance.supplier_payment.completed',
            module: 'finance',
            title: `Pago a proveedor registrado`,
            message: `Pago ${payment.paymentNumber} por ${input.currency} ${input.amount.toFixed(2)} aplicado a ${billRef}.`,
            type: 'success',
            entityType: 'SUPPLIER_PAYMENT',
            entityId: payment.id,
            priority: 'HIGH',
            severity: 'INFO',
            link: `/empresa/finanzas/facturas-proveedores`,
            source: 'finance.supplier_payments',
            dedupKey: `finance.supplier_payment.completed:${payment.id}`,
            metadata: {
              paymentId: payment.id,
              paymentNumber: payment.paymentNumber,
              supplierBillId: input.supplierBillId ?? null,
              amount: input.amount,
              currency: input.currency,
              igtfAmount,
            },
            createdById: userId ?? 'SYSTEM',
            createdByName: 'Sistema',
          })
        )
      } catch (publishError) {
        logger.error('Error publicando evento finance.supplier_payment.completed', { error: publishError })
      }
      return payment
    })
  }

  async cancel(empresaId: string, id: string) {
    const payment = await this.findById(empresaId, id)
    if (payment.status === 'CANCELLED') throw new BadRequestError('El pago ya está cancelado')

    const db = this.db as PrismaClient
    return db.$transaction(async (tx) => {
      const updated = await (tx as any).supplierPayment.update({
        where: { id },
        data: { status: 'CANCELLED' },
        include: PAYMENT_INCLUDE,
      })

      // Compute debit in account currency (mirrors create logic)
      const bankAccount = await (tx as any).bankAccount.findFirst({
        where: { id: payment.bankAccountId, empresaId },
        select: { id: true, currency: true },
      })
      let restoreInAccountCurrency = Number(payment.totalWithIgtf)
      const paymentCurrency = payment.currency ?? 'USD'
      if (bankAccount && bankAccount.currency !== paymentCurrency) {
        const rate = Number(payment.exchangeRate ?? 0)
        if (rate > 0) {
          const isSameSide = (
            (bankAccount.currency === 'USD' && paymentCurrency === 'VES') ||
            (bankAccount.currency === 'EUR' && paymentCurrency === 'VES')
          )
          const isInverse = (
            (bankAccount.currency === 'VES' && paymentCurrency === 'USD') ||
            (bankAccount.currency === 'VES' && paymentCurrency === 'EUR')
          )
          if (isSameSide) {
            restoreInAccountCurrency = Number((Number(payment.totalWithIgtf) / rate).toFixed(2))
          } else if (isInverse) {
            restoreInAccountCurrency = Number((Number(payment.totalWithIgtf) * rate).toFixed(2))
          }
        }
      }

      // Revertir movimiento de caja en la moneda de la cuenta
      await (tx as any).cashTransaction.create({
        data: {
          bankAccountId: payment.bankAccountId,
          type: 'ADJUSTMENT',
          source: 'SUPPLIER_PAYMENT',
          sourceId: payment.id,
          amount: restoreInAccountCurrency,
          currency: bankAccount?.currency ?? paymentCurrency,
          exchangeRate: payment.exchangeRate,
          description: `Reversión pago ${payment.paymentNumber}`,
          empresaId,
        },
      })

      // Recalcular saldo de cuenta bancaria desde cashTransactions
      await recalculateBankBalance(tx, payment.bankAccountId, empresaId)

      // Recalcular bill o expense
      const billSvc = new SupplierBillService(tx as PrismaClientType)
      if (payment.supplierBillId) {
        await billSvc.recalculatePaidAmount(tx as PrismaClientType, empresaId, payment.supplierBillId)
      }
      if (payment.expenseId) {
        await this.recalculateExpensePaidAmount(tx as PrismaClientType, empresaId, payment.expenseId)
      }

      return updated
    })
  }

  private async recalculateExpensePaidAmount(db: PrismaClientType, empresaId: string, expenseId: string) {
    const prismaDb = db as PrismaClient
    const agg = await (prismaDb as any).supplierPayment.aggregate({
      where: { expenseId, empresaId, status: { not: 'CANCELLED' } },
      _sum: { amount: true },
    })
    const paidAmount = Number(agg._sum.amount ?? 0)
    const expense = await (prismaDb as any).expense.findUnique({ where: { id: expenseId } })
    if (!expense) return

    const total = Number(expense.total)
    const pendingAmount = Math.max(0, total - paidAmount)
    let status = 'PENDING'
    if (paidAmount >= total) status = 'PAID'
    else if (paidAmount > 0) status = 'PARTIAL'

    await (prismaDb as any).expense.update({
      where: { id: expenseId },
      data: { paidAmount, pendingAmount, status },
    })
  }
}

export default SupplierPaymentService
