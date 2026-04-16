// backend/src/features/workshop/serviceOrderMaterials/serviceOrderMaterials.service.ts

import {
  PrismaClient,
  type Prisma,
  type TaxType,
} from '../../../generated/prisma/client.js'
import {
  NotFoundError,
  BadRequestError,
} from '../../../shared/utils/apiError.js'
import { MovementNumberGenerator } from '../../inventory/shared/utils/movementNumberGenerator.js'
import stockService from '../../inventory/stock/stock.service.js'
import { syncAfterMaterialChange } from '../integrations/billing-sync.service.js'
import type {
  ICreateServiceOrderMaterial,
  IUpdateServiceOrderMaterial,
  IServiceOrderMaterialFilters,
  IServiceOrderMaterialWithRelations,
} from './serviceOrderMaterials.interface.js'

type DbType = PrismaClient | Prisma.TransactionClient

const BASE_INCLUDE = {
  serviceOrder: { select: { id: true, folio: true } },
  item: { select: { id: true, code: true, name: true, sku: true } },
  warehouse: { select: { id: true, code: true, name: true } },
} as const

async function assertWarehouseBelongsToEmpresa(
  db: DbType,
  warehouseId: string,
  empresaId: string
) {
  const warehouse = await (db as PrismaClient).warehouse.findFirst({
    where: {
      id: warehouseId,
      empresaId,
      isActive: true,
    },
    select: {
      id: true,
      code: true,
      name: true,
    },
  })

  if (!warehouse) {
    throw new NotFoundError('Almacén no encontrado o inactivo')
  }

  return warehouse
}

async function attachDispatchExitNotes(
  db: DbType,
  materials: IServiceOrderMaterialWithRelations[]
): Promise<IServiceOrderMaterialWithRelations[]> {
  if (!materials.length) return materials

  const materialIds = materials.map((m) => m.id)

  const notes = await (db as PrismaClient).exitNote.findMany({
    where: {
      serviceOrderMaterialId: { in: materialIds },
    },
    select: {
      id: true,
      exitNoteNumber: true,
      status: true,
      serviceOrderMaterialId: true,
    },
  })

  const noteByMaterialId = new Map(
    notes.map((note) => [note.serviceOrderMaterialId ?? '', note])
  )

  return materials.map((material) => {
    const note = noteByMaterialId.get(material.id)

    return {
      ...material,
      dispatchExitNote: note
        ? {
            id: note.id,
            exitNoteNumber: note.exitNoteNumber,
            status: note.status,
          }
        : null,
    }
  })
}

