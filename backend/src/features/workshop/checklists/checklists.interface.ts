// backend/src/features/workshop/checklists/checklists.interface.ts
import {
  ChecklistCategory,
  ChecklistItemType,
} from '../../../generated/prisma/client.js'

export { ChecklistCategory, ChecklistItemType }

export interface IChecklistItem {
  id: string
  checklistTemplateId: string
  code: string
  name: string
  description?: string | null
  responseType: ChecklistItemType
  isRequired: boolean
  order: number
  options?: any
  isActive: boolean
}

export interface IChecklistTemplate {
  id: string
  code: string
  name: string
  description?: string | null
  category: ChecklistCategory
  isActive: boolean
  items?: IChecklistItem[]
  empresaId: string
  createdAt: Date
  updatedAt: Date
}

export interface IChecklistTemplateWithStats extends IChecklistTemplate {
  _count?: {
    receptions: number
    qualityChecks: number
  }
}

export interface ICreateChecklistTemplateInput {
  code: string
  name: string
  description?: string
  category: ChecklistCategory
  items?: {
    code: string
    name: string
    description?: string
    responseType?: ChecklistItemType
    isRequired?: boolean
    order?: number
    options?: any
  }[]
}

export interface IUpdateChecklistTemplateInput {
  code?: string
  name?: string
  description?: string | null
  category?: ChecklistCategory
  isActive?: boolean
  items?: {
    id?: string
    code?: string
    name?: string
    description?: string | null
    responseType?: ChecklistItemType
    isRequired?: boolean
    order?: number
    options?: any
    isActive?: boolean
  }[]
}

export interface IChecklistFilters {
  search?: string
  isActive?: boolean
  category?: ChecklistCategory
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface IChecklistListResult {
  checklists: IChecklistTemplateWithStats[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export const CHECKLIST_CATEGORY_LABELS: Record<ChecklistCategory, string> = {
  RECEPTION: 'Recepción',
  DIAGNOSIS: 'Diagnóstico',
  QUALITY_CONTROL: 'Control de Calidad',
}
