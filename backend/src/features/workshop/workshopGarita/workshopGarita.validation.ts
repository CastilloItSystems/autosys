// backend/src/features/workshop/workshopGarita/workshopGarita.validation.ts
import Joi from 'joi'

const GARITA_TYPES = ['VEHICLE_IN', 'VEHICLE_OUT', 'PART_OUT', 'PART_IN', 'ROAD_TEST_OUT', 'ROAD_TEST_IN', 'OTHER']
const GARITA_STATUSES = ['PENDING', 'AUTHORIZED', 'COMPLETED', 'FLAGGED', 'CANCELLED']

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING:    ['AUTHORIZED', 'FLAGGED', 'CANCELLED'],
  AUTHORIZED: ['COMPLETED', 'FLAGGED', 'CANCELLED'],
  COMPLETED:  [],
  FLAGGED:    ['AUTHORIZED', 'CANCELLED'],
  CANCELLED:  [],
}

export const createGaritaEventSchema = Joi.object({
  type: Joi.string().valid(...GARITA_TYPES).required().messages({ 'any.required': 'El tipo de evento es requerido' }),
  serviceOrderId: Joi.string().optional().allow(null, ''),
  totId: Joi.string().optional().allow(null, ''),
  plateNumber: Joi.string().trim().max(20).optional().allow('', null),
  vehicleDesc: Joi.string().trim().max(200).optional().allow('', null),
  serialMotor: Joi.string().trim().max(100).optional().allow('', null),
  serialBody: Joi.string().trim().max(100).optional().allow('', null),
  kmIn: Joi.number().integer().min(0).optional().allow(null),
  driverName: Joi.string().trim().max(200).optional().allow('', null),
  driverId: Joi.string().trim().max(30).optional().allow('', null),
  exitPassRef: Joi.string().trim().max(100).optional().allow('', null),
  photoUrls: Joi.array().items(Joi.string().uri()).optional().allow(null),
  notes: Joi.string().trim().max(2000).optional().allow('', null),
  eventAt: Joi.date().iso().optional().allow(null),
})

export const updateGaritaEventSchema = Joi.object({
  plateNumber: Joi.string().trim().max(20).optional().allow('', null),
  vehicleDesc: Joi.string().trim().max(200).optional().allow('', null),
  serialMotor: Joi.string().trim().max(100).optional().allow('', null),
  serialBody: Joi.string().trim().max(100).optional().allow('', null),
  kmIn: Joi.number().integer().min(0).optional().allow(null),
  kmOut: Joi.number().integer().min(0).optional().allow(null),
  driverName: Joi.string().trim().max(200).optional().allow('', null),
  driverId: Joi.string().trim().max(30).optional().allow('', null),
  exitPassRef: Joi.string().trim().max(100).optional().allow('', null),
  authorizedById: Joi.string().optional().allow(null, ''),
  authorizedAt: Joi.date().iso().optional().allow(null),
  photoUrls: Joi.array().items(Joi.string().uri()).optional().allow(null),
  hasIrregularity: Joi.boolean().optional(),
  irregularityNotes: Joi.string().trim().max(2000).optional().allow('', null),
  completedAt: Joi.date().iso().optional().allow(null),
  notes: Joi.string().trim().max(2000).optional().allow('', null),
}).min(1).messages({ 'object.min': 'Debe proporcionar al menos un campo para actualizar' })

export const updateGaritaStatusSchema = Joi.object({
  status: Joi.string().valid(...GARITA_STATUSES).required(),
  kmOut: Joi.number().integer().min(0).optional().allow(null),
  exitPassRef: Joi.string().trim().max(100).optional().allow('', null),
  irregularityNotes: Joi.string().trim().max(2000).optional().allow('', null),
  notes: Joi.string().trim().max(500).optional().allow('', null),
})

export const garitaFiltersSchema = Joi.object({
  type: Joi.string().valid(...GARITA_TYPES).optional(),
  status: Joi.string().valid(...GARITA_STATUSES).optional(),
  serviceOrderId: Joi.string().optional(),
  totId: Joi.string().optional(),
  plateNumber: Joi.string().trim().optional().allow(''),
  search: Joi.string().trim().optional().allow(''),
  dateFrom: Joi.date().iso().optional(),
  dateTo: Joi.date().iso().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(50),
})

export { VALID_TRANSITIONS as GARITA_VALID_TRANSITIONS }
