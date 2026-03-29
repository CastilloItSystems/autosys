// backend/src/features/crm/quotes/quotes.service.ts

import { PrismaClient, Prisma } from '../../../generated/prisma/client.js'
import { logger } from '../../../shared/utils/logger.js'
import { PaginationHelper } from '../../../shared/utils/pagination.js'
import { NotFoundError, BadRequestError } from '../../../shared/utils/apiError.js'
import { CreateQuoteDTO, UpdateQuoteDTO, UpdateQuoteStatusDTO } from './quotes.dto.js'
import { IQuote, IQuoteFilters } from './quotes.interface.js'

type PrismaClientType = PrismaClient | Prisma.TransactionClient

// ── Valid status transitions ──────────────────────────────────────────────────

const STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['ISSUED', 'SENT'],
  ISSUED: ['SENT', 'NEGOTIATING', 'APPROVED', 'REJECTED', 'EXPIRED'],
  SENT: ['NEGOTIATING', 'APPROVED', 'REJECTED', 'EXPIRED'],
  NEGOTIATING: ['APPROVED', 'REJECTED', 'EXPIRED'],
  APPROVED: ['CONVERTED'],
  REJECTED: [],
  EXPIRED: [],
  CONVERTED: [],
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function generateQuoteNumber(db: PrismaClientType, empresaId: string): Promise<string> {
  const last = await (db as PrismaClient).quote.findFirst({
    where: { empresaId },
    orderBy: { quoteNumber: 'desc' },
    select: { quoteNumber: true },
  })

  let nextNum = 1
  if (last?.quoteNumber) {
    const match = last.quoteNumber.match(/^Q-(\d+)$/)
    if (match) {
      nextNum = parseInt(match[1], 10) + 1
    }
  }

  return `Q-${String(nextNum).padStart(4, '0')}`
}

interface CalcResult {
  items: Array<{
    description: string
    quantity: number
    unitPrice: number
    discountPct: number
    taxPct: number
    total: number
    itemId?: string | null
    notes?: string | null
  }>
  subtotal: number
  discountAmt: number
  taxAmt: number
  total: number
}

function calcItems(rawItems: CreateQuoteDTO['items'] = []): CalcResult {
  let subtotal = 0
  let discountAmt = 0
  let taxAmt = 0

  const items = (rawItems ?? []).map((item) => {
    const qty = Number(item.quantity)
    const price = Number(item.unitPrice)
    const discPct = Number(item.discountPct ?? 0)
    const taxPct = Number(item.taxPct ?? 0)

    const lineSubtotal = qty * price
    const lineDiscount = lineSubtotal * (discPct / 100)
    const lineTaxable = lineSubtotal - lineDiscount
    const lineTax = lineTaxable * (taxPct / 100)
    const lineTotal = lineTaxable + lineTax

    subtotal += lineSubtotal
    discountAmt += lineDiscount
    taxAmt += lineTax

    return {
      description: item.description,
      quantity: qty,
      unitPrice: price,
      discountPct: discPct,
      taxPct,
      total: lineTotal,
      itemId: item.itemId ?? null,
      notes: item.notes ?? null,
    }
  })

  const total = subtotal - discountAmt + taxAmt

  return { items, subtotal, discountAmt, taxAmt, total }
}

// ── Service ───────────────────────────────────────────────────────────────────

class QuotesService {
  // ---------------------------------------------------------------------------
  // CREATE
  // ---------------------------------------------------------------------------

