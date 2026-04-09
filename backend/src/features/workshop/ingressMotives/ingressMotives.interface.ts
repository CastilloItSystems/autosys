export interface IIngressMotiveFilters {
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}
export interface ICreateIngressMotive {
  code: string;
  name: string;
  description?: string;
  isActive?: boolean;
}
export interface IUpdateIngressMotive extends Partial<ICreateIngressMotive> {}
