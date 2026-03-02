/**
 * Inventory Repository Interface
 */

export interface IStockRecord {
  id: string
  itemId: string
  warehouseId: string
  quantityReal: number
  quantityAvailable: number
  quantityReserved: number
  minStock?: number
  maxStock?: number
  lastMovementDate?: Date
}

export interface IMovementRecord {
  id: string
  type: string
  itemId: string
  quantity: number
  fromWarehouseId?: string
  toWarehouseId?: string
  referenceId?: string
  notes?: string
  createdAt: Date
  updatedAt?: Date
}

export interface IReservationRecord {
  id: string
  itemId: string
  quantity: number
  referenceId: string
  status: 'ACTIVE' | 'FULFILLED' | 'RELEASED' | 'EXPIRED'
  createdAt: Date
  expiresAt?: Date
}

export interface IBatchRecord {
  id: string
  itemId: string
  batchNumber: string
  quantity: number
  expiryDate?: Date
  cost?: number
  warehouseId: string
  status: 'ACTIVE' | 'EXPIRED' | 'USED' | 'DAMAGED'
  createdAt: Date
}

export interface ISerialNumberRecord {
  id: string
  itemId: string
  serialNumber: string
  status: 'ACTIVE' | 'SOLD' | 'RETURNED' | 'DAMAGED' | 'LOST'
  location?: string
  createdAt: Date
}

export interface IInventoryRepository {
  /**
   * Get stock for item in warehouse
   */
  getStock(itemId: string, warehouseId: string): Promise<IStockRecord | null>

  /**
   * Get all stock for item
   */
  getStockByItem(itemId: string): Promise<IStockRecord[]>

  /**
   * Get all stock in warehouse
   */
  getStockByWarehouse(warehouseId: string): Promise<IStockRecord[]>

  /**
   * Update stock quantities
   */
  updateStock(
    itemId: string,
    warehouseId: string,
    changes: Partial<IStockRecord>
  ): Promise<IStockRecord>

  /**
   * Create movement record
   */
  createMovement(movement: Partial<IMovementRecord>): Promise<IMovementRecord>

  /**
   * Get movements by item
   */
  getMovementsByItem(itemId: string, limit?: number): Promise<IMovementRecord[]>

  /**
   * Get movements by reference
   */
  getMovementsByReference(referenceId: string): Promise<IMovementRecord[]>

  /**
   * Create reservation
   */
  createReservation(
    itemId: string,
    quantity: number,
    referenceId: string,
    expiresAt?: Date
  ): Promise<IReservationRecord>

  /**
   * Get active reservations for item
   */
  getReservations(itemId: string): Promise<IReservationRecord[]>

  /**
   * Update reservation status
   */
  updateReservationStatus(
    reservationId: string,
    status: string
  ): Promise<IReservationRecord>

  /**
   * Get batch by number
   */
  getBatchByNumber(batchNumber: string): Promise<IBatchRecord | null>

  /**
   * Get batches for item
   */
  getBatchesByItem(itemId: string): Promise<IBatchRecord[]>

  /**
   * Update batch status
   */
  updateBatchStatus(batchId: string, status: string): Promise<IBatchRecord>

  /**
   * Get serial number details
   */
  getSerialNumber(serialNumber: string): Promise<ISerialNumberRecord | null>

  /**
   * Get serials for item
   */
  getSerialsByItem(itemId: string): Promise<ISerialNumberRecord[]>

  /**
   * Update serial status
   */
  updateSerialStatus(
    serialId: string,
    status: string
  ): Promise<ISerialNumberRecord>

  /**
   * Transaction wrapper
   */
  transaction<T>(fn: () => Promise<T>): Promise<T>
}
