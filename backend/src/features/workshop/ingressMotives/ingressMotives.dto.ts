// backend/src/features/workshop/ingressMotives/ingressMotives.dto.ts

export interface IngressMotiveDTO {
  id: string
  code: string
  name: string
  description: string | null
  isActive: boolean
  empresaId: string
  createdAt: Date
  updatedAt: Date
}
