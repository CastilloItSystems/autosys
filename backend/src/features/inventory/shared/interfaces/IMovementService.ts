/**
 * Movement Service Interface
 */

export interface IMovementRequest {
  type: string
  itemId: string
  quantity: number
  fromWarehouseId?: string
  toWarehouseId?: string
  referenceId?: string
  notes?: string
}

export interface IMovementResponse {
  id: string
  type: string
  itemId: string
  quantity: number
  itemSku: string
  itemName: string
  fromWarehouse?: string
  toWarehouse?: string
  referenceId?: string
  notes?: string
  createdAt: Date
  createdBy?: string
}

export interface ITransferRequest extends IMovementRequest {
  type: 'TRANSFER_OUT' | 'TRANSFER_IN'
  fromWarehouseId: string
  toWarehouseId: string
}

export interface IReturnRequest extends IMovementRequest {
  type: 'RETURN_IN' | 'RETURN_OUT'
  reason: string
  referenceId: string
}

export interface IAdjustmentRequest extends IMovementRequest {
  type: 'ADJUSTMENT_IN' | 'ADJUSTMENT_OUT'
  warehouseId: string
  reason: string
}

export interface IMovementValidation {
  isValid: boolean
  errors?: string[]
  warnings?: string[]
}

export interface IMovementService {
  /**
   * Create a movement
   */
  createMovement(request: IMovementRequest): Promise<IMovementResponse>

  /**
   * Create transfer between warehouses
   */
  createTransfer(request: ITransferRequest): Promise<IMovementResponse>

  /**
   * Create return (inbound or outbound)
   */
  createReturn(request: IReturnRequest): Promise<IMovementResponse>

  /**
   * Create stock adjustment
   */
  createAdjustment(request: IAdjustmentRequest): Promise<IMovementResponse>

  /**
   * Get movement by ID
   */
  getMovement(movementId: string): Promise<IMovementResponse | null>

  /**
   * Get movements for item
   */
  getMovementsByItem(
    itemId: string,
    limit?: number
  ): Promise<IMovementResponse[]>

  /**
   * Get movements for warehouse
   */
  getMovementsByWarehouse(
    warehouseId: string,
    limit?: number
  ): Promise<IMovementResponse[]>

  /**
   * Get movements by type
   */
  getMovementsByType(
    type: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<IMovementResponse[]>

  /**
   * Validate movement request
   */
  validateMovement(request: IMovementRequest): Promise<IMovementValidation>

  /**
   * Execute pre-movement hooks
   */
  executePreMovementHooks(request: IMovementRequest): Promise<void>

  /**
   * Execute post-movement hooks
   */
  executePostMovementHooks(movement: IMovementResponse): Promise<void>

  /**
   * Get movement history (paginated)
   */
  getMovementHistory(
    page: number,
    limit: number,
    filters?: {
      itemId?: string
      warehouseId?: string
      type?: string
      startDate?: Date
      endDate?: Date
    }
  ): Promise<{ data: IMovementResponse[]; total: number }>

  /**
   * Reverse a movement (create inverse)
   */
  reverseMovement(
    movementId: string,
    reason: string
  ): Promise<IMovementResponse>

  /**
   * Get movement statistics
   */
  getMovementStatistics(
    itemId: string,
    period: 'day' | 'week' | 'month' | 'quarter' | 'year'
  ): Promise<{
    period: string
    inbound: number
    outbound: number
    net: number
    avgPerDay?: number
  }>
}
