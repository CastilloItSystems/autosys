// backend/src/features/inventory/items/images/images.service.ts

import {
  ICreateImageInput,
  IUpdateImageInput,
  IImageFilters,
  IItemImageWithItem,
} from './images.interface'
import {
  NotFoundError,
  BadRequestError,
} from '../../../../shared/utils/ApiError'
import { PaginationHelper } from '../../../../shared/utils/pagination'
import { INVENTORY_MESSAGES } from '../../shared/constants/messages'
import { logger } from '../../../../shared/utils/logger'
import { FileUploadHelper } from '../../../../shared/utils/fileUpload'
import prisma from '../../../../services/prisma.service'

export class ImageService {
  async create(data: ICreateImageInput): Promise<IItemImageWithItem> {
    // Validar que el artículo existe
    const item = await prisma.item.findUnique({
      where: { id: data.itemId },
    })

    if (!item) {
      throw new NotFoundError(INVENTORY_MESSAGES.item.notFound)
    }

    // Si es imagen primaria, desactivar las otras imágenes primarias
    if (data.isPrimary) {
      await prisma.itemImage.updateMany({
        where: { itemId: data.itemId, isPrimary: true },
        data: { isPrimary: false },
      })
    }

    const image = await prisma.itemImage.create({
      data: {
        itemId: data.itemId,
        url: data.url,
        isPrimary: data.isPrimary ?? false,
      },
      include: {
        item: {
          select: {
            id: true,
            sku: true,
            name: true,
          },
        },
      },
    })

    logger.info('Image created', {
      imageId: image.id,
      itemId: data.itemId,
      isPrimary: data.isPrimary,
    })

    return image as IItemImageWithItem
  }

  async findAll(filters: IImageFilters, page = 1, limit = 10) {
    const {
      skip,
      take,
      page: validPage,
      limit: validLimit,
    } = PaginationHelper.validateAndParse({ page, limit })
    const where: any = {}

    if (filters.itemId) where.itemId = filters.itemId
    if (filters.isPrimary !== undefined)
      where.isPrimary = String(filters.isPrimary) === 'true'
    if (filters.order !== undefined) where.order = Number(filters.order)

    const [images, total] = await Promise.all([
      prisma.itemImage.findMany({
        where,
        include: {
          item: {
            select: {
              id: true,
              sku: true,
              name: true,
            },
          },
        },
        orderBy: { order: 'asc' },
        skip,
        take,
      }),
      prisma.itemImage.count({ where }),
    ])

    const meta = PaginationHelper.getMeta(validPage, validLimit, total)

    return {
      data: images as IItemImageWithItem[],
      ...meta,
      total,
    }
  }

  async findById(id: string): Promise<IItemImageWithItem> {
    const image = await prisma.itemImage.findUnique({
      where: { id },
      include: {
        item: {
          select: {
            id: true,
            sku: true,
            name: true,
          },
        },
      },
    })

    if (!image) {
      throw new NotFoundError(INVENTORY_MESSAGES.image.notFound)
    }

    return image as IItemImageWithItem
  }

  async findByItem(itemId: string): Promise<IItemImageWithItem[]> {
    const item = await prisma.item.findUnique({
      where: { id: itemId },
    })

    if (!item) {
      throw new NotFoundError(INVENTORY_MESSAGES.item.notFound)
    }

    const images = await prisma.itemImage.findMany({
      where: { itemId },
      include: {
        item: {
          select: {
            id: true,
            sku: true,
            name: true,
          },
        },
      },
      orderBy: { order: 'asc' },
    })

    return images as IItemImageWithItem[]
  }

  async update(
    id: string,
    data: IUpdateImageInput
  ): Promise<IItemImageWithItem> {
    const image = await prisma.itemImage.findUnique({
      where: { id },
    })

    if (!image) {
      throw new NotFoundError(INVENTORY_MESSAGES.image.notFound)
    }

    // Si se marca como primaria, desactivar las otras
    if (data.isPrimary) {
      await prisma.itemImage.updateMany({
        where: { itemId: image.itemId, id: { not: id }, isPrimary: true },
        data: { isPrimary: false },
      })
    }

    const updateData: any = {}
    if (data.url !== undefined) updateData.url = data.url
    if (data.isPrimary !== undefined) updateData.isPrimary = data.isPrimary
    if (data.order !== undefined) updateData.order = data.order

    const updated = await prisma.itemImage.update({
      where: { id },
      data: updateData,
      include: {
        item: {
          select: {
            id: true,
            sku: true,
            name: true,
          },
        },
      },
    })

    logger.info('Image updated', { imageId: id })

    return updated as IItemImageWithItem
  }

  async delete(id: string): Promise<void> {
    const image = await prisma.itemImage.findUnique({
      where: { id },
    })

    if (!image) {
      throw new NotFoundError(INVENTORY_MESSAGES.image.notFound)
    }

    await prisma.itemImage.delete({
      where: { id },
    })

    logger.info('Image deleted', { imageId: id, itemId: image.itemId })
  }

  async setPrimary(id: string): Promise<IItemImageWithItem> {
    const image = await prisma.itemImage.findUnique({
      where: { id },
    })

    if (!image) {
      throw new NotFoundError(INVENTORY_MESSAGES.image.notFound)
    }

    // Desactivar la imagen primaria anterior
    await prisma.itemImage.updateMany({
      where: { itemId: image.itemId, isPrimary: true },
      data: { isPrimary: false },
    })

    // Activar esta como primaria
    const updated = await prisma.itemImage.update({
      where: { id },
      data: { isPrimary: true },
      include: {
        item: {
          select: {
            id: true,
            sku: true,
            name: true,
          },
        },
      },
    })

    logger.info('Image set as primary', { imageId: id, itemId: image.itemId })

    return updated as IItemImageWithItem
  }

  async uploadFiles(
    itemId: string,
    files: Express.Multer.File[]
  ): Promise<IItemImageWithItem[]> {
    // Validar que el artículo existe
    const item = await prisma.item.findUnique({
      where: { id: itemId },
    })

    if (!item) {
      throw new NotFoundError(INVENTORY_MESSAGES.item.notFound)
    }

    if (!files || files.length === 0) {
      throw new BadRequestError('No files provided')
    }

    const createdImages: IItemImageWithItem[] = []

    for (const file of files) {
      // Generar URL del archivo
      const fileUrl = FileUploadHelper.getFileUrl(file.filename, 'images')

      const image = await prisma.itemImage.create({
        data: {
          itemId,
          url: fileUrl,
          isPrimary: createdImages.length === 0, // Primera imagen como primaria
        },
        include: {
          item: {
            select: {
              id: true,
              sku: true,
              name: true,
            },
          },
        },
      })

      createdImages.push(image as IItemImageWithItem)

      logger.info('Image uploaded', {
        imageId: image.id,
        itemId,
        filename: file.filename,
        originalname: file.originalname,
      })
    }

    return createdImages
  }
}
