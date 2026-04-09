// backend/src/features/inventory/items/pricing/pricing.validation.ts

import Joi from 'joi'

export const createPricingSchema = Joi.object({
  itemId: Joi.string().uuid().required().messages({
    'string.uuid': 'ID del artículo debe ser un UUID válido',
    'any.required': 'ID del artículo es requerido',
  }),
  costPrice: Joi.number().min(0).required().messages({
    'number.min': 'Precio de costo no puede ser negativo',
    'any.required': 'Precio de costo es requerido',
  }),
  salePrice: Joi.number().min(0).required().messages({
    'number.min': 'Precio de venta no puede ser negativo',
    'any.required': 'Precio de venta es requerido',
  }),
  wholesalePrice: Joi.number().min(0).optional().messages({
    'number.min': 'Precio mayorista no puede ser negativo',
  }),
  minMargin: Joi.number().min(0).optional().default(0).messages({
    'number.min': 'Margen mínimo no puede ser negativo',
  }),
  maxMargin: Joi.number().min(0).optional().default(0).messages({
    'number.min': 'Margen máximo no puede ser negativo',
  }),
  discountPercentage: Joi.number().min(0).max(100).optional().messages({
    'number.min': 'Descuento no puede ser negativo',
    'number.max': 'Descuento no puede exceder 100',
  }),
  costForeign: Joi.number().min(0).optional(),
  exchangeRate: Joi.number().min(0).optional(),
  taxRateSale: Joi.number().min(0).max(100).optional(),
  taxRatePurchase: Joi.number().min(0).max(100).optional(),
  priceLevels: Joi.array()
    .items(
      Joi.object({
        level: Joi.number().integer().min(1).max(8).required(),
        priceForeign: Joi.number().min(0).required(),
      })
    )
    .max(8)
    .optional(),
  notes: Joi.string().max(1000).optional().allow('').messages({
    'string.max': 'Notas no pueden exceder 1000 caracteres',
  }),
})

export const updatePricingSchema = Joi.object({
  costPrice: Joi.number().min(0).optional().messages({
    'number.min': 'Precio de costo no puede ser negativo',
  }),
  salePrice: Joi.number().min(0).optional().messages({
    'number.min': 'Precio de venta no puede ser negativo',
  }),
  wholesalePrice: Joi.number().min(0).optional().messages({
    'number.min': 'Precio mayorista no puede ser negativo',
  }),
  minMargin: Joi.number().min(0).optional().messages({
    'number.min': 'Margen mínimo no puede ser negativo',
  }),
  maxMargin: Joi.number().min(0).optional().messages({
    'number.min': 'Margen máximo no puede ser negativo',
  }),
  discountPercentage: Joi.number().min(0).max(100).optional().messages({
    'number.min': 'Descuento no puede ser negativo',
    'number.max': 'Descuento no puede exceder 100',
  }),
  costForeign: Joi.number().min(0).optional(),
  exchangeRate: Joi.number().min(0).optional(),
  taxRateSale: Joi.number().min(0).max(100).optional(),
  taxRatePurchase: Joi.number().min(0).max(100).optional(),
  priceLevels: Joi.array()
    .items(
      Joi.object({
        level: Joi.number().integer().min(1).max(8).required(),
        priceForeign: Joi.number().min(0).required(),
      })
    )
    .max(8)
    .optional(),
  notes: Joi.string().max(1000).optional().allow('').messages({
    'string.max': 'Notas no pueden exceder 1000 caracteres',
  }),
  isActive: Joi.boolean().optional().messages({
    'boolean.base': 'isActive debe ser verdadero o falso',
  }),
})

export const pricingIdSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    'string.uuid': 'ID de precios debe ser un UUID válido',
    'any.required': 'ID de precios es requerido',
  }),
})

export const itemIdSchema = Joi.object({
  itemId: Joi.string().uuid().required().messages({
    'string.uuid': 'ID del artículo debe ser un UUID válido',
    'any.required': 'ID del artículo es requerido',
  }),
})

export const getPricingFiltersSchema = Joi.object({
  itemId: Joi.string().uuid().optional().messages({
    'string.uuid': 'ID del artículo debe ser un UUID válido',
  }),
  isActive: Joi.boolean().optional().messages({
    'boolean.base': 'isActive debe ser verdadero o falso',
  }),
  page: Joi.string().pattern(/^\d+$/).optional().default('1').messages({
    'string.pattern.base': 'Página debe ser un número válido',
  }),
  limit: Joi.string().pattern(/^\d+$/).optional().default('10').messages({
    'string.pattern.base': 'Límite debe ser un número válido',
  }),
})

// Pricing Tier Validation
export const createPricingTierSchema = Joi.object({
  pricingId: Joi.string().uuid().required().messages({
    'string.uuid': 'ID de precios debe ser un UUID válido',
    'any.required': 'ID de precios es requerido',
  }),
  minQuantity: Joi.number().integer().min(0).required().messages({
    'number.min': 'Cantidad mínima no puede ser negativa',
    'any.required': 'Cantidad mínima es requerida',
  }),
  maxQuantity: Joi.number().integer().min(1).optional().messages({
    'number.min': 'Cantidad máxima debe ser mayor a 0',
  }),
  tierPrice: Joi.number().min(0).required().messages({
    'number.min': 'Precio de tier no puede ser negativo',
    'any.required': 'Precio de tier es requerido',
  }),
  discountPercentage: Joi.number().min(0).max(100).optional().messages({
    'number.min': 'Descuento no puede ser negativo',
    'number.max': 'Descuento no puede exceder 100',
  }),
})

export const updatePricingTierSchema = Joi.object({
  minQuantity: Joi.number().integer().min(0).optional().messages({
    'number.min': 'Cantidad mínima no puede ser negativa',
  }),
  maxQuantity: Joi.number().integer().min(1).optional().messages({
    'number.min': 'Cantidad máxima debe ser mayor a 0',
  }),
  tierPrice: Joi.number().min(0).optional().messages({
    'number.min': 'Precio de tier no puede ser negativo',
  }),
  discountPercentage: Joi.number().min(0).max(100).optional().messages({
    'number.min': 'Descuento no puede ser negativo',
    'number.max': 'Descuento no puede exceder 100',
  }),
})

export const tierIdSchema = Joi.object({
  tierId: Joi.string().uuid().required().messages({
    'string.uuid': 'ID de tier debe ser un UUID válido',
    'any.required': 'ID de tier es requerido',
  }),
})

export const getPricingTierFiltersSchema = Joi.object({
  pricingId: Joi.string().uuid().optional().messages({
    'string.uuid': 'ID de precios debe ser un UUID válido',
  }),
  page: Joi.string().pattern(/^\d+$/).optional().default('1').messages({
    'string.pattern.base': 'Página debe ser un número válido',
  }),
  limit: Joi.string().pattern(/^\d+$/).optional().default('10').messages({
    'string.pattern.base': 'Límite debe ser un número válido',
  }),
})

export const calculateMarginSchema = Joi.object({
  costPrice: Joi.number().min(0).required().messages({
    'number.min': 'Precio de costo no puede ser negativo',
    'any.required': 'Precio de costo es requerido',
  }),
  salePrice: Joi.number().min(0).required().messages({
    'number.min': 'Precio de venta no puede ser negativo',
    'any.required': 'Precio de venta es requerido',
  }),
})
