import { z } from "zod";

export const dealerTradeInSchema = z.object({
  customerId: z
    .string({ required_error: "Cliente requerido" })
    .min(1, "Cliente requerido"),
  customerName: z.string().min(1, "Nombre de cliente requerido"),
  vehicleBrand: z.string().min(1, "Marca requerida"),
  vehicleModel: z.string().optional(),
  requestedValue: z.number().min(0).optional(),
  appraisedValue: z.number().min(0).optional(),
  approvedValue: z.number().min(0).optional(),
  status: z
    .string({ required_error: "Estatus requerido" })
    .min(1, "Estatus requerido"),
});

export type DealerTradeInSchema = z.infer<typeof dealerTradeInSchema>;
