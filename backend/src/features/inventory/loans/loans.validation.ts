/**
 * Loans Validation Schemas - Joi
 */

import Joi from 'joi';

export const createLoanSchema = Joi.object({
  borrowerName: Joi.string().max(255).required(),
  borrowerId: Joi.string().uuid().optional(),
  warehouseId: Joi.string().uuid().required(),
  dueDate: Joi.date().iso().min('now').required(),
  purpose: Joi.string().max(255).optional(),
  notes: Joi.string().optional(),
  items: Joi.array()
    .items(
      Joi.object({
        itemId: Joi.string().uuid().required(),
        quantityLoaned: Joi.number().integer().positive().required(),
        notes: Joi.string().optional(),
      })
    )
    .min(1)
    .required(),
});

export const updateLoanSchema = Joi.object({
  borrowerName: Joi.string().max(255).optional(),
  dueDate: Joi.date().iso().optional(),
  purpose: Joi.string().max(255).optional(),
  notes: Joi.string().optional(),
});

export const approveLoanSchema = Joi.object({
  approvalNotes: Joi.string().optional(),
});

export const returnLoanSchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        itemId: Joi.string().uuid().required(),
        quantityReturned: Joi.number().integer().min(0).required(),
      })
    )
    .min(1)
    .required(),
  returnNotes: Joi.string().optional(),
});

export const cancelLoanSchema = Joi.object({
  reason: Joi.string().max(255).optional(),
});

export const loanFiltersSchema = Joi.object({
  status: Joi.string()
    .valid('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'ACTIVE', 'RETURNED', 'OVERDUE', 'CANCELLED')
    .optional(),
  warehouseId: Joi.string().uuid().optional(),
  borrowerId: Joi.string().uuid().optional(),
  borrowerName: Joi.string().optional(),
  createdBy: Joi.string().optional(),
  fromDate: Joi.date().iso().optional(),
  toDate: Joi.date().iso().optional(),
  overdueDaysOnly: Joi.boolean().optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  sortBy: Joi.string().optional(),
  sortOrder: Joi.string().valid('asc', 'desc').optional(),
});
