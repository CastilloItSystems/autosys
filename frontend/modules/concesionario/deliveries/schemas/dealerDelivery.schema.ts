import { z } from "zod";

export const dealerDeliverySchema = z.object({
  dealerUnitId: z
    .string({ required_error: "Unidad requerida" })
    .min(1, "Unidad requerida"),
  customerId: z
    .string({ required_error: "Cliente requerido" })
    .min(1, "Cliente requerido"),
  customerName: z.string().min(1, "Nombre de cliente requerido"),
  scheduledAt: z
    .date({ required_error: "Fecha programada requerida" })
    .nullable(),
  status: z
    .string({ required_error: "Estatus requerido" })
    .min(1, "Estatus requerido"),
});

export type DealerDeliverySchema = z.infer<typeof dealerDeliverySchema>;
