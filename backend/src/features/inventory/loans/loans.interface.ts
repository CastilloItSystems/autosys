/**
 * Loans Module - Interfaces and Types
 * Gestión de préstamos de items con vencimiento
 */

export enum LoanStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  ACTIVE = 'ACTIVE',
  RETURNED = 'RETURNED',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

export interface ILoanItem {
  id: string;
  loanId: string;
  itemId: string;
  quantityLoaned: number;
  quantityReturned: number;
  unitCost?: number;
  createdAt: Date;
}

export interface ILoan {
  id: string;
  loanNumber: string;
  borrowerName: string;
  borrowerId?: string;
  warehouseId: string;
  status: LoanStatus;
  items: ILoanItem[];
  
  // Dates
  approvedAt?: Date;
  approvedBy?: string;
  startDate: Date;
  dueDate: Date;
  returnedAt?: Date;
  
  // Notes
  purpose?: string;
  notes?: string;
  
  // Audit
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILoanWithRelations extends ILoan {
  approver?: any;
  creator?: any;
  warehouse?: any;
}

export interface ICreateLoanInput {
  borrowerName: string;
  borrowerId?: string;
  warehouseId: string;
  dueDate: Date;
  purpose?: string;
  notes?: string;
  items: ICreateLoanItemInput[];
}

export interface ICreateLoanItemInput {
  itemId: string;
  quantityLoaned: number;
  unitCost?: number;
  notes?: string;
}

export interface IUpdateLoanInput {
  borrowerName?: string;
  dueDate?: Date;
  purpose?: string;
  notes?: string;
}

export interface IApproveLoanInput {
  approvalNotes?: string;
}

export interface IReturnLoanInput {
  items: IReturnLoanItemInput[];
  returnNotes?: string;
}

export interface IReturnLoanItemInput {
  itemId: string;
  quantityReturned: number;
}

export interface ILoanFilters {
  status?: LoanStatus;
  warehouseId?: string;
  borrowerId?: string;
  borrowerName?: string;
  createdBy?: string;
  fromDate?: Date;
  toDate?: Date;
  overdueDaysOnly?: boolean;
}

export interface ILoanResponseDTO {
  id: string;
  loanNumber: string;
  borrowerName: string;
  borrowerId?: string;
  warehouseId: string;
  status: LoanStatus;
  items: {
    itemId: string;
    quantityLoaned: number;
    quantityReturned: number;
  }[];
  
  startDate: Date;
  dueDate: Date;
  returnedAt?: Date;
  daysOverdue?: number;
  
  purpose?: string;
  notes?: string;
  
  approvedBy?: string;
  approvedAt?: Date;
  
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
