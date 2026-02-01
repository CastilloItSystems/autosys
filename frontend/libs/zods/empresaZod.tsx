import { z } from "zod";

export const empresaSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  direccion: z.string().optional(),
  telefonos: z.string().optional(),
  fax: z.string().optional(),
  numerorif: z.string().optional(),
  numeronit: z.string().optional(),
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
  contacto: z.string().optional(),
  predeter: z.boolean().default(false),
  soporte1: z.string().optional(),
  soporte2: z.string().optional(),
  soporte3: z.string().optional(),
  data_usaweb: z.boolean().default(false),
  data_servidor: z.string().optional(),
  data_usuario: z.string().optional(),
  data_password: z.string().optional(),
  data_port: z.string().optional(),
  licencia: z.string().optional(),
  historizada: z.boolean().default(false),
  masinfo: z.string().optional(),
  usa_prefijo: z.boolean().default(false),
  name_prefijo: z.string().optional(),
  dprefijobd: z.string().optional(),
  dprefijosrv: z.string().optional(),
  dprefijousr: z.string().optional(),
});

export type EmpresaFormData = z.infer<typeof empresaSchema>;
