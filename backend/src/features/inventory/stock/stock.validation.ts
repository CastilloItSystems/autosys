// backend/src/features/inventory/stock/stock.validation.ts

import Joi from 'joi'

export const createStockSchema = Joi.object({
  itemId: Joi.string().uuid().required().messages({
    'string.empty': 'El ID del artículo es requerido',
    'string.guid': 'El ID del artículo debe ser un UUID válido',
    'any.required': 'El ID del artículo es obligatorio',
  }),

  warehouseId: Joi.string().uuid().required().messages({
    'string.empty': 'El ID del almacén es requerido',
    'string.guid': 'El ID del almacén debe ser un UUID válido',
    'any.required': 'El ID del almacén es obligatorio',
  }),

  quantityReal: Joi.number().integer().min(0).optional().default(0).messages({
    'number.base': 'La cantidad real debe ser un número',
    'number.min': 'La cantidad no puede ser negativa',
  }),

  quantityReserved: Joi.number()
    .integer()
    .min(0)
    .optional()
    .default(0)
    .messages({
      'number.base': 'La cantidad reservada debe ser un número',
      'number.min': 'La cantidad reservada no puede ser negativa',
    }),

  location: Joi.string().allow(null, '').optional().messages({
    'string.base': 'La ubicación debe ser texto',
  }),

  averageCost: Joi.number().optional().messages({
    'number.base': 'El costo promedio debe ser un número',
  }),
})

export const updateStockSchema = Joi.object({
  quantityReal: Joi.number().integer().min(0).optional().messages({
    'number.base': 'La cantidad real debe ser un número',
    'number.min': 'La cantidad no puede ser negativa',
  }),

  quantityReserved: Joi.number().integer().min(0).optional().messages({
    'number.base': 'La cantidad reservada debe ser un número',
    'number.min': 'La cantidad reservada no puede ser negativa',
  }),

  location: Joi.string().allow(null, '').optional().messages({
    'string.base': 'La ubicación debe ser texto',
  }),

  averageCost: Joi.number().optional().messages({
    'number.base': 'El costo promedio debe ser un número',
  }),
})
  .min(1)
  .messages({
    'object.min': 'Debe proporcionar al menos un campo para actualizar',
  })

export const adjustStockSchema = Joi.object({
  itemId: Joi.string().uuid().required().messages({
    'string.empty': 'El ID del artículo es requerido',
    'string.guid': 'El ID del artículo debe ser un UUID válido',
    'any.required': 'El ID del artículo es obligatorio',
  }),

  warehouseId: Joi.string().uuid().required().messages({
    'string.empty': 'El ID del almacén es requerido',
    'string.guid': 'El ID del almacén debe ser un UUID válido',
    'any.required': 'El ID del almacén es obligatorio',
  }),

  quantityChange: Joi.number().integer().required().messages({
    'number.base': 'El cambio de cantidad debe ser un número',
    'any.required': 'El cambio de cantidad es obligatorio',
  }),

  reason: Joi.string().min(3).max(500).required().messages({
    'string.empty': 'La razón del ajuste es requerida',
    'string.min': 'La razón debe tener al menos 3 caracteres',
    'string.max': 'La razón no puede exceder 500 caracteres',
    'any.required': 'La razón es obligatoria',
  }),

  movementId: Joi.string().uuid().optional().allow(null).messages({
    'string.guid': 'El ID del movimiento debe ser un UUID válido',
  }),
})

export const reserveStockSchema = Joi.object({
  itemId: Joi.string().uuid().required().messages({
    'string.empty': 'El ID del artículo es requerido',
    'string.guid': 'El ID del artículo debe ser un UUID válido',
    'any.required': 'El ID del artículo es obligatorio',
  }),

  warehouseId: Joi.string().uuid().required().messages({
    'string.empty': 'El ID del almacén es requerido',
    'string.guid': 'El ID del almacén debe ser un UUID válido',
    'any.required': 'El ID del almacén es obligatorio',
  }),

  quantity: Joi.number().integer().min(1).required().messages({
    'number.base': 'La cantidad debe ser un número',
    'number.min': 'La cantidad debe ser mayor a 0',
    'any.required': 'La cantidad es obligatoria',
  }),

  reservationId: Joi.string().uuid().optional().allow(null).messages({
    'string.guid': 'El ID de la reserva debe ser un UUID válido',
  }),
})

