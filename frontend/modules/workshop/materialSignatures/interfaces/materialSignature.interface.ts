// libs/interfaces/workshop/materialSignature.interface.ts

export type SignerRole =
  | 'STOREKEEPER'
  | 'SHOP_FOREMAN'
  | 'ADVISOR'
  | 'TECHNICIAN'

export interface MaterialSignature {
  id: string
  materialId: string
  signerRole: SignerRole
  signerId: string
  signerName: string | null
  signatureUrl: string | null
  signedAt: string
  notes: string | null
  empresaId: string
  createdAt: string
}

export interface CreateMaterialSignatureInput {
  materialId: string
  signerRole: SignerRole
  signerId: string
  signerName?: string
  signatureUrl?: string
  notes?: string
}

export interface SignatureStatus {
  complete: boolean
  missing: SignerRole[][]
}
