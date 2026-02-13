// backend/src/features/sales/index.ts

import { Router } from 'express'
// import customerRoutes from './customers/customers.routes'
// import orderRoutes from './orders/orders.routes'
// import preInvoiceRoutes from './preInvoices/preInvoices.routes'
// import paymentRoutes from './payments/payments.routes'
// import invoiceRoutes from './invoices/invoices.routes'
// import quoteRoutes from './quotes/quotes.routes'
// import creditNoteRoutes from './creditNotes/creditNotes.routes'
import reportRoutes from './reports/index'

const router = Router()

/**
 * Rutas de Sales (Ventas)
 * Base: /api/sales
 */

// Clientes
// /api/sales/customers/*
// router.use('/customers', customerRoutes)

// // Pedidos
// // /api/sales/orders/*
// router.use('/orders', orderRoutes)

// // Pre-facturas
// // /api/sales/pre-invoices/*
// router.use('/pre-invoices', preInvoiceRoutes)

// // Pagos
// // /api/sales/payments/*
// router.use('/payments', paymentRoutes)

// // Facturas
// // /api/sales/invoices/*
// router.use('/invoices', invoiceRoutes)

// // Cotizaciones
// // /api/sales/quotes/*
// router.use('/quotes', quoteRoutes)

// // Notas de Crédito
// // /api/sales/credit-notes/*
// router.use('/credit-notes', creditNoteRoutes)

// Reportes
// /api/sales/reports/*
router.use('/reports', reportRoutes)

export default router
