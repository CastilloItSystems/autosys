import { Router } from 'express'
import userRoutes from './users.routes.js'
import authRoutes from './auth.routes.js'
import empresaRoutes from './empresas.routes.js'
import companyRoleRoutes from './companyRoles.routes.js'
import membershipRoutes from './memberships.routes.js'
import notificationRoutes from '../features/notifications/notifications.routes.js'
// import { saveToken } from '../controllers/users.controller.js'

// Módulos
import inventoryRoutes from '../features/inventory/index.js'
import salesRoutes from '../features/sales/index.js'
import crmRoutes from '../features/crm/index.js'
import workshopRoutes from '../features/workshop/index.js'
import dealerRoutes from '../features/dealer/index.js'
import exchangeRateRoutes from '../features/exchangeRates/index.js'
import auditLogRoutes from '../features/audit/auditLog.routes.js'
import backupsRoutes from '../features/system/backups/backups.routes.js'

// Middlewares
import { authenticate } from '../shared/middleware/authenticate.middleware.js'
import { extractEmpresa } from '../shared/middleware/empresa.middleware.js'

const router = Router()

// Públicas
router.use('/auth', authRoutes)

// Usuarios globales del SaaS
router.use('/users', authenticate, userRoutes)

// Memberships por empresa
router.use('/memberships', authenticate, extractEmpresa, membershipRoutes)

// Roles dinámicos por empresa
router.use('/empresas/:id/roles', authenticate, companyRoleRoutes)

// Empresas (entidad global del SaaS — no requiere extractEmpresa)
router.use('/empresas', authenticate, empresaRoutes)

// Notificaciones
router.use('/notifications', authenticate, extractEmpresa, notificationRoutes)

// Auditoría global por empresa
router.use('/audit-logs', authenticate, extractEmpresa, auditLogRoutes)

// Respaldos de base de datos (sistema)
router.use('/system/backups', backupsRoutes)

// Módulo Inventario
router.use('/inventory', authenticate, extractEmpresa, inventoryRoutes)

// Módulo Ventas
router.use('/sales', authenticate, extractEmpresa, salesRoutes)

// Módulo CRM
router.use('/crm', authenticate, extractEmpresa, crmRoutes)

// Módulo Taller (Workshop)
router.use('/workshop', authenticate, extractEmpresa, workshopRoutes)

// Módulo Concesionario
router.use('/dealer', authenticate, extractEmpresa, dealerRoutes)

// Tasas de cambio (cross-cutting)
router.use('/exchange-rates', authenticate, extractEmpresa, exchangeRateRoutes)

// Módulo Finanzas
import bankAccountRoutes from '../features/finance/bankAccounts/bankAccounts.routes.js'
import supplierBillRoutes from '../features/finance/supplierBills/supplierBills.routes.js'
import supplierPaymentRoutes from '../features/finance/supplierPayments/supplierPayments.routes.js'
import expenseRoutes from '../features/finance/expenses/expenses.routes.js'
import cashTransactionRoutes from '../features/finance/cashTransactions/cashTransactions.routes.js'
import financeDashboardRoutes from '../features/finance/dashboard/financeDashboard.routes.js'

router.use('/finance/dashboard', authenticate, extractEmpresa, financeDashboardRoutes)
router.use('/finance/bank-accounts', authenticate, extractEmpresa, bankAccountRoutes)
router.use('/finance/supplier-bills', authenticate, extractEmpresa, supplierBillRoutes)
router.use('/finance/supplier-payments', authenticate, extractEmpresa, supplierPaymentRoutes)
router.use('/finance/expenses', authenticate, extractEmpresa, expenseRoutes)
router.use('/finance/cash-flow', authenticate, extractEmpresa, cashTransactionRoutes)

export default router
