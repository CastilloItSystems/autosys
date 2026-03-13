"use client";

import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { classNames } from "primereact/utils";
import { Toast } from "primereact/toast";

import { getEmpresas } from "@/app/api/empresaService";
import { getCompanyRoles, CompanyRole } from "@/app/api/roleService";
import {
  createMembership,
  updateMembership,
  Membership,
  MembershipStatus,
} from "@/app/api/userService";

const membershipSchema = z.object({
  empresaId: z.string().min(1, "La empresa es requerida"),
  roleId: z.string().min(1, "El rol es requerido"),
  status: z.enum(["active", "invited", "suspended"]),
});

type FormData = z.infer<typeof membershipSchema>;

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
  const [empresas, setEmpresas] = useState<{ label: string; value: string }[]>(
    [],
  );
  const [roles, setRoles] = useState<CompanyRole[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);

  const {
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    control,
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(membershipSchema),
    defaultValues: {
      empresaId: membership?.empresaId ?? "",
      roleId: membership?.roleId ?? "",
      status: (membership?.status as MembershipStatus) ?? "active",
    },
  });

  const watchedEmpresaId = watch("empresaId");

  // Cargar lista de empresas al montar
  useEffect(() => {
    getEmpresas()
      .then((res) => {
        setEmpresas(
          res.empresas.map((e) => ({ label: e.nombre, value: e.id_empresa })),
        );
      })
      .catch(() => {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "No se pudieron cargar las empresas",
          life: 3000,
        });
      });
  }, [toast]);

  // Cargar roles cuando cambia la empresa seleccionada
  useEffect(() => {
    if (!watchedEmpresaId) {
      setRoles([]);
      return;
    }
    setLoadingRoles(true);
    getCompanyRoles(watchedEmpresaId)
      .then(setRoles)
      .catch(() => {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "No se pudieron cargar los roles",
          life: 3000,
        });
      })
      .finally(() => setLoadingRoles(false));
  }, [watchedEmpresaId, toast]);

  // Si estamos editando, resetear al recibir la membership
  useEffect(() => {
    if (membership) {
      reset({
        empresaId: membership.empresaId,
        roleId: membership.roleId,
        status: membership.status,
      });
    }
  }, [membership, reset]);

  const onSubmit = async (data: FormData) => {
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

  const roleOptions = roles.map((r) => ({ label: r.name, value: r.id }));

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
                  options={empresas}
                  placeholder="Seleccionar empresa"
                  disabled={!!membership}
                  className={classNames({ "p-invalid": errors.empresaId })}
                  filter
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