export const releaseStockSchema = Joi.object({
  itemId: Joi.string().uuid().required().messages({
    'string.empty': 'El ID del artículo es requerido',
    'string.guid': 'El ID del artículo debe ser un UUID válido',
    'any.required': 'El ID del artículo es obligatorio',
  }),

  warehouseId: Joi.string().uuid().required().messages({
    'string.empty': 'El ID del almacén es requerido',
    'string.guid': 'El ID del almacén debe ser un UUID válido',
    'any.required': 'El ID del almacén es obligatorio',
  }),

  quantity: Joi.number().integer().min(1).required().messages({
    'number.base': 'La cantidad debe ser un número',
    'number.min': 'La cantidad debe ser mayor a 0',
    'any.required': 'La cantidad es obligatoria',
  }),

  reservationId: Joi.string().uuid().optional().allow(null).messages({
    'string.guid': 'El ID de la reserva debe ser un UUID válido',
  }),
})

export const transferStockSchema = Joi.object({
  itemId: Joi.string().uuid().required().messages({
    'string.empty': 'El ID del artículo es requerido',
    'string.guid': 'El ID del artículo debe ser un UUID válido',
    'any.required': 'El ID del artículo es obligatorio',
  }),

  warehouseFromId: Joi.string().uuid().required().messages({
    'string.empty': 'El ID del almacén origen es requerido',
    'string.guid': 'El ID del almacén origen debe ser un UUID válido',
    'any.required': 'El ID del almacén origen es obligatorio',
  }),

  warehouseToId: Joi.string().uuid().required().messages({
    'string.empty': 'El ID del almacén destino es requerido',
    'string.guid': 'El ID del almacén destino debe ser un UUID válido',
    'any.required': 'El ID del almacén destino es obligatorio',
  }),

  quantity: Joi.number().integer().min(1).required().messages({
    'number.base': 'La cantidad debe ser un número',
    'number.min': 'La cantidad debe ser mayor a 0',
    'any.required': 'La cantidad es obligatoria',
  }),

  movementId: Joi.string().uuid().optional().allow(null).messages({
    'string.guid': 'El ID del movimiento debe ser un UUID válido',
  }),
}).external(async (value) => {
  // Validar que los almacenes sean diferentes
  if (value.warehouseFromId === value.warehouseToId) {
    throw new Error('El almacén origen y destino no pueden ser el mismo')
  }
})

export const createStockAlertSchema = Joi.object({
  itemId: Joi.string().uuid().required().messages({
    'string.empty': 'El ID del artículo es requerido',
    'string.guid': 'El ID del artículo debe ser un UUID válido',
    'any.required': 'El ID del artículo es obligatorio',
  }),

  warehouseId: Joi.string().uuid().required().messages({
    'string.empty': 'El ID del almacén es requerido',
    'string.guid': 'El ID del almacén debe ser un UUID válido',
    'any.required': 'El ID del almacén es obligatorio',
  }),

  type: Joi.string()
    .valid('LOW_STOCK', 'OUT_OF_STOCK', 'EXPIRING_SOON', 'EXPIRED', 'OVERSTOCK')
    .required()
    .messages({
      'any.only':
        'El tipo debe ser uno de: LOW_STOCK, OUT_OF_STOCK, EXPIRING_SOON, EXPIRED, OVERSTOCK',
      'any.required': 'El tipo de alerta es obligatorio',
    }),

  message: Joi.string().min(5).max(500).required().messages({
    'string.empty': 'El mensaje de la alerta es requerido',
    'string.min': 'El mensaje debe tener al menos 5 caracteres',
    'string.max': 'El mensaje no puede exceder 500 caracteres',
    'any.required': 'El mensaje es obligatorio',
  }),

  severity: Joi.string()
    .valid('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')
    .optional()
    .default('MEDIUM')
    .messages({
      'any.only': 'La severidad debe ser uno de: LOW, MEDIUM, HIGH, CRITICAL',
    }),
})
