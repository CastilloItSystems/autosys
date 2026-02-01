import { array, boolean, date, number, object, string, union, z } from "zod";

export const rendimientoBKSchema = object({
  idProducto: object({
    _id: string().min(1, "El ID del producto es obligatorio"),
    nombre: string().min(1, "El nombre del producto es obligatorio"),
    color: string().min(1, "El color es obligatorio"),
    id: string().min(1, "El ID es obligatorio"),
  }),
  transporte: number().min(0, "El transporte debe ser un número no negativo"),
  bunker: number().min(0, "El bunker debe ser un número no negativo"),
  costoVenta: number().min(
    0,
    "El costo de venta debe ser un número no negativo"
  ),
  porcentaje: number().min(0, "El porcentaje debe ser un número no negativo"),
  _id: string().min(1, "El ID del rendimiento es obligatorio"),
});

export const tipoProductoBKSchema = object({
  _id: string().optional(),
  idRefineria: object({
    _id: string().min(1, "El ID de la refinería es obligatorio"),
    nombre: string().min(1, "El nombre de la refinería es obligatorio"),
    procesamientoDia: number().min(
      0,
      "El procesamiento por día debe ser un número no negativo"
    ),
    id: string().min(1, "El ID de la refinería es obligatorio"),
  }).optional(),
  idProducto: object({
    _id: string().min(1, "El ID del producto es obligatorio"),
    nombre: string().min(1, "El nombre del producto es obligatorio"),
    color: string().min(1, "El color es obligatorio"),
    id: string().min(1, "El ID es obligatorio"),
  }),
  nombre: string().min(1, "El nombre es obligatorio"),
  procedencia: string().min(1, "La procedencia es obligatoria"),
  clasificacion: string().min(1, "La clasificación es obligatoria"),
  gravedadAPI: number().min(
    0,
    "La gravedad API debe ser un número no negativo"
  ),
  azufre: number().min(0, "El azufre debe ser un número no negativo"),
  contenidoAgua: number().min(
    0,
    "El contenido de agua debe ser un número no negativo"
  ),
  puntoDeInflamacion: number().min(0, "El Flashpoint es obligatorio"),
  rendimientos: array(rendimientoBKSchema).optional(),
  costoOperacional: number().min(
    0,
    "El costo operacional debe ser un número no negativo"
  ),
  transporte: number().min(
    0,
    "El costo de transporte debe ser un número no negativo"
  ),
  convenio: number({
    required_error: "El convenio es obligatorio y debe ser un número.",
    invalid_type_error: "El convenio debe ser un número.",
  }),
  estado: string().min(1, "El estado es obligatorio"),
  eliminado: boolean().default(false),
  createdAt: union([string(), date()]).optional(),
  updatedAt: union([string(), date()]).optional(),
  id: string().min(1, "El ID es obligatorio").optional(),
});
