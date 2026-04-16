"use client";

import React from "react";
import { Controller, useForm } from "react-hook-form";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import dealerApprovalService, {
  DealerApproval,
} from "@/app/api/dealer/dealerApprovalService";
import { handleFormError } from "@/utils/errorHandlers";

const TYPE_OPTIONS = [
  { label: "Excepción de Descuento", value: "DISCOUNT_EXCEPTION" },
  { label: "Aprobación de Retoma", value: "TRADE_IN_APPROVAL" },
  { label: "Override Financiamiento", value: "FINANCING_OVERRIDE" },
  { label: "Excepción Entrega", value: "DELIVERY_EXCEPTION" },
  { label: "Excepción Documental", value: "DOCUMENT_EXCEPTION" },
];

const STATUS_OPTIONS = [
  { label: "Pendiente", value: "PENDING" },
  { label: "Aprobada", value: "APPROVED" },
  { label: "Rechazada", value: "REJECTED" },
  { label: "Cancelada", value: "CANCELLED" },
];

type DealerApprovalFormValues = {
  type: string;
  status: string;
  title: string;
  reason?: string;
  requestedAmount?: number;
  requestedPct?: number;
  resolutionNotes?: string;
};

interface DealerApprovalFormProps {
  approval: DealerApproval | null;
  onSave: () => void | Promise<void>;
  formId?: string;
  onSubmittingChange?: (isSubmitting: boolean) => void;
  toast: React.RefObject<Toast> | null;
}

export default function DealerApprovalForm({
  approval,
  onSave,
  formId,
  onSubmittingChange,
  toast,
}: DealerApprovalFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<DealerApprovalFormValues>({
    mode: "onBlur",
    defaultValues: {
      type: approval?.type || "DISCOUNT_EXCEPTION",
      status: approval?.status || "PENDING",
      title: approval?.title || "",
      reason: approval?.reason || "",
      requestedAmount:
        approval?.requestedAmount != null
          ? Number(approval.requestedAmount)
          : undefined,
      requestedPct:
        approval?.requestedPct != null ? Number(approval.requestedPct) : undefined,
      resolutionNotes: "",
    },
  });

  const onSubmit = async (data: DealerApprovalFormValues) => {
    onSubmittingChange?.(true);
    try {
      const payload = {
        type: data.type,
        status: data.status,
        title: data.title.trim(),
        reason: data.reason?.trim() || null,
        requestedAmount: data.requestedAmount ?? null,
        requestedPct: data.requestedPct ?? null,
        resolutionNotes: data.resolutionNotes?.trim() || null,
      };

      if (approval?.id) {
        await dealerApprovalService.update(approval.id, payload);
      } else {
        await dealerApprovalService.create(payload);
      }

      await onSave();
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      onSubmittingChange?.(false);
    }
  };

  return (
    <form
      id={formId || "dealer-approval-form"}
      onSubmit={handleSubmit(onSubmit)}
      className="p-fluid"
    >
      <div className="grid formgrid">
        <div className="col-12 md:col-6 field">
          <label className="font-semibold">Tipo *</label>
          <Controller
            name="type"
            control={control}
            rules={{ required: "Tipo requerido" }}
            render={({ field }) => (
              <Dropdown
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={TYPE_OPTIONS}
                optionLabel="label"
                optionValue="value"
                className={errors.type ? "p-invalid" : ""}
              />
            )}
          />
          {errors.type && <small className="p-error">{errors.type.message}</small>}
        </div>

        <div className="col-12 md:col-6 field">
          <label className="font-semibold">Estatus *</label>
          <Controller
            name="status"
            control={control}
            rules={{ required: "Estatus requerido" }}
            render={({ field }) => (
              <Dropdown
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={STATUS_OPTIONS}
                optionLabel="label"
                optionValue="value"
                className={errors.status ? "p-invalid" : ""}
              />
            )}
          />
          {errors.status && (
            <small className="p-error">{errors.status.message}</small>
          )}
        </div>

        <div className="col-12 field">
          <label className="font-semibold">Título *</label>
          <Controller
            name="title"
            control={control}
            rules={{ required: "Título requerido" }}
            render={({ field }) => (
              <InputText
                {...field}
                className={errors.title ? "p-invalid" : ""}
                placeholder="Ej: Descuento excepcional por volumen"
                autoFocus
              />
            )}
          />
          {errors.title && <small className="p-error">{errors.title.message}</small>}
        </div>

        <div className="col-12 field">
          <label className="font-semibold">Motivo</label>
          <Controller
            name="reason"
            control={control}
            render={({ field }) => <InputText {...field} value={field.value || ""} />}
          />
        </div>

        <div className="col-12 md:col-6 field">
          <label className="font-semibold">Monto solicitado</label>
          <Controller
            name="requestedAmount"
            control={control}
            render={({ field }) => (
              <InputNumber
                value={field.value ?? null}
                onValueChange={(e) => field.onChange(e.value ?? undefined)}
                min={0}
                mode="currency"
                currency="USD"
                locale="en-US"
              />
            )}
          />
        </div>

        <div className="col-12 md:col-6 field">
          <label className="font-semibold">% solicitado</label>
          <Controller
            name="requestedPct"
            control={control}
            render={({ field }) => (
              <InputNumber
                value={field.value ?? null}
                onValueChange={(e) => field.onChange(e.value ?? undefined)}
                min={0}
                max={100}
                suffix="%"
              />
            )}
          />
        </div>

        <div className="col-12 field mb-0">
          <label className="font-semibold">Notas de resolución</label>
          <Controller
            name="resolutionNotes"
            control={control}
            render={({ field }) => <InputText {...field} value={field.value || ""} />}
          />
        </div>
      </div>
    </form>
  );
}
