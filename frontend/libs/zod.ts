import { array, boolean, date, number, object, string, union, z } from "zod";

// export const despachoSchema = object({
//   estadoCarga: string().min(1, "El estado de carga es obligatorio"),
//   estado: string().min(1, "El estado es obligatorio"),
//   eliminado: boolean().default(false),
//   cantidadEnviada: number().min(
//     0,
//     "La cantidad enviada debe ser un número no negativo"
//   ),
//   cantidadRecibida: number().min(
//     0,
//     "La cantidad recibida debe ser un número no negativo"
//   ),
//   fechaInicio: union([string(), date()]).optional(),
//   fechaFin: union([string(), date()]).optional(),
//   idContrato: object({
//     numeroContrato: string().min(1, "El estado es obligatorio").optional(),
//     id: string().optional(),
//     idRefineria: object({
//       id: string().optional(),
//       nombre: string().min(1, "El nombre de la refinería es obligatorio"),
//     }).optional(),
//     idContacto: object({
//       id: string().optional(),
//       nombre: string().min(1, "El nombre del contacto es obligatorio"),
//     }).optional(),
//     idItems: array(
//       object({
//         estado: string().min(1, "El estado es obligatorio"),
//         eliminado: boolean().default(false),
//         id: string().optional(),
//         producto: object({
//           nombre: string().min(1, "El nombre del producto es obligatorio"),
//           id: string().min(1, "El ID del producto es obligatorio"),
//           color: string().min(1, "El color es obligatorio").optional(),
//         }),
//         cantidad: number().min(0, "La cantidad debe ser un número no negativo"),
//         precioUnitario: number().min(
//           0,
//           "El precio unitario debe ser un número no negativo"
//         ),
//         gravedadAPI: number().min(
//           0,
//           "La gravedad API debe ser un número no negativo"
//         ),
//         azufre: number().min(0, "El azufre debe ser un número no negativo"),

//         contenidoAgua: number().min(
//           0,
//           "El contenido de agua debe ser un número no negativo"
//         ),

//         clasificacion: string().min(1, "El origen es obligatorio"),

//         puntoDeInflamacion: number().min(
//           0,
//           "La presión debe ser un número no negativo"
//         ),
//       })
//     ).optional(),
//   }).optional(),
//   idContratoItems: object({
//     estado: string().min(1, "El estado es obligatorio"),
//     eliminado: boolean().default(false),
//     id: string().optional(),
//     producto: object({
//       nombre: string().min(1, "El nombre del producto es obligatorio"),
//       id: string().min(1, "El ID del producto es obligatorio"),
//     }),
//     cantidad: number().min(0, "La cantidad debe ser un número no negativo"),
//     precioUnitario: number().min(
//       0,
//       "El precio unitario debe ser un número no negativo"
//     ),
//     gravedadAPI: number().min(
//       0,
//       "La gravedad API debe ser un número no negativo"
//     ),
//     azufre: number().min(0, "El azufre debe ser un número no negativo"),

//     contenidoAgua: number().min(
//       0,
//       "El contenido de agua debe ser un número no negativo"
//     ),
//     clasificacion: string().min(1, "El origen es obligatorio"),
//     puntoDeInflamacion: number().min(
//       0,
//       "La temperatura debe ser un número no negativo"
//     ),
//   }).optional(),
//   idLineaDespacho: object({
//     id: string().optional(),
//     nombre: string().min(1, "El nombre de la línea es obligatorio"),
//   }).optional(),
//   idTanque: object({
//     id: string().optional(),
//     nombre: string().min(1, "El nombre del tanque es obligatorio"),
//     null: boolean().optional(),
//   })
//     .optional()
//     .nullable(),
//   idGuia: number().min(0, "El ID de la guía debe ser un número no negativo"),
//   idRefineria: object({
//     id: string().optional(),
//     nombre: string().min(1, "El nombre de la refinería es obligatorio"),
//   }).optional(),
//   placa: string().min(1, "La placa es obligatoria"),
//   nombreChofer: string().min(1, "El nombre del chofer es obligatorio"),
//   apellidoChofer: string().min(1, "El apellido del chofer es obligatorio"),
//   createdAt: union([string(), date()]).optional(),
//   updatedAt: union([string(), date()]).optional(),
//   id: string().optional(),
// });

