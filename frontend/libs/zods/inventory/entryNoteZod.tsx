import { z } from "zod";

export const entryTypeEnum = z.enum(
  [
    "PURCHASE",
    "RETURN",
    "TRANSFER",
    "WARRANTY_RETURN",
    "LOAN_RETURN",
    "ADJUSTMENT_IN",
    "DONATION",
    "SAMPLE",
    "OTHER",
  ],
  { errorMap: () => ({ message: "Selecciona un tipo de entrada válido" }) },
);

export const entryNoteStatusEnum = z.enum(
  ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
  { errorMap: () => ({ message: "Selecciona un estado válido" }) },
);

export const createEntryNoteItemSchema = z.object({
  itemId: z.string().min(1, "El artículo es requerido"),
  itemName: z.string().min(1, "El nombre del artículo es requerido"),
  quantityReceived: z.number().min(1, "La cantidad debe ser mayor a 0"),
  unitCost: z.number().min(0, "El costo unitario debe ser mayor o igual a 0"),
  storedToLocation: z.string().optional(),
  batchNumber: z.string().optional(),
  expiryDate: z.date().optional().nullable(),
  notes: z.string().optional(),
  // Fields used for PO validation in the frontend (not sent to backend)
  _maxQuantity: z.number().optional(),
});

/**
 * Schema base (sin refine) – items are optional arrays.
 * The real validation happens at the superRefine level.
 */
export const createEntryNoteSchema = z
  .object({
    type: entryTypeEnum.default("TRANSFER"),
    warehouseId: z.string().min(1, "El almacén es requerido"),
    purchaseOrderId: z.string().optional().nullable(),
    catalogSupplierId: z.string().optional().nullable(),
    supplierName: z.string().optional(),
    supplierId: z.string().optional(),
    supplierPhone: z.string().optional(),
    reason: z.string().optional(),
    reference: z.string().optional(),
    notes: z.string().optional(),
    receivedBy: z.string().optional(),
    authorizedBy: z.string().optional(),
    items: z.array(createEntryNoteItemSchema).default([]),
  })
  .superRefine((data, ctx) => {
    // Items are required
    if (!data.items || data.items.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Debe agregar al menos un artículo",
        path: ["items"],
      });
    }
  });

export const updateEntryNoteSchema = z.object({
  status: entryNoteStatusEnum.optional(),
  notes: z.string().optional().nullable(),
  receivedBy: z.string().optional().nullable(),
  verifiedBy: z.string().optional().nullable(),
  authorizedBy: z.string().optional().nullable(),
  supplierName: z.string().optional().nullable(),
  supplierId: z.string().optional().nullable(),
  supplierPhone: z.string().optional().nullable(),
  reason: z.string().optional().nullable(),
  reference: z.string().optional().nullable(),
});

export type CreateEntryNoteInput = z.infer<typeof createEntryNoteSchema>;
export type UpdateEntryNoteInput = z.infer<typeof updateEntryNoteSchema>;
export type CreateEntryNoteItemInput = z.infer<
  typeof createEntryNoteItemSchema
>;
