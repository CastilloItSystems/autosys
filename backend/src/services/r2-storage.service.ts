// backend/src/services/r2-storage.service.ts
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { CLOUDFLARE_R2 } from '../config/constants.js'
import { logger } from '../shared/utils/logger.js'
import crypto from 'crypto'
import path from 'path'

class R2StorageService {
  private client: S3Client

  constructor() {
    this.client = new S3Client({
      region: 'auto',
      endpoint: CLOUDFLARE_R2.ENDPOINT,
      credentials: {
        accessKeyId: CLOUDFLARE_R2.ACCESS_KEY_ID,
        secretAccessKey: CLOUDFLARE_R2.SECRET_ACCESS_KEY,
      },
    })
  }

  /**
   * Sube un archivo a Cloudflare R2
   * @param buffer Contenido del archivo
   * @param originalName Nombre original del archivo
   * @param contentType Tipo MIME
   * @param folder Carpeta de destino (opcional)
   * @returns URL pública del archivo
   */
  async uploadFile(
    buffer: Buffer,
    originalName: string,
    contentType: string,
    folder: string = 'general'
  ): Promise<string> {
    try {
      const extension = path.extname(originalName)
      const uniqueName = `${crypto.randomBytes(16).toString('hex')}${extension}`
      const key = `${folder}/${uniqueName}`

      const parallelUploads3 = new Upload({
        client: this.client,
        params: {
          Bucket: CLOUDFLARE_R2.BUCKET_NAME,
          Key: key,
          Body: buffer,
          ContentType: contentType,
        },
      })

      await parallelUploads3.done()

      return this.getPublicUrl(key)
    } catch (error) {
      logger.error('Error uploading file to R2:', error)
      throw new Error('Failed to upload file to storage')
    }
  }

  /**
   * Elimina un archivo de R2
   * @param fileUrl URL completa del archivo o Key del objeto
   */
  async deleteFile(fileUrl: string): Promise<void> {
    try {
      let key = fileUrl

      // Si es una URL completa, extraer la key
      if (fileUrl.startsWith('http')) {
        const url = new URL(fileUrl)
        key = url.pathname.startsWith('/')
          ? url.pathname.substring(1)
          : url.pathname
      }

      const command = new DeleteObjectCommand({
        Bucket: CLOUDFLARE_R2.BUCKET_NAME,
        Key: key,
      })

      await this.client.send(command)
    } catch (error) {
      logger.error('Error deleting file from R2:', error)
      // No lanzamos error para evitar romper flujos si el archivo ya no existe
    }
  }

  /**
   * Genera la URL pública del archivo
   * @param key Key del objeto en R2
   */
  private getPublicUrl(key: string): string {
    const baseUrl = CLOUDFLARE_R2.PUBLIC_URL.endsWith('/')
      ? CLOUDFLARE_R2.PUBLIC_URL.slice(0, -1)
      : CLOUDFLARE_R2.PUBLIC_URL

    return `${baseUrl}/${key}`
  }
}

export default new R2StorageService()
