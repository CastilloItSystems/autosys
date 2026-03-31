import { z } from "zod";

export const checklistItemSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(1, "Requerido").max(50),
  name: z.string().min(2, "Mínimo 2 caracteres").max(200),
  description: z.string().max(500).nullable().optional(),
  responseType: z.enum(["BOOLEAN", "TEXT", "NUMBER", "SELECTION"]),
  isRequired: z.boolean().default(false),
  order: z.number().int().default(0),
  options: z.array(z.string()).nullable().optional(),
});

export const createChecklistTemplateSchema = z.object({
  code: z
    .string()
    .min(2, "Mínimo 2 caracteres")
    .max(20, "Máximo 20 caracteres")
    .transform((val) => val.toUpperCase()),
  name: z
    .string()
    .min(2, "Mínimo 2 caracteres")
    .max(100, "Máximo 100 caracteres"),
  description: z.string().max(500).nullable().optional(),
  category: z.enum(["RECEPTION", "DIAGNOSIS", "QUALITY_CONTROL"]),
  items: z.array(checklistItemSchema).default([]),
});

export const updateChecklistTemplateSchema = createChecklistTemplateSchema.partial();

export type CreateChecklistTemplateForm = z.infer<typeof createChecklistTemplateSchema>;
export type UpdateChecklistTemplateForm = z.infer<typeof updateChecklistTemplateSchema>;
export type ChecklistItemForm = z.infer<typeof checklistItemSchema>;
