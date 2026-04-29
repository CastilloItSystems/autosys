import { z } from "zod";

export const empresaSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  address: z.string().optional(),
  phones: z.string().optional(),
  fax: z.string().optional(),
  rif: z.string().optional(),
  nit: z.string().optional(),
  website: z
    .string()
    .url("Debe ser una URL válida")
    .optional()
    .or(z.literal("")),
  email: z
    .string()
    .email("Debe ser un email válido")
    .optional()
    .or(z.literal("")),
  contact: z.string().optional(),
  isDefault: z.boolean().default(false),
  support1: z.string().optional(),
  support2: z.string().optional(),
  support3: z.string().optional(),
  usesWeb: z.boolean().default(false),
  dbServer: z.string().optional(),
  dbUser: z.string().optional(),
  dbPassword: z.string().optional(),
  dbPort: z.string().optional(),
  license: z.string().optional(),
  archived: z.boolean().default(false),
  additionalInfo: z.string().optional(),
  usesPrefix: z.boolean().default(false),
  prefixName: z.string().optional(),
  dbPrefix: z.string().optional(),
  serverPrefix: z.string().optional(),
  userPrefix: z.string().optional(),
  logoUrl: z.string().optional(),
});

export type EmpresaFormData = z.infer<typeof empresaSchema>;
