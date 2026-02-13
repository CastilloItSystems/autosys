// backend/src/features/inventory/shared/middleware/validateLocation.middleware.ts

import { Request, Response, NextFunction } from 'express'
import { asyncHandler } from '../../../../shared/middleware/asyncHandler.middleware'
import { BadRequestError } from '../../../../shared/utils/ApiError'
import { LocationValidator } from '../utils/locationValidator'

/**
 * Middleware para validar formato de ubicación
 */
export const validateLocation = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const location = req.body.location

    if (!location) {
      return next()
    }

    if (!LocationValidator.isValid(location)) {
      throw new BadRequestError(
        'Formato de ubicación inválido. Debe ser: M1-R01-D03 (Módulo-Rack-División)'
      )
    }

    // Sanitizar y normalizar
    const sanitized = LocationValidator.sanitize(location)
    if (sanitized) {
      req.body.location = sanitized
    }

    next()
  }
)

/**
 * Middleware para validar múltiples ubicaciones
 */
export const validateLocations = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const items = req.body.items || []

    for (const item of items) {
      if (item.location && !LocationValidator.isValid(item.location)) {
        throw new BadRequestError(
          `Formato de ubicación inválido para el item. Debe ser: M1-R01-D03`
        )
      }

      // Sanitizar
      if (item.location) {
        item.location = LocationValidator.sanitize(item.location)
      }
    }

    next()
  }
)

/**
 * Middleware para validar ubicación de picking
 */
export const validatePickingLocation = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { pickedFromLocation } = req.body

    if (!pickedFromLocation) {
      throw new BadRequestError(
        'Se requiere ubicación de donde se recogió el artículo'
      )
    }

    if (!LocationValidator.isValid(pickedFromLocation)) {
      throw new BadRequestError(
        'Formato de ubicación de picking inválido. Debe ser: M1-R01-D03'
      )
    }

    req.body.pickedFromLocation = LocationValidator.sanitize(pickedFromLocation)

    next()
  }
)
