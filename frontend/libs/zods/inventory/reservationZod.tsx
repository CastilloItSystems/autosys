import { z } from "zod";

export const reservationSchema = z.object({
  itemId: z.string().min(1, "El artículo es requerido"),
  warehouseId: z.string().min(1, "El almacén es requerido"),
  quantity: z
    .number()
    .min(1, "La cantidad debe ser al menos 1")
    .positive("La cantidad debe ser mayor a 0"),
  workOrderId: z.string().optional(),
  saleOrderId: z.string().optional(),
  reference: z.string().optional(),
  notes: z
    .string()
    .max(500, "Las notas no pueden exceder 500 caracteres")
    .optional(),
  expiresAt: z.date().optional().nullable(),
});

export type ReservationFormData = z.infer<typeof reservationSchema>;
