import { array, boolean, date, number, object, string, union, z } from "zod";

export const workshopSchema = object({
  nombre: string()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(50, "El nombre no puede exceder los 50 caracteres"),
  estado: string().min(1, "Debes seleccionar un estado").optional(),
  ubicacion: string()
    .min(3, "La ubicación debe tener al menos 3 caracteres")
    .max(100, "La ubicación no puede exceder los 100 caracteres"),
  telefono: string()
    .min(3, "El teléfono debe tener al menos 3 caracteres")
    .max(15, "El teléfono no puede exceder los 15 caracteres")
    .optional(),
  procesamientoDia: number()
    .min(0, "La capacidad no puede ser negativa")
    .optional(),
  rif: string()
    .min(5, "El RIF debe tener al menos 5 caracteres")
    .max(20, "El RIF no puede exceder los 20 caracteres"),
  legal: string()
    .min(3, "El representante legal debe tener al menos 3 caracteres")
    .max(50, "El representante legal no puede exceder los 50 caracteres")
    .optional(),
  img: string().url("La URL de la imagen es inválida").optional(),
  createdAt: string().optional(),
  updatedAt: string().optional(),
  id: string().optional(),
});

// Work Order Status Schema
export const workOrderStatusSchema = object({
  nombre: string().min(1, "El nombre es requerido"),
  descripcion: string().optional(),
  color: string().optional(),
  orden: number().min(0, "El orden debe ser mayor o igual a 0"),
  estado: z.enum(["activo", "inactivo"]).optional(),
});

export type WorkOrderStatusFormData = z.infer<typeof workOrderStatusSchema>;

// Service Schema
export const serviceSchema = object({
  name: string().min(1, "El nombre del servicio es requerido"),
  description: string().min(1, "La descripción es requerida"),
  price: number().min(0, "El precio debe ser mayor o igual a 0"),
  category: string().min(1, "La categoría es requerida"),
  estimatedHours: number()
    .min(0, "Las horas estimadas deben ser mayor o igual a 0")
    .optional(),
  estado: z.enum(["activo", "inactivo"]).optional(),
});

export type ServiceFormData = z.infer<typeof serviceSchema>;

// Work Order Item Schema
export const workOrderItemSchema = object({
  service: union([
    string(),
    object({
      _id: string(),
      name: string(),
    }),
  ]).optional(),
  item: union([
    string(),
    object({
      _id: string(),
      nombre: string(),
    }),
  ]).optional(),
  description: string().min(1, "La descripción es requerida"),
  quantity: number().min(1, "La cantidad debe ser mayor a 0"),
  unitPrice: number().min(0, "El precio unitario debe ser mayor o igual a 0"),
  totalPrice: number().min(0, "El precio total debe ser mayor o igual a 0"),
  type: z.enum(["service", "part"]),
  estado: z.enum(["activo", "inactivo"]).optional(),
});

export type WorkOrderItemFormData = z.infer<typeof workOrderItemSchema>;

// Work Order Schema
export const workOrderSchema = object({
  workOrderNumber: string().min(1, "El número de orden es requerido"),
  customer: union([
    string(),
    object({
      _id: string(),
      nombre: string(),
    }),
  ]),
  vehicle: union([
    string(),
    object({
      _id: string(),
      placa: string(),
    }),
  ]),
  technician: union([
    string(),
    object({
      _id: string(),
      nombre: string(),
    }),
  ]).optional(),
  status: union([
    string(),
    object({
      _id: string(),
      nombre: string(),
    }),
  ]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  description: string().min(1, "La descripción es requerida"),
  estimatedCompletionDate: date().optional(),
  actualCompletionDate: date().optional(),
  totalAmount: number().min(0, "El monto total debe ser mayor o igual a 0"),
  items: array(workOrderItemSchema).optional(),
  notes: string().optional(),
  estado: z.enum(["activo", "inactivo"]).optional(),
});

export type WorkOrderFormData = z.infer<typeof workOrderSchema>;

// Invoice Item Schema (embedded)
export const invoiceItemSchema = object({
  description: string().min(1, "La descripción es requerida"),
  quantity: number().min(1, "La cantidad debe ser mayor a 0"),
  unitPrice: number().min(0, "El precio unitario debe ser mayor o igual a 0"),
  totalPrice: number().min(0, "El precio total debe ser mayor o igual a 0"),
  type: z.enum(["service", "part"]),
  reference: string().optional(),
});

// Invoice Schema
export const invoiceSchema = object({
  invoiceNumber: string().min(1, "El número de factura es requerido"),
  workOrder: union([
    string(),
    object({
      _id: string(),
      workOrderNumber: string(),
    }),
  ]).optional(),
  customer: union([
    string(),
    object({
      _id: string(),
      nombre: string(),
    }),
  ]),
  issueDate: date(),
  dueDate: date(),
  subtotal: number().min(0, "El subtotal debe ser mayor o igual a 0"),
  tax: number().min(0, "El impuesto debe ser mayor o igual a 0"),
  discount: number().min(0, "El descuento debe ser mayor o igual a 0"),
  total: number().min(0, "El total debe ser mayor o igual a 0"),
  status: z.enum([
    "borrador",
    "emitida",
    "pagada_parcial",
    "pagada_total",
    "vencida",
    "cancelada",
  ]),
  items: array(invoiceItemSchema),
  notes: string().optional(),
});

export type InvoiceFormData = z.infer<typeof invoiceSchema>;

// Payment Schema
export const paymentSchema = object({
  invoice: union([
    string(),
    object({
      _id: string(),
      invoiceNumber: string(),
    }),
  ]),
  amount: number().min(0.01, "El monto debe ser mayor a 0"),
  paymentDate: date(),
  paymentMethod: z.enum(["efectivo", "tarjeta", "transferencia", "cheque"]),
  reference: string().optional(),
  notes: string().optional(),
  status: z.enum(["confirmado", "pendiente", "rechazado", "cancelado"]),
});

export type PaymentFormData = z.infer<typeof paymentSchema>;

// Change Status Schema
export const changeStatusSchema = object({
  status: string().min(1, "El estado es requerido"),
  notes: string().optional(),
});

export type ChangeStatusFormData = z.infer<typeof changeStatusSchema>;
