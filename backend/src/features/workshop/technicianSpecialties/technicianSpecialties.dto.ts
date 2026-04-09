// backend/src/features/workshop/technicianSpecialties/technicianSpecialties.dto.ts

export interface TechnicianSpecialtyDTO {
  id: string
  code: string
  name: string
  description: string | null
  isActive: boolean
  empresaId: string
  createdAt: Date
  updatedAt: Date
}
