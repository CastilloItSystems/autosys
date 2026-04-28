// backend/src/features/finance/supplierBills/supplierBills.service.ts

import { PrismaClient, Prisma } from '../../../generated/prisma/client.js'
import { PaginationHelper } from '../../../shared/utils/pagination.js'
import { createAuditLog } from '../../../services/audit.service.js'
import { domainEventBus } from '../../../shared/events/domain-event-bus.js'
import { toDomainEvent } from '../../../shared/events/domain-events.js'
import { logger } from '../../../shared/utils/logger.js'

function paginate<T>(data: T[], total: number, page: number, limit: number) {
  return { data, total, page, limit }
}
import { NotFoundError, ConflictError, BadRequestError } from '../../../shared/utils/apiError.js'
import {
  ICreateSupplierBillInput,
  IRegisterSupplierInvoiceInput,
  IUpdateSupplierBillInput,
  ISupplierBillFilters,
} from './supplierBills.interface.js'

type PrismaClientType = PrismaClient | Prisma.TransactionClient

const BILL_INCLUDE = {
  supplier: { select: { id: true, name: true, taxId: true } },
  purchaseOrder: { select: { id: true, orderNumber: true, total: true, status: true } },
  items: {
    include: {
      item: { select: { id: true, sku: true, name: true } },
    },
  },
  entryNotes: { select: { id: true, entryNoteNumber: true, status: true, createdAt: true } },
  payments: {
    select: { id: true, paymentNumber: true, amount: true, status: true, processedAt: true },
    where: { status: { not: 'CANCELLED' } },
  },
} as const

function generateInternalNumber(): string {
  const year = new Date().getFullYear()
  const ts = Date.now().toString(36).toUpperCase()
  const rnd = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `BILL-${year}-${ts}${rnd}`
}

function toNumber(value: unknown): number {
  return typeof value === 'number' ? value : parseFloat(String(value ?? 0))
}

function roundCurrency(value: number): number {
  return Number(value.toFixed(2))
}

