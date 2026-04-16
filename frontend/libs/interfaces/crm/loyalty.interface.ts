export interface LoyaltyEvent {
  id: string
  empresaId: string
  customerId: string
  type: string
  status: string
  title: string
  description?: string | null
  suggestedAction?: string | null
  dueAt?: string | null
  completedAt?: string | null
  createdBy: string
  createdAt: string
  updatedAt: string
  customer?: {
    id: string
    name: string
    code: string
  }
}

export interface CustomerSurvey {
  id: string
  empresaId: string
  customerId: string
  source: string
  score?: number | null
  feedback?: string | null
  submittedAt: string
  createdBy: string
  customer?: {
    id: string
    name: string
    code: string
  }
}
