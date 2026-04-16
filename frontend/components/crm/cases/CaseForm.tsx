"use client";
import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";

import { createCaseSchema, CreateCaseInput } from "@/libs/zods/crm/caseZod";
import {
  Case,
  CASE_TYPE_OPTIONS,
  CASE_PRIORITY_OPTIONS,
} from "@/libs/interfaces/crm/case.interface";
import caseService from "@/app/api/crm/caseService";
import customerCrmService from "@/app/api/crm/customerCrmService";
import customerVehicleService from "@/app/api/crm/customerVehicleService";
import { handleFormError } from "@/utils/errorHandlers";

interface Props {
  caseRecord: Case | null;
  formId?: string;
  onSave: () => void | Promise<void>;
  onSubmittingChange?: (isSubmitting: boolean) => void;
  toast: React.RefObject<Toast> | null;
}

const REF_DOC_TYPE_OPTIONS = [
  { label: "Factura", value: "invoice" },
  { label: "Orden de Taller", value: "service_order" },
  { label: "Pedido", value: "order" },
  { label: "Otro", value: "other" },
];

export default function CaseForm({ caseRecord, formId, onSave, onSubmittingChange, toast }: Props) {
  const isEditing = !!caseRecord;
  const [customers, setCustomers] = useState<{ label: string; value: string }[]>([]);
  const [vehicles, setVehicles] = useState<{ label: string; value: string }[]>([]);

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateCaseInput>({
    resolver: zodResolver(createCaseSchema),
    mode: "onBlur",
    defaultValues: caseRecord
      ? {
          title: caseRecord.title,
          description: caseRecord.description,
          type: caseRecord.type as any,
          priority: (caseRecord.priority as any) ?? "MEDIUM",
          customerId: caseRecord.customerId,
          customerVehicleId: caseRecord.customerVehicleId ?? undefined,
          leadId: caseRecord.leadId ?? undefined,
          refDocType: caseRecord.refDocType ?? undefined,
          refDocNumber: caseRecord.refDocNumber ?? undefined,
          assignedTo: caseRecord.assignedTo ?? undefined,
        }
      : {
          priority: "MEDIUM",
        },
  });

  const watchedCustomerId = watch("customerId");
  const watchedRefDocType = watch("refDocType");

  useEffect(() => {
    customerCrmService
      .getActive()
      .then((res) => {
        const list = (res as any)?.data ?? res ?? [];
        setCustomers(
          list.map((c: any) => ({ label: `${c.name} (${c.code})`, value: c.id }))
        );
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!watchedCustomerId) {
      setVehicles([]);
      setValue("customerVehicleId", undefined);
      return;
    }
    customerVehicleService
      .getAllByCustomer(watchedCustomerId, { limit: 50 })
      .then((res) => {
        const list = (res as any)?.data ?? res ?? [];
        setVehicles(
          list.map((v: any) => {
            const brand = v.brand?.name ?? "";
            const model = v.vehicleModel?.name ?? "";
            const detail = [brand, model].filter(Boolean).join(" ");
            return {
              label: detail ? `${v.plate} — ${detail}` : v.plate,
              value: v.id,
            };
          })
        );
      })
      .catch(() => setVehicles([]));
  }, [watchedCustomerId, setValue]);

  useEffect(() => {
    if (caseRecord) {
      reset({
        title: caseRecord.title,
        description: caseRecord.description,
        type: caseRecord.type as any,
        priority: (caseRecord.priority as any) ?? "MEDIUM",
        customerId: caseRecord.customerId,
        customerVehicleId: caseRecord.customerVehicleId ?? undefined,
        leadId: caseRecord.leadId ?? undefined,
        refDocType: caseRecord.refDocType ?? undefined,
        refDocNumber: caseRecord.refDocNumber ?? undefined,
        assignedTo: caseRecord.assignedTo ?? undefined,
      });
    } else {
      reset({ priority: "MEDIUM" });
    }
  }, [caseRecord, reset]);

  const onSubmit = async (data: CreateCaseInput) => {
    if (onSubmittingChange) onSubmittingChange(true);
    try {
      const payload = {
        ...data,
        customerVehicleId: data.customerVehicleId || undefined,
        leadId: data.leadId || undefined,
        refDocType: data.refDocType || undefined,
        refDocNumber: data.refDocNumber || undefined,
        assignedTo: data.assignedTo || undefined,
      };
      if (isEditing && caseRecord) {
        await caseService.update(caseRecord.id, payload as any);
      } else {
        await caseService.create(payload as any);
      }
      await onSave();
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      if (onSubmittingChange) onSubmittingChange(false);
    }
  };

  return (
    <form id={formId || "case-form"} onSubmit={handleSubmit(onSubmit)} className="p-fluid">
      <div className="grid formgrid row-gap-3">
        <div className="col-12 field">
          <label className="font-semibold">
            Título <span className="text-red-500">*</span>
          </label>
          <InputText
            {...register("title")}
            placeholder="Ej: Reclamo por falla en frenos"
            className={errors.title ? "p-invalid" : ""}
          />
          {errors.title && <small className="p-error">{errors.title.message}</small>}
        </div>

        <div className="col-12 md:col-6 field">
          <label className="font-semibold">
            Tipo <span className="text-red-500">*</span>
          </label>
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Dropdown
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={CASE_TYPE_OPTIONS}
                optionLabel="label"
                optionValue="value"
                placeholder="Seleccionar tipo"
                className={errors.type ? "p-invalid" : ""}
              />
            )}
          />
          {errors.type && <small className="p-error">{errors.type.message}</small>}
        </div>

        <div className="col-12 md:col-6 field">
          <label className="font-semibold">Prioridad</label>
          <Controller
            name="priority"
            control={control}
            render={({ field }) => (
              <Dropdown
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={CASE_PRIORITY_OPTIONS}
                optionLabel="label"
                optionValue="value"
                placeholder="Seleccionar prioridad"
              />
            )}
          />
        </div>

        <div className="col-12 md:col-6 field">
          <label className="font-semibold">
            Cliente <span className="text-red-500">*</span>
          </label>
          <Controller
            name="customerId"
            control={control}
            render={({ field }) => (
              <Dropdown
                value={field.value || null}
                onChange={(e) => field.onChange(e.value)}
                options={customers}
                optionLabel="label"
                optionValue="value"
                placeholder="Seleccionar cliente"
                filter
                showClear
                className={errors.customerId ? "p-invalid" : ""}
              />
            )}
          />
          {errors.customerId && <small className="p-error">{errors.customerId.message}</small>}
        </div>

        <div className="col-12 md:col-6 field">
          <label>Vehículo del cliente</label>
          <Controller
            name="customerVehicleId"
            control={control}
            render={({ field }) => (
              <Dropdown
                value={field.value || null}
                onChange={(e) => field.onChange(e.value)}
                options={vehicles}
                optionLabel="label"
                optionValue="value"
                placeholder={
                  watchedCustomerId
                    ? vehicles.length === 0
                      ? "Sin vehículos para este cliente"
                      : "Seleccionar vehículo (opcional)"
                    : "Selecciona un cliente primero"
                }
                disabled={!watchedCustomerId || vehicles.length === 0}
                showClear
                filter
              />
            )}
          />
        </div>

        <div className="col-12 field">
          <label className="font-semibold">
            Descripción <span className="text-red-500">*</span>
          </label>
          <InputTextarea
            {...register("description")}
            rows={4}
            placeholder="Describe el caso detalladamente..."
            className={errors.description ? "p-invalid" : ""}
          />
          {errors.description && <small className="p-error">{errors.description.message}</small>}
        </div>

        <div className="col-12 md:col-6 field">
          <label>Tipo de documento de referencia</label>
          <Controller
            name="refDocType"
            control={control}
            render={({ field }) => (
              <Dropdown
                value={field.value || null}
                onChange={(e) => field.onChange(e.value)}
                options={REF_DOC_TYPE_OPTIONS}
                optionLabel="label"
                optionValue="value"
                placeholder="Seleccionar (opcional)"
                showClear
              />
            )}
          />
        </div>

        {watchedRefDocType && (
          <div className="col-12 md:col-6 field">
            <label>Número de documento</label>
            <InputText {...register("refDocNumber")} placeholder="Ej: FAC-0001" />
          </div>
        )}

        <div className="col-12 md:col-6 field mb-0">
          <label>Asignado a</label>
          <InputText
            {...register("assignedTo")}
            placeholder="Usuario o agente responsable (opcional)"
          />
        </div>
      </div>
    </form>
  );
}
