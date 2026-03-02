/**
 * Loans Routes
 */

import { Router, Request, Response } from 'express';
import * as controller from './loans.controller';
import { validateRequest } from '../../../shared/middleware/validateRequest.middleware';
import { authenticate } from '../../../shared/middleware/authenticate.middleware';
import { authorize } from '../../../shared/middleware/authorize.middleware';
import { PERMISSIONS } from '../../../shared/constants/permissions';
import {
  createLoanSchema,
  updateLoanSchema,
  approveLoanSchema,
  returnLoanSchema,
  cancelLoanSchema,
} from './loans.validation';

const router = Router();

/**
 * @swagger
 * /api/inventory/loans:
 *   get:
 *     summary: Get all loans
 *     tags: [Loans]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, PENDING_APPROVAL, APPROVED, ACTIVE, RETURNED, OVERDUE, CANCELLED]
 *       - in: query
 *         name: borrowerName
 *         schema:
 *           type: string
 *       - in: query
 *         name: warehouseId
 *         schema:
 *           type: string
 *           format: uuid
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of loans
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_VIEW),
  controller.getLoans
);

/**
 * @swagger
 * /api/inventory/loans/{id}:
 *   get:
 *     summary: Get loan by ID
 *     tags: [Loans]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Loan details
 *       404:
 *         description: Loan not found
 */
router.get(
  '/:id',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_VIEW),
  controller.getLoanById
);

/**
 * @swagger
 * /api/inventory/loans:
 *   post:
 *     summary: Create new loan
 *     tags: [Loans]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [borrowerName, warehouseId, dueDate, items]
 *             properties:
 *               borrowerName:
 *                 type: string
 *               warehouseId:
 *                 type: string
 *                 format: uuid
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required: [itemId, quantityLoaned]
 *                   properties:
 *                     itemId:
 *                       type: string
 *                       format: uuid
 *                     quantityLoaned:
 *                       type: integer
 *                     unitCost:
 *                       type: number
 *                     notes:
 *                       type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Loan created
 *       400:
 *         description: Invalid input
 */
router.post(
  '/',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_CREATE),
  validateRequest(createLoanSchema),
  controller.createLoan
);

/**
 * @swagger
 * /api/inventory/loans/{id}:
 *   put:
 *     summary: Update loan
 *     tags: [Loans]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               borrowerName:
 *                 type: string
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Loan updated
 *       400:
 *         description: Cannot update non-DRAFT loans
 */
router.put(
  '/:id',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  validateRequest(updateLoanSchema),
  controller.updateLoan
);

/**
 * @swagger
 * /api/inventory/loans/{id}/approve:
 *   patch:
 *     summary: Approve loan (DRAFT -> APPROVED)
 *     tags: [Loans]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Loan approved
 *       400:
 *         description: Invalid status transition
 */
router.patch(
  '/:id/approve',
  authenticate,
  authorize(PERMISSIONS.LOAN_APPROVE),
  controller.approveLoan
);

/**
 * @swagger
 * /api/inventory/loans/{id}/activate:
 *   patch:
 *     summary: Activate loan - Reserve stock (APPROVED -> ACTIVE)
 *     tags: [Loans]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Loan activated
 *       400:
 *         description: Invalid status or insufficient stock
 */
router.patch(
  '/:id/activate',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  controller.activateLoan
);

/**
 * @swagger
 * /api/inventory/loans/{id}/return:
 *   patch:
 *     summary: Return loaned items
 *     tags: [Loans]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [items]
 *             properties:
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required: [itemId, quantityReturned]
 *                   properties:
 *                     itemId:
 *                       type: string
 *                       format: uuid
 *                     quantityReturned:
 *                       type: integer
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Items returned
 *       400:
 *         description: Invalid quantity or loan not active
 */
router.patch(
  '/:id/return',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  validateRequest(returnLoanSchema),
  controller.returnLoanItems
);

/**
 * @swagger
 * /api/inventory/loans/{id}/cancel:
 *   patch:
 *     summary: Cancel loan
 *     tags: [Loans]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Loan cancelled
 *       400:
 *         description: Cannot cancel returned/cancelled loans
 */
router.patch(
  '/:id/cancel',
  authenticate,
  authorize(PERMISSIONS.INVENTORY_UPDATE),
  validateRequest(cancelLoanSchema),
  controller.cancelLoan
);

export default router;
