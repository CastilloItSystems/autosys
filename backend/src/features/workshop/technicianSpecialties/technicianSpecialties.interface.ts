export interface ITechnicianSpecialtyFilters {
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}
export interface ICreateTechnicianSpecialty {
  code: string;
  name: string;
  description?: string;
  isActive?: boolean;
}
export interface IUpdateTechnicianSpecialty extends Partial<ICreateTechnicianSpecialty> {}
