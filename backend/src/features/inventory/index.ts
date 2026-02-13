// backend/src/features/inventory/index.ts

import { Router } from 'express'

// Importar rutas de submódulos
import itemsRouter from './items/index'
import catalogRoutes from './items/catalogs/index'
// import warehouseRoutes from './warehouses/warehouses.routes'
// import stockRoutes from './stock/stock.routes'
// import movementRoutes from './movements/movements.routes'
// import purchaseOrderRoutes from './purchaseOrders/purchaseOrders.routes'
// import reservationRoutes from './reservations/reservations.routes'
// import transferRoutes from './transfers/transfers.routes'
// import exitNoteRoutes from './exitNotes/exitNotes.routes'
// import batchRoutes from './batches/batches.routes'
// import serialNumberRoutes from './serialNumbers/serialNumbers.routes'
// import loanRoutes from './loans/loans.routes'
// import returnRoutes from './returns/returns.routes'
// import reportRoutes from './reports/index'
// import analyticsRoutes from './analytics/index'

const router = Router()

/**
 * Rutas de Inventory
 * Base: /api/inventory
 */

// Artículos/Items
// /api/inventory/items/*
router.use('/items', itemsRouter)

// Catálogos (brands, categories, units, models, model-compatibility)
// /api/inventory/catalogs/*
router.use('/catalogs', catalogRoutes)

// // Almacenes
// // /api/inventory/warehouses/*
// router.use('/warehouses', warehouseRoutes)

// // Stock
// // /api/inventory/stock/*
// router.use('/stock', stockRoutes)

// // Movimientos
// // /api/inventory/movements/*
// router.use('/movements', movementRoutes)

// // Órdenes de Compra
// // /api/inventory/purchase-orders/*
// router.use('/purchase-orders', purchaseOrderRoutes)

// // Reservas
// // /api/inventory/reservations/*
// router.use('/reservations', reservationRoutes)

// // Transferencias
// // /api/inventory/transfers/*
// router.use('/transfers', transferRoutes)

// // Notas de Salida
// // /api/inventory/exit-notes/*
// router.use('/exit-notes', exitNoteRoutes)

// // Lotes
// // /api/inventory/batches/*
// router.use('/batches', batchRoutes)

// // Números de Serie
// // /api/inventory/serial-numbers/*
// router.use('/serial-numbers', serialNumberRoutes)

// // Préstamos
// // /api/inventory/loans/*
// router.use('/loans', loanRoutes)

// // Devoluciones
// // /api/inventory/returns/*
// router.use('/returns', returnRoutes)

// // Reportes
// // /api/inventory/reports/*
// router.use('/reports', reportRoutes)

// // Analíticas
// // /api/inventory/analytics/*
// router.use('/analytics', analyticsRoutes)

export default router
