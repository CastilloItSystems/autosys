// backend/src/features/exchangeRates/exchangeRates.routes.ts

import { Router } from 'express'
import * as controller from './exchangeRates.controller.js'
import { authorize } from '../../shared/middleware/authorize.middleware.js'
import { validateRequest } from '../../shared/middleware/validateRequest.middleware.js'
import { PERMISSIONS } from '../../shared/constants/permissions.js'
import {
  createExchangeRateSchema,
  updateExchangeRateSchema,
  listExchangeRatesSchema,
  getLatestRateSchema,
  getRateForDateSchema,
  exchangeRateIdSchema,
  rateDateParamSchema,
} from './exchangeRates.validation.js'

const router = Router()

// IMPORTANTE: Rutas estáticas ANTES de /:id

// GET /exchange-rates/latest?fromCurrency=USD&toCurrency=VES
router.get(
  '/latest',
  authorize(PERMISSIONS.EXCHANGE_RATES_VIEW),
  validateRequest(getLatestRateSchema, 'query'),
  controller.getLatest
)

// GET /exchange-rates/active
router.get(
  '/active',
  authorize(PERMISSIONS.EXCHANGE_RATES_VIEW),
  controller.getActive
)

// GET /exchange-rates/date/:date?fromCurrency=USD&toCurrency=VES
router.get(
  '/date/:date',
  authorize(PERMISSIONS.EXCHANGE_RATES_VIEW),
  validateRequest(rateDateParamSchema, 'params'),
  validateRequest(getRateForDateSchema, 'query'),
  controller.getForDate
)

// POST /exchange-rates/fetch-bcv
router.post(
  '/fetch-bcv',
  authorize(PERMISSIONS.EXCHANGE_RATES_CREATE),
  controller.fetchBcv
)

// GET /exchange-rates
router.get(
  '/',
  authorize(PERMISSIONS.EXCHANGE_RATES_VIEW),
  validateRequest(listExchangeRatesSchema, 'query'),
  controller.list
)

// POST /exchange-rates
router.post(
  '/',
  authorize(PERMISSIONS.EXCHANGE_RATES_CREATE),
  validateRequest(createExchangeRateSchema, 'body'),
  controller.create
)

// GET /exchange-rates/:id
router.get(
  '/:id',
  authorize(PERMISSIONS.EXCHANGE_RATES_VIEW),
  validateRequest(exchangeRateIdSchema, 'params'),
  controller.getById
)

// PUT /exchange-rates/:id
router.put(
  '/:id',
  authorize(PERMISSIONS.EXCHANGE_RATES_UPDATE),
  validateRequest(exchangeRateIdSchema, 'params'),
  validateRequest(updateExchangeRateSchema, 'body'),
  controller.update
)

// DELETE /exchange-rates/:id
router.delete(
  '/:id',
  authorize(PERMISSIONS.EXCHANGE_RATES_DELETE),
  validateRequest(exchangeRateIdSchema, 'params'),
  controller.remove
)

export default router
