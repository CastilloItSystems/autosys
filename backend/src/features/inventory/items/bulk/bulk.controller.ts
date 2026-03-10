// backend/src/features/inventory/items/bulk/bulk.controller.ts

import { Request, Response } from 'express'
import { BulkService } from './bulk.service'
import { ApiResponse } from '../../../../shared/utils/ApiResponse'
import { asyncHandler } from '../../../../shared/middleware/asyncHandler.middleware'

const bulkService = new BulkService()

export class BulkController {
  import = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    console.log("BODY REQ:", req.body);

    const userId = (req as any).user?.id || 'system'
      const empresaId = (req.headers['x-empresa-id'] as string) || undefined
      const result = await bulkService.importItems(req.body, userId, empresaId)
    ApiResponse.success(res, result, 'Importación completada', 201)
  })

  export = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.id || 'system'
      const empresaId = (req.headers['x-empresa-id'] as string) || undefined
      const result = await bulkService.exportItems(req.body, userId, empresaId)

    let mimeType = 'text/csv'
    if (result.format === 'json') mimeType = 'application/json'
    else if (result.format === 'xlsx')
      mimeType =
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

    res.setHeader('Content-Type', mimeType)
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${result.fileName}"`
    )
    res.send(result.content)
  })

  update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.id || 'system'
      const empresaId = (req.headers['x-empresa-id'] as string) || undefined
      const result = await bulkService.bulkUpdate(req.body, userId, empresaId)
    ApiResponse.success(res, result, 'Actualización en lote completada')
  })

  delete = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.id || 'system'
      const empresaId = (req.headers['x-empresa-id'] as string) || undefined
      const result = await bulkService.bulkDelete(req.body, userId, empresaId)
    ApiResponse.success(res, result, 'Eliminación en lote completada')
  })

  getOperations = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { page = 1, limit = 10 } = req.query
      const result = await bulkService.getOperations(
        Number(page),
        Number(limit)
      )
      ApiResponse.paginated(
        res,
        result.data,
        Number(page),
        Number(limit),
        result.total,
        'Operaciones obtenidas'
      )
    }
  )

  getOperation = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { operationId } = req.params as { operationId: string }
      const operation = await bulkService.getOperation(operationId)
      ApiResponse.success(res, operation, 'Operación obtenida')
    }
  )

  deleteOperation = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { operationId } = req.params as { operationId: string }
      await bulkService.deleteOperation(operationId)
      ApiResponse.success(res, null, 'Operación eliminada')
    }
  )
}
