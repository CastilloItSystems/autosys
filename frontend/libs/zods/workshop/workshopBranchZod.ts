import { z } from "zod";

export const createWorkshopBranchSchema = z.object({
  code: z
    .string()
    .min(2, "Mínimo 2 caracteres")
    .max(20, "Máximo 20 caracteres")
    .transform((val) => val.toUpperCase()),
  name: z
    .string()
    .min(2, "Mínimo 2 caracteres")
    .max(100, "Máximo 100 caracteres"),
  address: z
    .string()
    .max(300, "Máximo 300 caracteres")
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .max(20, "Máximo 20 caracteres")
    .optional()
    .or(z.literal("")),
  managerUserId: z
    .string()
    .optional()
    .or(z.literal("")),
});

export const updateWorkshopBranchSchema = createWorkshopBranchSchema.partial();

export type CreateWorkshopBranchForm = z.infer<typeof createWorkshopBranchSchema>;
export type UpdateWorkshopBranchForm = z.infer<typeof updateWorkshopBranchSchema>;
