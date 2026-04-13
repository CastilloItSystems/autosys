import { Router } from 'express'
import { authorize } from '../../../shared/middleware/authorize.middleware.js'
import { PERMISSIONS } from '../../../shared/constants/permissions.js'
import { searchUnifiedCatalog } from './catalogs.controller.js'

const router = Router()

router.get(
  '/search',
  authorize(PERMISSIONS.WORKSHOP_VIEW),
  searchUnifiedCatalog
)

export default router
