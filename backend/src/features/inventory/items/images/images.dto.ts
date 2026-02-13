// backend/src/features/inventory/items/images/images.dto.ts

import {
  ICreateImageInput,
  IUpdateImageInput,
  IItemImageWithItem,
} from './images.interface'

export class CreateImageDTO implements ICreateImageInput {
  itemId: string
  url: string
  isPrimary?: boolean

  constructor(data: ICreateImageInput) {
    this.itemId = data.itemId
    this.url = data.url
    this.isPrimary = data.isPrimary ?? false
  }
}

export class UpdateImageDTO implements IUpdateImageInput {
  url?: string
  isPrimary?: boolean
  order?: number

  constructor(data: IUpdateImageInput) {
    if (data.url !== undefined) this.url = data.url
    if (data.isPrimary !== undefined) this.isPrimary = data.isPrimary
    if (data.order !== undefined) this.order = data.order
  }
}

export class ImageResponseDTO {
  id: string
  itemId: string
  url: string
  isPrimary: boolean
  order: number
  createdAt: Date

  constructor(data: IItemImageWithItem) {
    this.id = data.id
    this.itemId = data.itemId
    this.url = data.url
    this.isPrimary = data.isPrimary
    this.order = data.order
    this.createdAt = data.createdAt
  }
}
