"use client";

import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Dropdown } from "primereact/dropdown";
import { MultiSelect } from "primereact/multiselect";
import { Checkbox } from "primereact/checkbox";
import { classNames } from "primereact/utils";
import PhoneInput from "../common/PhoneInput";

import {
  createUser,
  updateUser,
  CreateUserRequest,
  UpdateUserRequest,
  User,
} from "@/app/api/userService";
import { handleFormError } from "@/utils/errorHandlers";
import {
  PasswordRequirements,
  passwordValidator,
  optionalPasswordValidator,
} from "./PasswordRequirements";

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

const createUserSchema = z
  .object({
    ...baseUsuarioSchema,
    password: passwordValidator,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

const updateUserSchema = z
  .object({
    ...baseUsuarioSchema,
    password: optionalPasswordValidator,
    confirmPassword: z.string().optional(),
  })
  .refine(
    (data) => {
      // Solo validamos coincidencia si se ingresó algo en la contraseña
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

type FormData = z.infer<typeof createUserSchema> &
  z.infer<typeof updateUserSchema>;

interface UsuarioFormProps {
  usuario?: User | null;
  onSave: () => void | Promise<void>;
  toast: React.RefObject<any>;
  formId?: string; // Permite inyectar un ID dinámico al form para conectarlo con botones externos
  onSubmittingChange?: (isSubmitting: boolean) => void;
}

const estatusValues = [
  { label: "Activo", value: "activo" },
  { label: "Pendiente", value: "pendiente" },
  { label: "Suspendido", value: "suspendido" },
];

const accesoValues = [
  { label: "Completo", value: "completo" },
  { label: "Limitado", value: "limitado" },
  { label: "Ninguno", value: "ninguno" },
];

const departamentoValues = [
  { label: "Ventas", value: "ventas" },
  { label: "Inventario", value: "inventario" },
  { label: "Administración", value: "administracion" },
  { label: "Servicios", value: "servicios" },
  { label: "Gerencia", value: "gerencia" },
];

const UsuarioForm = ({
  usuario,
  onSave,
  toast,
  formId = "usuario-form",
  onSubmittingChange,
}: UsuarioFormProps) => {
  const currentSchema = usuario ? updateUserSchema : createUserSchema;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    reset,
    control,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(currentSchema),
    mode: "onBlur",
    defaultValues: {
      nombre: "",
      correo: "",
      telefono: "",
      departamento: [],
      acceso: "ninguno",
      estado: "activo",
      isTechnician: false,
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (usuario) {
      reset({
        nombre: usuario.nombre ?? "",
        correo: usuario.correo ?? "",
        telefono: usuario.telefono ?? "",
        departamento: usuario.departamento ?? [],
        acceso: usuario.acceso,
        estado: usuario.estado,
        isTechnician: usuario.isTechnician ?? false,
        password: "",
        confirmPassword: "",
      });
    } else {
      reset({
        nombre: "",
        correo: "",
        telefono: "",
        departamento: [],
        acceso: "ninguno",
        estado: "activo",
        isTechnician: false,
        password: "",
        confirmPassword: "",
      });
    }
  }, [usuario, reset]);

  const onSubmit = async (data: FormData) => {
    if (onSubmittingChange) onSubmittingChange(true);
    try {
      const departamentoArray = data.departamento;

      if (usuario?.id) {
        const payload: UpdateUserRequest = {
          nombre: data.nombre,
          correo: data.correo,
          telefono: data.telefono || null,
          departamento: departamentoArray,
          acceso: data.acceso,
          estado: data.estado,
          isTechnician: data.isTechnician ?? false,
          ...(data.password ? { password: data.password } : {}),
        };

        await updateUser(usuario.id, payload);

        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Usuario actualizado correctamente",
          life: 3000,
        });
      } else {
        const payload: CreateUserRequest = {
          nombre: data.nombre,
          correo: data.correo,
          telefono: data.telefono || undefined,
          departamento: departamentoArray,
          acceso: data.acceso,
          estado: data.estado,
          password: data.password!, // Validado por createUserSchema
        };

        await createUser(payload);

        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Usuario creado correctamente",
          life: 3000,
        });
      }

      await onSave();
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      if (onSubmittingChange) onSubmittingChange(false);
    }
  };

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)} className="p-fluid">
      <div className="grid">
        {/* Nombre */}
        <div className="col-12 md:col-6">
          <label htmlFor="nombre" className="block text-900 font-medium mb-2">
            Nombre <span className="text-red-500">*</span>
          </label>
          <Controller
            name="nombre"
            control={control}
            render={({ field }) => (
              <InputText
                id="nombre"
                {...field}
                className={classNames("w-full", { "p-invalid": errors.nombre })}
                placeholder="Ej: Juan Pérez"
              />
            )}
          />
          {errors.nombre && (
            <small className="p-error block mt-1">
              {errors.nombre.message}
            </small>
          )}
        </div>

        {/* Correo */}
        <div className="col-12 md:col-6">
          <label htmlFor="correo" className="block text-900 font-medium mb-2">
            Correo <span className="text-red-500">*</span>
          </label>
          <Controller
            name="correo"
            control={control}
            render={({ field }) => (
              <InputText
                id="correo"
                {...field}
                className={classNames("w-full", { "p-invalid": errors.correo })}
                placeholder="Ej: correo@empresa.com"
              />
            )}
          />
          {errors.correo && (
            <small className="p-error block mt-1">
              {errors.correo.message}
            </small>
          )}
        </div>

        {/* Teléfono */}
        <div className="col-12 md:col-6">
          <label htmlFor="telefono" className="block text-900 font-medium mb-2">
            Teléfono
          </label>
          <Controller
            name="telefono"
            control={control}
            render={({ field }) => (
              <PhoneInput
                value={field.value ?? ""}
                onChange={field.onChange}
                className={classNames("w-full", {
                  "p-invalid": errors.telefono,
                })}
              />
            )}
          />
          {errors.telefono && (
            <small className="p-error block mt-1">
              {errors.telefono.message}
            </small>
          )}
        </div>

        {/* Departamento */}
        <div className="col-12 md:col-6">
          <label
            htmlFor="departamento"
            className="block text-900 font-medium mb-2"
          >
            Departamento <span className="text-red-500">*</span>
          </label>
          <Controller
            name="departamento"
            control={control}
            render={({ field }) => (
              <MultiSelect
                id="departamento"
                value={field.value}
                options={departamentoValues}
                onChange={(e) => field.onChange(e.value)}
                optionLabel="label"
                optionValue="value"
                placeholder="Seleccione departamentos"
                display="chip"
                className={classNames("w-full", {
                  "p-invalid": errors.departamento,
                })}
              />
            )}
          />
          {errors.departamento && (
            <small className="p-error block mt-1">
              {errors.departamento.message}
            </small>
          )}
        </div>

        {/* Acceso */}
        <div className="col-12 md:col-6">
          <label htmlFor="acceso" className="block text-900 font-medium mb-2">
            Acceso
          </label>
          <Controller
            name="acceso"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="acceso"
                value={field.value}
                options={accesoValues}
                onChange={(e) => field.onChange(e.value)}
                optionLabel="label"
                optionValue="value"
                placeholder="Seleccione un acceso"
                className={classNames("w-full", { "p-invalid": errors.acceso })}
              />
            )}
          />
          {errors.acceso && (
            <small className="p-error block mt-1">
              {errors.acceso.message}
            </small>
          )}
        </div>

        {/* Estado */}
        <div className="col-12 md:col-6">
          <label htmlFor="estado" className="block text-900 font-medium mb-2">
            Estado
          </label>
          <Controller
            name="estado"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="estado"
                value={field.value}
                options={estatusValues}
                onChange={(e) => field.onChange(e.value)}
                optionLabel="label"
                optionValue="value"
                placeholder="Seleccione un estado"
                className={classNames("w-full", { "p-invalid": errors.estado })}
              />
            )}
          />
          {errors.estado && (
            <small className="p-error block mt-1">
              {errors.estado.message}
            </small>
          )}
        </div>

        {/* Es técnico */}
        <div className="col-12 md:col-6">
          <label className="block text-900 font-medium mb-2">
            Rol de técnico
          </label>
          <Controller
            name="isTechnician"
            control={control}
            render={({ field }) => (
              <div className="flex align-items-center gap-2 mt-2">
                <Checkbox
                  inputId="isTechnician"
                  checked={field.value ?? false}
                  onChange={(e) => field.onChange(e.checked)}
                />
                <label htmlFor="isTechnician" className="cursor-pointer">
                  Es técnico de taller
                </label>
              </div>
            )}
          />
        </div>

        {/* Password */}
        <div className="col-12 md:col-6">
          <label htmlFor="password" className="block text-900 font-medium mb-2">
            {usuario ? "Nueva contraseña (opcional)" : "Contraseña"}
            {!usuario && <span className="text-red-500"> *</span>}
          </label>
          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <Password
                id="password"
                toggleMask
                feedback={false}
                className={classNames("w-full", {
                  "p-invalid": errors.password,
                })}
                inputClassName="w-full"
                value={field.value || ""}
                onChange={(e) => field.onChange(e.target.value)}
                onBlur={field.onBlur}
              />
            )}
          />
          {errors.password && (
            <small className="p-error block mt-1">
              {errors.password.message}
            </small>
          )}
        </div>

        {/* Confirmar Password */}
        <div className="col-12 md:col-6">
          <label
            htmlFor="confirmPassword"
            className="block text-900 font-medium mb-2"
          >
            Confirmar contraseña
            {!usuario && <span className="text-red-500"> *</span>}
          </label>
          <Controller
            name="confirmPassword"
            control={control}
            render={({ field }) => (
              <Password
                id="confirmPassword"
                toggleMask
                feedback={false}
                className={classNames("w-full", {
                  "p-invalid": errors.confirmPassword,
                })}
                inputClassName="w-full"
                value={field.value || ""}
                onChange={(e) => field.onChange(e.target.value)}
                onBlur={field.onBlur}
              />
            )}
          />
          {errors.confirmPassword && (
            <small className="p-error block mt-1">
              {errors.confirmPassword.message}
            </small>
          )}
        </div>

        {/* Requisitos */}
        <div className="col-12">
          {(!usuario || watch("password")) && (
            <PasswordRequirements
              password={watch("password")}
              confirmPassword={watch("confirmPassword")}
              showConfirm={true}
            />
          )}
        </div>
      </div>
    </form>
  );
};

export default UsuarioForm;
