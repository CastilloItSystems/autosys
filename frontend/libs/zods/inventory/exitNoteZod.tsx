import { z } from "zod";
import { ExitNoteType } from "@/libs/interfaces/inventory/exitNote.interface";

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const createExitNoteItemSchema = z.object({
  itemId: z
    .string()
    .min(1, "El artículo es requerido")
    .regex(uuidRegex, "Debe seleccionar un artículo válido de la lista"),
  itemName: z.string().optional().default(""),
  quantity: z.number().min(1, "La cantidad debe ser mayor a 0"),
  pickedFromLocation: z.string().optional(),
  batchId: z.string().optional(),
  serialNumberId: z.string().optional(),
  notes: z.string().optional(),
});

export const createExitNoteSchema = z.object({
  type: z.nativeEnum(ExitNoteType, {
    errorMap: () => ({ message: "Tipo de salida inválido" }),
  }),
  warehouseId: z
    .string()
    .min(1, "El almacén es requerido")
    .regex(uuidRegex, "Almacén inválido"),
  preInvoiceId: z.string().optional(),
  recipientName: z.string().optional(),
  recipientId: z.string().optional(),
  recipientPhone: z.string().optional(),
  reason: z.string().optional(),
  reference: z.string().optional(),
  expectedReturnDate: z.date().optional().nullable(),
  notes: z.string().optional(),
  authorizedBy: z.string().optional(),
  items: z
    .array(createExitNoteItemSchema)
    .min(1, "Debe agregar al menos un ítem"),
});

export type CreateExitNoteInput = z.infer<typeof createExitNoteSchema>;
