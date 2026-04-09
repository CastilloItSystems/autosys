// backend/src/features/inventory/items/bulk/bulk.controller.ts

import { Request, Response } from 'express'
import { BulkService } from './bulk.service.js'
import { ApiResponse } from '../../../../shared/utils/apiResponse.js'
import { asyncHandler } from '../../../../shared/middleware/asyncHandler.middleware.js'

const bulkService = new BulkService()

export class BulkController {
  import = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.userId || 'system'
    const empresaId = (req.headers['x-empresa-id'] as string) || undefined

    // Support both multipart/form-data (req.file) and legacy JSON (req.body.fileContent)
    let fileContent: string
    let fileName: string
    let options: any

    if ((req as any).file) {
      // Multipart upload — decode buffer to UTF-8 string
      const file = (req as any).file as Express.Multer.File
      fileContent = file.buffer.toString('utf-8')
      fileName = file.originalname
      // Options come as form fields (JSON-stringified or individual fields)
      try {
        options = req.body.options ? JSON.parse(req.body.options) : {}
      } catch {
        options = {
          skipHeaderRow: req.body.skipHeaderRow === 'true',
          updateExisting: req.body.updateExisting === 'true',
          validateOnly: req.body.validateOnly === 'true',
        }
      }
    } else {
      // Legacy JSON body
      fileContent = req.body.fileContent
      fileName = req.body.fileName || 'import.csv'
      options = req.body.options || {}
    }

    if (!fileContent) {
      ApiResponse.badRequest(
        res,
        'No se recibió contenido de archivo. Envía el archivo como multipart/form-data (campo "file") o JSON con el campo "fileContent".'
      )
      return
    }

    const result = await bulkService.importItems(
      { fileContent, fileName, options },
      userId,
      empresaId
    )
    ApiResponse.success(res, result, 'Importación completada', 201)
  })

  export = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.userId || 'system'
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

    if (result.format === 'xlsx') {
      // Use res.end() for binary buffers to avoid Express text/JSON transformations
      const buf: Buffer = Buffer.isBuffer(result.content)
        ? result.content
        : Buffer.from(result.content)
      res.setHeader('Content-Length', buf.length)
      res.end(buf)
    } else {
      res.send(result.content)
    }
  })

  update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.userId || 'system'
    const empresaId = (req.headers['x-empresa-id'] as string) || undefined
    const result = await bulkService.bulkUpdate(req.body, userId, empresaId)
    ApiResponse.success(res, result, 'Actualización en lote completada')
  })

  delete = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.userId || 'system'
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
