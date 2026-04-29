export type QuoteStatus =
  | 'DRAFT'
  | 'ISSUED'
  | 'SENT'
  | 'NEGOTIATING'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'CONVERTED'

export type QuoteType = 'VEHICLE' | 'PARTS' | 'SERVICE' | 'CORPORATE'

export interface QuoteItem {
  id?: string
  description: string
  quantity: number
  unitPrice: number
  discountPct: number
  taxPct: number
  total: number
  itemId?: string | null
  notes?: string | null
}

export interface Quote {
  id: string
  quoteNumber: string
  version: number
  parentId?: string | null
  type: QuoteType | string
  status: QuoteStatus | string
  customerId: string
  customer?: { id: string; name: string; code: string } | null
  leadId?: string | null
  lead?: { id: string; title: string; channel: string } | null
  title: string
  description?: string | null
  subtotal: number
  discountPct: number
  discountAmt: number
  taxPct: number
  taxAmt: number
  total: number
  currency: string
  issuedAt?: string | null
  validUntil?: string | null
  paymentTerms?: string | null
  deliveryTerms?: string | null
  notes?: string | null
  convertedAt?: string | null
  convertedTo?: string | null
  convertedRefId?: string | null
  assignedTo?: string | null
  createdBy: string
  empresaId: string
  items: QuoteItem[]
  versions?: Pick<Quote, 'id' | 'quoteNumber' | 'version' | 'status' | 'createdAt'>[]
  createdAt: string
  updatedAt: string
}

export interface QuoteListResponse {
  data: Quote[]
  meta: { page: number; limit: number; total: number; totalPages: number }
}

// ── UI config ──────────────────────────────────────────────────────────────

export const QUOTE_STATUS_CONFIG: Record<
  string,
  { label: string; severity: 'secondary' | 'info' | 'success' | 'warning' | 'danger'; icon: string }
> = {
  DRAFT:       { label: 'Borrador',   severity: 'secondary', icon: 'pi pi-file-edit' },
  ISSUED:      { label: 'Emitida',    severity: 'info',      icon: 'pi pi-file' },
  SENT:        { label: 'Enviada',    severity: 'info',      icon: 'pi pi-send' },
  NEGOTIATING: { label: 'Negociando', severity: 'warning',   icon: 'pi pi-sync' },
  APPROVED:    { label: 'Aprobada',   severity: 'success',   icon: 'pi pi-check-circle' },
  REJECTED:    { label: 'Rechazada',  severity: 'danger',    icon: 'pi pi-times-circle' },
  EXPIRED:     { label: 'Vencida',    severity: 'danger',    icon: 'pi pi-clock' },
  CONVERTED:   { label: 'Convertida', severity: 'success',   icon: 'pi pi-arrow-right-arrow-left' },
}

export const QUOTE_TYPE_CONFIG: Record<string, { label: string; icon: string }> = {
  VEHICLE:   { label: 'Vehículo',    icon: 'pi pi-car' },
  PARTS:     { label: 'Repuestos',   icon: 'pi pi-cog' },
  SERVICE:   { label: 'Servicio',    icon: 'pi pi-wrench' },
  CORPORATE: { label: 'Corporativo', icon: 'pi pi-building' },
}

export const QUOTE_TYPE_OPTIONS = Object.entries(QUOTE_TYPE_CONFIG).map(([value, cfg]) => ({
  label: cfg.label,
  value,
}))

export const QUOTE_STATUS_OPTIONS = Object.entries(QUOTE_STATUS_CONFIG).map(([value, cfg]) => ({
  label: cfg.label,
  value,
}))
