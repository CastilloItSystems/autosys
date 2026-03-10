/**
 * Loans Service - Business Logic
 */

import { v4 as uuidv4 } from 'uuid'
import prisma from '../../../services/prisma.service'
import { logger } from '../../../shared/utils/logger'
import { PaginationHelper } from '../../../shared/utils/pagination'
import {
  NotFoundError,
  BadRequestError,
  ConflictError,
} from '../../../shared/utils/ApiError'
import {
  ILoanWithRelations,
  ICreateLoanInput,
  IUpdateLoanInput,
  ILoanFilters,
  LoanStatus,
} from './loans.interface'
import { MovementType } from '../movements/movements.interface'
import { EventType } from '../shared/events/event.types'
import EventService from '../shared/events/event.service'
import HookRegistry from '../hooks/hook.registry'
import { HookType, HookStage } from '../hooks/hook.interface'

const eventService = EventService.getInstance()
const hookRegistry = HookRegistry.getInstance()

class LoansService {
  private static instance: LoansService

  private constructor() {}

  static getInstance(): LoansService {
    if (!LoansService.instance) {
      LoansService.instance = new LoansService()
    }
    return LoansService.instance
  }

  /**
   * Create a new loan
   */
  async create(
    input: ICreateLoanInput,
    userId: string
  ): Promise<ILoanWithRelations> {
    try {
      logger.info('Creating loan', { borrowerName: input.borrowerName, userId })

      // Validate warehouse exists
      const warehouse = await prisma.warehouse.findUnique({
        where: { id: input.warehouseId },
      })

      if (!warehouse) {
        throw new NotFoundError('Warehouse not found')
      }

      // Generate loan number
      const count = await prisma.loan.count()
      const loanNumber = `LOAN-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`

      // Validate items exist and have stock
      for (const item of input.items) {
        const itemRecord = await prisma.item.findUnique({
          where: { id: item.itemId },
        })

        if (!itemRecord) {
          throw new NotFoundError(`Item ${item.itemId} not found`)
        }

        const stock = await prisma.stock.findUnique({
          where: {
            itemId_warehouseId: {
              itemId: item.itemId,
              warehouseId: input.warehouseId,
            },
          },
        })

        if (!stock || stock.quantityAvailable < item.quantityLoaned) {
          throw new BadRequestError(
            `Insufficient quantity for item ${itemRecord.name}`
          )
        }
      }

      // Create loan with items in transaction
      const loan = await prisma.loan.create({
        data: {
          id: uuidv4(),
          loanNumber,
          borrowerName: input.borrowerName,
          status: LoanStatus.DRAFT as any,
          warehouseId: input.warehouseId,
          startDate: new Date(),
          dueDate: input.dueDate,
          borrowerId: input.borrowerId,
          purpose: input.purpose,
          notes: input.notes,
          createdBy: userId,
          items: {
            create: input.items.map((item) => ({
              id: uuidv4(),
              itemId: item.itemId,
              quantityLoaned: item.quantityLoaned,
              quantityReturned: 0,
              unitCost: item.unitCost || 0,
              notes: item.notes,
            })),
          },
        },
        include: { items: { include: { item: true } }, warehouse: true },
      })

      // Emit event
      await eventService.emit({
        type: EventType.LOAN_CREATED,
        entityId: loan.id,
        entityType: 'loan',
        userId,
        data: {
          loanNumber: loan.loanNumber,
          borrowerName: loan.borrowerName,
          itemCount: loan.items.length,
        },
      })

      logger.info('Loan created', { loanId: loan.id, loanNumber })
      return this.mapToInterface(loan)
    } catch (error) {
      logger.error('Error creating loan', { error })
      throw error
    }
  }

  /**
   * Find loan by ID
   */
  async findById(id: string, includeItems = true): Promise<ILoanWithRelations> {
    try {
      const loan = await prisma.loan.findUnique({
        where: { id },
        include: includeItems
          ? { items: { include: { item: true } }, warehouse: true }
          : undefined,
      })

      if (!loan) {
        throw new NotFoundError('Loan not found')
      }

      return this.mapToInterface(loan)
    } catch (error) {
      logger.error('Error finding loan', { error, id })
      throw error
    }
  }

  /**
   * Find all loans with filters and pagination
   */
  async findAll(
    filters: ILoanFilters = {},
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc',
    prismaClient?: any
  ): Promise<{
    items: ILoanWithRelations[]
    total: number
    page: number
    limit: number
  }> {
    try {
      const where: any = {}

      if (filters.status) where.status = filters.status
      if (filters.borrowerName)
        where.borrowerName = { contains: filters.borrowerName }
      if (filters.warehouseId) where.warehouseId = filters.warehouseId
      if (filters.createdBy) where.createdBy = filters.createdBy

      if (filters.fromDate || filters.toDate) {
        where.createdAt = {}
        if (filters.fromDate) where.createdAt.gte = filters.fromDate
        if (filters.toDate) where.createdAt.lte = filters.toDate
      }

      const db = prismaClient || prisma

      const [loans, total] = await Promise.all([
        db.loan.findMany({
          where,
          include: { items: { include: { item: true } } },
          orderBy: { [sortBy]: sortOrder },
          skip: (page - 1) * limit,
          take: limit,
        }),
        db.loan.count({ where }),
      ])

      return {
        items: loans.map((loan) => this.mapToInterface(loan)),
        total,
        page,
        limit,
      }
    } catch (error) {
      logger.error('Error finding loans', { error })
      throw error
    }
  }

