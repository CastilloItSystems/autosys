import { z } from "zod";

export const supplierBillItemInputSchema = z.object({
  itemId: z.string().nullable().optional(),
  itemName: z.string().nullable().optional(),
  quantity: z
    .number({ required_error: "La cantidad es requerida" })
    .positive("Debe ser mayor a 0"),
  unitCost: z
    .number({ required_error: "El costo unitario es requerido" })
    .positive("Debe ser mayor a 0"),
  discountPercent: z.number().min(0).max(100).optional(),
  taxType: z.enum(["IVA", "EXEMPT", "REDUCED"]).optional(),
  taxRate: z.number().min(0).optional(),
  notes: z.string().nullable().optional(),
});

export const createSupplierBillSchema = z.object({
  billNumber: z.string().min(1, "El número de factura es requerido").max(50),
  supplierId: z.string().min(1, "El proveedor es requerido"),
  purchaseOrderId: z.string().optional(),
  currency: z.enum(["USD", "VES", "EUR"], {
    required_error: "La moneda es requerida",
  }),
  exchangeRate: z.number().positive().optional(),
  subtotal: z.number({ required_error: "El subtotal es requerido" }).min(0),
  taxAmount: z.number().min(0).optional(),
  total: z
    .number({ required_error: "El total es requerido" })
    .positive("El total debe ser mayor a 0"),
  issueDate: z.string().min(1, "La fecha de emisión es requerida"),
  dueDate: z.string().optional(),
  notes: z.string().max(500).optional(),
  items: z
    .array(supplierBillItemInputSchema)
    .min(1, "Debe incluir al menos un ítem"),
});

export const updateSupplierBillSchema = createSupplierBillSchema.partial();

export const registerSupplierInvoiceSchema = z.object({
  billNumber: z.string().min(1, "El número de factura es requerido").max(50),
  issueDate: z.string().min(1, "La fecha de emisión es requerida"),
  dueDate: z.string().nullable().optional(),
  attachmentUrl: z.string().optional(),
  notes: z.string().max(500).optional(),
  subtotal: z.number().min(0).optional(),
  taxAmount: z.number().min(0).optional(),
  total: z.number().positive().optional(),
});

export type CreateSupplierBillFormValues = z.infer<
  typeof createSupplierBillSchema
>;
export type UpdateSupplierBillFormValues = z.infer<
  typeof updateSupplierBillSchema
>;
export type RegisterSupplierInvoiceFormValues = z.infer<
  typeof registerSupplierInvoiceSchema
>;
export type SupplierBillItemInputFormValues = z.infer<
  typeof supplierBillItemInputSchema
>;
