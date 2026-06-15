// backend/src/features/workshop/materialSignatures/materialSignatures.interface.ts

export type SignerRole =
  | 'STOREKEEPER'
  | 'SHOP_FOREMAN'
  | 'ADVISOR'
  | 'TECHNICIAN'

export interface ICreateMaterialSignature {
  materialId: string
  signerRole: SignerRole
  signerId: string
  signerName?: string | null
  signatureUrl?: string | null
  notes?: string | null
}

export interface IMaterialSignature extends ICreateMaterialSignature {
  id: string
  signedAt: Date
  empresaId: string
  createdAt: Date
}
