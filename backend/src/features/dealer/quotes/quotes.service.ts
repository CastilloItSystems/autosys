import { DealerQuoteStatus, DealerUnitStatus, Prisma, PrismaClient } from '../../../generated/prisma/client.js'
import { BadRequestError, NotFoundError } from '../../../shared/utils/apiError.js'
import { logger } from '../../../shared/utils/logger.js'
import { PaginationHelper } from '../../../shared/utils/pagination.js'
import { CreateDealerQuoteDTO, UpdateDealerQuoteDTO } from './quotes.dto.js'
import { IDealerQuote, IDealerQuoteFilters } from './quotes.interface.js'
import ordersService from '../../sales/orders/orders.service.js'
import { CreateOrderDTO } from '../../sales/orders/orders.dto.js'

type PrismaClientType = PrismaClient | Prisma.TransactionClient

const QUOTE_INCLUDE = {
  customer: {
    select: {
      id: true,
      code: true,
      name: true,
      phone: true,
      email: true,
      taxId: true,
    },
  },
  dealerUnit: {
    select: {
      id: true,
      code: true,
      vin: true,
      plate: true,
      itemId: true,
      warehouseId: true,
      item: { select: { id: true, code: true, sku: true, name: true } },
      warehouse: { select: { id: true, code: true, name: true } },
      status: true,
      brand: { select: { id: true, code: true, name: true } },
      model: { select: { id: true, name: true, year: true } },
    },
  },
} as const

const STATUS_TRANSITIONS: Record<DealerQuoteStatus, DealerQuoteStatus[]> = {
  DRAFT: ['SENT', 'NEGOTIATING', 'APPROVED', 'REJECTED', 'EXPIRED'],
  SENT: ['NEGOTIATING', 'APPROVED', 'REJECTED', 'EXPIRED'],
  NEGOTIATING: ['APPROVED', 'REJECTED', 'EXPIRED'],
  APPROVED: ['CONVERTED'],
  REJECTED: [],
  EXPIRED: [],
  CONVERTED: [],
}

class DealerQuotesService {
  private normalizeCurrency(currency?: string | null): 'USD' | 'VES' | 'EUR' {
    const normalized = String(currency || 'USD').toUpperCase()
    if (normalized !== 'USD' && normalized !== 'VES' && normalized !== 'EUR') {
      throw new BadRequestError('Moneda inválida. Debe ser USD, VES o EUR')
    }
    return normalized
  }

  private async resolveExchangeRate(
    empresaId: string,
    currency: 'USD' | 'VES' | 'EUR',
    exchangeRate: number | null | undefined,
    exchangeRateSource: 'BCV_AUTO' | 'MANUAL' | null | undefined,
    db: PrismaClientType
  ): Promise<{ exchangeRate: number; exchangeRateSource: 'BCV_AUTO' | 'MANUAL' }> {
    if (currency === 'VES') {
      return { exchangeRate: 1, exchangeRateSource: exchangeRateSource ?? 'BCV_AUTO' }
    }

    if (exchangeRateSource === 'MANUAL') {
      if (!exchangeRate || exchangeRate <= 0) {
        throw new BadRequestError('Debe indicar exchangeRate manual para moneda distinta a VES')
      }
      return { exchangeRate, exchangeRateSource: 'MANUAL' }
    }

    if (exchangeRate && exchangeRate > 0) {
      return { exchangeRate, exchangeRateSource: exchangeRateSource ?? 'BCV_AUTO' }
    }

    const latestRate = await (db as PrismaClient).exchangeRate.findFirst({
      where: {
        empresaId,
        fromCurrency: currency as any,
        toCurrency: 'VES',
        isActive: true,
      },
      orderBy: [{ rateDate: 'desc' }, { createdAt: 'desc' }],
    })

    if (!latestRate) {
      throw new BadRequestError(`No existe tasa activa para ${currency}/VES`)
    }

    return {
      exchangeRate: Number(latestRate.rate),
      exchangeRateSource: 'BCV_AUTO',
    }
  }

