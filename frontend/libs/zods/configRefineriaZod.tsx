import { array, boolean, date, number, object, string, union, z } from "zod";

export const refineriaSchema = object({
  nombre: string().min(1, "El nombre es obligatorio"),
  estado: string().min(1, "Debes seleccionar un estado").optional(),
  // eliminado: boolean().default(false),
  procesamientoDia: number().min(1, "El procesamiento diario es obligatorio"),
  ubicacion: string().min(1, "La ubicación es obligatoria"),
  nit: string().min(1, "El NIT es obligatorio"),
  img: string().url("La URL de la imagen es inválida"),
  createdAt: string().optional(),
  updatedAt: string().optional(),
  id: string().optional(),
  idRefineria: object({
    id: string(),
    nombre: string(),
  }).optional(),
  material: array(
    object({
      estadoMaterial: string(),
      posicion: string(),
      nombre: string(),
    })
  ).optional(),
});

export const torreDestilacionSchema = object({
  id: string().optional(),
  nombre: string().min(1, "El nombre es obligatorio"),
  // estado: string().min(1, "El estado es obligatorio"),
  eliminado: boolean().default(false),
  ubicacion: string().min(1, "La ubicación es obligatoria").optional(),
  capacidad: number().min(1, "La capacidad es obligatoria"),

  material: array(
    object({
      estadoMaterial: string(),
      porcentaje: number().optional(),
      idProducto: object({
        _id: string().min(1, "El ID del producto es obligatorio"),
        nombre: string().min(1, "El nombre del producto es obligatorio"),
        posicion: number().min(1, "La posición es obligatoria"),
        color: string().min(1, "El color es obligatorio"),
        id: string().min(1, "El ID del producto es obligatorio"),
      }),
    })
  ).optional(),
  idRefineria: object({
    id: string().optional(),
  }).optional(),

  createdAt: string().optional(),
  updatedAt: string().optional(),
});

export const tanqueSchema = object({
  id: string().optional(),
  nombre: string().min(1, "El nombre es obligatorio"),
  estado: string().min(1, "El estado es obligatorio"),
  eliminado: boolean().default(false),
  ubicacion: string().min(1, "La ubicación es obligatoria").optional(),
  idProducto: object({
    _id: string().min(1, "El ID del producto es obligatorio").optional(),
    nombre: string().min(1, "El nombre del producto es obligatorio"),
    posicion: number().min(1, "La posición es obligatoria").optional(),
    color: string().min(1, "El color es obligatorio").optional(),
    id: string().min(1, "El ID del producto es obligatorio"),
  }),
  almacenamientoMateriaPrimaria: boolean().default(false).optional(),
  capacidad: number().min(1, "La capacidad es obligatoria"),
  almacenamiento: number().min(1, "El almacenamiento es obligatorio"),
  idRefineria: object({
    id: string().optional(),
  }).optional(),
  createdAt: string().optional(),
  updatedAt: string().optional(),
}).refine((data) => data.almacenamiento <= data.capacidad, {
  message: "El almacenamiento no puede ser mayor a la capacidad",
  path: ["almacenamiento"],
});

export const lineaRecepcionSchema = object({
  id: string().optional(),
  nombre: string().min(1, "El nombre es obligatorio"),
  estado: string().min(1, "El estado es obligatorio"),
  eliminado: boolean().default(false),
  ubicacion: string().min(1, "La ubicación es obligatoria").optional(),
  createdAt: string().optional(),
  updatedAt: string().optional(),
  idRefineria: object({
    id: string().optional(),
  }).optional(),
});

export const lineaDespachoSchema = object({
  id: string().optional(),
  nombre: string().min(1, "El nombre es obligatorio"),
  estado: string().min(1, "El estado es obligatorio"),
  eliminado: boolean().default(false),
  ubicacion: string().min(1, "La ubicación es obligatoria").optional(),
  idProducto: object({
    _id: string().min(1, "El ID del producto es obligatorio").optional(),
    nombre: string().min(1, "El nombre del producto es obligatorio"),
    posicion: number().min(1, "La posición es obligatoria").optional(),
    color: string().min(1, "El color es obligatorio").optional(),
    id: string().min(1, "El ID del producto es obligatorio"),
  }),
  createdAt: string().optional(),
  updatedAt: string().optional(),
  idRefineria: object({
    id: string().optional(),
  }).optional(),
});

export const productoSchema = object({
  idRefineria: object({
    id: string().optional(),
    nombre: string().min(1, "El nombre de la refinería es obligatorio"),
  }).optional(),
  nombre: string().min(1, "El nombre es obligatorio"),
  color: string().min(1, "El color es obligatorio"),
  estado: string().min(1, "El estado es obligatorio").optional(),
  posicion: number().min(1, "La posición es obligatoria"),
  tipoMaterial: string()
    .min(1, "El tipo de material es obligatorio")
    .default("Derivado"),
  eliminado: boolean().default(false),
  createdAt: union([string(), date()]).optional(),
  updatedAt: union([string(), date()]).optional(),
  id: string().optional(),
});
