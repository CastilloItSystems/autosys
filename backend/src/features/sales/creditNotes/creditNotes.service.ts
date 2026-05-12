// backend/src/features/sales/creditNotes/creditNotes.service.ts

import { PrismaClient, Prisma, OrderCurrency, TaxType } from '../../../generated/prisma/client.js'
import { logger } from '../../../shared/utils/logger.js'
import { PaginationHelper } from '../../../shared/utils/pagination.js'
import {
  NotFoundError,
  BadRequestError,
} from '../../../shared/utils/apiError.js'
import {
  ICreditNoteWithRelations,
  ICreateCreditNoteInput,
  ICreditNoteFilters,
  CreditNoteStatus,
} from './creditNotes.interface.js'
import { resolveUserNames } from '../shared/userNameResolver.js'

type PrismaClientType = PrismaClient | Prisma.TransactionClient

const CN_INCLUDE = {
  items: {
    include: {
      item: { select: { id: true, name: true, code: true } },
    },
  },
  invoice: {
    select: {
      id: true,
      invoiceNumber: true,
      fiscalNumber: true,
      status: true,
      total: true,
    },
  },
  customer: {
    select: {
      id: true,
      name: true,
      code: true,
      taxId: true,
    },
  },
} as const

function generateCreditNoteNumber(count: number): string {
  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
  return `NCA-${dateStr}-${String(count + 1).padStart(4, '0')}`
}

async function enrichWithUserNames(
  db: PrismaClientType,
  records: any[]
): Promise<any[]> {
  const allUserIds = records.flatMap((cn) => [cn.issuedBy, cn.cancelledBy])
  const names = await resolveUserNames(db, allUserIds)
  return records.map((cn) => ({
    ...cn,
    issuedByName: names.get(cn.issuedBy) ?? null,
    cancelledByName: names.get(cn.cancelledBy) ?? null,
  }))
}

class CreditNoteService {
  async create(
    empresaId: string,
    input: ICreateCreditNoteInput,
    userId: string,
    db: PrismaClientType
  ): Promise<ICreditNoteWithRelations> {
    const invoice = await (db as PrismaClient).invoice.findFirst({
      where: { id: input.invoiceId, empresaId },
      select: { id: true, status: true, customerId: true, invoiceNumber: true },
    })

    if (!invoice) throw new NotFoundError('Factura no encontrada')

    if (invoice.status === 'CANCELLED') {
      throw new BadRequestError('No se puede emitir una nota de crédito sobre una factura anulada')
    }

    const count = await (db as PrismaClient).creditNote.count({
      where: { empresaId },
    })

    const creditNoteNumber = generateCreditNoteNumber(count)

    const created = await (db as PrismaClient).$transaction(async (tx) => {
      const cn = await tx.creditNote.create({
        data: {
          creditNoteNumber,
          status: CreditNoteStatus.ACTIVE,
          empresa: { connect: { id_empresa: empresaId } },
          invoice: { connect: { id: input.invoiceId } },
          customer: { connect: { id: invoice.customerId } },
          reason: input.reason,
          currency: (input.currency ?? 'USD') as OrderCurrency,
          exchangeRate: input.exchangeRate ?? null,
          discountAmount: input.discountAmount ?? 0,
          subtotalBruto: input.subtotalBruto,
          baseImponible: input.baseImponible ?? 0,
          baseExenta: input.baseExenta ?? 0,
          taxAmount: input.taxAmount,
          taxRate: input.taxRate ?? 0,
          igtfApplies: input.igtfApplies ?? false,
          igtfRate: input.igtfRate ?? 0,
          igtfAmount: input.igtfAmount ?? 0,
          total: input.total,
          notes: input.notes ?? null,
          issuedBy: userId,
          issuedAt: new Date(),
          items: {
            create: input.items.map((item) => ({
              itemId: item.itemId ?? null,
              itemName: item.itemName ?? null,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discountPercent: item.discountPercent ?? 0,
              discountAmount: item.discountAmount ?? 0,
              taxType: (item.taxType ?? 'EXEMPT') as TaxType,
              taxRate: item.taxRate ?? 0,
              taxAmount: item.taxAmount,
              subtotal: item.subtotal,
              totalLine: item.totalLine,
            })),
          },
        },
        include: CN_INCLUDE,
      })

      await tx.invoice.update({
        where: { id: input.invoiceId },
        data: { status: 'CREDITED' },
      })

      return cn
    })

    logger.info(`Nota de crédito creada: ${creditNoteNumber}`, { empresaId, invoiceId: input.invoiceId })

    const [enriched] = await enrichWithUserNames(db, [created])
    return enriched as unknown as ICreditNoteWithRelations
  }

