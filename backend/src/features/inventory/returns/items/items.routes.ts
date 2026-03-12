/**
 * Return Items Routes
 */

import { Router, Request, Response } from 'express'
import { authenticate, asyncHandler } from '../../../../shared/middleware/index.js'
import {
  addItemHandler,
  processItemHandler,
  getItemsHandler,
  getAnalysisHandler,
  getAllItemsHandler,
} from './items.controller.js'

const router = Router()

/**
 * POST /api/inventory/returns/:returnId/items
 * Add item to return
 */
router.post(
  '/:returnId/items',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    await addItemHandler(req, res)
  })
)

/**
 * PUT /api/inventory/returns/:returnId/items/:itemId/process
 * Process return item (approve/reject/restock/scrap)
 */
router.put(
  '/:returnId/items/:itemId/process',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    await processItemHandler(req, res)
  })
)

/**
 * GET /api/inventory/returns/:returnId/items
 * Get return items by return ID
 */
router.get(
  '/:returnId/items',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    await getItemsHandler(req, res)
  })
)

/**
 * GET /api/inventory/returns/items/:itemId/analysis?days=90
 * Get return analysis for item
 */
router.get(
  '/items/:itemId/analysis',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    await getAnalysisHandler(req, res)
  })
)

/**
 * GET /api/inventory/returns/items?page=1&limit=50
 * Get all return items (paginated)
 */
router.get(
  '/items',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    await getAllItemsHandler(req, res)
  })
)

export default router
