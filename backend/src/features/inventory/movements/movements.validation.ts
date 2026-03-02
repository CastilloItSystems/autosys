// backend/src/features/inventory/movements/movements.validation.ts

import Joi from 'joi'
import { MovementType } from './movements.interface'

export const createMovementSchema = Joi.object({
  type: Joi.string()
    .valid(
      'PURCHASE',
      'SALE',
      'ADJUSTMENT_IN',
      'ADJUSTMENT_OUT',
      'TRANSFER',
      'SUPPLIER_RETURN',
      'WORKSHOP_RETURN',
      'RESERVATION_RELEASE'
    )
    .required()
    .messages({
      'string.empty': 'El tipo de movimiento es requerido',
      'any.only':
        'El tipo debe ser uno de: PURCHASE, SALE, ADJUSTMENT_IN, ADJUSTMENT_OUT, TRANSFER, SUPPLIER_RETURN, WORKSHOP_RETURN, RESERVATION_RELEASE',
      'any.required': 'El tipo de movimiento es obligatorio',
    }),

  itemId: Joi.string().uuid().required().messages({
    'string.empty': 'El ID del artículo es requerido',
    'string.guid': 'El ID del artículo debe ser un UUID válido',
    'any.required': 'El ID del artículo es obligatorio',
  }),

  quantity: Joi.number().integer().min(1).required().messages({
    'number.base': 'La cantidad debe ser un número',
    'number.min': 'La cantidad debe ser mayor a 0',
    'any.required': 'La cantidad es obligatoria',
  }),

  unitCost: Joi.number().allow(null).optional().messages({
    'number.base': 'El costo unitario debe ser un número',
  }),

  totalCost: Joi.number().allow(null).optional().messages({
    'number.base': 'El costo total debe ser un número',
  }),

  warehouseFromId: Joi.string().uuid().allow(null).optional().messages({
    'string.guid': 'El ID del almacén origen debe ser un UUID válido',
  }),

  warehouseToId: Joi.string().uuid().allow(null).optional().messages({
    'string.guid': 'El ID del almacén destino debe ser un UUID válido',
  }),

  batchId: Joi.string().uuid().allow(null).optional().messages({
    'string.guid': 'El ID del lote debe ser un UUID válido',
  }),

  reference: Joi.string().max(500).allow(null).optional().messages({
    'string.max': 'La referencia no puede exceder 500 caracteres',
  }),

  purchaseOrderId: Joi.string().uuid().allow(null).optional().messages({
    'string.guid': 'El ID de la orden de compra debe ser un UUID válido',
  }),

  workOrderId: Joi.string().uuid().allow(null).optional().messages({
    'string.guid': 'El ID de la orden de trabajo debe ser un UUID válido',
  }),

  reservationId: Joi.string().uuid().allow(null).optional().messages({
    'string.guid': 'El ID de la reserva debe ser un UUID válido',
  }),

  exitNoteId: Joi.string().uuid().allow(null).optional().messages({
    'string.guid': 'El ID de la nota de salida debe ser un UUID válido',
  }),

  invoiceId: Joi.string().uuid().allow(null).optional().messages({
    'string.guid': 'El ID de la factura debe ser un UUID válido',
  }),

  exitType: Joi.string().max(100).allow(null).optional().messages({
    'string.max': 'El tipo de salida no puede exceder 100 caracteres',
  }),

  notes: Joi.string().max(2000).allow(null).optional().messages({
    'string.max': 'Las notas no pueden exceder 2000 caracteres',
  }),

  movementDate: Joi.date().allow(null).optional().messages({
    'date.base': 'La fecha de movimiento debe ser una fecha válida',
  }),
}).external(async (value) => {
  // Validaciones condicionales
  if (value.type === 'TRANSFER') {
    if (!value.warehouseFromId || !value.warehouseToId) {
      throw new Error('Las transferencias requieren almacén origen y destino')
    }
  }

  if (value.type === 'SUPPLIER_RETURN') {
    if (!value.warehouseFromId) {
      throw new Error('Las devoluciones a proveedor requieren almacén origen')
    }
  }

  if (value.type === 'ADJUSTMENT_IN' || value.type === 'PURCHASE') {
    if (!value.warehouseToId) {
      throw new Error('Este tipo de movimiento requiere almacén destino')
    }
  }

  if (value.type === 'ADJUSTMENT_OUT' || value.type === 'SALE') {
    if (!value.warehouseFromId) {
      throw new Error('Este tipo de movimiento requiere almacén origen')
    }
  }
})