  async findAll(
    empresaId: string,
    filters: ICreditNoteFilters,
    page: number,
    limit: number,
    db: PrismaClientType
  ): Promise<{ items: ICreditNoteWithRelations[]; total: number; page: number; limit: number }> {
    const { skip, take } = PaginationHelper.validateAndParse({ page, limit })

    const where: Prisma.CreditNoteWhereInput = { empresaId }

    if (filters.status) where.status = filters.status as any
    if (filters.invoiceId) where.invoiceId = filters.invoiceId
    if (filters.customerId) where.customerId = filters.customerId
    if (filters.from || filters.to) {
      where.createdAt = {}
      if (filters.from) (where.createdAt as any).gte = new Date(filters.from)
      if (filters.to) (where.createdAt as any).lte = new Date(filters.to)
    }

    const [data, total] = await Promise.all([
      (db as PrismaClient).creditNote.findMany({
        where,
        include: CN_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      (db as PrismaClient).creditNote.count({ where }),
    ])

    const enriched = await enrichWithUserNames(db, data as any[])

    return {
      items: enriched as unknown as ICreditNoteWithRelations[],
      total,
      page,
      limit,
    }
  }

  async findById(
    id: string,
    empresaId: string,
    db: PrismaClientType
  ): Promise<ICreditNoteWithRelations> {
    const cn = await (db as PrismaClient).creditNote.findFirst({
      where: { id, empresaId },
      include: CN_INCLUDE,
    })

    if (!cn) throw new NotFoundError('Nota de crédito no encontrada')

    const [enriched] = await enrichWithUserNames(db, [cn])
    return enriched as unknown as ICreditNoteWithRelations
  }

  async cancel(
    id: string,
    empresaId: string,
    userId: string,
    reason: string,
    db: PrismaClientType
  ): Promise<ICreditNoteWithRelations> {
    const cn = await (db as PrismaClient).creditNote.findFirst({
      where: { id, empresaId },
      select: { id: true, status: true, invoiceId: true, creditNoteNumber: true },
    })

    if (!cn) throw new NotFoundError('Nota de crédito no encontrada')

    if (cn.status === CreditNoteStatus.CANCELLED) {
      throw new BadRequestError('La nota de crédito ya está anulada')
    }

    const updated = await (db as PrismaClient).$transaction(async (tx) => {
      const result = await tx.creditNote.update({
        where: { id },
        data: {
          status: CreditNoteStatus.CANCELLED,
          cancelledAt: new Date(),
          cancelledBy: userId,
          cancellationReason: reason,
        },
        include: CN_INCLUDE,
      })

      // If no other ACTIVE credit notes remain for this invoice, revert invoice to ACTIVE
      const remainingActive = await tx.creditNote.count({
        where: {
          invoiceId: cn.invoiceId,
          status: CreditNoteStatus.ACTIVE,
        },
      })

      if (remainingActive === 0) {
        await tx.invoice.update({
          where: { id: cn.invoiceId },
          data: { status: 'ACTIVE' },
        })
      }

      return result
    })

    logger.info(`Nota de crédito anulada: ${cn.creditNoteNumber}`, {
      empresaId,
      reason,
    })

    const [enriched] = await enrichWithUserNames(db, [updated])
    return enriched as unknown as ICreditNoteWithRelations
  }
}

export default new CreditNoteService()