  private async assertUnitValid(dealerUnitId: string, empresaId: string, db: PrismaClientType) {
    const unit = await (db as PrismaClient).dealerUnit.findFirst({
      where: { id: dealerUnitId, empresaId, isActive: true },
      select: { id: true, status: true, listPrice: true },
    })
    if (!unit) throw new NotFoundError('Unidad no encontrada')
    return unit
  }

  private async assertCustomerValid(customerId: string, empresaId: string, db: PrismaClientType) {
    const customer = await (db as PrismaClient).customer.findFirst({
      where: { id: customerId, empresaId, isActive: true },
      select: {
        id: true,
        name: true,
        taxId: true,
        phone: true,
        mobile: true,
        email: true,
      },
    })
    if (!customer) throw new NotFoundError('Cliente no encontrado')
    return customer
  }

  private async generateQuoteNumber(empresaId: string, db: PrismaClientType): Promise<string> {
    const now = new Date()
    const yy = String(now.getFullYear()).slice(-2)
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const dd = String(now.getDate()).padStart(2, '0')
    const prefix = `COT-${yy}${mm}${dd}-`

    const countToday = await (db as PrismaClient).dealerQuote.count({
      where: {
        empresaId,
        quoteNumber: { startsWith: prefix },
      },
    })

    return `${prefix}${String(countToday + 1).padStart(4, '0')}`
  }

  private calculateTotals(input: {
    listPrice?: number | null
    discountPct?: number | null
    offeredPrice?: number | null
    taxPct?: number | null
  }) {
    const listPrice = input.listPrice != null ? Number(input.listPrice) : null
    const offeredPrice = input.offeredPrice != null ? Number(input.offeredPrice) : listPrice
    const discountPct = input.discountPct != null ? Number(input.discountPct) : 0
    const taxPct = input.taxPct != null ? Number(input.taxPct) : 0

    let discountAmount = null as number | null
    if (listPrice != null && offeredPrice != null) {
      discountAmount = Math.max(listPrice - offeredPrice, 0)
    } else if (listPrice != null && discountPct > 0) {
      discountAmount = listPrice * (discountPct / 100)
    }

    const taxable = offeredPrice ?? listPrice
    const taxAmount = taxable != null ? taxable * (taxPct / 100) : null
    const totalAmount = taxable != null ? taxable + (taxAmount ?? 0) : null

    return {
      listPrice,
      offeredPrice,
      discountPct,
      discountAmount,
      taxPct,
      taxAmount,
      totalAmount,
    }
  }

  private validateTransition(currentStatus: DealerQuoteStatus, newStatus: DealerQuoteStatus) {
    if (currentStatus === newStatus) return
    const allowed = STATUS_TRANSITIONS[currentStatus]
    if (!allowed.includes(newStatus)) {
      throw new BadRequestError(`Transición no permitida: ${currentStatus} -> ${newStatus}`)
    }
  }

  async create(data: CreateDealerQuoteDTO, empresaId: string, userId: string, db: PrismaClientType): Promise<IDealerQuote> {
    const unit = await this.assertUnitValid(data.dealerUnitId, empresaId, db)
    const customer = await this.assertCustomerValid(data.customerId, empresaId, db)

    const status = (data.status as DealerQuoteStatus) || DealerQuoteStatus.DRAFT
    const quoteNumber = await this.generateQuoteNumber(empresaId, db)
    const totals = this.calculateTotals({
      listPrice: data.listPrice ?? (unit.listPrice as unknown as number | null),
      discountPct: data.discountPct,
      offeredPrice: data.offeredPrice,
      taxPct: data.taxPct,
    })

    const created = await (db as PrismaClient).dealerQuote.create({
      data: {
        empresaId,
        dealerUnitId: data.dealerUnitId,
        customerId: data.customerId,
        quoteNumber,
        status,
        customerName: data.customerName || customer.name,
        customerDocument: data.customerDocument ?? customer.taxId ?? null,
        customerPhone: data.customerPhone ?? customer.phone ?? customer.mobile ?? null,
        customerEmail: data.customerEmail ?? customer.email ?? null,
        listPrice: totals.listPrice,
        discountPct: totals.discountPct,
        discountAmount: totals.discountAmount,
        offeredPrice: totals.offeredPrice,
        taxPct: totals.taxPct,
        taxAmount: totals.taxAmount,
        totalAmount: totals.totalAmount,
        currency: this.normalizeCurrency(data.currency),
        exchangeRate: data.exchangeRate ?? null,
        exchangeRateSource: (data.exchangeRateSource as any) ?? null,
        validUntil: data.validUntil ?? null,
        paymentTerms: data.paymentTerms ?? null,
        financingRequired: data.financingRequired ?? false,
        notes: data.notes ?? null,
        fiscalStatus: 'NOT_REQUESTED',
        ...(status === DealerQuoteStatus.SENT ? { sentAt: new Date() } : {}),
        ...(status === DealerQuoteStatus.APPROVED ? { approvedAt: new Date() } : {}),
        ...(status === DealerQuoteStatus.REJECTED ? { rejectedAt: new Date() } : {}),
      },
      include: QUOTE_INCLUDE,
    })

    logger.info('Dealer quote creada', { id: created.id, quoteNumber, empresaId, userId })
    return created as unknown as IDealerQuote
  }

