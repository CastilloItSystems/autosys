export interface VehicleBrand {
  id: string;
  _id: string;
  nombre: string;
  paisOrigen?: string;
  logo?: string;
  estado?: "activo" | "inactivo";
  eliminado?: boolean;
  createdBy?: string;
  historial?: any[];
  createdAt?: string;
  updatedAt?: string;
}

export interface VehicleModel {
  id: string;
  _id: string;
  brand: VehicleBrand | string;
  nombre: string;
  tipo:
    | "sedan"
    | "hatchback"
    | "pickup"
    | "suv"
    | "coupe"
    | "convertible"
    | "wagon"
    | "van";
  motor: "gasolina" | "diesel" | "electrico" | "hibrido";
  yearInicio?: number;
  yearFin?: number | null;
  estado?: "activo" | "inactivo";
  eliminado?: boolean;
  createdBy?: string;
  historial?: any[];
  createdAt?: string;
  updatedAt?: string;
}

export interface VehicleCustomer {
  id: string;
  _id: string;
  nombre: string;
  telefono?: string;
  correo?: string;
  rif?: string;
  nombreCompleto?: string;
}

export interface Vehicle {
  id: string;
  _id: string;
  customer: VehicleCustomer | string;
  model: VehicleModel | string;
  year: number;
  placa: string;
  vin?: string;
  color: string;
  kilometraje: number;
  estado?: "activo" | "inactivo";
  eliminado?: boolean;
  createdBy?: any;
  historial?: any[];
  createdAt?: string;
  updatedAt?: string;
}
