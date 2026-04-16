export interface ILoyaltyEvent {
  id: string
  empresaId: string
  customerId: string
  type: string
  status: string
  title: string
  description?: string | null
  suggestedAction?: string | null
  dueAt?: Date | null
  completedAt?: Date | null
  createdBy: string
  createdAt: Date
  updatedAt: Date
}
