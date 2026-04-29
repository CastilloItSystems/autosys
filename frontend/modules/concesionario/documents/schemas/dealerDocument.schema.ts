import { z } from "zod";

export const dealerDocumentSchema = z.object({
  referenceType: z
    .string({ required_error: "Tipo de referencia requerido" })
    .min(1, "Tipo de referencia requerido"),
  referenceId: z.string().optional(),
  documentType: z
    .string({ required_error: "Tipo de documento requerido" })
    .min(1, "Tipo de documento requerido"),
  name: z
    .string({ required_error: "Nombre requerido" })
    .min(1, "Nombre requerido"),
  fileUrl: z
    .string({ required_error: "URL del archivo requerida" })
    .min(1, "URL del archivo requerida"),
  status: z
    .string({ required_error: "Estatus requerido" })
    .min(1, "Estatus requerido"),
});

export type DealerDocumentSchema = z.infer<typeof dealerDocumentSchema>;
