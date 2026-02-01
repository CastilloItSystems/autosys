import { z } from "zod";

// Work Order Schema
export const workOrderSchema = z.object({
  numeroOrden: z.string().optional(), // Auto-generated on backend
  customer: z.union([
    z.string().min(1, "El cliente es requerido"),
    z.object({
      _id: z.string(),
      nombre: z.string(),
      id: z.string(),
    }),
  ]),
  vehicle: z.union([
    z.string().min(1, "El vehículo es requerido"),
    z.object({
      _id: z.string(),
      placa: z.string(),
      id: z.string(),
    }),
  ]),
  motivo: z.string().min(1, "El motivo es requerido"),
  kilometraje: z.number().min(0, "El kilometraje debe ser mayor o igual a 0"),
  tecnicoAsignado: z
    .union([
      z.string(),
      z.object({
        _id: z.string(),
        nombre: z.string(),
        id: z.string(),
      }),
    ])
    .optional(),
  estado: z.union([
    z.string().min(1, "El estado es requerido"),
    z.object({
      _id: z.string(),
      codigo: z.string(),
      nombre: z.string(),
    }),
  ]),
  prioridad: z.enum(["baja", "normal", "alta", "urgente"]),
  descripcionProblema: z.string().optional(),
  subtotalRepuestos: z.number().min(0).optional(),
  subtotalServicios: z.number().min(0).optional(),
  descuento: z.number().min(0).optional(),
  impuesto: z.number().min(0).optional(),
  costoTotal: z.number().min(0).optional(),
  fechaApertura: z.union([z.date(), z.string()]).optional(),
  fechaEstimadaEntrega: z.union([z.date(), z.string()]).optional(),
  fechaEntregaReal: z.union([z.date(), z.string()]).optional(),
  observaciones: z.string().optional(),
});

export type WorkOrderFormData = z.infer<typeof workOrderSchema>;