  async create(
    db: PrismaClientType,
    empresaId: string,
    userId: string,
    dto: CreateQuoteDTO
  ): Promise<IQuote> {
    // Validate customer
    const customer = await (db as PrismaClient).customer.findFirst({
      where: { id: dto.customerId, empresaId },
    })
    if (!customer) throw new NotFoundError('Cliente no encontrado')

    // Validate lead if provided
    if (dto.leadId) {
      const lead = await (db as PrismaClient).lead.findFirst({
        where: { id: dto.leadId, empresaId },
      })
      if (!lead) throw new NotFoundError('Lead no encontrado')
    }

    const quoteNumber = await generateQuoteNumber(db, empresaId)
    const calc = calcItems(dto.items)

    const quote = await (db as PrismaClient).quote.create({
      data: {
        quoteNumber,
        version: 1,
        parentId: null,
        type: dto.type as any,
        status: 'DRAFT',
        customerId: dto.customerId,
        leadId: dto.leadId ?? null,
        title: dto.title,
        description: dto.description ?? null,
        subtotal: calc.subtotal,
        discountPct: Number(dto.discountPct ?? 0),
        discountAmt: calc.discountAmt,
        taxPct: Number(dto.taxPct ?? 0),
        taxAmt: calc.taxAmt,
        total: calc.total,
        currency: dto.currency ?? 'USD',
        validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
        paymentTerms: dto.paymentTerms ?? null,
        deliveryTerms: dto.deliveryTerms ?? null,
        notes: dto.notes ?? null,
        assignedTo: dto.assignedTo ?? null,
        createdBy: userId,
        empresaId,
        items: {
          create: calc.items,
        },
      },
      include: {
        customer: { select: { id: true, name: true, code: true } },
        lead: { select: { id: true, title: true, channel: true } },
        items: true,
      },
    })

    logger.info(`CRM - Cotización creada: ${quote.id}`, { quoteNumber, empresaId })
    return quote as unknown as IQuote
  }

  // ---------------------------------------------------------------------------
  // FIND ALL
  // ---------------------------------------------------------------------------