  /**
   * Update loan (only when DRAFT)
   */
  async update(
    id: string,
    input: IUpdateLoanInput,
    userId: string
  ): Promise<ILoanWithRelations> {
    try {
      const loan = await this.findById(id)

      if (loan.status !== LoanStatus.DRAFT) {
        throw new BadRequestError('Can only update loans in DRAFT status')
      }

      const updated = await prisma.loan.update({
        where: { id },
        data: {
          borrowerName: input.borrowerName || loan.borrowerName,
          dueDate: input.dueDate || loan.dueDate,
          purpose: input.purpose !== undefined ? input.purpose : loan.purpose,
          notes: input.notes !== undefined ? input.notes : loan.notes,
        } as any,
        include: { items: { include: { item: true } } },
      })

      logger.info('Loan updated', { loanId: id, userId })
      return this.mapToInterface(updated)
    } catch (error) {
      logger.error('Error updating loan', { error, id })
      throw error
    }
  }

  /**
   * Approve loan (DRAFT -> APPROVED)
   */
  async approve(id: string, approvedBy: string): Promise<ILoanWithRelations> {
    try {
      const loan = await this.findById(id)

      if (loan.status !== LoanStatus.DRAFT) {
        throw new BadRequestError('Can only approve loans in DRAFT status')
      }

      // Execute BEFORE hooks
      await hookRegistry.executeBefore(HookType.LOAN_APPROVE, {
        entityId: id,
        entityType: 'loan',
        userId: approvedBy,
      })

      const updated = await prisma.loan.update({
        where: { id },
        data: {
          status: LoanStatus.APPROVED as any,
          approvedAt: new Date(),
          approvedBy,
        },
        include: { items: { include: { item: true } } },
      })

      await eventService.emit({
        type: EventType.LOAN_APPROVED,
        entityId: id,
        entityType: 'loan',
        userId: approvedBy,
        data: { loanNumber: loan.loanNumber },
      })

      // Execute AFTER hooks
      await hookRegistry.executeAfter(HookType.LOAN_APPROVE, {
        entityId: id,
        entityType: 'loan',
        userId: approvedBy,
      })

      logger.info('Loan approved', { loanId: id, approvedBy })
      return this.mapToInterface(updated)
    } catch (error) {
      logger.error('Error approving loan', { error, id })
      throw error
    }
  }

  /**
   * Activate loan (APPROVED -> ACTIVE) - Reserve stock and create ExitNote
   */
  async activate(id: string, userId: string): Promise<ILoanWithRelations> {
    try {
      const loan = await this.findById(id)

      if (loan.status !== LoanStatus.APPROVED) {
        throw new BadRequestError('Can only activate approved loans')
      }

      // Reserve stock for all items
      for (const item of loan.items) {
        const stock = await prisma.stock.findUnique({
          where: {
            itemId_warehouseId: {
              itemId: item.itemId,
              warehouseId: loan.warehouseId,
            },
          },
        })

        if (!stock || stock.quantityAvailable < item.quantityLoaned) {
          throw new BadRequestError(
            `Insufficient quantity for item ${item.itemId}`
          )
        }

        // Deduct from stock
        await prisma.stock.update({
          where: { id: stock.id },
          data: {
            quantityReserved: { increment: item.quantityLoaned },
            quantityAvailable: { decrement: item.quantityLoaned },
          },
        })

        // Create movement record
        await prisma.movement.create({
          data: {
            id: uuidv4(),
            itemId: item.itemId,
            warehouseId: loan.warehouseId,
            type: MovementType.LOAN_OUT as any,
            quantity: item.quantityLoaned,
            reference: loan.loanNumber,
            createdBy: userId,
          },
        })
      }

      const updated = await prisma.loan.update({
        where: { id },
        data: {
          status: LoanStatus.ACTIVE as any,
        },
        include: { items: { include: { item: true } } },
      })

      await eventService.emit({
        type: EventType.LOAN_ACTIVE,
        entityId: id,
        entityType: 'loan',
        userId,
        data: { loanNumber: loan.loanNumber },
      })

      logger.info('Loan activated', { loanId: id, userId })
      return this.mapToInterface(updated)
    } catch (error) {
      logger.error('Error activating loan', { error, id })
      throw error
    }
  }

