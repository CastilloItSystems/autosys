"use client";
import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputText } from "primereact/inputtext";
import CustomerSelector from "@/components/common/CustomerSelector";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { ProgressSpinner } from "primereact/progressspinner";
import { handleFormError } from "@/utils/errorHandlers";
import { warrantyService } from "@/app/api/workshop";
import { createWarrantySchema, updateWarrantySchema } from "@/libs/zods/workshop/warrantyZod";
import type { CreateWarrantyForm, UpdateWarrantyForm } from "@/libs/zods/workshop/warrantyZod";
import type { WorkshopWarranty } from "@/libs/interfaces/workshop";
import { WARRANTY_TYPE_OPTIONS } from "@/components/workshop/shared/WarrantyStatusBadge";

interface Props {
  warranty: WorkshopWarranty | null;
  onSave: () => void | Promise<void>;
  formId?: string;
  onSubmittingChange?: (v: boolean) => void;
  toast: React.RefObject<any>;
}

export default function WarrantyForm({ warranty, onSave, formId, onSubmittingChange, toast }: Props) {
  const isUpdate = !!warranty?.id;
  const [isLoading, setIsLoading] = useState(true);

  // ── Create form ──────────────────────────────────────────────────────────
  const createForm = useForm<CreateWarrantyForm>({
    resolver: zodResolver(createWarrantySchema),
    mode: "onBlur",
    defaultValues: {
      type: undefined,
      originalOrderId: "",
      customerId: "",
      customerVehicleId: undefined,
      description: "",
      technicianId: undefined,
      expiresAt: undefined,
    },
  });

  // ── Update form ──────────────────────────────────────────────────────────
  const updateForm = useForm<UpdateWarrantyForm>({
    resolver: zodResolver(updateWarrantySchema),
    mode: "onBlur",
    defaultValues: {
      rootCause: "",
      resolution: "",
      technicianId: undefined,
      reworkOrderId: undefined,
    },
  });

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 150);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (isUpdate && warranty) {
      updateForm.reset({
        rootCause: warranty.rootCause ?? "",
        resolution: warranty.resolution ?? "",
        technicianId: warranty.technicianId ?? undefined,
        reworkOrderId: warranty.reworkOrderId ?? undefined,
      });
    }
  }, [warranty, isUpdate, isLoading, updateForm]);

  const onCreateSubmit = async (data: CreateWarrantyForm) => {
    onSubmittingChange?.(true);
    try {
      await warrantyService.create({
        type: data.type,
        originalOrderId: data.originalOrderId,
        customerId: data.customerId,
        customerVehicleId: data.customerVehicleId ?? undefined,
        description: data.description,
        technicianId: data.technicianId ?? undefined,
        expiresAt: data.expiresAt ?? undefined,
      });
      await onSave();
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      onSubmittingChange?.(false);
    }
  };

  const onUpdateSubmit = async (data: UpdateWarrantyForm) => {
    if (!warranty?.id) return;
    onSubmittingChange?.(true);
    try {
      await warrantyService.update(warranty.id, {
        rootCause: data.rootCause ?? undefined,
        resolution: data.resolution ?? undefined,
        technicianId: data.technicianId ?? undefined,
        reworkOrderId: data.reworkOrderId ?? undefined,
      });
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
        <ProgressSpinner style={{ width: "40px", height: "40px" }} strokeWidth="4" fill="var(--surface-ground)" animationDuration=".5s" />
        <p className="mt-3 text-600 font-medium">Cargando formulario...</p>
      </div>
    );
  }

  // ── UPDATE form ────────────────────────────────────────────────────────
  if (isUpdate) {
    const { control, handleSubmit, formState: { errors } } = updateForm;
    return (
      <form id={formId ?? "warranty-form"} onSubmit={handleSubmit(onUpdateSubmit)} className="p-fluid">
        <div className="grid">
          {/* Info bar */}
          <div className="col-12">
            <div className="p-3 surface-100 border-round flex gap-4 text-sm mb-1">
              <span><b>Folio:</b> {warranty.warrantyNumber}</span>
              <span><b>Cliente:</b> {warranty.customer?.name ?? warranty.customerId.slice(0, 8)}</span>
              <span><b>OT:</b> {warranty.originalOrder?.folio ?? warranty.originalOrderId.slice(0, 8)}</span>
            </div>
          </div>

          <div className="col-12">
            <label htmlFor="rootCause" className="block text-900 font-medium mb-2">Causa raíz</label>
            <Controller
              name="rootCause"
              control={control}
              render={({ field }) => (
                <InputTextarea
                  id="rootCause"
                  {...field}
                  value={field.value ?? ""}
                  rows={3}
                  placeholder="Descripción de la causa del problema..."
                />
              )}
            />
            {errors.rootCause && <small className="p-error block mt-1">{errors.rootCause.message}</small>}
          </div>

          <div className="col-12">
            <label htmlFor="resolution" className="block text-900 font-medium mb-2">Resolución</label>
            <Controller
              name="resolution"
              control={control}
              render={({ field }) => (
                <InputTextarea
                  id="resolution"
                  {...field}
                  value={field.value ?? ""}
                  rows={3}
                  placeholder="Solución aplicada o a aplicar..."
                />
              )}
            />
            {errors.resolution && <small className="p-error block mt-1">{errors.resolution.message}</small>}
          </div>

          <div className="col-12 md:col-6">
            <label htmlFor="technicianId" className="block text-900 font-medium mb-2">ID Técnico</label>
            <Controller
              name="technicianId"
              control={control}
              render={({ field }) => (
                <InputText
                  id="technicianId"
                  {...field}
                  value={field.value ?? ""}
                  placeholder="ID del técnico responsable"
                />
              )}
            />
          </div>

          <div className="col-12 md:col-6">
            <label htmlFor="reworkOrderId" className="block text-900 font-medium mb-2">ID OT de retrabajo</label>
            <Controller
              name="reworkOrderId"
              control={control}
              render={({ field }) => (
                <InputText
                  id="reworkOrderId"
                  {...field}
                  value={field.value ?? ""}
                  placeholder="ID de la OT generada para el retrabajo"
                />
              )}
            />
          </div>
        </div>
      </form>
    );
  }

  // ── CREATE form ────────────────────────────────────────────────────────
  const { control, handleSubmit, formState: { errors } } = createForm;
  return (
    <form id={formId ?? "warranty-form"} onSubmit={handleSubmit(onCreateSubmit)} className="p-fluid">
      <div className="grid">
        <div className="col-12 md:col-6">
          <label htmlFor="type" className="block text-900 font-medium mb-2">
            Tipo de garantía <span className="text-red-500">*</span>
          </label>
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="type"
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={WARRANTY_TYPE_OPTIONS}
                placeholder="Seleccionar tipo"
                className={errors.type ? "p-invalid" : ""}
              />
            )}
          />
          {errors.type && <small className="p-error block mt-1">{errors.type.message}</small>}
        </div>

        <div className="col-12 md:col-6">
          <label htmlFor="expiresAt" className="block text-900 font-medium mb-2">Fecha de vencimiento</label>
          <Controller
            name="expiresAt"
            control={control}
            render={({ field }) => (
              <Calendar
                id="expiresAt"
                value={field.value ? new Date(field.value) : null}
                onChange={(e) => field.onChange(e.value ? (e.value as Date).toISOString() : null)}
                dateFormat="dd/mm/yy"
                placeholder="Sin vencimiento"
                showIcon
                minDate={new Date()}
              />
            )}
          />
        </div>

        <div className="col-12">
          <label htmlFor="originalOrderId" className="block text-900 font-medium mb-2">
            ID Orden de Trabajo original <span className="text-red-500">*</span>
          </label>
          <Controller
            name="originalOrderId"
            control={control}
            render={({ field }) => (
              <InputText
                id="originalOrderId"
                {...field}
                placeholder="ID de la OT que originó la garantía"
                className={errors.originalOrderId ? "p-invalid" : ""}
              />
            )}
          />
          {errors.originalOrderId && <small className="p-error block mt-1">{errors.originalOrderId.message}</small>}
        </div>

        <div className="col-12 md:col-6">
          <label className="block text-900 font-medium mb-2">
            Cliente <span className="text-red-500">*</span>
          </label>
          <Controller
            name="customerId"
            control={control}
            render={({ field }) => (
              <CustomerSelector
                value={field.value}
                onChange={field.onChange}
                invalid={!!errors.customerId}
              />
            )}
          />
          {errors.customerId && <small className="p-error block mt-1">{errors.customerId.message}</small>}
        </div>

        <div className="col-12 md:col-6">
          <label htmlFor="technicianId" className="block text-900 font-medium mb-2">ID Técnico</label>
          <Controller
            name="technicianId"
            control={control}
            render={({ field }) => (
              <InputText
                id="technicianId"
                {...field}
                value={field.value ?? ""}
                placeholder="ID del técnico responsable (opcional)"
              />
            )}
          />
        </div>

        <div className="col-12">
          <label htmlFor="description" className="block text-900 font-medium mb-2">
            Descripción del problema <span className="text-red-500">*</span>
          </label>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <InputTextarea
                id="description"
                {...field}
                rows={4}
                placeholder="Describe el problema reportado por el cliente (mínimo 10 caracteres)..."
                className={errors.description ? "p-invalid" : ""}
              />
            )}
          />
          {errors.description && <small className="p-error block mt-1">{errors.description.message}</small>}
        </div>
      </div>
    </form>
  );
}