export const refinacionSchema = object({
  idRefineria: object({
    nombre: string().min(1, "El nombre de la refinería es obligatorio"),
    id: string().min(1, "El ID de la refinería es obligatorio"),
  }).optional(),
  idTanque: object({
    nombre: string().min(1, "El nombre del tanque es obligatorio"),
    id: string().min(1, "El ID del tanque es obligatorio"),
  }),
  idTorre: object({
    nombre: string().min(1, "El nombre de la torre es obligatorio"),
    id: string().min(1, "El ID de la torre es obligatorio"),
  }),
  idProducto: object({
    nombre: string().min(1, "El nombre del producto es obligatorio"),
    id: string().min(1, "El ID del producto es obligatorio"),
  }),
  cantidadTotal: number().min(
    0,
    "La cantidad total debe ser un número no negativo"
  ),
  idChequeoCalidad: array(
    object({
      operador: string().min(1, "El nombre del operador es obligatorio"),
      id: string().min(1, "El ID del chequeo de calidad es obligatorio"),
    })
  ).optional(),
  idChequeoCantidad: array(
    object({
      operador: string().min(1, "El nombre del operador es obligatorio"),
      id: string().min(1, "El ID del chequeo de cantidad es obligatorio"),
    })
  ).optional(),
  derivado: array(
    object({
      idProducto: object({
        _id: string().min(1, "El ID del producto es obligatorio"),
        nombre: string().min(1, "El nombre del producto es obligatorio"),
        id: string().min(1, "El ID del producto es obligatorio"),
      }),
      porcentaje: number().min(
        0,
        "El porcentaje debe ser un número no negativo"
      ),
      _id: string().min(1, "El ID es obligatorio"),
    })
  ).optional(),
  fechaInicio: union([string(), date()]).refine(
    (val) => val !== "",
    "La fecha de inicio es obligatoria"
  ),
  fechaFin: union([string(), date()]).refine(
    (val) => val !== "",
    "La fecha de fin es obligatoria"
  ),
  operador: string().min(1, "El nombre del operador es obligatorio"),
  estado: string().min(1, "El estado es obligatorio"),
  eliminado: boolean().default(false),
  createdAt: union([string(), date()]).optional(),
  updatedAt: union([string(), date()]).optional(),
  descripcion: string().min(1, "La descripción es obligatoria"),
  estadoRefinacion: string().min(
    1,
    "El estado de la refinación es obligatorio"
  ),
  id: string().optional(),
});

export const refinacionSalidaSchema = object({
  idRefinacion: object({
    idTorre: object({
      _id: string().min(1, "El _id de la torre es obligatorio"),
      nombre: string().min(1, "El nombre de la torre es obligatorio"),
      id: string().min(1, "El ID de la torre es obligatorio"),
    }),
    idProducto: object({
      _id: string().min(1, "El _id del producto es obligatorio"),
      nombre: string().min(1, "El nombre del producto es obligatorio"),
      id: string().min(1, "El ID del producto es obligatorio"),
    }),
    cantidadTotal: number().min(0, "La cantidad total debe ser no negativa"),
    derivado: array(
      object({
        idProducto: object({
          _id: string().min(1, "El _id del producto derivado es obligatorio"),
          nombre: string().min(
            1,
            "El nombre del producto derivado es obligatorio"
          ),
          id: string().min(1, "El ID del producto derivado es obligatorio"),
        }),
        porcentaje: number().min(0, "El porcentaje debe ser no negativo"),
        _id: string().min(1, "El _id del derivado es obligatorio"),
      })
    ).optional(),
    numeroRefinacion: number().min(
      0,
      "El número de refinación debe ser no negativo"
    ),
    id: string().min(1, "El ID de la refinación es obligatorio"),
  }),
  idTanque: object({
    _id: string().min(1, "El _id del tanque es obligatorio"),
    nombre: string().min(1, "El nombre del tanque es obligatorio"),
    id: string().min(1, "El ID del tanque es obligatorio"),
  }),
  cantidadTotal: number().min(0, "La cantidad debe ser un número no negativo"),
  descripcion: string().min(1, "La descripción es obligatoria"),
  idChequeoCalidad: array(
    object({
      _id: string().min(1, "El _id del chequeo de calidad es obligatorio"),
      idProducto: object({
        _id: string().min(1, "El _id del producto es obligatorio"),
        nombre: string().min(1, "El nombre del producto es obligatorio"),
        id: string().min(1, "El ID del producto es obligatorio"),
      }),
      idTanque: object({
        _id: string().min(1, "El _id del tanque es obligatorio"),
        nombre: string().min(1, "El nombre del tanque es obligatorio"),
        id: string().min(1, "El ID del tanque es obligatorio"),
      }),
      gravedadAPI: number().min(
        0,
        "La gravedad API debe ser un número no negativo"
      ),
      azufre: number().min(
        0,
        "El porcentaje de azufre debe ser un número no negativo"
      ),
      contenidoAgua: number().min(
        0,
        "El contenido de agua debe ser un número no negativo"
      ),
      id: string().min(1, "El ID del chequeo de calidad es obligatorio"),
    })
  ).optional(),
  idChequeoCantidad: array(
    object({
      idProducto: object({
        _id: string().min(1, "El _id del producto es obligatorio"),
        nombre: string().min(1, "El nombre del producto es obligatorio"),
        id: string().min(1, "El ID del producto es obligatorio"),
      }),
      idTanque: object({
        _id: string().min(1, "El _id del tanque es obligatorio"),
        nombre: string().min(1, "El nombre del tanque es obligatorio"),
        id: string().min(1, "El ID del tanque es obligatorio"),
      }),
      id: string().min(1, "El ID del chequeo de cantidad es obligatorio"),
    })
  ).optional(),
  idProducto: object({
    _id: string().min(1, "El _id del producto es obligatorio"),
    nombre: string().min(1, "El nombre del producto es obligatorio"),
    id: string().min(1, "El ID del producto es obligatorio"),
  }),
  fechaFin: union([string(), date()]).refine(
    (val) => val !== "",
    "La fecha de fin es obligatoria"
  ),
  operador: string().min(1, "El nombre del operador es obligatorio"),
  estadoRefinacionSalida: string().min(
    1,
    "El estado de la refinación es obligatorio"
  ),
  eliminado: boolean().default(false),
  estado: string().min(1, "El estado es obligatorio"),
  createdAt: union([string(), date()]).optional(),
  updatedAt: union([string(), date()]).optional(),
  id: string().optional(),
});
