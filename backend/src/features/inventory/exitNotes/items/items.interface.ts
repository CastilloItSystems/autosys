/**
 * Exit Notes Items Sub-Module Interfaces
 * Handles picking, batch tracking, and serial number assignment
 */

/**
 * Item Picking Status
 * Tracks the state of each item in the exit note picking process
 */
export enum ItemPickingStatus {
  NOT_STARTED = 'NOT_STARTED',
  PICKING = 'PICKING',
  PICKED = 'PICKED',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

/**
 * Exit Note Item with Picking Details
 */
export interface IExitNoteItemDetails {
  id: string
  exitNoteId: string
  itemId: string
  quantity: number
  quantityPicked: number
  quantityVerified: number
  pickedFromLocation?: string
  batchId?: string
  serialNumberId?: string
  pickingStatus: ItemPickingStatus
  notes?: string
  pickedAt?: Date
  pickedBy?: string
  verifiedAt?: Date
  verifiedBy?: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Item Picking Information
 */
export interface IItemPickingInfo {
  itemId: string
  batchId?: string
  serialNumberId?: string
  location: string
  quantity: number
  notes?: string
}

/**
 * Item Verification Result
 */
export interface IItemVerificationResult {
  itemId: string
  quantityExpected: number
  quantityFound: number
  discrepancy: number
  verified: boolean
  notes?: string
}

/**
 * Batch Assignment for Items
 */
export interface IBatchAssignment {
  itemId: string
  batchId: string
  quantity: number
  expiryDate?: Date
}

/**
 * Serial Number Assignment for Items
 */
export interface ISerialAssignment {
  itemId: string
  serialNumberId: string
  serialNumber: string
}

/**
 * Summary of Items in Exit Note
 */
export interface IExitNoteItemsSummary {
  exitNoteId: string
  totalItems: number
  totalQuantity: number
  itemsNotPicked: number
  itemsPicked: number
  itemsVerified: number
  itemsRejected: number
  completionPercentage: number
  pickingStatus:
    | 'NOT_STARTED'
    | 'IN_PROGRESS'
    | 'COMPLETE'
    | 'COMPLETE_WITH_ISSUES'
}
