// backend/src/shared/utils/fileUpload.ts

import multer, { FileFilterCallback } from 'multer'
import path from 'path'
import fs from 'fs'
import { Request } from 'express'
import { ApiError } from './apiError.js'

export class FileUploadHelper {
  static readonly UPLOAD_DIR = './public/uploads'
  static readonly MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

  static readonly ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ]

  static readonly ALLOWED_DOCUMENT_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ]

  static ensureUploadDir(subDir?: string): string {
    const dir = subDir ? path.join(this.UPLOAD_DIR, subDir) : this.UPLOAD_DIR

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    return dir
  }

  static generateFilename(originalname: string): string {
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 1000)
    const ext = path.extname(originalname)
    const nameWithoutExt = path.basename(originalname, ext)
    const sanitized = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_')

    return `${sanitized}_${timestamp}_${random}${ext}`
  }

  static createMulterStorage(subDir: string = 'temp') {
    return multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadDir = this.ensureUploadDir(subDir)
        cb(null, uploadDir)
      },
      filename: (req, file, cb) => {
        const filename = this.generateFilename(file.originalname)
        cb(null, filename)
      },
    })
  }

  static createMemoryUploader(
    fieldName: string = 'image',
    maxSize: number = this.MAX_FILE_SIZE
  ) {
    return multer({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: maxSize,
      },
      fileFilter: this.createImageFilter(),
    }).single(fieldName)
  }

  static createMemoryArrayUploader(
    fieldName: string = 'image',
    maxCount: number = 10,
    maxSize: number = this.MAX_FILE_SIZE
  ) {
    return multer({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: maxSize,
      },
      fileFilter: this.createImageFilter(),
    }).array(fieldName, maxCount)
  }

  static createImageFilter() {
    return (
      req: Request,
      file: Express.Multer.File,
      cb: FileFilterCallback
    ) => {
      if (this.ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
        cb(null, true)
      } else {
        cb(
          new ApiError(
            `Tipo de archivo no permitido. Solo se permiten: ${this.ALLOWED_IMAGE_TYPES.join(', ')}`,
            400
          )
        )
      }
    }
  }

  static createDocumentFilter() {
    return (
      req: Request,
      file: Express.Multer.File,
      cb: FileFilterCallback
    ) => {
      if (this.ALLOWED_DOCUMENT_TYPES.includes(file.mimetype)) {
        cb(null, true)
      } else {
        cb(
          new ApiError(
            `Tipo de archivo no permitido. Solo se permiten: ${this.ALLOWED_DOCUMENT_TYPES.join(', ')}`,
            400
          )
        )
      }
    }
  }

  static createImageUploader(
    fieldName: string = 'image',
    maxCount: number = 1
  ) {
    return multer({
      storage: this.createMulterStorage('images'),
      fileFilter: this.createImageFilter(),
      limits: {
        fileSize: this.MAX_FILE_SIZE,
      },
    }).array(fieldName, maxCount)
  }

  static createDocumentUploader(fieldName: string = 'document') {
    return multer({
      storage: this.createMulterStorage('documents'),
      fileFilter: this.createDocumentFilter(),
      limits: {
        fileSize: this.MAX_FILE_SIZE,
      },
    }).single(fieldName)
  }

  static deleteFile(filePath: string): void {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
  }

  static getFileUrl(filename: string, subDir: string = ''): string {
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000'
    const fullPath = subDir
      ? `uploads/${subDir}/${filename}`
      : `uploads/${filename}`
    return `${baseUrl}/${fullPath}`
  }
}