  async findAll(
    db: PrismaClientType,
    empresaId: string,
    filters: IQuoteFilters
  ): Promise<{ data: IQuote[]; total: number }> {
    const page = filters.page ?? 1
    const limit = filters.limit ?? 20
    const { skip, take } = PaginationHelper.validateAndParse({ page, limit })

    const where: Prisma.QuoteWhereInput = { empresaId }

    if (filters.type) where.type = filters.type as any
    if (filters.status) where.status = filters.status as any
    if (filters.customerId) where.customerId = filters.customerId
    if (filters.leadId) where.leadId = filters.leadId
    if (filters.assignedTo) where.assignedTo = filters.assignedTo

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { quoteNumber: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {}
      if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom)
      if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo)
    }

    const validSortFields = new Set(['createdAt', 'updatedAt', 'total', 'quoteNumber', 'status', 'validUntil'])
    const safeSortBy = validSortFields.has(filters.sortBy ?? '') ? filters.sortBy! : 'createdAt'
    const sortOrder = filters.sortOrder ?? 'desc'

    const [data, total] = await Promise.all([
      (db as PrismaClient).quote.findMany({
        where,
        orderBy: { [safeSortBy]: sortOrder },
        skip,
        take,
        include: {
          customer: { select: { id: true, name: true, code: true } },
          lead: { select: { id: true, title: true, channel: true } },
        },
      }),
      (db as PrismaClient).quote.count({ where }),
    ])

    return { data: data as unknown as IQuote[], total }
  }

  // ---------------------------------------------------------------------------
  // FIND BY ID
  // ---------------------------------------------------------------------------

  async findById(db: PrismaClientType, id: string, empresaId: string): Promise<IQuote> {
    const quote = await (db as PrismaClient).quote.findFirst({
      where: { id, empresaId },
      include: {
        customer: { select: { id: true, name: true, code: true } },
        lead: { select: { id: true, title: true, channel: true } },
        items: true,
        versions: {
          select: { id: true, quoteNumber: true, version: true, status: true, createdAt: true },
          orderBy: { version: 'asc' },
        },
      },
    })

    if (!quote) throw new NotFoundError('Cotización no encontrada')
    return quote as unknown as IQuote
  }

  // ---------------------------------------------------------------------------
  // UPDATE
  // ---------------------------------------------------------------------------

  async update(
    db: PrismaClientType,
    id: string,
    empresaId: string,
    dto: UpdateQuoteDTO
  ): Promise<IQuote> {
    const quote = await (db as PrismaClient).quote.findFirst({
      where: { id, empresaId },
    })
    if (!quote) throw new NotFoundError('Cotización no encontrada')
    if ((quote.status as string) !== 'DRAFT') {
      throw new BadRequestError('Solo se pueden editar cotizaciones en estado DRAFT')
    }

    // Validate lead if changed
    if (dto.leadId) {
      const lead = await (db as PrismaClient).lead.findFirst({
        where: { id: dto.leadId, empresaId },
      })
      if (!lead) throw new NotFoundError('Lead no encontrado')
    }

    const updateData: Record<string, unknown> = {}
    if (dto.title !== undefined) updateData.title = dto.title
    if (dto.description !== undefined) updateData.description = dto.description ?? null
    if (dto.currency !== undefined) updateData.currency = dto.currency
    if (dto.discountPct !== undefined) updateData.discountPct = Number(dto.discountPct)
    if (dto.taxPct !== undefined) updateData.taxPct = Number(dto.taxPct)
    if (dto.validUntil !== undefined) updateData.validUntil = dto.validUntil ? new Date(dto.validUntil) : null
    if (dto.paymentTerms !== undefined) updateData.paymentTerms = dto.paymentTerms ?? null
    if (dto.deliveryTerms !== undefined) updateData.deliveryTerms = dto.deliveryTerms ?? null
    if (dto.notes !== undefined) updateData.notes = dto.notes ?? null
    if (dto.assignedTo !== undefined) updateData.assignedTo = dto.assignedTo ?? null
    if (dto.leadId !== undefined) updateData.leadId = dto.leadId ?? null

    // Recalculate items if provided
    if (dto.items !== undefined) {
      const calc = calcItems(dto.items)
      updateData.subtotal = calc.subtotal
      updateData.discountAmt = calc.discountAmt
      updateData.taxAmt = calc.taxAmt
      updateData.total = calc.total

      // Replace items
      await (db as PrismaClient).quoteItem.deleteMany({ where: { quoteId: id } })
      await (db as PrismaClient).quoteItem.createMany({
        data: calc.items.map((item) => ({ ...item, quoteId: id })),
      })
    }

    const updated = await (db as PrismaClient).quote.update({
      where: { id },
      data: updateData,
      include: {
        customer: { select: { id: true, name: true, code: true } },
        lead: { select: { id: true, title: true, channel: true } },
        items: true,
      },
    })

    logger.info(`CRM - Cotización actualizada: ${id}`, { empresaId })
    return updated as unknown as IQuote
  }

  // ---------------------------------------------------------------------------
  // UPDATE STATUS
  // ---------------------------------------------------------------------------

  async updateStatus(
    db: PrismaClientType,
    id: string,
    empresaId: string,
    dto: UpdateQuoteStatusDTO
  ): Promise<IQuote> {
    const quote = await (db as PrismaClient).quote.findFirst({
      where: { id, empresaId },
    })
    if (!quote) throw new NotFoundError('Cotización no encontrada')

    const currentStatus = quote.status as string
    const allowedNext = STATUS_TRANSITIONS[currentStatus] ?? []

    if (!allowedNext.includes(dto.status)) {
      throw new BadRequestError(
        `No se puede cambiar el estado de ${currentStatus} a ${dto.status}. ` +
        `Transiciones válidas: ${allowedNext.length ? allowedNext.join(', ') : 'ninguna (estado terminal)'}`
      )
    }

    const updateData: Record<string, unknown> = { status: dto.status }

    // Set issuedAt when transitioning to ISSUED for the first time
    if (dto.status === 'ISSUED' && !quote.issuedAt) {
      updateData.issuedAt = new Date()
    }

    // Append notes if provided
    if (dto.notes) {
      const existing = (quote.notes as string | null) ?? ''
      updateData.notes = existing
        ? `${existing}\n[${new Date().toISOString()}] ${dto.notes}`
        : `[${new Date().toISOString()}] ${dto.notes}`
    }

    const updated = await (db as PrismaClient).quote.update({
      where: { id },
      data: updateData,
      include: {
        customer: { select: { id: true, name: true, code: true } },
        lead: { select: { id: true, title: true, channel: true } },
        items: true,
      },
    })

    logger.info(`CRM - Cotización estado actualizado: ${id} → ${dto.status}`, { empresaId })
    return updated as unknown as IQuote
  }

  // ---------------------------------------------------------------------------
  // REVISE (new version)
  // ---------------------------------------------------------------------------

  async revise(
    db: PrismaClientType,
    id: string,
    empresaId: string,
    userId: string,
    dto: CreateQuoteDTO
  ): Promise<IQuote> {
    const original = await (db as PrismaClient).quote.findFirst({
      where: { id, empresaId },
      include: { items: true },
    })
    if (!original) throw new NotFoundError('Cotización no encontrada')

    // Find the highest version for this quoteNumber
    const lastVersion = await (db as PrismaClient).quote.findFirst({
      where: { empresaId, quoteNumber: original.quoteNumber },
      orderBy: { version: 'desc' },
      select: { version: true },
    })

    const newVersion = (lastVersion?.version ?? original.version) + 1

    // Validate customer
    const customer = await (db as PrismaClient).customer.findFirst({
      where: { id: dto.customerId, empresaId },
    })
    if (!customer) throw new NotFoundError('Cliente no encontrado')

    // Validate lead if provided
    if (dto.leadId) {
      const lead = await (db as PrismaClient).lead.findFirst({
        where: { id: dto.leadId, empresaId },
      })
      if (!lead) throw new NotFoundError('Lead no encontrado')
    }

    const calc = calcItems(dto.items ?? (original.items as any[]).map((i) => ({
      description: i.description,
      quantity: Number(i.quantity),
      unitPrice: Number(i.unitPrice),
      discountPct: Number(i.discountPct),
      taxPct: Number(i.taxPct),
      itemId: i.itemId,
      notes: i.notes,
    })))

    // Determine parentId: use original's parentId if it exists, else original's id
    const parentId = original.parentId ?? original.id

    const revised = await (db as PrismaClient).quote.create({
      data: {
        quoteNumber: original.quoteNumber,
        version: newVersion,
        parentId,
        type: (original.type as any),
        status: 'DRAFT',
        customerId: dto.customerId ?? original.customerId,
        leadId: dto.leadId !== undefined ? (dto.leadId ?? null) : original.leadId,
        title: dto.title ?? original.title,
        description: dto.description !== undefined ? (dto.description ?? null) : original.description,
        subtotal: calc.subtotal,
        discountPct: Number(dto.discountPct ?? original.discountPct),
        discountAmt: calc.discountAmt,
        taxPct: Number(dto.taxPct ?? original.taxPct),
        taxAmt: calc.taxAmt,
        total: calc.total,
        currency: dto.currency ?? (original.currency as string),
        validUntil: dto.validUntil ? new Date(dto.validUntil) : original.validUntil,
        paymentTerms: dto.paymentTerms !== undefined ? (dto.paymentTerms ?? null) : original.paymentTerms,
        deliveryTerms: dto.deliveryTerms !== undefined ? (dto.deliveryTerms ?? null) : original.deliveryTerms,
        notes: dto.notes !== undefined ? (dto.notes ?? null) : original.notes,
        assignedTo: dto.assignedTo !== undefined ? (dto.assignedTo ?? null) : original.assignedTo,
        createdBy: userId,
        empresaId,
        items: {
          create: calc.items,
        },
      },
      include: {
        customer: { select: { id: true, name: true, code: true } },
        lead: { select: { id: true, title: true, channel: true } },
        items: true,
      },
    })

    logger.info(`CRM - Cotización revisada: ${revised.id} (v${newVersion} de ${original.quoteNumber})`, { empresaId })
    return revised as unknown as IQuote
  }

  // ---------------------------------------------------------------------------
  // DELETE
  // ---------------------------------------------------------------------------

  async delete(
    db: PrismaClientType,
    id: string,
    empresaId: string
  ): Promise<{ success: boolean; id: string }> {
    const quote = await (db as PrismaClient).quote.findFirst({
      where: { id, empresaId },
    })
    if (!quote) throw new NotFoundError('Cotización no encontrada')
    if ((quote.status as string) !== 'DRAFT') {
      throw new BadRequestError(
        `Solo se pueden eliminar cotizaciones en estado DRAFT. Estado actual: ${quote.status}`
      )
    }

    await (db as PrismaClient).quote.delete({ where: { id } })

    logger.info(`CRM - Cotización eliminada: ${id}`, { empresaId })
    return { success: true, id }
  }
}

export default new QuotesService()
