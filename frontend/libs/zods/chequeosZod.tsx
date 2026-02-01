import { array, boolean, date, number, object, string, union, z } from "zod";

export const chequeoCalidadSchema = z.object({
  aplicar: z.object({
    tipo: z.enum(["Recepcion", "Tanque", "Despacho"], {
      errorMap: () => ({ message: "Tipo de aplicación inválido" }),
    }),
    idReferencia: z.union([
      z
        .object({
          id: z.string().min(1, "El ID de referencia es obligatorio"),
          idGuia: z.number().min(1, "El ID de guía debe ser positivo"),
        })
        .refine((data) => data.id && data.idGuia, {
          message: "Datos incompletos para Recepcion o Despacho",
        }),
      z.object({
        id: z.string().min(1, "El ID de referencia es obligatorio"),
        nombre: z.string().min(1, "El nombre de referencia es obligatorio"),
      }),
    ]),
  }),
  idRefineria: z
    .object({
      _id: z.string().optional(),
      nombre: z.string().min(1, "El nombre de la refinería es obligatorio"),
      id: z.string().min(1, "El ID de la refinería es obligatorio"),
    })
    .optional(),
  idProducto: z.object({
    _id: z.string().optional(),
    nombre: z.string().min(1, "El nombre del producto es obligatorio"),
    id: z.string().min(1, "El ID del producto es obligatorio"),
  }),
  fechaChequeo: z.coerce.date({
    required_error: "La fecha de chequeo es obligatoria",
    invalid_type_error: "Formato de fecha inválido",
  }),
  gravedadAPI: z
    .number()
    .min(0, "La gravedad API debe ser un número no negativo"),
  azufre: z.number().min(0, "El azufre debe ser un número no negativo"),
  contenidoAgua: z
    .number()
    .min(0, "El contenido de agua debe ser un número no negativo"),
  puntoDeInflamacion: z
    .number()
    .min(0, "El punto de inflamación debe ser un número no negativo"),
  // cetano: z.number().min(0, "El índice cetano debe ser un número no negativo"),
  idOperador: z
    .object({
      nombre: z.string().min(1, "El nombre del operador es obligatorio"),
      id: z.string().min(1, "El ID del operador es obligatorio"),
      _id: z.string().optional(),
    })
    .optional(),
  estado: string().min(1, "El estado es obligatorio"),
  eliminado: z.boolean().default(false),
  numeroChequeoCalidad: z
    .number()
    .int()
    .positive("El número de chequeo debe ser positivo")
    .optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  id: z.string().optional(),
});

export const chequeoCantidadSchema = z.object({
  aplicar: z.object({
    tipo: z.enum(["Recepcion", "Tanque", "Despacho"], {
      errorMap: () => ({ message: "Tipo de aplicación inválido" }),
    }),
    idReferencia: z.union([
      z
        .object({
          id: z.string().min(1, "El ID de referencia es obligatorio"),
          idGuia: z.number().min(1, "El ID de guía debe ser positivo"),
        })
        .refine((data) => data.id && data.idGuia, {
          message: "Datos incompletos para Recepcion o Despacho",
        }),
      z.object({
        id: z.string().min(1, "El ID de referencia es obligatorio"),
        nombre: z.string().min(1, "El nombre de referencia es obligatorio"),
      }),
    ]),
  }),
  idRefineria: z
    .object({
      _id: z.string().optional(),
      nombre: z.string().min(1, "El nombre de la refinería es obligatorio"),
      id: z.string().min(1, "El ID de la refinería es obligatorio"),
    })
    .optional(),
  idProducto: z.object({
    _id: z.string().optional(),
    nombre: z.string().min(1, "El nombre del producto es obligatorio"),
    id: z.string().min(1, "El ID del producto es obligatorio"),
  }),
  fechaChequeo: z.coerce.date({
    required_error: "La fecha de chequeo es obligatoria",
    invalid_type_error: "Formato de fecha inválido",
  }),
  cantidad: z.number().min(0, "La cantidad debe ser un número no negativo"),
  idOperador: z
    .object({
      nombre: z.string().min(1, "El nombre del operador es obligatorio"),
      id: z.string().min(1, "El ID del operador es obligatorio"),
      _id: z.string().optional(),
    })
    .optional(),
  estado: string().min(1, "El estado es obligatorio"),
  eliminado: z.boolean().default(false),
  numeroChequeoCantidad: z
    .number()
    .int()
    .positive("El número de chequeo debe ser positivo")
    .optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  id: z.string().optional(),
});
