export interface WorkshopShift {
  id: string;
  code: string;
  name: string;
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
  workDays: number[]; // 0=Sun, 1=Mon...6=Sat
  isActive: boolean;
  empresaId: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkshopShiftFilters {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: "true" | "false";
}

export interface CreateWorkshopShiftInput {
  code: string;
  name: string;
  startTime: string;
  endTime: string;
  workDays: number[];
}

export interface UpdateWorkshopShiftInput {
  name?: string;
  startTime?: string;
  endTime?: string;
  workDays?: number[];
  isActive?: boolean;
}
