import { array, boolean, date, number, object, string, union } from "zod";

export const corteRefinacionSchema = object({
  idRefineria: object({
    _id: string().min(1, "El _id de la refinería es obligatorio"),
    nombre: string().min(1, "El nombre de la refinería es obligatorio"),
    id: string().min(1, "El ID de la refinería es obligatorio"),
  }).optional(),
  // numeroCorteRefinacion: number().min(1, "El número de corte es obligatorio"),
  corteTorre: array(
    object({
      idTorre: object({
        _id: string().min(1, "El _id de la torre es obligatorio"),
        nombre: string().min(1, "El nombre de la torre es obligatorio"),
        id: string().min(1, "El ID de la torre es obligatorio"),
      }).optional(),
      detalles: array(
        object({
          idTanque: object({
            // _id: string().min(1, "El _id del tanque es obligatorio"),
            nombre: string().min(1, "El nombre del tanque es obligatorio"),
            id: string().min(1, "El ID del tanque es obligatorio"),
          }).optional(),
          idProducto: object({
            // _id: string().min(1, "El _id del producto es obligatorio"),
            // nombre: string().min(1, "El nombre del producto es obligatorio"),
            id: string().min(1, "El ID del producto es obligatorio"),
          }).optional(),
          cantidad: number().default(0),
          // _id: string().min(1, "El _id del detalle es obligatorio"),
        })
      ).optional(),
      // _id: string().min(1, "El _id de la torre es obligatorio"),
    })
  ).optional(),
  fechaCorte: union([string(), date()]).refine(
    (val) => val !== "",
    "La fecha de corte es obligatoria"
  ),
  observacion: string().optional(),
  idOperador: object({
    nombre: string().min(1, "El nombre del operador es obligatorio"),
    id: string().min(1, "El ID del operador es obligatorio"),
  }).optional(),
  eliminado: boolean().default(false),
  // estado: string().min(1, "El estado es obligatorio"),
  createdAt: union([string(), date()]).optional(),
  updatedAt: union([string(), date()]).optional(),
  id: string().optional(),
});
