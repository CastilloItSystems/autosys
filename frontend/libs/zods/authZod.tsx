import { number, object, string } from "zod";

export const loginSchema = object({
  correo: string().email("Correo inválido"),
  password: string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export const registerSchema = object({
  fullname: string().nonempty("El nombre de usuario es obligatorio"),
  email: string()
    .email("El correo electrónico no es válido")
    .nonempty("El correo electrónico es obligatorio"),
  password: string()
    .min(6, "La contraseña debe tener al menos 6 caracteres")
    .nonempty("La contraseña es obligatoria"),
});

export const usuarioSchema = object({
  nombre: string().min(1, "El nombre es obligatorio"),
  correo: string().email("Correo electrónico inválido"),
  telefono: string()
    .nonempty("El teléfono es obligatorio")
    .min(8, "El teléfono debe tener al menos 8 dígitos")
    .max(15, "El teléfono no puede exceder los 15 dígitos")
    .regex(/^\+[1-9]\d+$/, {
      message:
        "Formato inválido. Use: +[código país][número]. Ej: +584248286102",
    }),
  password: string()
    .optional()
    .refine((val) => val === undefined || val.length >= 6, {
      message:
        "La contraseña debe tener al menos 6 caracteres si se proporciona",
    }),
  rol: string().min(1, "Debes seleccionar un rol"),
  estado: string().min(1, "Debes seleccionar un estado"),
  acceso: string().min(1, "Debes seleccionar un acceso"),
  idRefineria: string().array().optional(),
  departamento: string()
    .array()
    .min(1, "Debes seleccionar al menos un departamento"),
});
export const profileSchema = object({
  nombre: string().min(1, "El nombre es obligatorio"),

  telefono: string()
    .nonempty("El teléfono es obligatorio")
    .min(8, "El teléfono debe tener al menos 8 dígitos")
    .max(15, "El teléfono no puede exceder los 15 dígitos")
    .regex(/^\+[1-9]\d+$/, {
      message:
        "Formato inválido. Use: +[código país][número]. Ej: +584248286102",
    }),

  idRefineria: string().array().optional(),
});
