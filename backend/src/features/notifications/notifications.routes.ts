import { Router } from 'express'
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getNotificationCatalogController,
  getCompanyPolicies,
  upsertCompanyPolicies,
  getMyNotificationPreferences,
  upsertMyNotificationPreferences,
} from './notifications.controller.js'
import { authorize } from '../../shared/middleware/authorize.middleware.js'
import { validateRequest } from '../../shared/middleware/validateRequest.middleware.js'
import { PERMISSIONS } from '../../shared/constants/permissions.js'
import {
  listNotificationsQuerySchema,
  notificationIdParamSchema,
  upsertCompanyPoliciesSchema,
  upsertPreferencesSchema,
} from './notifications.validation.js'

const router = Router()

router.get(
  '/catalog',
  authorize(PERMISSIONS.NOTIFICATIONS_VIEW),
  getNotificationCatalogController
)

router.get(
  '/',
  authorize(PERMISSIONS.NOTIFICATIONS_VIEW),
  validateRequest(listNotificationsQuerySchema, 'query'),
  getNotifications
)

router.patch(
  '/read-all',
  authorize(PERMISSIONS.NOTIFICATIONS_VIEW),
  markAllNotificationsAsRead
)

router.patch(
  '/:id/read',
  authorize(PERMISSIONS.NOTIFICATIONS_VIEW),
  validateRequest(notificationIdParamSchema, 'params'),
  markNotificationAsRead
)

router.get(
  '/company-policies',
  authorize(PERMISSIONS.NOTIFICATIONS_MANAGE_POLICY),
  getCompanyPolicies
)

router.put(
  '/company-policies',
  authorize(PERMISSIONS.NOTIFICATIONS_MANAGE_POLICY),
  validateRequest(upsertCompanyPoliciesSchema, 'body'),
  upsertCompanyPolicies
)

router.get(
  '/me/preferences',
  authorize(PERMISSIONS.NOTIFICATIONS_VIEW),
  getMyNotificationPreferences
)

router.put(
  '/me/preferences',
  authorize(PERMISSIONS.NOTIFICATIONS_VIEW),
  validateRequest(upsertPreferencesSchema, 'body'),
  upsertMyNotificationPreferences
)

export default router
