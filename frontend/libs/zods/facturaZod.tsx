import { array, boolean, date, number, object, string, union, z } from "zod";

export const facturaSchema = object({
  id: string().optional(),
  idRefineria: object({
    id: string().min(1, "El ID de la refinería es obligatorio"),
    nombre: string().optional(),
  }).optional(),
  idLineasFactura: array(
    object({
      id: string().optional(),
      descripcion: string().min(1, "La descripción es obligatoria"),
      subTotal: number().min(0, "El subtotal debe ser un número no negativo"),

      idPartida: object({
        id: string().optional(),
        descripcion: string().optional(),
      }).optional(),

      eliminado: boolean().default(false).optional(),
      estado: string().optional(),
    })
  ).min(1, "Debe haber al menos una línea de factura"),
  concepto: string().min(1, "El concepto es obligatorio"),
  total: number().min(0, "El total debe ser un número no negativo"),
  aprobada: string().optional(),
  fechaFactura: union([string(), date()]).optional(),
  eliminado: boolean().default(false),
  estado: string().min(1, "El estado es obligatorio"),
});
export const partidaSchema = object({
  id: string().optional(),

  descripcion: string().min(1, "La descripción es obligatoria"),
  codigo: number().min(0, "El código debe ser un número no negativo"),
  eliminado: boolean().default(false),
  createdAt: union([string(), date()]).optional(),
  updatedAt: union([string(), date()]).optional(),
  createdBy: object({
    id: string().optional(),
    nombre: string().optional(),
  }).optional(),
  modificadoPor: object({
    id: string().optional(),
    nombre: string().optional(),
  }).optional(),
  historial: array(
    object({
      id: string().optional(),
      fecha: union([string(), date()]).optional(),
      descripcion: string().optional(),
    })
  ).optional(),
  color: string().min(1, "El color es obligatorio"),
});
