import { z } from "zod";

// ── Validadores de contraseña ────────────────────────────────────────────────

export const passwordValidator = z
  .string()
  .min(6, { message: "La contraseña debe tener al menos 6 caracteres" })
  .refine(
    (val) => {
      let conditionsMet = 0;
      if (/[A-Z]/.test(val)) conditionsMet++;
      if (/[a-z]/.test(val)) conditionsMet++;
      if (/[0-9]/.test(val)) conditionsMet++;
      if (/[^A-Za-z0-9]/.test(val)) conditionsMet++;
      return conditionsMet >= 2;
    },
    {
      message:
        "Debe combinar al menos 2 tipos: mayúsculas, minúsculas, números o símbolos",
    },
  );

export const optionalPasswordValidator = z
  .string()
  .optional()
  .transform((val) => (val === "" ? undefined : val))
  .refine((val) => val === undefined || val.length >= 6, {
    message: "La contraseña debe tener al menos 6 caracteres",
  })
  .refine(
    (val) => {
      if (val === undefined) return true;
      let conditionsMet = 0;
      if (/[A-Z]/.test(val)) conditionsMet++;
      if (/[a-z]/.test(val)) conditionsMet++;
      if (/[0-9]/.test(val)) conditionsMet++;
      if (/[^A-Za-z0-9]/.test(val)) conditionsMet++;
      return conditionsMet >= 2;
    },
    {
      message:
        "Debe combinar al menos 2 tipos: mayúsculas, minúsculas, números o símbolos",
    },
  );

// ── Schemas de usuario ───────────────────────────────────────────────────────

const baseUsuarioSchema = {
  nombre: z.string().min(1, "El nombre es requerido"),
  correo: z.string().email("Correo inválido"),
  telefono: z.string().optional().or(z.literal("")),
  departamento: z
    .array(z.string())
    .min(1, "Seleccione al menos un departamento"),
  acceso: z.enum(["completo", "limitado", "ninguno"]),
  estado: z.enum(["activo", "pendiente", "suspendido"]),
  isTechnician: z.boolean().optional(),
};

export const createUserSchema = z
  .object({
    ...baseUsuarioSchema,
    password: passwordValidator,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export const updateUserSchema = z
  .object({
    ...baseUsuarioSchema,
    password: optionalPasswordValidator,
    confirmPassword: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.password) {
        return data.password === data.confirmPassword;
      }
      return true;
    },
    {
      message: "Las contraseñas no coinciden",
      path: ["confirmPassword"],
    },
  );

export type UserFormData = z.infer<typeof createUserSchema> &
  z.infer<typeof updateUserSchema>;

// ── Schema de cambio de contraseña ───────────────────────────────────────────

export const passwordSchema = z
  .object({
    newPassword: passwordValidator,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type PasswordFormData = z.infer<typeof passwordSchema>;

// ── Schema de membership ─────────────────────────────────────────────────────

export const membershipSchema = z.object({
  empresaId: z.string().min(1, "La empresa es requerida"),
  roleId: z.string().min(1, "El rol es requerido"),
  status: z.enum(["active", "invited", "suspended"]),
});

export type MembershipFormData = z.infer<typeof membershipSchema>;