export async function findAll(
  db: DbType,
  serviceOrderId: string,
  filters: IServiceOrderMaterialFilters
): Promise<{
  data: IServiceOrderMaterialWithRelations[]
  page: number
  limit: number
  total: number
}> {
  const { status, search, page = 1, limit = 50 } = filters

  const where: any = { serviceOrderId }

  if (status) where.status = status
  if (search) {
    where.OR = [
      { description: { contains: search, mode: 'insensitive' } },
      {
        item: {
          OR: [
            { code: { contains: search, mode: 'insensitive' } },
            { name: { contains: search, mode: 'insensitive' } },
          ],
        },
      },
    ]
  }

  const skip = (page - 1) * limit

  const [data, total] = await Promise.all([
    (db as PrismaClient).serviceOrderMaterial.findMany({
      where,
      include: BASE_INCLUDE,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    (db as PrismaClient).serviceOrderMaterial.count({ where }),
  ])

  const enriched = await attachDispatchExitNotes(
    db,
    data as unknown as IServiceOrderMaterialWithRelations[]
  )

  return {
    data: enriched,
    page,
    limit,
    total,
  }
}

export async function findById(
  db: DbType,
  id: string
): Promise<IServiceOrderMaterialWithRelations> {
  const material = await (db as PrismaClient).serviceOrderMaterial.findUnique({
    where: { id },
    include: BASE_INCLUDE,
  })

  if (!material) throw new NotFoundError('Material no encontrado')
  const [enriched] = await attachDispatchExitNotes(db, [
    material as unknown as IServiceOrderMaterialWithRelations,
  ])
  return enriched
}

export async function create(
  db: DbType,
  data: ICreateServiceOrderMaterial,
  userId = 'system'
): Promise<IServiceOrderMaterialWithRelations> {
  // Verify serviceOrder exists
  const serviceOrder = await (db as PrismaClient).serviceOrder.findUnique({
    where: { id: data.serviceOrderId },
  })

  if (!serviceOrder) throw new NotFoundError('Orden de servicio no encontrada')

  if (data.warehouseId) {
    await assertWarehouseBelongsToEmpresa(
      db,
      data.warehouseId,
      serviceOrder.empresaId
    )
  }

  // Verify item exists if provided and inherit tax fields
  let taxType = 'IVA'
  let taxRate = 0.16
  if (data.itemId) {
    const item = await (db as PrismaClient).item.findUnique({
      where: { id: data.itemId },
      select: { id: true, name: true, pricing: true },
    })
    if (!item) throw new NotFoundError('Artículo no encontrado')

    // Inherit tax settings from item catalog pricing
    if ((item.pricing as any)?.taxType) taxType = (item.pricing as any).taxType
    if (
      (item.pricing as any)?.taxRate !== null &&
      (item.pricing as any)?.taxRate !== undefined
    ) {
      taxRate =
        typeof (item.pricing as any).taxRate === 'string'
          ? parseFloat((item.pricing as any).taxRate)
          : Number((item.pricing as any).taxRate)
    }
  }

  const material = await (db as PrismaClient).serviceOrderMaterial.create({
    data: {
      description: data.description,
      quantityRequested: Number(data.quantityRequested),
      quantityReserved: Number(data.quantityReserved || 0),
      quantityDispatched: Number(data.quantityDispatched || 0),
      quantityConsumed: Number(data.quantityConsumed || 0),
      quantityReturned: Number(data.quantityReturned || 0),
      quantity: 0, // Will be set to quantityDispatched when DISPATCHED
      unitPrice: Number(data.unitPrice),
      unitCost: Number(data.unitCost || 0),
      discountPct: Number(data.discountPct || 0),
      taxType: taxType as TaxType,
      taxRate,
      taxAmount: 0, // Will be calculated during sync
      total: 0, // Will be calculated when quantity is set
      status: data.status || 'REQUESTED',
      clientApproved: data.clientApproved ?? null,
      clientApprovalAt: data.clientApprovalAt ?? null,
      clientApprovedBy: data.clientApprovedBy ?? null,
      clientApprovalNotes: data.clientApprovalNotes ?? null,
      warehouseId: data.warehouseId ?? null,
      serviceOrderId: data.serviceOrderId,
      itemId: data.itemId,
      empresaId: serviceOrder.empresaId,
      createdBy: userId,
    },
    include: BASE_INCLUDE,
  })

  return findById(db, material.id)
}

export async function update(
  db: DbType,
  id: string,
  data: IUpdateServiceOrderMaterial
): Promise<IServiceOrderMaterialWithRelations> {
  const existing = await findById(db, id)

  if (data.itemId) {
    const item = await (db as PrismaClient).item.findUnique({
      where: { id: data.itemId },
      select: { id: true, name: true, pricing: true },
    })
    if (!item) throw new NotFoundError('Artículo no encontrado')
  }

  const updateData: any = {}

  if (data.description !== undefined) updateData.description = data.description
  if (data.quantityRequested !== undefined)
    updateData.quantityRequested = Number(data.quantityRequested)
  if (data.quantityReserved !== undefined)
    updateData.quantityReserved = Number(data.quantityReserved)
  if (data.quantityDispatched !== undefined)
    updateData.quantityDispatched = Number(data.quantityDispatched)
  if (data.quantityConsumed !== undefined)
    updateData.quantityConsumed = Number(data.quantityConsumed)
  if (data.quantityReturned !== undefined)
    updateData.quantityReturned = Number(data.quantityReturned)
  if (data.unitPrice !== undefined)
    updateData.unitPrice = Number(data.unitPrice)
  if (data.unitCost !== undefined) updateData.unitCost = Number(data.unitCost)
  if (data.discountPct !== undefined)
    updateData.discountPct = Number(data.discountPct)
  if (data.status !== undefined) updateData.status = data.status
  if (data.clientApproved !== undefined)
    updateData.clientApproved = data.clientApproved
  if (data.clientApprovalAt !== undefined)
    updateData.clientApprovalAt = data.clientApprovalAt
  if (data.clientApprovedBy !== undefined)
    updateData.clientApprovedBy = data.clientApprovedBy
  if (data.clientApprovalNotes !== undefined)
    updateData.clientApprovalNotes = data.clientApprovalNotes
  if (data.serviceOrderId !== undefined)
    updateData.serviceOrderId = data.serviceOrderId
  if (data.itemId !== undefined) updateData.itemId = data.itemId
  if (data.warehouseId !== undefined) {
    if (data.warehouseId) {
      await assertWarehouseBelongsToEmpresa(db, data.warehouseId, existing.empresaId)
      updateData.warehouseId = data.warehouseId
    } else {
      updateData.warehouseId = null
    }
  }

  // If itemId changed, re-inherit tax settings
  if (data.itemId && data.itemId !== existing.itemId) {
    const newItem = await (db as PrismaClient).item.findUnique({
      where: { id: data.itemId },
      select: { pricing: true },
    })
    if (newItem) {
      updateData.taxType = (newItem.pricing as any)?.taxType as TaxType
      updateData.taxRate = (newItem.pricing as any)?.taxRate || 0.16
    }
  }

  // Recalculate quantity and total based on current dispatched quantity
  const quantityDispatched =
    updateData.quantityDispatched ?? Number(existing.quantityDispatched || 0)
  const unitPrice = updateData.unitPrice ?? Number(existing.unitPrice || 0)
  const discountPct =
    updateData.discountPct ?? Number(existing.discountPct || 0)
  const taxRate = updateData.taxRate ?? Number(existing.taxRate || 0.16)

  if (quantityDispatched > 0) {
    updateData.quantity = quantityDispatched
    const subtotal = quantityDispatched * unitPrice
    const discountAmount = (discountPct / 100) * subtotal
    const baseForTax = subtotal - discountAmount
    const taxAmount = Math.round(baseForTax * taxRate * 100) / 100
    updateData.taxAmount = taxAmount
    updateData.total = Math.round((baseForTax + taxAmount) * 100) / 100
  }

  const material = await (db as PrismaClient).serviceOrderMaterial.update({
    where: { id },
    data: updateData,
    include: BASE_INCLUDE,
  })

  return findById(db, material.id)
}

export async function remove(db: DbType, id: string): Promise<void> {
  await findById(db, id)

  await (db as PrismaClient).serviceOrderMaterial.delete({ where: { id } })
}

export async function findMovements(db: DbType, materialId: string) {
  const material = await findById(db, materialId)
  return (db as PrismaClient).serviceOrderMaterialMovement.findMany({
    where: { materialId: material.id },
    orderBy: { createdAt: 'asc' },
  })
}

export async function recordMovement(
  db: DbType,
  materialId: string,
  userId: string,
  data: {
    type:
      | 'RESERVATION'
      | 'DISPATCH'
      | 'CONSUMPTION'
      | 'RETURN'
      | 'ADJUSTMENT'
      | 'CANCELLATION'
    quantity: number
    previousQuantity?: number
    warehouseId?: string
    warehouseName?: string
    notes?: string
    referenceId?: string
    empresaId: string
  }
) {
  await findById(db, materialId)
  return (db as PrismaClient).serviceOrderMaterialMovement.create({
    data: {
      materialId,
      type: data.type,
      quantity: data.quantity,
      previousQuantity: data.previousQuantity ?? null,
      warehouseId: data.warehouseId ?? null,
      warehouseName: data.warehouseName ?? null,
      userId,
      notes: data.notes ?? null,
      referenceId: data.referenceId ?? null,
      empresaId: data.empresaId,
    },
  })
}

async function createWorkshopSupplyExitNote(
  db: DbType,
  material: IServiceOrderMaterialWithRelations,
  warehouseId: string,
  userId: string
) {
  if (!material.itemId) return

  const qty = Number(material.quantityRequested)

  if (qty <= 0) return

  // Check no existing WORKSHOP_SUPPLY note for this material
  const existing = await (db as PrismaClient).exitNote.findFirst({
    where: { serviceOrderMaterialId: material.id },
    select: { id: true },
  })

  if (existing) return

  const exitNote = await (db as PrismaClient).exitNote.create({
    data: {
      exitNoteNumber: MovementNumberGenerator.generate('EXIT'),
      type: 'WORKSHOP_SUPPLY',
      status: 'PENDING', // Creada en PENDING para que el almacenista la trabaje
      warehouseId,
      serviceOrderMaterialId: material.id,
      recipientName: 'Taller',
      reason: 'Suministro de repuesto a taller por orden de servicio',
      notes: `OT ${material.serviceOrder?.folio ?? material.serviceOrderId} - ${material.description}`,
      authorizedBy: userId,
      items: {
        create: [
          {
            itemId: material.itemId,
            itemName: material.item?.name ?? material.description,
            quantity: qty,
            notes: `Material ${material.id} - Solicitud de taller`,
          },
        ],
      },
    },
  })

  await (db as PrismaClient).movement.create({
    data: {
      movementNumber: MovementNumberGenerator.generate('MOV'),
      type: 'ADJUSTMENT_OUT',
      itemId: material.itemId,
      warehouseFromId: warehouseId,
      quantity: qty,
      reference: exitNote.exitNoteNumber,
      notes: `Solicitud taller OT ${material.serviceOrder?.folio ?? material.serviceOrderId}`,
      createdBy: userId,
      exitNoteId: exitNote.id,
      workOrderId: material.serviceOrderId,
      exitType: 'WORKSHOP_SUPPLY',
    },
  })
}

async function createWorkshopReturnMovement(
  db: DbType,
  material: IServiceOrderMaterialWithRelations,
  warehouseId: string,
  quantityReturned: number,
  userId: string
) {
  if (!material.itemId || quantityReturned <= 0) return

  await (db as PrismaClient).movement.create({
    data: {
      movementNumber: MovementNumberGenerator.generate('MOV'),
      type: 'WORKSHOP_RETURN',
      itemId: material.itemId,
      warehouseToId: warehouseId,
      quantity: quantityReturned,
      reference: `WS-RETURN:${material.id}`,
      notes: `Devolución material taller - OT ${material.serviceOrder?.folio ?? material.serviceOrderId}`,
      createdBy: userId,
      workOrderId: material.serviceOrderId,
    },
  })
}

async function changeStatusInternal(
  db: DbType,
  id: string,
  status:
    | 'REQUESTED'
    | 'RESERVED'
    | 'DISPATCHED'
    | 'CONSUMED'
    | 'RETURNED'
    | 'CANCELLED',
  context?: {
    warehouseId?: string
    quantityReturned?: number
    empresaId?: string
    userId?: string
  }
): Promise<IServiceOrderMaterialWithRelations> {
  const material = await findById(db, id)

  // Block manual DISPATCHED transition — must be done via exit note delivery
  if (status === 'DISPATCHED') {
    throw new BadRequestError(
      'El despacho de material se realiza desde el almacén a través de la nota de salida'
    )
  }

  const validTransitions: Record<string, string[]> = {
    REQUESTED: ['RESERVED', 'CANCELLED'],
    RESERVED: ['DISPATCHED', 'RETURNED', 'CANCELLED'],
    DISPATCHED: ['CONSUMED', 'RETURNED', 'CANCELLED'],
    CONSUMED: ['RETURNED'],
    RETURNED: [],
    CANCELLED: [],
  }

  if (!validTransitions[material.status as string]?.includes(status)) {
    throw new BadRequestError(
      `No se puede cambiar de estado ${material.status} a ${status}`
    )
  }

  if (
    ['RESERVED', 'DISPATCHED', 'CONSUMED'].includes(status) &&
    material.clientApproved !== true
  ) {
    throw new BadRequestError(
      'El material debe estar aprobado por el cliente para avanzar a este estado'
    )
  }

  const { warehouseId, quantityReturned, userId = 'system' } = context ?? {}
  const effectiveEmpresaId = context?.empresaId ?? material.empresaId
  const itemId = material.itemId

  let effectiveWarehouseId = material.warehouseId ?? warehouseId ?? undefined

  const requiresWarehouseForInventory =
    Boolean(itemId) &&
    (status === 'RESERVED' ||
      status === 'DISPATCHED' ||
      status === 'RETURNED' ||
      (status === 'CANCELLED' &&
        (material.status === 'RESERVED' || material.status === 'DISPATCHED')))

  if (
    status !== 'RESERVED' &&
    material.warehouseId &&
    warehouseId &&
    warehouseId !== material.warehouseId
  ) {
    throw new BadRequestError(
      'El almacén del material ya fue fijado al reservar y no puede cambiarse'
    )
  }

  if (status === 'RESERVED') {
    if (!warehouseId) {
      throw new BadRequestError(
        'Debe seleccionar un almacén para reservar el material'
      )
    }

    await assertWarehouseBelongsToEmpresa(db, warehouseId, effectiveEmpresaId)
    effectiveWarehouseId = warehouseId
  }

  // Create WORKSHOP_SUPPLY exit note when material is RESERVED (not DISPATCHED)
  if (status === 'RESERVED' && material.itemId && effectiveWarehouseId) {
    await createWorkshopSupplyExitNote(
      db,
      material as unknown as IServiceOrderMaterialWithRelations,
      effectiveWarehouseId,
      userId
    )
  }

  if (requiresWarehouseForInventory && !effectiveWarehouseId) {
    throw new BadRequestError(
      'El material requiere almacén asignado para operaciones de inventario'
    )
  }

  if (itemId && effectiveWarehouseId) {
    if (status === 'RESERVED') {
      // Reservar en inventario: quantityReserved += qty, quantityAvailable -= qty
      await stockService.reserve(
        {
          itemId,
          warehouseId: effectiveWarehouseId,
          quantity: Number(material.quantityRequested),
        },
        effectiveEmpresaId,
        userId,
        db
      )
    } else if (status === 'DISPATCHED') {
      const qty = Number(material.quantityReserved) || Number(material.quantityRequested)

      // 1. Liberar la reserva
      await stockService.releaseReservation(
        { itemId, warehouseId: effectiveWarehouseId, quantity: qty },
        effectiveEmpresaId,
        userId,
        db
      )

      // 2. Descontar del stock físico
      await stockService.adjust(
        {
          itemId,
          warehouseId: effectiveWarehouseId,
          quantityChange: -qty,
          reason: `Despacho OT material ${id}`,
        },
        effectiveEmpresaId,
        userId,
        db
      )
    } else if (status === 'RETURNED') {
      const returnQty =
        quantityReturned ??
        Number(material.quantityDispatched) ??
        Number(material.quantityRequested)

      // Reponer al stock físico
      await stockService.adjust(
        {
          itemId,
          warehouseId: effectiveWarehouseId,
          quantityChange: returnQty,
          reason: `Devolución OT material ${id}`,
        },
        effectiveEmpresaId,
        userId,
        db
      )
    } else if (status === 'CANCELLED' && material.status === 'RESERVED') {
      // Liberar la reserva si se cancela estando reservado
      await stockService.releaseReservation(
        {
          itemId,
          warehouseId: effectiveWarehouseId,
          quantity: Number(material.quantityReserved),
        },
        effectiveEmpresaId,
        userId,
        db
      )
    }
  }

  // Actualizar cantidades según el nuevo estado
  const quantityUpdate: Record<string, number> = {}
  if (status === 'DISPATCHED') {
    quantityUpdate.quantityDispatched =
      Number(material.quantityReserved) || Number(material.quantityRequested)
  } else if (status === 'CONSUMED') {
    quantityUpdate.quantityConsumed = Number(material.quantityDispatched)
  } else if (status === 'RETURNED') {
    quantityUpdate.quantityReturned =
      quantityReturned ??
      Number(material.quantityDispatched) ??
      Number(material.quantityRequested)
  }

  // Update quantity and total when dispatched
  if (status === 'DISPATCHED') {
    const qty = Number(material.quantityReserved) || Number(material.quantityRequested)
    const unitPrice = Number(material.unitPrice || 0)
    const discountPct = Number(material.discountPct || 0)
    const taxRate = Number(material.taxRate || 0.16)

    const subtotal = qty * unitPrice
    const discountAmount = (discountPct / 100) * subtotal
    const baseForTax = subtotal - discountAmount
    const taxAmount = Math.round(baseForTax * taxRate * 100) / 100
    const total = Math.round((baseForTax + taxAmount) * 100) / 100

    quantityUpdate.quantity = qty
    quantityUpdate.taxAmount = taxAmount
    quantityUpdate.total = total
  } else if (status === 'RETURNED') {
    // Keep quantity as is (it represents what was dispatched)
    quantityUpdate.quantity = Number(material.quantityDispatched || 0)
  }

  const updateData: any = { status, ...quantityUpdate }

  if (status === 'RESERVED' && effectiveWarehouseId) {
    updateData.warehouseId = effectiveWarehouseId
  }

  const updated = await (db as PrismaClient).serviceOrderMaterial.update({
    where: { id },
    data: updateData,
    include: BASE_INCLUDE,
  })

  if (status === 'RETURNED' && updated.itemId && effectiveWarehouseId) {
    await createWorkshopReturnMovement(
      db,
      updated as unknown as IServiceOrderMaterialWithRelations,
      effectiveWarehouseId,
      Number(quantityUpdate.quantityReturned || 0),
      userId
    )
  }

  return updated as unknown as IServiceOrderMaterialWithRelations
}

export async function changeStatus(
  db: DbType,
  id: string,
  status:
    | 'REQUESTED'
    | 'RESERVED'
    | 'DISPATCHED'
    | 'CONSUMED'
    | 'RETURNED'
    | 'CANCELLED',
  context?: {
    warehouseId?: string
    quantityReturned?: number
    empresaId?: string
    userId?: string
  }
): Promise<IServiceOrderMaterialWithRelations> {
  if (db instanceof PrismaClient) {
    const updated = await db.$transaction(async (tx) =>
      changeStatusInternal(tx as unknown as DbType, id, status, context)
    )

    if (status === 'DISPATCHED' || status === 'RETURNED') {
      try {
        await syncAfterMaterialChange(db, id)
      } catch (err: any) {
        console.error(
          `[workshop-materials] Error syncing billing for material ${id}:`,
          err?.message
        )
      }
    }

    return findById(db, updated.id)
  }

  const updated = await changeStatusInternal(db, id, status, context)
  return findById(db, updated.id)
}

export async function setClientApproval(
  db: DbType,
  id: string,
  clientApproved: boolean,
  context?: { userId?: string; notes?: string | null }
): Promise<IServiceOrderMaterialWithRelations> {
  await findById(db, id)

  const userId = context?.userId ?? null
  const notes = context?.notes ?? null

  const updated = await (db as PrismaClient).serviceOrderMaterial.update({
    where: { id },
    data: {
      clientApproved,
      clientApprovalAt: new Date(),
      clientApprovedBy: userId,
      clientApprovalNotes: notes,
    },
    include: BASE_INCLUDE,
  })

  return findById(db, updated.id)
}
