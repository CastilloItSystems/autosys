"use client";

import React, { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { classNames } from "primereact/utils";
import PhoneInput from "../common/PhoneInput";

import {
  createUser,
  updateUser,
  CreateUserRequest,
  UpdateUserRequest,
  User,
} from "@/app/api/userService";

const usuarioSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  correo: z.string().email("Correo inválido"),
  telefono: z.string().optional().or(z.literal("")),
  departamento: z.string().min(1, "El departamento es requerido"),
  acceso: z.enum(["completo", "limitado", "ninguno"]),
  estado: z.enum(["activo", "pendiente", "suspendido"]),
  password: z.string().optional(),
});

type FormData = z.infer<typeof usuarioSchema>;

interface UsuarioFormProps {
  usuario?: User | null;
  onSave: () => void;
  onCancel: () => void;
  toast: React.RefObject<any>;
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

const UsuarioForm = ({
  usuario,
  onSave,
  onCancel,
  toast,
}: UsuarioFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    reset,
    control,
  } = useForm<FormData>({
    resolver: zodResolver(usuarioSchema),
    defaultValues: {
      nombre: "",
      correo: "",
      telefono: "",
      departamento: "",
      acceso: "ninguno",
      estado: "activo",
      password: "",
    },
  });

  useEffect(() => {
    if (usuario) {
      reset({
        nombre: usuario.nombre ?? "",
        correo: usuario.correo ?? "",
        telefono: usuario.telefono ?? "",
        departamento: usuario.departamento?.join(", ") ?? "",
        acceso: usuario.acceso,
        estado: usuario.estado,
        password: "",
      });
    } else {
      reset({
        nombre: "",
        correo: "",
        telefono: "",
        departamento: "",
        acceso: "ninguno",
        estado: "activo",
        password: "",
      });
    }
  }, [usuario, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      const departamentoArray = data.departamento
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      if (usuario?.id) {
        const payload: UpdateUserRequest = {
          nombre: data.nombre,
          correo: data.correo,
          telefono: data.telefono || null,
          departamento: departamentoArray,
          acceso: data.acceso,
          estado: data.estado,
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
        if (!data.password || data.password.trim().length < 6) {
          toast.current?.show({
            severity: "warn",
            summary: "Validación",
            detail:
              "La contraseña es obligatoria y debe tener al menos 6 caracteres",
            life: 3000,
          });
          return;
        }

        const payload: CreateUserRequest = {
          nombre: data.nombre,
          correo: data.correo,
          telefono: data.telefono || undefined,
          departamento: departamentoArray,
          acceso: data.acceso,
          estado: data.estado,
          password: data.password,
        };

        await createUser(payload);

        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Usuario creado correctamente",
          life: 3000,
        });
      }

      onSave();
    } catch (error) {
      console.error("Error guardando usuario:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo guardar el usuario",
        life: 3000,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
      <div className="grid">
        {/* Nombre */}
        <div className="col-12 md:col-6">
          <label htmlFor="nombre" className="block font-medium mb-2">
            Nombre
          </label>
          <InputText
            id="nombre"
            {...register("nombre")}
            className={classNames({ "p-invalid": errors.nombre })}
          />
          {errors.nombre && (
            <small className="p-error">{errors.nombre.message}</small>
          )}
        </div>

        {/* Correo */}
        <div className="col-12 md:col-6">
          <label htmlFor="correo" className="block font-medium mb-2">
            Correo
          </label>
          <InputText
            id="correo"
            {...register("correo")}
            className={classNames({ "p-invalid": errors.correo })}
          />
          {errors.correo && (
            <small className="p-error">{errors.correo.message}</small>
          )}
        </div>

        {/* Teléfono */}
        <div className="col-12 md:col-6">
          <label htmlFor="telefono" className="block font-medium mb-2">
            Teléfono
          </label>
          <Controller
            name="telefono"
            control={control}
            render={({ field }) => (
              <PhoneInput
                value={field.value ?? ""}
                onChange={field.onChange}
                className={classNames({ "p-invalid": errors.telefono })}
              />
            )}
          />
          {errors.telefono && (
            <small className="p-error">{errors.telefono.message}</small>
          )}
        </div>

        {/* Departamento */}
        <div className="col-12 md:col-6">
          <label htmlFor="departamento" className="block font-medium mb-2">
            Departamento
          </label>
          <InputText
            id="departamento"
            {...register("departamento")}
            placeholder="Ej: ventas, inventario"
            className={classNames({ "p-invalid": errors.departamento })}
          />
          {errors.departamento && (
            <small className="p-error">{errors.departamento.message}</small>
          )}
        </div>

        {/* Acceso */}
        <div className="col-12 md:col-6">
          <label htmlFor="acceso" className="block font-medium mb-2">
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
                className={classNames({ "p-invalid": errors.acceso })}
              />
            )}
          />
          {errors.acceso && (
            <small className="p-error">{errors.acceso.message}</small>
          )}
        </div>

        {/* Estado */}
        <div className="col-12 md:col-6">
          <label htmlFor="estado" className="block font-medium mb-2">
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
                className={classNames({ "p-invalid": errors.estado })}
              />
            )}
          />
          {errors.estado && (
            <small className="p-error">{errors.estado.message}</small>
          )}
        </div>

        {/* Password */}
        <div className="col-12">
          <label htmlFor="password" className="block font-medium mb-2">
            {usuario ? "Nueva contraseña (opcional)" : "Contraseña"}
          </label>
          <InputText
            id="password"
            type="password"
            {...register("password")}
            className={classNames({ "p-invalid": errors.password })}
          />
          {errors.password && (
            <small className="p-error">{errors.password.message}</small>
          )}
          {!usuario && (
            <small className="text-500">
              La contraseña debe tener al menos 6 caracteres.
            </small>
          )}
        </div>

        {/* Botones */}
        <div className="col-12 flex justify-content-end gap-2 mt-4">
          <Button
            label="Cancelar"
            icon="pi pi-times"
            severity="secondary"
            onClick={onCancel}
            type="button"
            disabled={isSubmitting}
          />
          <Button
            label={usuario ? "Actualizar" : "Crear"}
            icon="pi pi-check"
            type="submit"
            loading={isSubmitting}
          />
        </div>
      </div>
    </form>
  );
};

export default UsuarioForm;
