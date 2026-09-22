// backend/src/features/system/backups/backups.validation.ts

import Joi from 'joi'

export const listBackupsSchema = Joi.object({
  page: Joi.string().pattern(/^\d+$/).optional().default('1'),
  limit: Joi.string().pattern(/^\d+$/).optional().default('20'),
  type: Joi.string().valid('MANUAL', 'DAILY', 'WEEKLY').optional(),
  status: Joi.string().valid('PENDING', 'SUCCESS', 'FAILED').optional(),
})

export const backupIdParamsSchema = Joi.object({
  id: Joi.string().required().messages({
    'any.required': 'El ID del respaldo es requerido',
  }),
})

export const restoreBackupSchema = Joi.object({
  confirmFileName: Joi.string().required().messages({
    'any.required':
      'Debes escribir el nombre del archivo del respaldo para confirmar la restauración',
  }),
})

export const restoreJobParamsSchema = Joi.object({
  jobId: Joi.string().uuid().required().messages({
    'string.guid': 'El identificador de la restauración no es válido',
    'any.required': 'El identificador de la restauración es requerido',
  }),
})