  /**
   * Return loaned items
   */
  async returnItems(
    id: string,
    returns: { itemId: string; quantityReturned: number }[],
    userId: string
  ): Promise<ILoanWithRelations> {
    try {
      const loan = await this.findById(id)

      if (
        loan.status !== LoanStatus.ACTIVE &&
        loan.status !== LoanStatus.OVERDUE
      ) {
        throw new BadRequestError(
          'Can only return items from ACTIVE or OVERDUE loans'
        )
      }

      // Update loan items with returned quantities
      for (const ret of returns) {
        const loanItem = loan.items.find((item) => item.itemId === ret.itemId)

        if (!loanItem) {
          throw new NotFoundError(`Loan item ${ret.itemId} not found`)
        }

        if (
          ret.quantityReturned >
          loanItem.quantityLoaned - loanItem.quantityReturned
        ) {
          throw new BadRequestError(
            `Returned quantity exceeds loaned quantity for item ${ret.itemId}`
          )
        }

        await (prisma as any).loanItem.update({
          where: { id: loanItem.id },
          data: {
            quantityReturned: loanItem.quantityReturned + ret.quantityReturned,
          },
        })

        // Restore stock
        const stock = await prisma.stock.findUnique({
          where: {
            itemId_warehouseId: {
              itemId: ret.itemId,
              warehouseId: loan.warehouseId,
            },
          },
        })

        if (stock) {
          await prisma.stock.update({
            where: { id: stock.id },
            data: {
              quantityReserved: { decrement: ret.quantityReturned },
              quantityAvailable: { increment: ret.quantityReturned },
            },
          })

          // Create return movement
          await prisma.movement.create({
            data: {
              id: uuidv4(),
              itemId: ret.itemId,
              warehouseId: loan.warehouseId,
              type: MovementType.LOAN_RETURN as any,
              quantity: ret.quantityReturned,
              reference: loan.loanNumber,
              createdBy: userId,
            },
          })
        }
      }

      // Check if all items are returned
      const updatedLoan = await this.findById(id)
      const allReturned = updatedLoan.items.every(
        (item) => item.quantityReturned === item.quantityLoaned
      )

      let status: any = loan.status
      if (allReturned) {
        status = LoanStatus.RETURNED
      }

      const finalLoan = await prisma.loan.update({
        where: { id },
        data: {
          status: status as any,
          returnedAt: allReturned ? new Date() : undefined,
        },
        include: { items: { include: { item: true } } },
      })

      await eventService.emit({
        type: EventType.LOAN_RETURNED,
        entityId: id,
        entityType: 'loan',
        userId,
        data: {
          loanNumber: loan.loanNumber,
          allReturned,
          itemsReturned: returns.length,
        },
      })

      logger.info('Loan items returned', {
        loanId: id,
        itemCount: returns.length,
      })
      return this.mapToInterface(finalLoan)
    } catch (error) {
      logger.error('Error returning loan items', { error, id })
      throw error
    }
  }

  /**
   * Cancel loan
   */
  async cancel(id: string, reason?: string): Promise<ILoanWithRelations> {
    try {
      const loan = await this.findById(id)

      if (
        loan.status === LoanStatus.RETURNED ||
        loan.status === LoanStatus.CANCELLED
      ) {
        throw new BadRequestError(
          'Cannot cancel loans that are already returned or cancelled'
        )
      }

      // If ACTIVE, restore all stock
      if (
        loan.status === LoanStatus.ACTIVE ||
        loan.status === LoanStatus.OVERDUE
      ) {
        for (const item of loan.items) {
          const quantityToRestore = item.quantityLoaned - item.quantityReturned

          if (quantityToRestore > 0) {
            const stock = await prisma.stock.findUnique({
              where: {
                itemId_warehouseId: {
                  itemId: item.itemId,
                  warehouseId: loan.warehouseId,
                },
              },
            })

            if (stock) {
              await prisma.stock.update({
                where: { id: stock.id },
                data: {
                  quantityReserved: { decrement: quantityToRestore },
                  quantityAvailable: { increment: quantityToRestore },
                },
              })
            }
          }
        }
      }

      const updated = await prisma.loan.update({
        where: { id },
        data: {
          status: LoanStatus.CANCELLED as any,
        },
        include: { items: { include: { item: true } } },
      })

      logger.info('Loan cancelled', { loanId: id, reason })
      return this.mapToInterface(updated)
    } catch (error) {
      logger.error('Error cancelling loan', { error, id })
      throw error
    }
  }

  /**
   * Helper: MapTo Interface
   */
  private mapToInterface(loan: any): ILoanWithRelations {
    return {
      id: loan.id,
      loanNumber: loan.loanNumber,
      borrowerName: loan.borrowerName,
      borrowerId: loan.borrowerId,
      status: loan.status,
      warehouseId: loan.warehouseId,
      startDate: loan.startDate,
      dueDate: loan.dueDate,
      returnedAt: loan.returnedAt,
      approvedAt: loan.approvedAt,
      approvedBy: loan.approvedBy,
      purpose: loan.purpose,
      notes: loan.notes,
      createdBy: loan.createdBy,
      createdAt: loan.createdAt,
      updatedAt: loan.updatedAt,
      items: (loan.items || []).map((item: any) => ({
        id: item.id,
        loanId: item.loanId,
        itemId: item.itemId,
        quantityLoaned: item.quantityLoaned,
        quantityReturned: item.quantityReturned || 0,
        unitCost: item.unitCost ? Number(item.unitCost) : 0,
        createdAt: item.createdAt,
      })),
    }
  }
}

export default LoansService
