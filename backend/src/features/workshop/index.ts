// backend/src/features/workshop/index.ts
import { Router } from 'express'
import serviceOrderRoutes from './serviceOrders/serviceOrders.routes.js'
import serviceTypeRoutes from './serviceTypes/serviceTypes.routes.js'
import workshopBayRoutes from './workshopBays/workshopBays.routes.js'
import workshopOperationRoutes from './workshopOperations/workshopOperations.routes.js'
import appointmentRoutes from './appointments/appointments.routes.js'
import receptionRoutes from './receptions/receptions.routes.js'
import laborTimeRoutes from './laborTimes/laborTimes.routes.js'
import qualityCheckRoutes from './qualityChecks/qualityChecks.routes.js'
import warrantyRoutes from './workshopWarranties/workshopWarranties.routes.js'
import checklistRoutes from './checklists/checklists.routes.js'
import diagnosesRoutes from './diagnoses/diagnoses.routes.js'
import deliveriesRoutes from './deliveries/deliveries.routes.js'
import ingressMotiveRoutes from './ingressMotives/ingressMotives.routes.js'
import technicianSpecialtyRoutes from './technicianSpecialties/technicianSpecialties.routes.js'
import serviceOrderMaterialRoutes from './serviceOrderMaterials/serviceOrderMaterials.routes.js'
import serviceOrderAdditionalRoutes from './serviceOrderAdditionals/serviceOrderAdditionals.routes.js'
import dashboardRoutes from './dashboard/index.js'
import automationsRoutes from './automations/index.js'
import reportsRoutes from './reports/index.js'
import vehicleHistoryRoutes from './vehicleHistory/vehicleHistory.routes.js'
import receptionMediaRoutes from './receptionMedia/receptionMedia.routes.js'
import attachmentRoutes from './attachments/attachments.routes.js'
import shiftRoutes from './workshopShifts/workshopShifts.routes.js'
import reworkRoutes from './workshopReworks/workshopReworks.routes.js'
import auditLogRoutes from './auditLog/auditLog.routes.js'
import quotationRoutes from './workshopQuotations/workshopQuotations.routes.js'
import totRoutes from './workshopTOT/workshopTOT.routes.js'
import garitaRoutes from './workshopGarita/workshopGarita.routes.js'

const router = Router()

// FASE 3.4: Operational Dashboard
router.use('/dashboard', dashboardRoutes)

// OPCIÓN C: Automations & Reports (Operational Intelligence)
router.use('/automations', automationsRoutes)
router.use('/reports', reportsRoutes)

// ERP - Opción 3 Modulos Avanzados
router.use('/checklists', checklistRoutes)
router.use('/diagnoses', diagnosesRoutes)
router.use('/deliveries', deliveriesRoutes)
router.use('/ingress-motives', ingressMotiveRoutes)
router.use('/technician-specialties', technicianSpecialtyRoutes)

// Catálogos
router.use('/service-types', serviceTypeRoutes)
router.use('/bays', workshopBayRoutes)
router.use('/operations', workshopOperationRoutes)

// Flujo operativo
router.use('/appointments', appointmentRoutes)
router.use('/receptions', receptionRoutes)
router.use('/service-orders', serviceOrderRoutes)

// Control operativo
router.use('/labor-times', laborTimeRoutes)
router.use('/quality-checks', qualityCheckRoutes)
router.use('/warranties', warrantyRoutes)

// Service Order Details
router.use('/materials', serviceOrderMaterialRoutes)
router.use('/additionals', serviceOrderAdditionalRoutes)

// Workshop Prioridad 2
router.use('/vehicles', vehicleHistoryRoutes)
router.use('/receptions/:receptionId', receptionMediaRoutes)
router.use('/attachments', attachmentRoutes)

// Workshop Prioridad 3
router.use('/shifts', shiftRoutes)
router.use('/reworks', reworkRoutes)
router.use('/audit-log', auditLogRoutes)
router.use('/quotations', quotationRoutes)
router.use('/tot', totRoutes)
router.use('/garita', garitaRoutes)

export default router
