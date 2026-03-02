import { z } from "zod";

export const createSupplierSchema = z.object({
  code: z
    .string()
    .min(2, "El código debe tener al menos 2 caracteres")
    .max(50, "El código no puede exceder 50 caracteres")
    .toUpperCase(),
  name: z
    .string()
    .min(1, "El nombre es obligatorio")
    .max(200, "El nombre no puede exceder 200 caracteres"),
  contactName: z
    .string()
    .max(100, "El contacto no puede exceder 100 caracteres")
    .nullable()
    .optional(),
  email: z
    .string()
    .email("Debe ser un correo válido")
    .max(100, "El correo no puede exceder 100 caracteres")
    .nullable()
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .max(20, "El teléfono no puede exceder 20 caracteres")
    .nullable()
    .optional(),
  address: z
    .string()
    .max(300, "La dirección no puede exceder 300 caracteres")
    .nullable()
    .optional(),
  taxId: z
    .string()
    .max(50, "El RIF/NIT no puede exceder 50 caracteres")
    .nullable()
    .optional(),
});

export const updateSupplierSchema = z.object({
  code: z
    .string()
    .min(2, "El código debe tener al menos 2 caracteres")
    .max(50, "El código no puede exceder 50 caracteres")
    .toUpperCase()
    .optional(),
  name: z
    .string()
    .min(1, "El nombre es obligatorio")
    .max(200, "El nombre no puede exceder 200 caracteres")
    .optional(),
  contactName: z
    .string()
    .max(100, "El contacto no puede exceder 100 caracteres")
    .nullable()
    .optional(),
  email: z
    .string()
    .email("Debe ser un correo válido")
    .max(100, "El correo no puede exceder 100 caracteres")
    .nullable()
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .max(20, "El teléfono no puede exceder 20 caracteres")
    .nullable()
    .optional(),
  address: z
    .string()
    .max(300, "La dirección no puede exceder 300 caracteres")
    .nullable()
    .optional(),
  taxId: z
    .string()
    .max(50, "El RIF/NIT no puede exceder 50 caracteres")
    .nullable()
    .optional(),
  isActive: z.boolean().optional(),
});

export type CreateSupplier = z.infer<typeof createSupplierSchema>;
export type UpdateSupplier = z.infer<typeof updateSupplierSchema>;

// Legacy: mantener supplierSchema para backward compatibility
export const supplierSchema = createSupplierSchema;
