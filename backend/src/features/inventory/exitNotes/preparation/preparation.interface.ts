/**
 * Exit Notes Preparation Sub-Module Interfaces
 * Handles picking workflow and item preparation before delivery
 */

/**
 * Preparation Status
 * Tracks the state of preparation process
 */
export enum PreparationStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  PAUSED = 'PAUSED',
  COMPLETE = 'COMPLETE',
  ISSUES = 'ISSUES',
}

/**
 * Preparation Task
 * Individual picking task for warehouse staff
 */
export interface IPreparationTask {
  id: string
  exitNoteId: string
  itemId: string
  quantity: number
  location?: string
  status: 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETE' | 'REJECTED'
  assignedTo?: string
  assignedAt?: Date
  startedAt?: Date
  completedAt?: Date
  notes?: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Preparation Session
 * Represents a picking session for an exit note
 */
export interface IPreparationSession {
  id: string
  exitNoteId: string
  status: PreparationStatus
  startedAt?: Date
  startedBy?: string
  completedAt?: Date
  completedBy?: string
  tasks: IPreparationTask[]
  completionPercentage: number
  issuesFound: number
  notes?: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Preparation Report
 * Summary of preparation work
 */
export interface IPreparationReport {
  exitNoteId: string
  status: PreparationStatus
  totalTasks: number
  tasksComplete: number
  tasksInProgress: number
  tasksPending: number
  tasksRejected: number
  completionPercentage: number
  startedAt?: Date
  completedAt?: Date
  preparedBy?: string
  issues: string[]
}

/**
 * Picking Instruction
 * Detailed instruction for picker
 */
export interface IPickingInstruction {
  itemId: string
  quantity: number
  location?: string
  batchId?: string
  serialNumberId?: string
  priority: 'LOW' | 'NORMAL' | 'HIGH'
  notes?: string
}

/**
 * Preparation Quality Check
 * Result of quality verification during preparation
 */
export interface IPreparationQualityCheck {
  taskId: string
  itemId: string
  expected: number
  found: number
  discrepancy: number
  quality: 'OK' | 'ISSUES' | 'REJECTED'
  notes?: string
  checkedAt: Date
  checkedBy: string
}
