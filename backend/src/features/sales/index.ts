// backend/src/features/sales/index.ts

import { Router } from 'express'
import customerRoutes from './customers/customers.routes.js'
import orderRoutes from './orders/orders.routes.js'
// import preInvoiceRoutes from './preInvoices/preInvoices.routes.js'
// import paymentRoutes from './payments/payments.routes.js'
// import invoiceRoutes from './invoices/invoices.routes.js'
// import quoteRoutes from './quotes/quotes.routes.js'
// import creditNoteRoutes from './creditNotes/creditNotes.routes.js'
import reportRoutes from './reports/index.js'

const router = Router()

/**
 * Rutas de Sales (Ventas)
 * Base: /api/sales
 */

// Clientes
// /api/sales/customers/*
router.use('/customers', customerRoutes)

// Pedidos / Órdenes de Venta
// /api/sales/orders/*
router.use('/orders', orderRoutes)

// Pre-facturas
// /api/sales/pre-invoices/*
// router.use('/pre-invoices', preInvoiceRoutes)

// Pagos
// /api/sales/payments/*
// router.use('/payments', paymentRoutes)

// Facturas
// /api/sales/invoices/*
// router.use('/invoices', invoiceRoutes)

// Cotizaciones
// /api/sales/quotes/*
// router.use('/quotes', quoteRoutes)

// Notas de Crédito
// /api/sales/credit-notes/*
// router.use('/credit-notes', creditNoteRoutes)

// Reportes
// /api/sales/reports/*
router.use('/reports', reportRoutes)

export default router