export const updateMovementSchema = Joi.object({
  type: Joi.string()
    .valid(
      'PURCHASE',
      'SALE',
      'ADJUSTMENT_IN',
      'ADJUSTMENT_OUT',
      'TRANSFER',
      'SUPPLIER_RETURN',
      'WORKSHOP_RETURN',
      'RESERVATION_RELEASE'
    )
    .optional()
    .messages({
      'any.only':
        'El tipo debe ser uno de: PURCHASE, SALE, ADJUSTMENT_IN, ADJUSTMENT_OUT, TRANSFER, SUPPLIER_RETURN, WORKSHOP_RETURN, RESERVATION_RELEASE',
    }),

  quantity: Joi.number().integer().min(1).optional().messages({
    'number.base': 'La cantidad debe ser un número',
    'number.min': 'La cantidad debe ser mayor a 0',
  }),

  unitCost: Joi.number().allow(null).optional().messages({
    'number.base': 'El costo unitario debe ser un número',
  }),

  totalCost: Joi.number().allow(null).optional().messages({
    'number.base': 'El costo total debe ser un número',
  }),

  warehouseFromId: Joi.string().uuid().allow(null).optional().messages({
    'string.guid': 'El ID del almacén origen debe ser un UUID válido',
  }),

  warehouseToId: Joi.string().uuid().allow(null).optional().messages({
    'string.guid': 'El ID del almacén destino debe ser un UUID válido',
  }),

  batchId: Joi.string().uuid().allow(null).optional().messages({
    'string.guid': 'El ID del lote debe ser un UUID válido',
  }),

  reference: Joi.string().max(500).allow(null).optional().messages({
    'string.max': 'La referencia no puede exceder 500 caracteres',
  }),

  purchaseOrderId: Joi.string().uuid().allow(null).optional().messages({
    'string.guid': 'El ID de la orden de compra debe ser un UUID válido',
  }),

  workOrderId: Joi.string().uuid().allow(null).optional().messages({
    'string.guid': 'El ID de la orden de trabajo debe ser un UUID válido',
  }),

  reservationId: Joi.string().uuid().allow(null).optional().messages({
    'string.guid': 'El ID de la reserva debe ser un UUID válido',
  }),

  exitNoteId: Joi.string().uuid().allow(null).optional().messages({
    'string.guid': 'El ID de la nota de salida debe ser un UUID válido',
  }),

  invoiceId: Joi.string().uuid().allow(null).optional().messages({
    'string.guid': 'El ID de la factura debe ser un UUID válido',
  }),

  exitType: Joi.string().max(100).allow(null).optional().messages({
    'string.max': 'El tipo de salida no puede exceder 100 caracteres',
  }),

  notes: Joi.string().max(2000).allow(null).optional().messages({
    'string.max': 'Las notas no pueden exceder 2000 caracteres',
  }),

  approvedBy: Joi.string().allow(null).optional(),
  approvedAt: Joi.date().allow(null).optional().messages({
    'date.base': 'La fecha de aprobación debe ser una fecha válida',
  }),
})
  .min(1)
  .messages({
    'object.min': 'Debe proporcionar al menos un campo para actualizar',
  })
  .external(async (value) => {
    // Validaciones condicionales
    if (value.type === 'TRANSFER') {
      if (!value.warehouseFromId || !value.warehouseToId) {
        throw new Error('Las transferencias requieren almacén origen y destino')
      }
    }
  })
