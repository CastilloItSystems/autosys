// backend/src/features/workshop/appointments/appointments.validation.ts
import Joi from 'joi'

const APPOINTMENT_STATUSES = [
  'SCHEDULED', 'CONFIRMED', 'ARRIVED', 'COMPLETED',
  'NO_SHOW', 'CANCELLED', 'RESCHEDULED', 'WAITING',
]
const APPOINTMENT_ORIGINS = ['PHONE', 'SOCIAL_MEDIA', 'PRESENTIAL', 'WEB', 'CRM']

export const createAppointmentSchema = Joi.object({
  customerId: Joi.string().required().messages({ 'any.required': 'El cliente es requerido' }),
  customerVehicleId: Joi.string().optional(),
  vehiclePlate: Joi.string().trim().max(20).optional(),
  vehicleDesc: Joi.string().trim().max(255).optional(),
  serviceTypeId: Joi.string().optional(),
  scheduledDate: Joi.date().iso().required().messages({
    'any.required': 'La fecha de la cita es requerida',
    'date.base': 'La fecha de la cita no es válida',
  }),
  estimatedMinutes: Joi.number().integer().min(15).optional(),
  assignedAdvisorId: Joi.string().optional(),
  origin: Joi.string().valid(...APPOINTMENT_ORIGINS).optional().default('PRESENTIAL'),
  preDiagnosis: Joi.string().trim().max(2000).optional().allow(''),
  preIdentifiedParts: Joi.array().items(Joi.object({
    description: Joi.string().required(),
    qty: Joi.number().positive().optional().default(1),
  })).optional(),
  estimatedCost: Joi.number().min(0).optional(),
  clientNotes: Joi.string().trim().max(1000).optional().allow(''),
  internalNotes: Joi.string().trim().max(1000).optional().allow(''),
})

export const updateAppointmentSchema = Joi.object({
  customerVehicleId: Joi.string().optional().allow(null),
  vehiclePlate: Joi.string().trim().max(20).optional(),
  vehicleDesc: Joi.string().trim().max(255).optional(),
  serviceTypeId: Joi.string().optional().allow(null),
  scheduledDate: Joi.date().iso().optional(),
  estimatedMinutes: Joi.number().integer().min(15).optional().allow(null),
  assignedAdvisorId: Joi.string().optional().allow(null),
  origin: Joi.string().valid(...APPOINTMENT_ORIGINS).optional(),
  preDiagnosis: Joi.string().trim().max(2000).optional().allow('', null),
  preIdentifiedParts: Joi.array().items(Joi.object({
    description: Joi.string().required(),
    qty: Joi.number().positive().optional().default(1),
  })).optional().allow(null),
  estimatedCost: Joi.number().min(0).optional().allow(null),
  clientNotes: Joi.string().trim().max(1000).optional().allow(''),
  internalNotes: Joi.string().trim().max(1000).optional().allow(''),
}).min(1).messages({ 'object.min': 'Debe proporcionar al menos un campo para actualizar' })

export const updateAppointmentStatusSchema = Joi.object({
  status: Joi.string().valid(...APPOINTMENT_STATUSES).required().messages({
    'any.required': 'El estado es requerido',
    'any.only': `El estado debe ser uno de: ${APPOINTMENT_STATUSES.join(', ')}`,
  }),
})

export const appointmentFiltersSchema = Joi.object({
  status: Joi.string().valid(...APPOINTMENT_STATUSES).optional(),
  origin: Joi.string().valid(...APPOINTMENT_ORIGINS).optional(),
  customerId: Joi.string().optional(),
  assignedAdvisorId: Joi.string().optional(),
  dateFrom: Joi.date().iso().optional(),
  dateTo: Joi.date().iso().optional(),
  search: Joi.string().trim().optional().allow(''),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sortBy: Joi.string().valid('scheduledDate', 'folio', 'status', 'createdAt').default('scheduledDate'),
  sortOrder: Joi.string().valid('asc', 'desc').default('asc'),
})
