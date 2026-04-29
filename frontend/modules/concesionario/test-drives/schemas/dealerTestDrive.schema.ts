import { z } from "zod";

export const dealerTestDriveSchema = z.object({
  dealerUnitId: z
    .string({ required_error: "Unidad requerida" })
    .min(1, "Unidad requerida"),
  customerId: z
    .string({ required_error: "Cliente requerido" })
    .min(1, "Cliente requerido"),
  customerName: z.string().min(1, "Nombre de cliente requerido"),
  customerDocument: z.string().optional(),
  customerPhone: z.string().optional(),
  customerEmail: z
    .string()
    .email("Email inválido")
    .optional()
    .or(z.literal("")),
  driverLicense: z.string().optional(),
  scheduledAt: z.date({ required_error: "Fecha requerida" }).nullable(),
  advisorName: z.string().optional(),
  routeDescription: z.string().optional(),
  observations: z.string().optional(),
  customerFeedback: z.string().optional(),
  status: z
    .string({ required_error: "Estatus requerido" })
    .min(1, "Estatus requerido"),
  isActive: z.boolean(),
});

export type DealerTestDriveSchema = z.infer<typeof dealerTestDriveSchema>;
