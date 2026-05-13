"use client";

import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Dropdown } from "primereact/dropdown";
import { MultiSelect } from "primereact/multiselect";
import { Checkbox } from "primereact/checkbox";
import { classNames } from "primereact/utils";
import PhoneInput from "../../../shared/components/PhoneInput";

import {
  createCompanyUser,
  createUser,
  updateCompanyUser,
  updateUser,
} from "@/modules/users/services/user.service";
import type {
  CreateCompanyUserRequest,
  CreateUserRequest,
  UpdateCompanyUserRequest,
  UpdateUserRequest,
  User,
  UserScope,
} from "../interfaces/user.interface";
import { handleFormError } from "@/utils/errorHandlers";
import { PasswordRequirements } from "./PasswordRequirements";
import { createUserSchema, updateUserSchema } from "../schemas/user.schema";
import type { UserFormData } from "../schemas/user.schema";
import { useMembershipCompanyRolesData } from "../hooks/useUsersData";
import { useEmpresasStore } from "@/store/empresasStore";
import { useRefreshAuthContext } from "@/hooks/useRefreshAuthContext";

interface UsuarioFormProps {
  usuario?: User | null;
  onSave: () => void | Promise<void>;
  toast: React.RefObject<any>;
  formId?: string; // Permite inyectar un ID dinámico al form para conectarlo con botones externos
  onSubmittingChange?: (isSubmitting: boolean) => void;
  scope?: UserScope;
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

const membershipStatusValues = [
  { label: "Activo", value: "active" },
  { label: "Invitado", value: "invited" },
  { label: "Suspendido", value: "suspended" },
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
  scope = "global",
}: UsuarioFormProps) => {
  const currentSchema = usuario ? updateUserSchema : createUserSchema;
  const isCompanyScope = scope === "company";
  const activeEmpresaId = useEmpresasStore(
    (state) => state.activeEmpresa?.id_empresa,
  );
  const { roleOptions, loading: rolesLoading } = useMembershipCompanyRolesData(
    isCompanyScope ? activeEmpresaId : null,
  );
  const selectedMembership = usuario?.memberships?.[0];
  const refreshAuthContext = useRefreshAuthContext();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    setError,
    reset,
    control,
    watch,
  } = useForm<UserFormData>({
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
      roleId: "",
      membershipStatus: "active",
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
        roleId: selectedMembership?.roleId ?? "",
        membershipStatus: selectedMembership?.status ?? "active",
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
        roleId: "",
        membershipStatus: "active",
        password: "",
        confirmPassword: "",
      });
    }
  }, [selectedMembership?.roleId, selectedMembership?.status, usuario, reset]);

  const onSubmit = async (data: UserFormData) => {
    if (onSubmittingChange) onSubmittingChange(true);
    try {
      if (isCompanyScope && !data.roleId) {
        setError("roleId", {
          type: "manual",
          message: "Seleccione un rol de empresa",
        });
        return;
      }

      const departamentoArray = data.departamento;

      if (usuario?.id) {
        const payload: UpdateUserRequest | UpdateCompanyUserRequest = {
          nombre: data.nombre,
          correo: data.correo,
          telefono: data.telefono || null,
          departamento: departamentoArray,
          acceso: data.acceso,
          estado: data.estado,
          isTechnician: data.isTechnician ?? false,
          ...(data.password ? { password: data.password } : {}),
          ...(isCompanyScope
            ? {
                roleId: data.roleId,
                membershipStatus: data.membershipStatus,
              }
            : {}),
        };

        if (isCompanyScope) {
          await updateCompanyUser(usuario.id, payload as UpdateCompanyUserRequest);
        } else {
          await updateUser(usuario.id, payload as UpdateUserRequest);
        }

        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Usuario actualizado correctamente",
          life: 3000,
        });
      } else {
        const payload: CreateUserRequest | CreateCompanyUserRequest = {
          nombre: data.nombre,
          correo: data.correo,
          telefono: data.telefono || undefined,
          departamento: departamentoArray,
          acceso: data.acceso,
          estado: data.estado,
          isTechnician: data.isTechnician ?? false,
          password: data.password!, // Validado por createUserSchema
          ...(isCompanyScope
            ? {
                roleId: data.roleId!,
                membershipStatus: data.membershipStatus,
              }
            : {}),
        };

        if (isCompanyScope) {
          await createCompanyUser(payload as CreateCompanyUserRequest);
        } else {
          await createUser(payload as CreateUserRequest);
        }

        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Usuario creado correctamente",
          life: 3000,
        });
      }

      await refreshAuthContext();
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

        {isCompanyScope && (
          <>
            <div className="col-12 md:col-6">
              <label htmlFor="roleId" className="block text-900 font-medium mb-2">
                Rol de empresa <span className="text-red-500">*</span>
              </label>
              <Controller
                name="roleId"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="roleId"
                    value={field.value}
                    options={roleOptions}
                    loading={rolesLoading}
                    onChange={(e) => field.onChange(e.value)}
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Seleccione un rol"
                    className={classNames("w-full", {
                      "p-invalid": errors.roleId,
                    })}
                  />
                )}
              />
              {errors.roleId && (
                <small className="p-error block mt-1">
                  {errors.roleId.message}
                </small>
              )}
            </div>

            <div className="col-12 md:col-6">
              <label
                htmlFor="membershipStatus"
                className="block text-900 font-medium mb-2"
              >
                Estado en empresa
              </label>
              <Controller
                name="membershipStatus"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="membershipStatus"
                    value={field.value}
                    options={membershipStatusValues}
                    onChange={(e) => field.onChange(e.value)}
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Seleccione un estado"
                    className={classNames("w-full", {
                      "p-invalid": errors.membershipStatus,
                    })}
                  />
                )}
              />
              {errors.membershipStatus && (
                <small className="p-error block mt-1">
                  {errors.membershipStatus.message}
                </small>
              )}
            </div>
          </>
        )}

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
