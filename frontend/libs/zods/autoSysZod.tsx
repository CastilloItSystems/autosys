import { array, boolean, date, number, object, string, union, z } from "zod";

export const autoSysSchema = object({
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
