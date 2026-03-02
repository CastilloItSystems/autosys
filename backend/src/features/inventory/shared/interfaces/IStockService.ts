/**
 * Stock Service Interface
 */

export interface IStockStatus {
  itemId: string
  warehouseId?: string
  quantityReal: number
  quantityAvailable: number
  quantityReserved: number
  minStock?: number
  maxStock?: number
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'
  isLow: boolean
  isHigh: boolean
}

export interface IStockAdjustment {
  itemId: string
  warehouseId: string
  adjustment: number // Can be positive or negative
  reason: string
  notes?: string
}

export interface IReservationRequest {
  itemId: string
  quantity: number
  referenceId: string
  reason?: string
  expiresAt?: Date
}

export interface IReservationResponse {
  id: string
  itemId: string
  quantity: number
  referenceId: string
  status: 'ACTIVE' | 'FULFILLED' | 'RELEASED' | 'EXPIRED'
  createdAt: Date
  expiresAt?: Date
}

export interface IStockReconciliation {
  itemId: string
  warehouseId: string
  systemQuantity: number
  countedQuantity: number
  variance: number
  variancePercentage: number
  notes?: string
}

export interface IReorderPoint {
  itemId: string
  avgDailyDemand: number
  leadTimeDays: number
  safetyStockDays: number
  reorderPoint: number
  reorderQuantity: number
}

export interface IStockLevel {
  itemId: string
  itemSku: string
  itemName: string
  currentStock: number
  minStock: number
  maxStock: number
  reorderPoint: number
  recommendation: 'ORDER' | 'MONITOR' | 'REDUCE' | 'OK'
}

export interface IStockService {
  /**
   * Get stock status for item
   */
  getStockStatus(itemId: string, warehouseId?: string): Promise<IStockStatus[]>

  /**
   * Check if item is in stock
   */
  isInStock(
    itemId: string,
    quantity: number,
    warehouseId?: string
  ): Promise<boolean>

  /**
   * Check if item is available for reservation
   */
  canReserve(itemId: string, quantity: number): Promise<boolean>

  /**
   * Get available quantity for item
   */
  getAvailableQuantity(itemId: string): Promise<number>

  /**
   * Get reserved quantity for item
   */
  getReservedQuantity(itemId: string): Promise<number>

  /**
   * Adjust stock
   */
  adjustStock(adjustment: IStockAdjustment): Promise<IStockStatus>

  /**
   * Create reservation
   */
  createReservation(request: IReservationRequest): Promise<IReservationResponse>

  /**
   * Fulfill reservation
   */
  fulfillReservation(reservationId: string): Promise<void>

  /**
   * Release reservation
   */
  releaseReservation(reservationId: string): Promise<void>

  /**
   * Get active reservations for item
   */
  getReservations(itemId: string): Promise<IReservationResponse[]>

  /**
   * Reconcile stock (physical count vs system)
   */
  reconcileStock(
    reconciliation: IStockReconciliation
  ): Promise<IStockReconciliation>

  /**
   * Calculate reorder point
   */
  calculateReorderPoint(request: IReorderPoint): Promise<IReorderPoint>

  /**
   * Get items needing order
   */
  getItemsNeedingOrder(warehouseId?: string): Promise<IStockLevel[]>

  /**
   * Get low stock items
   */
  getLowStockItems(warehouseId?: string): Promise<IStockLevel[]>

  /**
   * Get overstock items
   */
  getOverstockItems(warehouseId?: string): Promise<IStockLevel[]>

  /**
   * Get all stock (paginated)
   */
  getAllStock(
    page: number,
    limit: number,
    filters?: {
      itemId?: string
      warehouseId?: string
      status?: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'
    }
  ): Promise<{ data: IStockLevel[]; total: number }>

  /**
   * Update min/max for item
   */
  updateMinMax(
    itemId: string,
    warehouseId: string,
    minStock: number,
    maxStock: number
  ): Promise<void>

  /**
   * Get stock value
   */
  getStockValue(itemId?: string, warehouseId?: string): Promise<number>

  /**
   * Get stock statistics
   */
  getStockStatistics(): Promise<{
    totalItems: number
    totalWarehouses: number
    totalValue: number
    inStock: number
    lowStock: number
    outOfStock: number
  }>

  /**
   * Check threshold violations
   */
  checkThresholds(itemId: string): Promise<{
    isLow: boolean
    isHigh: boolean
    isExpiring?: boolean
  }>
}
