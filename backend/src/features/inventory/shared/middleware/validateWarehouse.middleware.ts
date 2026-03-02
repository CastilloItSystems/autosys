// backend/src/features/inventory/shared/middleware/validateWarehouse.middleware.ts

import { Request, Response, NextFunction } from 'express'
import { asyncHandler } from '../../../../shared/middleware/asyncHandler.middleware'
import {
  BadRequestError,
  NotFoundError,
} from '../../../../shared/utils/ApiError'
import prisma from '../../../../services/prisma.service'


/**
 * Middleware para validar que el almacén existe y está activo
 */
export const validateWarehouse = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const warehouseId =
      req.body.warehouseId || req.params.warehouseId || req.query.warehouseId

    if (!warehouseId) {
      throw new BadRequestError('ID de almacén es requerido')
    }

    const warehouse = await prisma.warehouse.findUnique({
      where: { id: warehouseId as string },
    })

    if (!warehouse) {
      throw new NotFoundError('Almacén no encontrado')
    }

    if (!warehouse.isActive) {
      throw new BadRequestError('El almacén no está activo')
    }

    // Adjuntar al request para uso posterior
    req.body.warehouse = warehouse

    next()
  }
)

/**
 * Middleware para validar almacenes de origen y destino en transferencias
 */
export const validateTransferWarehouses = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { warehouseFromId, warehouseToId } = req.body

    if (!warehouseFromId || !warehouseToId) {
      throw new BadRequestError('Se requieren almacenes de origen y destino')
    }

    if (warehouseFromId === warehouseToId) {
      throw new BadRequestError(
        'Los almacenes de origen y destino deben ser diferentes'
      )
    }

    const [warehouseFrom, warehouseTo] = await Promise.all([
      prisma.warehouse.findUnique({ where: { id: warehouseFromId } }),
      prisma.warehouse.findUnique({ where: { id: warehouseToId } }),
    ])

    if (!warehouseFrom) {
      throw new NotFoundError('Almacén de origen no encontrado')
    }

    if (!warehouseTo) {
      throw new NotFoundError('Almacén de destino no encontrado')
    }

    if (!warehouseFrom.isActive) {
      throw new BadRequestError('El almacén de origen no está activo')
    }

    if (!warehouseTo.isActive) {
      throw new BadRequestError('El almacén de destino no está activo')
    }

    // Adjuntar al request
    req.body.warehouseFrom = warehouseFrom
    req.body.warehouseTo = warehouseTo

    next()
  }
)

/**
 * Middleware para validar que el usuario tiene acceso al almacén
 */
export const validateWarehouseAccess = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const warehouseId = req.body.warehouseId || req.params.warehouseId
    const user = req.user

    if (!user) {
      throw new BadRequestError('Usuario no autenticado')
    }

    // Aquí puedes implementar lógica de permisos por almacén
    // Por ejemplo, verificar si el usuario tiene acceso al almacén específico
    // según su rol o asignación

    // Por ahora, permitimos acceso a todos los almacenes para usuarios autenticados
    // Puedes expandir esta lógica según tus necesidades

    next()
  }
)