  async findById(id: string, empresaId: string, db: PrismaClientType): Promise<IDealerQuote> {
    const quote = await (db as PrismaClient).dealerQuote.findFirst({
      where: { id, empresaId },
      include: QUOTE_INCLUDE,
    })
    if (!quote) throw new NotFoundError('Cotización no encontrada')
    return quote as unknown as IDealerQuote
  }

  async findAll(
    filters: IDealerQuoteFilters,
    page: number,
    limit: number,
    empresaId: string,
    db: PrismaClientType,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ data: IDealerQuote[]; total: number }> {
    const { skip, take } = PaginationHelper.validateAndParse({ page, limit })

    const where: Prisma.DealerQuoteWhereInput = { empresaId }
    if (filters.dealerUnitId) where.dealerUnitId = filters.dealerUnitId
    if (filters.status) where.status = filters.status as DealerQuoteStatus
    if (filters.isActive !== undefined) where.isActive = filters.isActive
    if (filters.fromDate || filters.toDate) {
      where.createdAt = {}
      if (filters.fromDate) where.createdAt.gte = filters.fromDate
      if (filters.toDate) where.createdAt.lte = filters.toDate
    }
    if (filters.search) {
      const search = filters.search.trim()
      where.OR = [
        { quoteNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerDocument: { contains: search, mode: 'insensitive' } },
        { customerPhone: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { dealerUnit: { vin: { contains: search, mode: 'insensitive' } } },
        { dealerUnit: { code: { contains: search, mode: 'insensitive' } } },
        { dealerUnit: { plate: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const validSortFields = new Set(['createdAt', 'updatedAt', 'status', 'totalAmount', 'validUntil'])
    const safeSortBy = validSortFields.has(sortBy) ? sortBy : 'createdAt'

    const [data, total] = await Promise.all([
      (db as PrismaClient).dealerQuote.findMany({
        where,
        include: QUOTE_INCLUDE,
        orderBy: { [safeSortBy]: sortOrder },
        skip,
        take,
      }),
      (db as PrismaClient).dealerQuote.count({ where }),
    ])

    return { data: data as unknown as IDealerQuote[], total }
  }

  async update(id: string, data: UpdateDealerQuoteDTO, empresaId: string, userId: string, db: PrismaClientType): Promise<IDealerQuote> {
    const current = await this.findById(id, empresaId, db)

    const newStatus = data.status ? (data.status as DealerQuoteStatus) : current.status
    this.validateTransition(current.status, newStatus)

    const listPrice = data.listPrice !== undefined ? data.listPrice : ((current.listPrice as unknown as number | null) ?? null)
    const offeredPrice = data.offeredPrice !== undefined ? data.offeredPrice : ((current.offeredPrice as unknown as number | null) ?? null)
    const discountPct = data.discountPct !== undefined ? data.discountPct : ((current.discountPct as unknown as number | null) ?? null)
    const taxPct = data.taxPct !== undefined ? data.taxPct : ((current.taxPct as unknown as number | null) ?? null)
    const totals = this.calculateTotals({ listPrice, offeredPrice, discountPct, taxPct })

    const updateData: Prisma.DealerQuoteUpdateInput = {
      listPrice: totals.listPrice,
      discountPct: totals.discountPct,
      discountAmount: totals.discountAmount,
      offeredPrice: totals.offeredPrice,
      taxPct: totals.taxPct,
      taxAmount: totals.taxAmount,
      totalAmount: totals.totalAmount,
    }

    if (data.customerId !== undefined) {
      await this.assertCustomerValid(data.customerId, empresaId, db)
      updateData.customer = { connect: { id: data.customerId } }
    }
    if (data.customerName !== undefined) updateData.customerName = data.customerName
    if (data.customerDocument !== undefined) updateData.customerDocument = data.customerDocument || null
    if (data.customerPhone !== undefined) updateData.customerPhone = data.customerPhone || null
    if (data.customerEmail !== undefined) updateData.customerEmail = data.customerEmail || null
    if (data.currency !== undefined) updateData.currency = this.normalizeCurrency(data.currency || null) as any
    if (data.exchangeRate !== undefined) updateData.exchangeRate = data.exchangeRate ?? null
    if (data.exchangeRateSource !== undefined) updateData.exchangeRateSource = (data.exchangeRateSource as any) ?? null
    if (data.validUntil !== undefined) updateData.validUntil = data.validUntil ?? null
    if (data.paymentTerms !== undefined) updateData.paymentTerms = data.paymentTerms || null
    if (data.financingRequired !== undefined) updateData.financingRequired = data.financingRequired
    if (data.notes !== undefined) updateData.notes = data.notes || null
    if (data.status !== undefined) updateData.status = newStatus
    if (data.isActive !== undefined) updateData.isActive = data.isActive

    if (current.status !== newStatus) {
      if (newStatus === DealerQuoteStatus.SENT) updateData.sentAt = new Date()
      if (newStatus === DealerQuoteStatus.APPROVED) updateData.approvedAt = new Date()
      if (newStatus === DealerQuoteStatus.REJECTED) updateData.rejectedAt = new Date()
      if (newStatus === DealerQuoteStatus.CONVERTED) {
        throw new BadRequestError('Para convertir una cotización debe usar la acción convert-and-fiscalize')
      }
    }

    const updated = await (db as PrismaClient).dealerQuote.update({
      where: { id },
      data: updateData,
      include: QUOTE_INCLUDE,
    })
    logger.info('Dealer quote actualizada', { id, empresaId, userId, status: newStatus })
    return updated as unknown as IDealerQuote
  }

  async convertAndFiscalize(
    id: string,
    empresaId: string,
    userId: string,
    db: PrismaClientType,
    force = false
  ): Promise<IDealerQuote> {
    const quote = await this.findById(id, empresaId, db)

    if (!force && quote.salesOrderId && quote.preInvoiceId) {
      return quote
    }

    if (!force && quote.status !== DealerQuoteStatus.APPROVED) {
      throw new BadRequestError('Solo se pueden fiscalizar cotizaciones aprobadas')
    }

    const unit = await (db as PrismaClient).dealerUnit.findFirst({
      where: { id: quote.dealerUnitId, empresaId, isActive: true },
      select: { id: true, itemId: true, warehouseId: true },
    })
    if (!unit) throw new NotFoundError('Unidad no encontrada')
    if (!unit.itemId || !unit.warehouseId) {
      throw new BadRequestError('La unidad no tiene itemId/warehouseId fiscal configurado')
    }

    if (quote.salesOrderId && !force) {
      const existingOrder = await (db as PrismaClient).order.findFirst({
        where: { id: quote.salesOrderId, empresaId },
        select: { id: true },
      })
      const existingPreInvoice = await (db as PrismaClient).preInvoice.findFirst({
        where: { orderId: quote.salesOrderId, empresaId },
        select: { id: true, invoice: { select: { id: true } } },
      })

      if (existingOrder && existingPreInvoice) {
        const synced = await (db as PrismaClient).dealerQuote.update({
          where: { id: quote.id },
          data: {
            status: DealerQuoteStatus.CONVERTED,
            convertedAt: quote.convertedAt ?? new Date(),
            fiscalStatus: existingPreInvoice.invoice ? 'INVOICED' : 'PREINVOICE_READY',
            preInvoiceId: existingPreInvoice.id,
            invoiceId: existingPreInvoice.invoice?.id ?? null,
            fiscalError: null,
          },
          include: QUOTE_INCLUDE,
        })
        return synced as unknown as IDealerQuote
      }
    }

    try {
      const currency = this.normalizeCurrency(quote.currency)
      const fx = await this.resolveExchangeRate(
        empresaId,
        currency,
        quote.exchangeRate ? Number(quote.exchangeRate) : null,
        (quote.exchangeRateSource as any) ?? null,
        db
      )
      const unitPrice = Number(quote.offeredPrice ?? quote.listPrice ?? quote.totalAmount ?? 0)
      if (unitPrice <= 0) {
        throw new BadRequestError('La cotización debe tener precio válido para fiscalizar')
      }

      await (db as PrismaClient).dealerQuote.update({
        where: { id: quote.id },
        data: { fiscalStatus: 'ORDER_DRAFT', fiscalError: null },
      })

      const createdOrder = await ordersService.createWithItems(
        new CreateOrderDTO({
          customerId: quote.customerId,
          warehouseId: unit.warehouseId,
          currency,
          exchangeRate: fx.exchangeRate,
          exchangeRateSource: fx.exchangeRateSource,
          paymentTerms: quote.paymentTerms ?? undefined,
          taxRate: Number(quote.taxPct ?? 16),
          igtfApplies: currency !== 'VES',
          items: [
            {
              itemId: unit.itemId,
              itemName: quote.dealerUnit.code || quote.dealerUnit.vin || quote.dealerUnit.item.name,
              quantity: 1,
              unitPrice,
              discountPercent: Number(quote.discountPct ?? 0),
              taxType: Number(quote.taxPct ?? 16) > 0 ? 'IVA' : 'EXEMPT',
            },
          ],
          notes: `Generada desde cotización dealer ${quote.quoteNumber}`,
        }),
        empresaId,
        userId,
        db
      )

      const approvedOrder = await ordersService.approve(createdOrder.id, empresaId, userId, db)
      const preInvoice = await (db as PrismaClient).preInvoice.findFirst({
        where: { orderId: approvedOrder.id, empresaId },
        select: { id: true, invoice: { select: { id: true } } },
      })

      const fiscalStatus = preInvoice?.invoice
        ? 'INVOICED'
        : preInvoice
          ? 'PREINVOICE_READY'
          : 'ORDER_APPROVED'

      const updated = await (db as PrismaClient).dealerQuote.update({
        where: { id: quote.id },
        data: {
          status: DealerQuoteStatus.CONVERTED,
          convertedAt: new Date(),
          currency,
          exchangeRate: fx.exchangeRate,
          exchangeRateSource: fx.exchangeRateSource as any,
          salesOrderId: approvedOrder.id,
          preInvoiceId: preInvoice?.id ?? null,
          invoiceId: preInvoice?.invoice?.id ?? null,
          fiscalStatus: fiscalStatus as any,
          fiscalError: null,
        },
        include: QUOTE_INCLUDE,
      })

      await (db as PrismaClient).dealerUnit.update({
        where: { id: quote.dealerUnitId },
        data: { status: DealerUnitStatus.IN_DOCUMENTATION },
      })

      logger.info('Dealer quote convertida y fiscalizada', {
        quoteId: quote.id,
        orderId: approvedOrder.id,
        preInvoiceId: preInvoice?.id ?? null,
        empresaId,
        userId,
      })

      return updated as unknown as IDealerQuote
    } catch (error: any) {
      const message = error?.message ? String(error.message).slice(0, 600) : 'Error de fiscalización'
      await (db as PrismaClient).dealerQuote.update({
        where: { id: quote.id },
        data: {
          fiscalStatus: 'ERROR',
          fiscalError: message,
        },
      })
      throw error
    }
  }

  async delete(id: string, empresaId: string, userId: string, db: PrismaClientType): Promise<{ success: boolean; id: string }> {
    await this.findById(id, empresaId, db)
    await (db as PrismaClient).dealerQuote.update({
      where: { id },
      data: { isActive: false },
    })
    logger.info('Dealer quote desactivada', { id, empresaId, userId })
    return { success: true, id }
  }
}

export default new DealerQuotesService()
