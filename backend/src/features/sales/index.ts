// backend/src/features/sales/index.ts

import { Router } from 'express'
import orderRoutes from './orders/orders.routes.js'
import preInvoiceRoutes from './preInvoices/preInvoices.routes.js'
import paymentRoutes from './payments/payments.routes.js'
import invoiceRoutes from './invoices/invoices.routes.js'
// import quoteRoutes from './quotes/quotes.routes.js'
// import creditNoteRoutes from './creditNotes/creditNotes.routes.js'
import reportRoutes from './reports/index.js'

const router = Router()

/**
 * Rutas de Sales (Ventas)
 * Base: /api/sales
 */

// Órdenes de Venta
router.use('/orders', orderRoutes)

// Pre-facturas
router.use('/pre-invoices', preInvoiceRoutes)

// Pagos
router.use('/payments', paymentRoutes)

// Facturas
router.use('/invoices', invoiceRoutes)

// Cotizaciones
// router.use('/quotes', quoteRoutes)

// Notas de Crédito
// router.use('/credit-notes', creditNoteRoutes)

// Reportes
router.use('/reports', reportRoutes)

export default router
