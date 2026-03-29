// backend/src/features/workshop/receptions/receptions.validation.ts
import Joi from 'joi'

const FUEL_LEVELS = ['EMPTY', 'QUARTER', 'HALF', 'THREE_QUARTERS', 'FULL']

export const createReceptionSchema = Joi.object({
  customerId: Joi.string().required().messages({ 'any.required': 'El cliente es requerido' }),
  customerVehicleId: Joi.string().optional(),
  vehiclePlate: Joi.string().trim().max(20).optional(),
  vehicleDesc: Joi.string().trim().max(255).optional(),
  mileageIn: Joi.number().integer().min(0).optional(),
  fuelLevel: Joi.string().valid(...FUEL_LEVELS).optional(),
  accessories: Joi.array().items(Joi.string().max(100)).optional(),
  hasPreExistingDamage: Joi.boolean().default(false),
  damageNotes: Joi.string().trim().max(2000).optional().allow(''),
  clientDescription: Joi.string().trim().max(2000).optional().allow(''),
  authorizationName: Joi.string().trim().max(150).optional(),
  authorizationPhone: Joi.string().trim().max(30).optional(),
  estimatedDelivery: Joi.date().iso().optional(),
  advisorId: Joi.string().optional(),
  appointmentId: Joi.string().optional(),
})

export const updateReceptionSchema = Joi.object({
  mileageIn: Joi.number().integer().min(0).optional(),
  fuelLevel: Joi.string().valid(...FUEL_LEVELS).optional().allow(null),
  accessories: Joi.array().items(Joi.string().max(100)).optional(),
  hasPreExistingDamage: Joi.boolean().optional(),
  damageNotes: Joi.string().trim().max(2000).optional().allow('', null),
  clientDescription: Joi.string().trim().max(2000).optional().allow(''),
  authorizationName: Joi.string().trim().max(150).optional(),
  authorizationPhone: Joi.string().trim().max(30).optional(),
  estimatedDelivery: Joi.date().iso().optional().allow(null),
  advisorId: Joi.string().optional().allow(null),
}).min(1).messages({ 'object.min': 'Debe proporcionar al menos un campo para actualizar' })

export const receptionFiltersSchema = Joi.object({
  customerId: Joi.string().optional(),
  advisorId: Joi.string().optional(),
  appointmentId: Joi.string().optional(),
  dateFrom: Joi.date().iso().optional(),
  dateTo: Joi.date().iso().optional(),
  search: Joi.string().trim().optional().allow(''),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sortBy: Joi.string().valid('folio', 'createdAt', 'estimatedDelivery').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
})
