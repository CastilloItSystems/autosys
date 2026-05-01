export interface WorkshopResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
