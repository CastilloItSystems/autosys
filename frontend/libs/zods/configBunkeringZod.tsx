import { array, boolean, number, object, string } from "zod";

export const bunkeringSchema = object({
  nombre: string().min(1, "El nombre es obligatorio"),
  estado: string().min(1, "Debes seleccionar un estado").optional(),
  ubicacion: string().min(1, "La ubicación es obligatoria"),
  nit: string().min(1, "El NIT es obligatorio"),
  img: string().url("La URL de la imagen es inválida"),
  createdAt: string().optional(),
  updatedAt: string().optional(),
  id: string().optional(),
  idRefineria: object({
    id: string(),
    nombre: string(),
  }).optional(),
  material: array(
    object({
      estadoMaterial: string(),
      posicion: string(),
      nombre: string(),
    })
  ).optional(),
});

export const muelleSchema = object({
  _id: string().optional(),
  ubicacion: string().min(1, "La ubicación es obligatoria"),
  correo: string().email("Correo inválido"),
  telefono: string().min(7, "El teléfono es obligatorio"),
  nombre: string().min(1, "El nombre es obligatorio"),
  nit: string().min(1, "El NIT es obligatorio"),
  legal: string().min(1, "El representante legal es obligatorio"),
  img: string().url("La URL de la imagen es inválida"),
  estado: string().min(1, "El estado es obligatorio"),
  idBunkering: object({
    id: string().optional(),
    nombre: string().min(1, "El nombre de la refinería es obligatorio"),
  }).optional(),
  eliminado: boolean().optional(),

  createdAt: string().optional(),
  updatedAt: string().optional(),
  id: string().optional(),
});

export const lineaRecepcionBKSchema = object({
  id: string().optional(),
  nombre: string().min(1, "El nombre es obligatorio"),
  estado: string().min(1, "El estado es obligatorio"),
  eliminado: boolean().default(false),
  ubicacion: string().min(1, "La ubicación es obligatoria").optional(),
  idMuelle: object({
    id: string().optional(),
    nombre: string().optional(),
  }).optional(),
  createdAt: string().optional(),
  updatedAt: string().optional(),
  idRefineria: object({
    id: string().optional(),
  }).optional(),
});

export const lineaDespachoBKSchema = object({
  id: string().optional(),
  nombre: string().min(1, "El nombre es obligatorio"),
  estado: string().min(1, "El estado es obligatorio"),
  eliminado: boolean().default(false),
  ubicacion: string().min(1, "La ubicación es obligatoria").optional(),
  idMuelle: object({
    id: string().optional(),
    nombre: string().optional(),
  }).optional(),
  createdAt: string().optional(),
  updatedAt: string().optional(),
  idRefineria: object({
    id: string().optional(),
  }).optional(),
});

export const productoBKSchema = object({
  idRefineria: object({
    id: string().optional(),
    nombre: string().min(1, "El nombre de la refinería es obligatorio"),
  }).optional(),
  nombre: string().min(1, "El nombre es obligatorio"),
  color: string().min(1, "El color es obligatorio"),
  estado: string().min(1, "El estado es obligatorio").optional(),
  posicion: number().min(1, "La capacidad es obligatoria"),
  tipoMaterial: string()
    .min(1, "El tipo de material es obligatorio")
    .default("Derivado"),
  eliminado: boolean().default(false),
  id: string().optional(),
});

// TanqueBK Schema
export const tanqueBKSchema = object({
  _id: string().optional(),
  idEmbarcacion: object({
    _id: string(),
    nombre: string(),

    id: string(),
  }).optional(),
  capacidad: number(),
  almacenamiento: number(),
  nombre: string(),
  ubicacion: string(),
  eliminado: boolean().default(false),

  id: string().optional(),
});

// Embarcacion Schema
export const embarcacionSchema = object({
  _id: string().optional(),
  idBunkering: object({
    id: string(),
    nombre: string(),
  }).optional(),
  capacidad: number(),
  nombre: string(),
  imo: string(),
  tipo: string(),
  tanques: array(tanqueBKSchema).optional(),
  estado: string().optional(),
  eliminado: boolean().default(false),

  id: string().optional(),
});
