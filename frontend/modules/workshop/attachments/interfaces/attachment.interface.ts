export interface WorkshopResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface WorkshopPagedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
