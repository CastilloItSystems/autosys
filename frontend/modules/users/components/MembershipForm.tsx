"use client";

import React, { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dropdown } from "primereact/dropdown";
import { classNames } from "primereact/utils";
import { Toast } from "primereact/toast";

import {
  createMembership,
  updateMembership,
} from "@/modules/users/services/user.service";
import type {
  Membership,
  MembershipStatus,
} from "../interfaces/user.interface";
import { membershipSchema } from "../schemas/user.schema";
import type { MembershipFormData } from "../schemas/user.schema";
import {
  useMembershipCompanyRolesData,
} from "../hooks/useUsersData";
import { useEmpresasStore } from "@/store/empresasStore";
import { useRefreshAuthContext } from "@/hooks/useRefreshAuthContext";

const statusOptions = [
  { label: "Activo", value: "active" },
  { label: "Invitado", value: "invited" },
  { label: "Suspendido", value: "suspended" },
];

interface MembershipFormProps {
  userId: string;
  membership?: Membership | null;
  onSave: () => void;
  onCancel?: () => void;
  toast: React.RefObject<Toast | null>;
  formId?: string;
  onSubmittingChange?: (isSubmitting: boolean) => void;
}

const MembershipForm = ({
  userId,
  membership,
  onSave,
  onCancel,
  toast,
  formId = "membership-form",
  onSubmittingChange,
}: MembershipFormProps) => {
  const activeEmpresa = useEmpresasStore((state) => state.activeEmpresa);
  const refreshAuthContext = useRefreshAuthContext();
  const activeEmpresaId = membership?.empresaId ?? activeEmpresa?.id_empresa ?? "";
  const empresaOptions = activeEmpresaId
    ? [
        {
          label: membership?.empresa?.nombre ?? activeEmpresa?.nombre ?? activeEmpresaId,
          value: activeEmpresaId,
        },
      ]
    : [];
  const {
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    control,
    reset,
  } = useForm<MembershipFormData>({
    resolver: zodResolver(membershipSchema),
    defaultValues: {
      empresaId: activeEmpresaId,
      roleId: membership?.roleId ?? "",
      status: (membership?.status as MembershipStatus) ?? "active",
    },
  });

  const watchedEmpresaId = watch("empresaId") || activeEmpresaId;
  const {
    roleOptions,
    loading: loadingRoles,
    error: rolesError,
  } = useMembershipCompanyRolesData(watchedEmpresaId);

  useEffect(() => {
    if (rolesError) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar los roles",
        life: 3000,
      });
    }
  }, [rolesError, toast]);

  // La pantalla de empresa solo administra memberships de la empresa activa.
  useEffect(() => {
    if (membership) {
      reset({
        empresaId: membership.empresaId,
        roleId: membership.roleId,
        status: membership.status,
      });
    } else if (activeEmpresaId) {
      reset({
        empresaId: activeEmpresaId,
        roleId: "",
        status: "active",
      });
    }
  }, [activeEmpresaId, membership, reset]);

  const onSubmit = async (data: MembershipFormData) => {
    if (onSubmittingChange) onSubmittingChange(true);
    try {
      if (membership?.id) {
        await updateMembership(membership.id, {
          roleId: data.roleId,
          status: data.status,
        });
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Membership actualizada correctamente",
          life: 3000,
        });
      } else {
        await createMembership({
          userId,
          empresaId: data.empresaId,
          roleId: data.roleId,
          status: data.status,
        });
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Membership creada correctamente",
          life: 3000,
        });
      }
      await refreshAuthContext();
      onSave();
    } catch (error: any) {
      const detail =
        error?.response?.data?.error ?? "No se pudo guardar la membership";
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail,
        life: 4000,
      });
    } finally {
      if (onSubmittingChange) onSubmittingChange(false);
    }
  };

  return (
    <div className="p-2">
      <form id={formId} onSubmit={handleSubmit(onSubmit)} className="p-fluid">
        <div className="grid">
          {/* Empresa (solo editable al crear, no al editar) */}
          <div className="col-12">
            <label className="block text-900 font-medium mb-2">
              Empresa <span className="text-red-500">*</span>
            </label>
            <Controller
              name="empresaId"
              control={control}
              render={({ field }) => (
                <Dropdown
                  {...field}
                  options={empresaOptions}
                  placeholder="Seleccionar empresa"
                  disabled
                  className={classNames({ "p-invalid": errors.empresaId })}
                />
              )}
            />
            {errors.empresaId && (
              <small className="p-error">{errors.empresaId.message}</small>
            )}
          </div>

          {/* Rol */}
          <div className="col-12 md:col-6">
            <label className="block text-900 font-medium mb-2">
              Rol <span className="text-red-500">*</span>
            </label>
            <Controller
              name="roleId"
              control={control}
              render={({ field }) => (
                <Dropdown
                  {...field}
                  options={roleOptions}
                  placeholder={
                    !watchedEmpresaId
                      ? "Selecciona una empresa primero"
                      : loadingRoles
                      ? "Cargando..."
                      : "Seleccionar rol"
                  }
                  disabled={!watchedEmpresaId || loadingRoles}
                  className={classNames({ "p-invalid": errors.roleId })}
                />
              )}
            />
            {errors.roleId && (
              <small className="p-error">{errors.roleId.message}</small>
            )}
          </div>

          {/* Status */}
          <div className="col-12 md:col-6">
            <label className="block text-900 font-medium mb-2">
              Estado <span className="text-red-500">*</span>
            </label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Dropdown
                  {...field}
                  options={statusOptions}
                  className={classNames({ "p-invalid": errors.status })}
                />
              )}
            />
            {errors.status && (
              <small className="p-error">{errors.status.message}</small>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default MembershipForm;
