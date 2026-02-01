import { z } from "zod";

// Work Order Status Schema
export const workOrderStatusSchema = z.object({
  codigo: z
    .string()
    .min(1, "El código es requerido")
    .max(50, "El código no puede exceder 50 caracteres"),
  nombre: z
    .string()
    .min(1, "El nombre es requerido")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  descripcion: z.string().optional(),
  color: z.string().optional(),
  icono: z.string().optional(),
  orden: z.number().min(0, "El orden debe ser mayor o igual a 0").optional(),
  tipo: z
    .enum(["inicial", "intermedio", "final", "cancelado"], {
      errorMap: () => ({
        message: "Tipo debe ser: inicial, intermedio, final o cancelado",
      }),
    })
    .optional(),
  transicionesPermitidas: z.array(z.string()).optional(),
  requiereAprobacion: z.boolean().optional(),
  requiereDocumentacion: z.boolean().optional(),
  notificarCliente: z.boolean().optional(),
  notificarTecnico: z.boolean().optional(),
  activo: z.boolean().optional(),
  collapsed: z.boolean().optional(),
});

export type WorkOrderStatusFormData = z.infer<typeof workOrderStatusSchema>;

// Schema for creating new work order status (without system fields)
export const createWorkOrderStatusSchema = workOrderStatusSchema.omit({
  activo: true,
});

// Schema for updating work order status
export const updateWorkOrderStatusSchema = workOrderStatusSchema
  .partial()
  .extend({
    _id: z.string().optional(),
  });

// Schema for filters
export const workOrderStatusFiltersSchema = z.object({
  activo: z.boolean().optional(),
  tipo: z.enum(["inicial", "intermedio", "final", "cancelado"]).optional(),
  codigo: z.string().optional(),
  nombre: z.string().optional(),
});

export type WorkOrderStatusFiltersData = z.infer<
  typeof workOrderStatusFiltersSchema
>;
