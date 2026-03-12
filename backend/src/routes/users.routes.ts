import { Router } from 'express'
import {
  getAllUsers,
  createUser,
  getUserById,
  updateUser,
  deleteUser,
} from '../controllers/users.controller.js'
import { authenticate } from '../shared/middleware/authenticate.middleware.js'
import { authorize } from '../shared/middleware/authorize.middleware.js'
import { PERMISSIONS } from '../shared/constants/permissions.js'

const router = Router()

router.use(authenticate)

router.get('/', getAllUsers)
router.post('/', authorize(PERMISSIONS.USERS_CREATE), createUser)

// router.get(
//   '/:id/audit-logs',
//   authorize(PERMISSIONS.USERS_READ),
//   getAuditLogsForUser
// )

router.get('/:id', authorize(PERMISSIONS.USERS_READ), getUserById)
router.put('/:id', authorize(PERMISSIONS.USERS_UPDATE), updateUser)
router.delete('/:id', authorize(PERMISSIONS.USERS_DELETE), deleteUser)

export default router
