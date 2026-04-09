"use client";
import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputText } from "primereact/inputtext";
import { ProgressSpinner } from "primereact/progressspinner";
import { workshopBranchService } from "@/app/api/workshop";
import { handleFormError } from "@/utils/errorHandlers";
import UserSelector from "@/components/common/UserSelector";
import {
  createWorkshopBranchSchema,
  updateWorkshopBranchSchema,
  type CreateWorkshopBranchForm,
} from "@/libs/zods/workshop/workshopBranchZod";
import type { WorkshopBranch } from "@/libs/interfaces/workshop";

interface WorkshopBranchFormProps {
  branch: WorkshopBranch | null;
  onSave: () => void | Promise<void>;
  formId?: string;
  onSubmittingChange?: (v: boolean) => void;
  toast: React.RefObject<any>;
}

export default function WorkshopBranchForm({
  branch,
  onSave,
  formId,
  onSubmittingChange,
  toast,
}: WorkshopBranchFormProps) {
  const [isLoading, setIsLoading] = useState(true);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateWorkshopBranchForm>({
    resolver: zodResolver(
      branch ? updateWorkshopBranchSchema : createWorkshopBranchSchema,
    ),
    mode: "onBlur",
    defaultValues: {
      code: "",
      name: "",
      address: "",
      phone: "",
      managerUserId: "",
    },
  });

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 250);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (branch) {
      reset({
        code: branch.code ?? "",
        name: branch.name ?? "",
        address: branch.address ?? "",
        phone: branch.phone ?? "",
        managerUserId: branch.managerUserId ?? "",
      });
    } else {
      reset({ code: "", name: "", address: "", phone: "", managerUserId: "" });
    }
  }, [branch, reset, isLoading]);

  const onSubmit = async (data: CreateWorkshopBranchForm) => {
    onSubmittingChange?.(true);
    try {
      const payload = {
        ...data,
        address: data.address || undefined,
        phone: data.phone || undefined,
        managerUserId: data.managerUserId || undefined,
      };
      if (branch?.id) {
        await workshopBranchService.update(branch.id, payload);
      } else {
        await workshopBranchService.create(payload as any);
      }
      await onSave();
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      onSubmittingChange?.(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-column align-items-center justify-content-center p-4">
        <ProgressSpinner
          style={{ width: "40px", height: "40px" }}
          strokeWidth="4"
          fill="var(--surface-ground)"
          animationDuration=".5s"
        />
        <p className="mt-3 text-600 font-medium">Preparando formulario...</p>
      </div>
    );
  }

  return (
    <form
      id={formId ?? "workshop-branch-form"}
      onSubmit={handleSubmit(onSubmit)}
      className="p-fluid"
    >
      <div className="grid">
        {/* Código */}
        <div className="col-12 md:col-6">
          <label htmlFor="code" className="block text-900 font-medium mb-2">
            Código <span className="text-red-500">*</span>
          </label>
          <Controller
            name="code"
            control={control}
            render={({ field }) => (
              <InputText
                id="code"
                {...field}
                placeholder="Ej: SUC-NORTE"
                className={errors.code ? "p-invalid" : ""}
                autoFocus
                disabled={!!branch?.id}
                title={branch?.id ? "El código no puede ser modificado" : ""}
              />
            )}
          />
          {errors.code && (
            <small className="p-error block mt-1">{errors.code.message}</small>
          )}
        </div>

        {/* Nombre */}
        <div className="col-12 md:col-6">
          <label htmlFor="name" className="block text-900 font-medium mb-2">
            Nombre <span className="text-red-500">*</span>
          </label>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <InputText
                id="name"
                {...field}
                placeholder="Ej: Sucursal Norte"
                className={errors.name ? "p-invalid" : ""}
              />
            )}
          />
          {errors.name && (
            <small className="p-error block mt-1">{errors.name.message}</small>
          )}
        </div>

        {/* Teléfono */}
        <div className="col-12 md:col-6">
          <label htmlFor="phone" className="block text-900 font-medium mb-2">
            Teléfono
          </label>
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <InputText
                id="phone"
                {...field}
                value={field.value ?? ""}
                placeholder="Ej: 55 1234 5678"
                className={errors.phone ? "p-invalid" : ""}
              />
            )}
          />
          {errors.phone && (
            <small className="p-error block mt-1">{errors.phone.message}</small>
          )}
        </div>

        {/* Responsable */}
        <div className="col-12 md:col-6">
          <label className="block text-900 font-medium mb-2">Responsable</label>
          <Controller
            name="managerUserId"
            control={control}
            render={({ field }) => (
              <UserSelector
                value={field.value}
                onChange={field.onChange}
                invalid={!!errors.managerUserId}
              />
            )}
          />
          {errors.managerUserId && (
            <small className="p-error block mt-1">
              {errors.managerUserId.message}
            </small>
          )}
        </div>

        {/* Dirección */}
        <div className="col-12">
          <label htmlFor="address" className="block text-900 font-medium mb-2">
            Dirección
          </label>
          <Controller
            name="address"
            control={control}
            render={({ field }) => (
              <InputText
                id="address"
                {...field}
                value={field.value ?? ""}
                placeholder="Ej: Av. Insurgentes Norte 123, Col. Centro"
                className={errors.address ? "p-invalid" : ""}
              />
            )}
          />
          {errors.address && (
            <small className="p-error block mt-1">
              {errors.address.message}
            </small>
          )}
        </div>
      </div>
    </form>
  );
}
