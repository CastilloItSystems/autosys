// backend/src/features/inventory/items/images/images.controller.ts

import { Request, Response } from 'express'
import { ImageService } from './images.service'
import { ApiResponse } from '../../../../shared/utils/ApiResponse'
import { asyncHandler } from '../../../../shared/middleware/asyncHandler.middleware'

const imageService = new ImageService()

export class ImageController {
  create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const image = await imageService.create(req.body)
    ApiResponse.success(res, image, 'Imagen creada correctamente', 201)
  })

  getAll = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { page = 1, limit = 10, ...filters } = req.query
    const result = await imageService.findAll(
      filters,
      Number(page),
      Number(limit)
    )
    ApiResponse.paginated(
      res,
      result.data,
      Number(page),
      Number(limit),
      result.total,
      'Imágenes obtenidas correctamente'
    )
  })

  getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as { id: string }
    const image = await imageService.findById(id)
    ApiResponse.success(res, image, 'Imagen obtenida correctamente')
  })

  getByItem = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { itemId } = req.params as { itemId: string }
      const images = await imageService.findByItem(itemId)
      ApiResponse.success(
        res,
        images,
        'Imágenes del artículo obtenidas correctamente'
      )
    }
  )

  update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as { id: string }
    const image = await imageService.update(id, req.body)
    ApiResponse.success(res, image, 'Imagen actualizada correctamente')
  })

  delete = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as { id: string }
    await imageService.delete(id)
    ApiResponse.success(res, null, 'Imagen eliminada correctamente')
  })

  setPrimary = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { id } = req.params as { id: string }
      const image = await imageService.setPrimary(id)
      ApiResponse.success(
        res,
        image,
        'Imagen marcada como primaria correctamente'
      )
    }
  )
}
