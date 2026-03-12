/**
 * Shared Interfaces Index
 */

export type {
  IInventoryRepository,
  IStockRecord,
  IMovementRecord,
  IReservationRecord,
  IBatchRecord,
  ISerialNumberRecord,
} from './IInventoryRepository.js'

export type {
  IMovementService,
  IMovementRequest,
  IMovementResponse,
  ITransferRequest,
  IReturnRequest,
  IAdjustmentRequest,
  IMovementValidation,
} from './IMovementService.js'

export type {
  IStockService,
  IStockStatus,
  IStockAdjustment,
  IReservationRequest,
  IReservationResponse,
  IStockReconciliation,
  IReorderPoint,
  IStockLevel,
} from './IStockService.js'
