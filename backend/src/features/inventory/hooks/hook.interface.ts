/**
 * Hook System Interfaces and Types
 */

export enum HookStage {
  BEFORE = 'BEFORE',
  AFTER = 'AFTER',
}

export enum HookType {
  // Stock hooks
  STOCK_CREATE = 'STOCK_CREATE',
  STOCK_UPDATE = 'STOCK_UPDATE',
  STOCK_RESERVE = 'STOCK_RESERVE',
  STOCK_UNRESERVE = 'STOCK_UNRESERVE',
  STOCK_DEDUCT = 'STOCK_DEDUCT',

  // Adjustment hooks
  ADJUSTMENT_APPLY = 'ADJUSTMENT_APPLY',
  ADJUSTMENT_APPROVE = 'ADJUSTMENT_APPROVE',
  ADJUSTMENT_REJECT = 'ADJUSTMENT_REJECT',

  // CycleCount hooks
  CYCLE_COUNT_APPLY = 'CYCLE_COUNT_APPLY',
  CYCLE_COUNT_COMPLETE = 'CYCLE_COUNT_COMPLETE',

  // Item hooks
  ITEM_CREATE = 'ITEM_CREATE',
  ITEM_UPDATE = 'ITEM_UPDATE',
  ITEM_DELETE = 'ITEM_DELETE',

  // Reconciliation hooks
  RECONCILIATION_APPLY = 'RECONCILIATION_APPLY',

  // Loan hooks
  LOAN_CREATE = 'LOAN_CREATE',
  LOAN_APPROVE = 'LOAN_APPROVE',
  LOAN_RETURN = 'LOAN_RETURN',

  // External repair hooks
  EXTERNAL_REPAIR_SEND = 'EXTERNAL_REPAIR_SEND',
  EXTERNAL_REPAIR_RECEIVE = 'EXTERNAL_REPAIR_RECEIVE',

  // Return hooks
  RETURN_PROCESS = 'RETURN_PROCESS',

  // Transfer hooks
  TRANSFER_SEND = 'TRANSFER_SEND',
  TRANSFER_RECEIVE = 'TRANSFER_RECEIVE',

  // Movement hooks
  MOVEMENT_CREATE = 'MOVEMENT_CREATE',
}

export interface IHookContext {
  hookType: HookType
  stage: HookStage
  userId?: string
  warehouseId?: string
  entityId?: string
  entityType?: string
  data?: Record<string, any>
  errors?: string[]
  result?: any
  timestamp: Date
}

export interface IHook {
  id: string
  hookType: HookType
  stage: HookStage
  handler: (context: IHookContext) => Promise<void> | void
  priority?: number // For execution order (higher = earlier)
  enabled?: boolean
}

export interface IHookHandler {
  (context: IHookContext): Promise<void> | void
}
