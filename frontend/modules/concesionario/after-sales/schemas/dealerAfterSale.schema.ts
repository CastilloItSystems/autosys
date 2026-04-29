import { z } from "zod";

export const dealerAfterSaleSchema = z.object({
  type: z.string({ required_error: "Tipo requerido" }).min(1, "Tipo requerido"),
  status: z
    .string({ required_error: "Estatus requerido" })
    .min(1, "Estatus requerido"),
  customerId: z
    .string({ required_error: "Cliente requerido" })
    .min(1, "Cliente requerido"),
  customerName: z.string().min(1, "Nombre de cliente requerido"),
  title: z
    .string({ required_error: "Título requerido" })
    .min(1, "Título requerido"),
  description: z.string().optional(),
  dueAt: z.date().nullable().optional(),
  satisfactionScore: z.number().min(1).max(10).optional(),
});

export type DealerAfterSaleSchema = z.infer<typeof dealerAfterSaleSchema>;
