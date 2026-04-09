// backend/src/features/workshop/checklists/checklists.dto.ts
import {
  ChecklistCategory,
  ChecklistItemType,
  IChecklistTemplateWithStats,
  CHECKLIST_CATEGORY_LABELS,
} from './checklists.interface.js'

export class CreateChecklistTemplateDTO {
  code: string
  name: string
  description?: string
  category: ChecklistCategory
  items: Array<{
    code: string
    name: string
    description?: string
    responseType?: ChecklistItemType
    isRequired?: boolean
    order?: number
    options?: any
  }>

  constructor(data: any) {
    this.code = data.code?.trim()?.toUpperCase()
    this.name = data.name?.trim()
    this.description = data.description?.trim()
    this.category = data.category
    this.items = Array.isArray(data.items)
      ? data.items.map((i: any) => ({
          code: i.code?.trim()?.toUpperCase(),
          name: i.name?.trim(),
          description: i.description?.trim(),
          responseType: i.responseType || 'BOOLEAN',
          isRequired: Boolean(i.isRequired),
          order: Number(i.order) || 0,
          options: i.options || null,
        }))
      : []
  }
}

export class UpdateChecklistTemplateDTO {
  code?: string
  name?: string
  description?: string | null
  category?: ChecklistCategory
  isActive?: boolean
  items?: Array<{
    id?: string
    code?: string
    name?: string
    description?: string | null
    responseType?: ChecklistItemType
    isRequired?: boolean
    order?: number
    options?: any
    isActive?: boolean
  }>

  constructor(data: any) {
    if (data.code !== undefined) this.code = data.code.trim().toUpperCase()
    if (data.name !== undefined) this.name = data.name.trim()
    if (data.description !== undefined)
      this.description = data.description?.trim() || null
    if (data.category !== undefined) this.category = data.category
    if (data.isActive !== undefined) this.isActive = Boolean(data.isActive)

    if (Array.isArray(data.items)) {
      this.items = data.items.map((i: any) => {
        const item: any = {}
        if (i.id) item.id = i.id
        if (i.code) item.code = i.code.trim().toUpperCase()
        if (i.name) item.name = i.name.trim()
        if (i.description !== undefined)
          item.description = i.description?.trim() || null
        if (i.responseType) item.responseType = i.responseType
        if (i.isRequired !== undefined) item.isRequired = Boolean(i.isRequired)
        if (i.order !== undefined) item.order = Number(i.order)
        if (i.options !== undefined) item.options = i.options
        if (i.isActive !== undefined) item.isActive = Boolean(i.isActive)
        return item
      })
    }
  }
}

export class ChecklistTemplateResponseDTO {
  id: string
  code: string
  name: string
  description: string | null
  category: ChecklistCategory
  categoryLabel: string
  isActive: boolean
  items: any[]
  createdAt: Date
  updatedAt: Date
  stats?: {
    receptionsCount: number
    qualityChecksCount: number
  }

  constructor(data: IChecklistTemplateWithStats) {
    this.id = data.id
    this.code = data.code
    this.name = data.name
    this.description = data.description ?? null
    this.category = data.category
    this.categoryLabel = CHECKLIST_CATEGORY_LABELS[data.category]
    this.isActive = data.isActive
    this.items = data.items ?? []
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt

    if (data._count) {
      this.stats = {
        receptionsCount: data._count.receptions || 0,
        qualityChecksCount: data._count.qualityChecks || 0,
      }
    }
  }
}
