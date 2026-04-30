import { z } from "zod";

export const reservationSchema = z.object({
  itemId: z.string().min(1, "El artículo es requerido"),
  warehouseId: z.string().min(1, "El almacén es requerido"),
  quantity: z
    .number()
    .min(1, "La cantidad debe ser al menos 1")
    .positive("La cantidad debe ser mayor a 0"),
  workOrderId: z.string().uuid("Debe ser un ID válido").optional().or(z.literal("")),
  saleOrderId: z.string().uuid("Debe ser un ID válido").optional().or(z.literal("")),
  reference: z.string().max(100, "La referencia no puede exceder 100 caracteres").optional(),
  notes: z
    .string()
    .max(1000, "Las notas no pueden exceder 1000 caracteres")
    .optional(),
  expiresAt: z.date().optional().nullable(),
});

export type ReservationFormData = z.infer<typeof reservationSchema>;
