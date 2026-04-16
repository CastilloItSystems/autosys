import { DealerDocumentReferenceType, DealerDocumentStatus, Prisma, PrismaClient } from '../../../generated/prisma/client.js'
import { BadRequestError, NotFoundError } from '../../../shared/utils/apiError.js'
import { logger } from '../../../shared/utils/logger.js'
import { PaginationHelper } from '../../../shared/utils/pagination.js'
import { CreateDealerDocumentDTO, UpdateDealerDocumentDTO } from './documents.dto.js'
import { IDealerDocument, IDealerDocumentFilters } from './documents.interface.js'

type PrismaClientType = PrismaClient | Prisma.TransactionClient

const DOCUMENT_INCLUDE = {
  dealerUnit: {
    select: {
      id: true,
      code: true,
      vin: true,
      brand: { select: { id: true, code: true, name: true } },
      model: { select: { id: true, name: true, year: true } },
    },
  },
} as const

class DealerDocumentsService {
  private async assertUnitValid(dealerUnitId: string, empresaId: string, db: PrismaClientType): Promise<void> {
    const unit = await (db as PrismaClient).dealerUnit.findFirst({
      where: { id: dealerUnitId, empresaId, isActive: true },
      select: { id: true },
    })
    if (!unit) throw new NotFoundError('Unidad no encontrada')
  }

  private validateDates(issuedAt?: Date | null, expiresAt?: Date | null): void {
    if (issuedAt && expiresAt && expiresAt < issuedAt) {
      throw new BadRequestError('La fecha de vencimiento no puede ser menor que la fecha de emisión')
    }
  }

  async create(data: CreateDealerDocumentDTO, empresaId: string, userId: string, db: PrismaClientType): Promise<IDealerDocument> {
    if (data.dealerUnitId) await this.assertUnitValid(data.dealerUnitId, empresaId, db)
    this.validateDates(data.issuedAt, data.expiresAt)

    const created = await (db as PrismaClient).dealerDocument.create({
      data: {
        empresaId,
        dealerUnitId: data.dealerUnitId ?? null,
        referenceType: data.referenceType as DealerDocumentReferenceType,
        referenceId: data.referenceId ?? null,
        documentType: data.documentType,
        documentNumber: data.documentNumber ?? null,
        name: data.name,
        fileUrl: data.fileUrl,
        mimeType: data.mimeType ?? null,
        sizeBytes: data.sizeBytes ?? null,
        issuedAt: data.issuedAt ?? null,
        expiresAt: data.expiresAt ?? null,
        status: (data.status as DealerDocumentStatus) || DealerDocumentStatus.PENDING,
        notes: data.notes ?? null,
      },
      include: DOCUMENT_INCLUDE,
    })

    logger.info('Dealer document creado', { id: created.id, empresaId, userId })
    return created as unknown as IDealerDocument
  }

  async findById(id: string, empresaId: string, db: PrismaClientType): Promise<IDealerDocument> {
    const doc = await (db as PrismaClient).dealerDocument.findFirst({
      where: { id, empresaId },
      include: DOCUMENT_INCLUDE,
    })
    if (!doc) throw new NotFoundError('Documento no encontrado')
    return doc as unknown as IDealerDocument
  }

  async findAll(
    filters: IDealerDocumentFilters,
    page: number,
    limit: number,
    empresaId: string,
    db: PrismaClientType,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ data: IDealerDocument[]; total: number }> {
    const { skip, take } = PaginationHelper.validateAndParse({ page, limit })
    const where: Prisma.DealerDocumentWhereInput = { empresaId }

    if (filters.dealerUnitId) where.dealerUnitId = filters.dealerUnitId
    if (filters.referenceType) where.referenceType = filters.referenceType as DealerDocumentReferenceType
    if (filters.referenceId) where.referenceId = filters.referenceId
    if (filters.status) where.status = filters.status as DealerDocumentStatus
    if (filters.isActive !== undefined) where.isActive = filters.isActive

    if (filters.expiringDays !== undefined) {
      const now = new Date()
      const until = new Date()
      until.setDate(until.getDate() + filters.expiringDays)
      where.expiresAt = { gte: now, lte: until }
    }

    if (filters.search) {
      const q = filters.search.trim()
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { documentType: { contains: q, mode: 'insensitive' } },
        { documentNumber: { contains: q, mode: 'insensitive' } },
        { referenceId: { contains: q, mode: 'insensitive' } },
      ]
    }

    const validSortFields = new Set(['createdAt', 'updatedAt', 'status', 'expiresAt'])
    const safeSortBy = validSortFields.has(sortBy) ? sortBy : 'createdAt'

    const [data, total] = await Promise.all([
      (db as PrismaClient).dealerDocument.findMany({
        where,
        include: DOCUMENT_INCLUDE,
        orderBy: { [safeSortBy]: sortOrder },
        skip,
        take,
      }),
      (db as PrismaClient).dealerDocument.count({ where }),
    ])

    return { data: data as unknown as IDealerDocument[], total }
  }

  async update(
    id: string,
    data: UpdateDealerDocumentDTO,
    empresaId: string,
    userId: string,
    db: PrismaClientType
  ): Promise<IDealerDocument> {
    const current = await this.findById(id, empresaId, db)
    const dealerUnitId = data.dealerUnitId !== undefined ? data.dealerUnitId : current.dealerUnitId
    if (dealerUnitId) await this.assertUnitValid(dealerUnitId, empresaId, db)

    const issuedAt = data.issuedAt !== undefined ? data.issuedAt : current.issuedAt
    const expiresAt = data.expiresAt !== undefined ? data.expiresAt : current.expiresAt
    this.validateDates(issuedAt, expiresAt)

    const updated = await (db as PrismaClient).dealerDocument.update({
      where: { id },
      data: {
        ...(data.dealerUnitId !== undefined ? { dealerUnitId: data.dealerUnitId || null } : {}),
        ...(data.referenceType !== undefined ? { referenceType: data.referenceType as DealerDocumentReferenceType } : {}),
        ...(data.referenceId !== undefined ? { referenceId: data.referenceId || null } : {}),
        ...(data.documentType !== undefined ? { documentType: data.documentType } : {}),
        ...(data.documentNumber !== undefined ? { documentNumber: data.documentNumber || null } : {}),
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.fileUrl !== undefined ? { fileUrl: data.fileUrl } : {}),
        ...(data.mimeType !== undefined ? { mimeType: data.mimeType || null } : {}),
        ...(data.sizeBytes !== undefined ? { sizeBytes: data.sizeBytes ?? null } : {}),
        ...(data.issuedAt !== undefined ? { issuedAt: data.issuedAt ?? null } : {}),
        ...(data.expiresAt !== undefined ? { expiresAt: data.expiresAt ?? null } : {}),
        ...(data.status !== undefined ? { status: data.status as DealerDocumentStatus } : {}),
        ...(data.notes !== undefined ? { notes: data.notes || null } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
      include: DOCUMENT_INCLUDE,
    })

    logger.info('Dealer document actualizado', { id, empresaId, userId })
    return updated as unknown as IDealerDocument
  }

  async delete(id: string, empresaId: string, userId: string, db: PrismaClientType): Promise<{ success: boolean; id: string }> {
    await this.findById(id, empresaId, db)
    await (db as PrismaClient).dealerDocument.update({
      where: { id },
      data: { isActive: false },
    })

    logger.info('Dealer document desactivado', { id, empresaId, userId })
    return { success: true, id }
  }
}

export default new DealerDocumentsService()
