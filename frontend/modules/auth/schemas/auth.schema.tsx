import { number, object, string } from "zod";

export const loginSchema = object({
  email: string().email("Invalid email"),
  password: string().min(6, "Password must be at least 6 characters"),
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
  name: string().min(1, "El nombre es obligatorio"),
  email: string().email("Correo electrónico inválido"),
  phone: string()
    .nonempty("El teléfono es obligatorio")
    .min(8, "El teléfono debe tener al menos 8 dígitos")
    .max(20, "El teléfono no puede exceder los 20 dígitos")
    .regex(/^[\d\+\-\s]+$/, {
      message: "El teléfono solo puede contener números, guiones y el signo +",
    }),
  password: string()
    .optional()
    .refine((val) => val === undefined || val.length >= 6, {
      message:
        "La contraseña debe tener al menos 6 caracteres si se proporciona",
    }),
  rol: string().optional(),
  status: string().min(1, "Debes seleccionar un estado"),
  access: string().min(1, "Debes seleccionar un acceso"),
  idEmpresas: string().array().optional(),
  departments: string()
    .array()
    .min(1, "Debes seleccionar al menos un departamento"),
});
export const profileSchema = object({
  name: string().min(1, "El nombre es obligatorio"),

  phone: string()
    .nonempty("El teléfono es obligatorio")
    .min(8, "El teléfono debe tener al menos 8 dígitos")
    .max(20, "El teléfono no puede exceder los 20 dígitos")
    .regex(/^[\d\+\-\s]+$/, {
      message: "El teléfono solo puede contener números, guiones y el signo +",
    }),

  idRefineria: string().array().optional(),
});