function calculateStatus(total: number, paidAmount: number): 'PENDING' | 'PARTIAL' | 'PAID' {
  if (paidAmount >= total) return 'PAID'
  if (paidAmount > 0) return 'PARTIAL'
  return 'PENDING'
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

type SupplierBillItemInput = {
  itemId?: string | null
  itemName?: string | null
  quantity: number
  unitCost: number
  discountPercent?: number
  taxType?: 'IVA' | 'EXEMPT' | 'REDUCED'
  taxRate?: number
  notes?: string | null
}

function normalizeBillItems(items: SupplierBillItemInput[]) {
  return items.map((item) => {
    const quantity = Number(item.quantity || 0)
    const unitCost = Number(item.unitCost || 0)
    const discountPercent = Number(item.discountPercent ?? 0)
    const taxType = item.taxType ?? 'IVA'
    const taxRate = taxType === 'EXEMPT' ? 0 : Number(item.taxRate ?? 16)
    const gross = quantity * unitCost
    const discountAmount = roundCurrency(gross * (discountPercent / 100))
    const subtotal = roundCurrency(gross - discountAmount)
    const taxAmount = roundCurrency(subtotal * (taxRate / 100))
    const totalLine = roundCurrency(subtotal + taxAmount)

    return {
      itemId: item.itemId || null,
      itemName: item.itemName || null,
      quantity,
      unitCost,
      discountPercent,
      discountAmount,
      taxType,
      taxRate,
      taxAmount,
      subtotal,
      totalLine,
      notes: item.notes ?? null,
    }
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function calculateBillTotals(items: any[]) {
  const subtotal = roundCurrency(items.reduce((sum: number, item) => sum + toNumber(item.subtotal), 0))
  const taxAmount = roundCurrency(items.reduce((sum: number, item) => sum + toNumber(item.taxAmount), 0))
  const total = roundCurrency(items.reduce((sum: number, item) => sum + toNumber(item.totalLine ?? item.subtotal), 0))
  return { subtotal, taxAmount, total }
}

class SupplierBillService {
  private db: PrismaClientType

  constructor(db: PrismaClientType) {
    this.db = db
  }

  async findAll(empresaId: string, filters: ISupplierBillFilters = {}) {
    const { status, supplierId, purchaseOrderId, from, to, search, page = 1, limit = 20 } = filters
    const where: Prisma.SupplierBillWhereInput = { empresaId }

    if (status) where.status = status
    if (supplierId) where.supplierId = supplierId
    if (purchaseOrderId) where.purchaseOrderId = purchaseOrderId
    if (from || to) {
      where.issueDate = {}
      if (from) where.issueDate.gte = new Date(from)
      if (to) where.issueDate.lte = new Date(to)
    }
    if (search) {
      where.OR = [
        { billNumber: { contains: search, mode: 'insensitive' } },
        { internalNumber: { contains: search, mode: 'insensitive' } },
        { supplier: { name: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const db = this.db as PrismaClient
    const [total, data] = await Promise.all([
      db.supplierBill.count({ where }),
      db.supplierBill.findMany({
        where,
        include: BILL_INCLUDE,
        orderBy: { issueDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    return paginate(data, total, page, limit)
  }

  async findById(empresaId: string, id: string) {
    const db = this.db as PrismaClient
    const bill = await db.supplierBill.findFirst({ where: { id, empresaId }, include: BILL_INCLUDE })
    if (!bill) throw new NotFoundError('Factura de proveedor no encontrada')
    return bill
  }

  async getAvailablePurchaseOrders(empresaId: string) {
    const db = this.db as PrismaClient
    return db.purchaseOrder.findMany({
      where: {
        warehouse: { empresaId },
        status: { in: ['SENT', 'PARTIAL', 'COMPLETED'] as any },
        supplierBills: {
          none: {
            status: { not: 'CANCELLED' },
          },
        },
      },
      include: {
        supplier: { select: { id: true, name: true, taxId: true } },
        warehouse: { select: { id: true, name: true, code: true } },
        items: {
          include: {
            item: { select: { id: true, sku: true, name: true } },
          },
        },
      },
      orderBy: { sentAt: 'desc' },
      take: 200,
    })
  }

  async create(empresaId: string, input: ICreateSupplierBillInput) {
    const db = this.db as PrismaClient

    const existing = await db.supplierBill.findUnique({
      where: { empresaId_supplierId_billNumber: { empresaId, supplierId: input.supplierId, billNumber: input.billNumber } },
    })
    if (existing) throw new ConflictError(`El proveedor ya tiene una factura con el número "${input.billNumber}"`)

    if (input.purchaseOrderId) {
      const po = await db.purchaseOrder.findFirst({ where: { id: input.purchaseOrderId, warehouse: { empresaId } } })
      if (!po) throw new BadRequestError('Orden de compra no encontrada')
      const existingPoBill = await db.supplierBill.findFirst({
        where: {
          empresaId,
          purchaseOrderId: input.purchaseOrderId,
          status: { not: 'CANCELLED' },
        },
      })
      if (existingPoBill) {
        throw new ConflictError('Esta orden de compra ya tiene una factura de proveedor asociada')
      }
    }

    const normalizedItems = normalizeBillItems(input.items)
    if (normalizedItems.length === 0) {
      throw new BadRequestError('Debe agregar al menos un item a la factura')
    }

    const itemIds = normalizedItems
      .map((item) => item.itemId)
      .filter((itemId): itemId is string => Boolean(itemId))
    if (itemIds.length > 0) {
      const validItems = await db.item.count({
        where: { id: { in: itemIds }, empresaId },
      })
      if (validItems !== new Set(itemIds).size) {
        throw new BadRequestError('Uno o más items no pertenecen a esta empresa')
      }
    }

    const totals = calculateBillTotals(normalizedItems)
    const pendingAmount = totals.total
    const internalNumber = generateInternalNumber()

    const bill = await db.$transaction(async (tx) => {
      return tx.supplierBill.create({
        data: {
          internalNumber,
          billNumber: input.billNumber,
          status: 'PENDING',
          supplierId: input.supplierId,
          purchaseOrderId: input.purchaseOrderId ?? null,
          currency: input.currency as any,
          exchangeRate: input.exchangeRate ?? null,
          subtotal: totals.subtotal,
          taxAmount: totals.taxAmount,
          total: totals.total,
          paidAmount: 0,
          pendingAmount,
          issueDate: new Date(input.issueDate),
          dueDate:
            input.dueDate !== undefined
              ? input.dueDate
                ? new Date(input.dueDate)
                : null
              : undefined,
          attachmentUrl: input.attachmentUrl ?? null,
          notes: input.notes ?? null,
          empresaId,
          items: { create: normalizedItems },
        },
        include: BILL_INCLUDE,
      })
    })

    return bill
  }

  async update(empresaId: string, id: string, input: IUpdateSupplierBillInput) {
    const bill = await this.findById(empresaId, id)
    if (bill.status === 'CANCELLED') throw new BadRequestError('No se puede modificar una factura cancelada')
    if (input.items && Number(bill.paidAmount) > 0) {
      throw new BadRequestError('No se pueden modificar items de una factura con pagos aplicados')
    }

    const db = this.db as PrismaClient
    const normalizedItems = input.items ? normalizeBillItems(input.items) : null
    const totals = normalizedItems ? calculateBillTotals(normalizedItems) : null

    const updated = await db.$transaction(async (tx) => {
      if (normalizedItems) {
        await tx.supplierBillItem.deleteMany({ where: { supplierBillId: id } })
        for (const item of normalizedItems) {
          await tx.supplierBillItem.create({
            data: { ...item, supplierBillId: id },
          })
        }
      }

      return tx.supplierBill.update({
        where: { id },
        data: {
          billNumber: input.billNumber ?? undefined,
          currency: (input.currency as any) ?? undefined,
          exchangeRate: input.exchangeRate ?? undefined,
          subtotal: totals?.subtotal ?? input.subtotal ?? undefined,
          taxAmount: totals?.taxAmount ?? input.taxAmount ?? undefined,
          total: totals?.total ?? input.total ?? undefined,
          pendingAmount: totals
            ? Math.max(0, totals.total - Number(bill.paidAmount))
            : undefined,
          issueDate: input.issueDate ? new Date(input.issueDate) : undefined,
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
          attachmentUrl: input.attachmentUrl ?? undefined,
          notes: input.notes ?? undefined,
          status: input.status ?? undefined,
        } as any,
        include: BILL_INCLUDE,
      })
    })
    return updated
  }

  async cancel(empresaId: string, id: string) {
    const bill = await this.findById(empresaId, id)
    if (bill.status === 'PAID') throw new BadRequestError('No se puede cancelar una factura pagada totalmente')
    if (bill.status === 'CANCELLED') throw new BadRequestError('La factura ya está cancelada')

    const completedPayments = (bill.payments ?? []).filter((p: any) => p.status !== 'CANCELLED')
    if (completedPayments.length > 0) {
      throw new BadRequestError(
        'No se puede cancelar una factura con pagos aplicados. Cancele los pagos primero.'
      )
    }

    const db = this.db as PrismaClient
    return db.supplierBill.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: BILL_INCLUDE,
    })
  }

  async syncFromPurchaseOrderReceipt(
    empresaId: string,
    purchaseOrderId: string,
    userId?: string
  ) {
    const db = this.db as PrismaClient
    const po = await db.purchaseOrder.findFirst({
      where: { id: purchaseOrderId, warehouse: { empresaId } },
      include: {
        supplier: true,
        items: true,
        entryNotes: {
          where: { type: 'PURCHASE', status: 'COMPLETED' },
          include: { items: true },
          orderBy: { verifiedAt: 'asc' },
        },
      },
    })

    if (!po) throw new BadRequestError('Orden de compra no encontrada')
    if (po.entryNotes.length === 0) return null

    const poItemsByItemId = new Map(po.items.map((item) => [item.itemId, item]))
    const receivedByItemId = new Map<string, SupplierBillItemInput>()

    for (const entryNote of po.entryNotes) {
      for (const noteItem of entryNote.items) {
        const poItem = poItemsByItemId.get(noteItem.itemId)
        const current = receivedByItemId.get(noteItem.itemId)
        const quantity = (current?.quantity ?? 0) + noteItem.quantityReceived
        receivedByItemId.set(noteItem.itemId, {
          itemId: noteItem.itemId,
          itemName: noteItem.itemName ?? poItem?.itemName ?? null,
          quantity,
          unitCost: toNumber(noteItem.unitCost),
          discountPercent: poItem ? toNumber(poItem.discountPercent) : 0,
          taxType: (poItem?.taxType as any) ?? 'IVA',
          taxRate: poItem ? toNumber(poItem.taxRate) : 16,
          notes: `Recepción de OC ${po.orderNumber}`,
        })
      }
    }

    const normalizedItems = normalizeBillItems([...receivedByItemId.values()])
    const totals = calculateBillTotals(normalizedItems)
    const subtotal = totals.subtotal
    const taxAmount = totals.taxAmount
    const igtfAmount = po.igtfApplies
      ? roundCurrency((subtotal + taxAmount) * (toNumber(po.igtfRate) / 100))
      : 0
    const total = roundCurrency(subtotal + taxAmount + igtfAmount)

    if (total <= 0) return null

    const existing = await db.supplierBill.findFirst({
      where: {
        empresaId,
        purchaseOrderId,
        status: { not: 'CANCELLED' },
      },
      orderBy: { createdAt: 'asc' },
      include: BILL_INCLUDE,
    })

    let bill
    let action = 'CREATE_SUPPLIER_BILL_FROM_RECEIPT'

    if (existing) {
      if (existing.status === 'PAID') {
        throw new BadRequestError(
          'No se puede actualizar una cuenta por pagar ya pagada'
        )
      }

      const paidAmount = toNumber(existing.paidAmount)
      const pendingAmount = roundCurrency(Math.max(0, total - paidAmount))
      const nextStatus =
        existing.status === 'PENDING_INVOICE'
          ? 'PENDING_INVOICE'
          : calculateStatus(total, paidAmount)

      bill = await db.supplierBill.update({
        where: { id: existing.id },
        data: {
          subtotal,
          taxAmount,
          total,
          pendingAmount,
          status: nextStatus,
          notes:
            existing.notes ??
            `Generada por recepción de OC ${po.orderNumber}`,
        },
        include: BILL_INCLUDE,
      })
      await db.supplierBillItem.deleteMany({ where: { supplierBillId: bill.id } })
      for (const item of normalizedItems) {
        await db.supplierBillItem.create({
          data: { ...item, supplierBillId: bill.id },
        })
      }
      bill = await db.supplierBill.findUnique({
        where: { id: bill.id },
        include: BILL_INCLUDE,
      })
      action = 'UPDATE_SUPPLIER_BILL_FROM_RECEIPT'
    } else {
      bill = await db.supplierBill.create({
        data: {
          internalNumber: generateInternalNumber(),
          billNumber: null,
          status: 'PENDING_INVOICE',
          supplierId: po.supplierId,
          purchaseOrderId,
          currency: po.currency as any,
          exchangeRate: po.exchangeRate,
          subtotal,
          taxAmount,
          total,
          paidAmount: 0,
          pendingAmount: total,
          issueDate: null,
          dueDate: null,
          notes: `Provisión generada por recepción de OC ${po.orderNumber}`,
          empresaId,
          items: { create: normalizedItems },
        },
        include: BILL_INCLUDE,
      })
    }

    await db.entryNote.updateMany({
      where: {
        id: { in: po.entryNotes.map((entryNote) => entryNote.id) },
        supplierBillId: null,
      },
      data: { supplierBillId: bill.id },
    })

    await createAuditLog(
      {
        entity: 'SupplierBill',
        entityId: bill.id,
        action,
        empresaId,
        userId,
        changes: {
          subtotal,
          taxAmount,
          igtfAmount,
          total,
          pendingAmount: bill.pendingAmount,
        },
        metadata: {
          purchaseOrderId,
          orderNumber: po.orderNumber,
          entryNoteIds: po.entryNotes.map((entryNote) => entryNote.id),
        },
      },
      db
    )

    return bill
  }

  async registerInvoice(
    empresaId: string,
    id: string,
    input: IRegisterSupplierInvoiceInput,
    userId?: string
  ) {
    const bill = await this.findById(empresaId, id)
    if (bill.status !== 'PENDING_INVOICE') {
      throw new BadRequestError(
        'Solo se puede registrar factura sobre una provisión pendiente por factura'
      )
    }

    const db = this.db as PrismaClient
    const duplicate = await db.supplierBill.findFirst({
      where: {
        empresaId,
        supplierId: bill.supplierId,
        billNumber: input.billNumber,
        id: { not: id },
      },
    })
    if (duplicate) {
      throw new ConflictError(
        `El proveedor ya tiene una factura con el número "${input.billNumber}"`
      )
    }

    const supplier = await db.supplier.findFirst({
      where: { id: bill.supplierId, empresaId },
      select: { creditDays: true },
    })
    const issueDate = new Date(input.issueDate)
    const dueDate =
      input.dueDate === null
        ? null
        : input.dueDate
          ? new Date(input.dueDate)
          : addDays(issueDate, supplier?.creditDays ?? 0)

    // Re-derive totals from persisted items to avoid trusting client values
    let subtotal: number
    let taxAmount: number
    let total: number
    if (bill.items && bill.items.length > 0) {
      const computed = calculateBillTotals(bill.items as any)
      subtotal = computed.subtotal
      taxAmount = computed.taxAmount
      total = computed.total
    } else {
      subtotal = roundCurrency(toNumber(bill.subtotal))
      taxAmount = roundCurrency(toNumber(bill.taxAmount))
      total = roundCurrency(toNumber(bill.total))
    }
    const paidAmount = toNumber(bill.paidAmount)
    const pendingAmount = roundCurrency(Math.max(0, total - paidAmount))

    const updated = await db.supplierBill.update({
      where: { id },
      data: {
        billNumber: input.billNumber,
        issueDate,
        dueDate,
        subtotal,
        taxAmount,
        total,
        pendingAmount,
        attachmentUrl: input.attachmentUrl ?? bill.attachmentUrl,
        notes: input.notes ?? bill.notes,
        status: calculateStatus(total, paidAmount),
      },
      include: BILL_INCLUDE,
    })

    await createAuditLog(
      {
        entity: 'SupplierBill',
        entityId: id,
        action: 'REGISTER_SUPPLIER_INVOICE',
        empresaId,
        userId,
        changes: {
          before: {
            billNumber: bill.billNumber,
            issueDate: bill.issueDate,
            status: bill.status,
            subtotal: bill.subtotal,
            taxAmount: bill.taxAmount,
            total: bill.total,
          },
          after: {
            billNumber: updated.billNumber,
            issueDate: updated.issueDate,
            status: updated.status,
            subtotal: updated.subtotal,
            taxAmount: updated.taxAmount,
            total: updated.total,
          },
        },
        metadata: {
          purchaseOrderId: updated.purchaseOrderId,
          supplierId: updated.supplierId,
        },
      },
      db
    )

    try {
      await domainEventBus.publish(
        toDomainEvent({
          empresaId,
          eventCode: 'finance.supplier_bill.invoice_registered',
          module: 'finance',
          title: `Factura de proveedor registrada`,
          message: `Factura ${updated.billNumber} registrada para ${updated.supplier?.name ?? updated.supplierId}. Total: ${updated.currency} ${Number(updated.total).toFixed(2)}.`,
          type: 'info',
          entityType: 'SUPPLIER_BILL',
          entityId: id,
          priority: 'MEDIUM',
          severity: 'INFO',
          link: `/empresa/finanzas/facturas-proveedores`,
          source: 'finance.supplier_bills',
          dedupKey: `finance.supplier_bill.invoice_registered:${id}`,
          metadata: {
            billId: id,
            billNumber: updated.billNumber,
            supplierId: updated.supplierId,
            total: Number(updated.total),
            currency: updated.currency,
          },
          createdById: userId ?? 'SYSTEM',
          createdByName: 'Sistema',
        })
      )
    } catch (publishError) {
      logger.error('Error publicando evento finance.supplier_bill.invoice_registered', { error: publishError })
    }

    return updated
  }

  // Llamado internamente por supplierPayments.service al crear/cancelar un pago
  async recalculatePaidAmount(db: PrismaClientType, empresaId: string, billId: string) {
    const prismaDb = db as PrismaClient
    const agg = await prismaDb.supplierPayment.aggregate({
      where: { supplierBillId: billId, empresaId, status: { not: 'CANCELLED' } },
      _sum: { amount: true },
    })
    const paidAmount = Number(agg._sum.amount ?? 0)
    const bill = await prismaDb.supplierBill.findUnique({ where: { id: billId } })
    if (!bill) return

    const total = Number(bill.total)
    const pendingAmount = Math.max(0, total - paidAmount)
    let status: 'PENDING' | 'PARTIAL' | 'PAID' = 'PENDING'
    if (paidAmount >= total) status = 'PAID'
    else if (paidAmount > 0) status = 'PARTIAL'

    await prismaDb.supplierBill.update({
      where: { id: billId },
      data: {
        paidAmount,
        pendingAmount,
        status,
        paidAt: status === 'PAID' ? new Date() : null,
      },
    })
  }

  async getAccountsPayable(empresaId: string) {
    const db = this.db as PrismaClient
    const bills = await db.supplierBill.findMany({
      where: {
        empresaId,
        status: { in: ['PENDING_INVOICE', 'PENDING', 'PARTIAL'] },
      },
      include: {
        supplier: { select: { id: true, name: true, taxId: true } },
        purchaseOrder: { select: { id: true, orderNumber: true } },
      },
      orderBy: { dueDate: 'asc' },
    })

    const now = new Date()

    type SupplierEntry = {
      supplier: any
      totalPendingByCurrency: Record<string, number>
      overdueCount: number
      bills: any[]
    }

    const bySupplier = new Map<string, SupplierEntry>()

    for (const bill of bills) {
      if (!bySupplier.has(bill.supplierId)) {
        bySupplier.set(bill.supplierId, {
          supplier: bill.supplier,
          totalPendingByCurrency: {},
          overdueCount: 0,
          bills: [],
        })
      }
      const entry = bySupplier.get(bill.supplierId)!
      const cur = bill.currency ?? 'USD'
      // For PENDING_INVOICE bills, pendingAmount = total (no payments allowed yet)
      const pending = Number(
        bill.status === 'PENDING_INVOICE' ? bill.total : bill.pendingAmount
      )
      entry.totalPendingByCurrency[cur] =
        (entry.totalPendingByCurrency[cur] ?? 0) + pending

      if (bill.dueDate && new Date(bill.dueDate) < now && bill.status !== 'PENDING_INVOICE') {
        entry.overdueCount += 1
      }

      entry.bills.push({
        ...bill,
        pendingAmount: pending,
        isOverdue:
          bill.dueDate &&
          new Date(bill.dueDate) < now &&
          bill.status !== 'PENDING_INVOICE',
      })
    }

    return Array.from(bySupplier.values())
      .map((entry) => ({
        ...entry,
        // totalPending kept for backward compat (USD-equivalent best-effort)
        totalPending: Object.values(entry.totalPendingByCurrency).reduce(
          (s, v) => s + v,
          0
        ),
      }))
      .sort((a, b) => b.totalPending - a.totalPending)
  }
}

export default SupplierBillService
