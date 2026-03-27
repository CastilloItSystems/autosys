// backend/src/features/inventory/stock/bulk/bulk.controller.ts

import { Request, Response } from 'express'
import { StockBulkService } from './bulk.service.js'
import { ApiResponse } from '../../../../shared/utils/apiResponse.js'
import { asyncHandler } from '../../../../shared/middleware/asyncHandler.middleware.js'

const stockBulkService = new StockBulkService()

export class StockBulkController {
  /** POST /stock/bulk/import — multipart/form-data */
  import = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.id || 'system'
    const empresaId = (req.headers['x-empresa-id'] as string) || ''

    let fileContent: string
    let fileName: string
    let options: any

    if ((req as any).file) {
      const file = (req as any).file as Express.Multer.File
      fileContent = file.buffer.toString('utf-8')
      fileName = file.originalname
      try {
        options = req.body.options ? JSON.parse(req.body.options) : {}
      } catch {
        options = { updateExisting: req.body.updateExisting === 'true' }
      }
    } else {
      fileContent = req.body.fileContent
      fileName = req.body.fileName || 'import.csv'
      options = req.body.options || {}
    }

    if (!fileContent) {
      ApiResponse.badRequest(res, 'No se recibió contenido de archivo')
      return
    }

    const result = await stockBulkService.importStock(fileContent, fileName, userId, empresaId, options)
    ApiResponse.success(res, result, 'Carga de stock completada', 201)
  })

  /** POST /stock/bulk/adjust — multipart/form-data */
  adjust = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.id || 'system'
    const empresaId = (req.headers['x-empresa-id'] as string) || ''

    let fileContent: string
    let fileName: string

    if ((req as any).file) {
      const file = (req as any).file as Express.Multer.File
      fileContent = file.buffer.toString('utf-8')
      fileName = file.originalname
    } else {
      fileContent = req.body.fileContent
      fileName = req.body.fileName || 'adjust.csv'
    }

    if (!fileContent) {
      ApiResponse.badRequest(res, 'No se recibió contenido de archivo')
      return
    }

    const result = await stockBulkService.adjustStock(fileContent, fileName, userId, empresaId)
    ApiResponse.success(res, result, 'Ajuste masivo de stock completado', 201)
  })

  /** POST /stock/bulk/transfer — multipart/form-data */
  transfer = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.id || 'system'
    const empresaId = (req.headers['x-empresa-id'] as string) || ''

    let fileContent: string
    let fileName: string

    if ((req as any).file) {
      const file = (req as any).file as Express.Multer.File
      fileContent = file.buffer.toString('utf-8')
      fileName = file.originalname
    } else {
      fileContent = req.body.fileContent
      fileName = req.body.fileName || 'transfer.csv'
    }

    if (!fileContent) {
      ApiResponse.badRequest(res, 'No se recibió contenido de archivo')
      return
    }

    const result = await stockBulkService.transferStock(fileContent, fileName, userId, empresaId)
    ApiResponse.success(res, result, 'Transferencia masiva completada', 201)
  })

  /** POST /stock/bulk/export — JSON body */
  export = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.id || 'system'
    const empresaId = (req.headers['x-empresa-id'] as string) || ''

    const result = await stockBulkService.exportStock(req.body, userId, empresaId)

    let mimeType = 'text/csv'
    if (result.format === 'json') mimeType = 'application/json'
    else if (result.format === 'xlsx')
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

    res.setHeader('Content-Type', mimeType)
    res.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`)

    if (result.format === 'xlsx') {
      const buf: Buffer = Buffer.isBuffer(result.content)
        ? result.content
        : Buffer.from(result.content)
      res.setHeader('Content-Length', buf.length)
      res.end(buf)
    } else {
      res.send(result.content)
    }
  })

  /** GET /stock/bulk/operations */
  getOperations = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { page = 1, limit = 10 } = req.query
    const empresaId = (req.headers['x-empresa-id'] as string) || undefined
    const result = await stockBulkService.getOperations(Number(page), Number(limit), empresaId)
    ApiResponse.paginated(res, result.data, Number(page), Number(limit), result.total, 'Operaciones obtenidas')
  })

  /** GET /stock/bulk/operations/:operationId */
  getOperation = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { operationId } = req.params as { operationId: string }
    const operation = await stockBulkService.getOperation(operationId)
    ApiResponse.success(res, operation, 'Operación obtenida')
  })

  /** DELETE /stock/bulk/operations/:operationId */
  deleteOperation = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { operationId } = req.params as { operationId: string }
    await stockBulkService.deleteOperation(operationId)
    ApiResponse.success(res, null, 'Operación eliminada')
  })
}
