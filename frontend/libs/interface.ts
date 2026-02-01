// export interface Tanque {
//   id: string;
//   // idRefineria: { id: string };

//   nombre: string;
//   material: string[];
// }

export interface Refinacion {
  idRefineria: {
    nombre: string;
    id: string;
  };
  idTanque: {
    _id: string;
    nombre: string;
    id: string;
  };
  idTorre: {
    nombre: string;
    id: string;
  };
  cantidadTotal: number;
  idChequeoCalidad: {
    operador: string;
    id: string;
  }[];
  idChequeoCantidad: {
    operador: string;
    id: string;
    fechaChequeo: string;
    cantidad: number;
  }[];
  derivado: Derivado[];
  fechaInicio: string;
  fechaFin: string;
  operador: string;
  estado: string;
  eliminado: boolean;
  createdAt: string;
  updatedAt: string;
  id: string;
  descripcion: string;
  estadoRefinacion: string;
  idProducto: {
    nombre: string;
    id: string;
  };
  numeroRefinacion: number;
  idRefinacionSalida: RefinacionSalida[];
}
export interface RefinacionSalida {
  idRefineria: {
    nombre: string;
    id: string;
  };
  idRefinacion: {
    idTorre: {
      _id: string;
      nombre: string;
      id: string;
    };
    idProducto: {
      _id: string;
      nombre: string;
      id: string;
    };
    cantidadTotal: number;
    derivado: Array<{
      idProducto: {
        _id: string;
        nombre: string;
        id: string;
      };
      porcentaje: number;
      _id: string;
    }>;
    numeroRefinacion: number;
    id: string;
  };
  idTanque: {
    _id: string;
    nombre: string;
    id: string;
  };
  cantidadTotal: number;
  descripcion: string;
  idChequeoCalidad: Array<{
    _id: string;
    idProducto: {
      _id: string;
      nombre: string;
      id: string;
    };
    idTanque: {
      _id: string;
      nombre: string;
      id: string;
    };
    gravedadAPI: number;
    azufre: number;
    contenidoAgua: number;
    id: string;
  }>;
  idChequeoCantidad: Array<{
    idProducto: {
      _id: string;
      nombre: string;
      id: string;
    };
    idTanque: {
      _id: string;
      nombre: string;
      id: string;
    };
    fechaChequeo: string;
    cantidad: number;
    estado: string;
    eliminado: boolean;
    createdAt: string;
    updatedAt: string;
    id: string;
  }>;
  idProducto: {
    _id: string;
    nombre: string;
    id: string;
  };
  fechaFin: string;
  operador: string;
  estadoRefinacionSalida: string;
  eliminado: boolean;
  estado: string;
  createdAt: string;
  updatedAt: string;
  id: string;
  numeroRefinacionSalida: number;
}
export interface Derivado {
  idProducto: {
    _id: string;
    nombre: string;
    id: string;
  };
  porcentaje: number;
  _id: string;
}
