import { z } from "zod";

export const vehicleBrandSchema = z.object({
  id: z.string().optional(),
  _id: z.string().optional(),
  nombre: z.string().min(2, "Nombre requerido").max(50, "Nombre muy largo"),
  paisOrigen: z.string().optional(),
  logo: z.string().url("URL inválida").optional().or(z.literal("")),
  estado: z.enum(["activo", "inactivo"]).default("activo"),
  eliminado: z.boolean().optional(),
  createdBy: z.string().optional(),
  historial: z.array(z.any()).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const vehicleModelSchema = z.object({
  id: z.string().optional(),
  _id: z.string().optional(),
  brand: z.union([z.string().min(1, "Marca requerida"), vehicleBrandSchema]),
  nombre: z.string().min(2, "Nombre requerido").max(50, "Nombre muy largo"),
  tipo: z.enum([
    "sedan",
    "hatchback",
    "pickup",
    "suv",
    "coupe",
    "convertible",
    "wagon",
    "van",
  ]),
  motor: z.enum(["gasolina", "diesel", "electrico", "hibrido"]),
  yearInicio: z
    .number()
    .min(1900)
    .max(new Date().getFullYear() + 1)
    .optional(),
  yearFin: z
    .number()
    .min(1900)
    .max(new Date().getFullYear() + 10)
    .nullable()
    .optional(),
  estado: z.enum(["activo", "inactivo"]).default("activo"),
  eliminado: z.boolean().optional(),
  createdBy: z.string().optional(),
  historial: z.array(z.any()).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const vehicleSchema = z.object({
  id: z.string().optional(),
  _id: z.string().optional(),
  customer: z.union([
    z.string().min(1, "Cliente requerido"),
    z.object({
      id: z.string(),
      _id: z.string(),
      nombre: z.string(),
      telefono: z.string().optional(),
      correo: z.string().optional(),
      rif: z.string().optional(),
      nombreCompleto: z.string().optional(),
    }),
  ]),
  model: z.union([z.string().min(1, "Modelo requerido"), vehicleModelSchema]),
  year: z
    .number()
    .min(1900)
    .max(new Date().getFullYear() + 1, "Año inválido"),
  placa: z.string().min(3, "Placa requerida").max(20, "Placa muy larga"),
  vin: z.string().optional(),
  color: z.string().min(2, "Color requerido").max(30, "Color muy largo"),
  kilometraje: z.number().min(0, "Kilometraje debe ser positivo"),
  estado: z.enum(["activo", "inactivo"]).default("activo"),
  eliminado: z.boolean().optional(),
  createdBy: z.any().optional(),
  historial: z.array(z.any()).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type VehicleBrandFormData = z.infer<typeof vehicleBrandSchema>;
export type VehicleModelFormData = z.infer<typeof vehicleModelSchema>;
export type VehicleFormData = z.infer<typeof vehicleSchema>;
