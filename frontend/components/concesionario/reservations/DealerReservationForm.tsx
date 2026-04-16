"use client";

import React from "react";
import { Controller, useForm } from "react-hook-form";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import dealerReservationService, {
  SaveDealerReservationRequest,
} from "@/app/api/dealer/dealerReservationService";
import type { DealerReservation } from "@/libs/interfaces/dealer/dealerReservation.interface";
import { handleFormError } from "@/utils/errorHandlers";

const STATUS_OPTIONS = [
  { label: "Pendiente", value: "PENDING" },
  { label: "Confirmada", value: "CONFIRMED" },
  { label: "Expirada", value: "EXPIRED" },
  { label: "Cancelada", value: "CANCELLED" },
  { label: "Convertida", value: "CONVERTED" },
];

type DealerReservationFormValues = {
  dealerUnitId: string;
  customerName: string;
  customerDocument: string;
  customerPhone: string;
  customerEmail: string;
  offeredPrice?: number;
  depositAmount?: number;
  currency: string;
  expiresAt?: Date | null;
  notes: string;
  sourceChannel: string;
  status: string;
  isActive: boolean;
};

interface DealerReservationFormProps {
  reservation: DealerReservation | null;
  unitOptions: Array<{ label: string; value: string }>;
  onSave: () => void | Promise<void>;
  formId?: string;
  onSubmittingChange?: (isSubmitting: boolean) => void;
  toast: React.RefObject<Toast> | null;
}

export default function DealerReservationForm({
  reservation,
  unitOptions,
  onSave,
  formId,
  onSubmittingChange,
  toast,
}: DealerReservationFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<DealerReservationFormValues>({
    mode: "onBlur",
    defaultValues: {
      dealerUnitId: reservation?.dealerUnitId || "",
      customerName: reservation?.customerName || "",
      customerDocument: reservation?.customerDocument || "",
      customerPhone: reservation?.customerPhone || "",
      customerEmail: reservation?.customerEmail || "",
      offeredPrice:
        reservation?.offeredPrice != null
          ? Number(reservation.offeredPrice)
          : undefined,
      depositAmount:
        reservation?.depositAmount != null
          ? Number(reservation.depositAmount)
          : undefined,
      currency: reservation?.currency || "USD",
      expiresAt: reservation?.expiresAt ? new Date(reservation.expiresAt) : null,
      notes: reservation?.notes || "",
      sourceChannel: reservation?.sourceChannel || "",
      status: reservation?.status || "PENDING",
      isActive: reservation?.isActive ?? true,
    },
  });

  const onSubmit = async (data: DealerReservationFormValues) => {
    onSubmittingChange?.(true);
    try {
      const payload: SaveDealerReservationRequest = {
        dealerUnitId: data.dealerUnitId,
        customerName: data.customerName.trim(),
        customerDocument: data.customerDocument || null,
        customerPhone: data.customerPhone || null,
        customerEmail: data.customerEmail || null,
        offeredPrice: data.offeredPrice ?? null,
        depositAmount: data.depositAmount ?? null,
        currency: data.currency || "USD",
        expiresAt: data.expiresAt ? data.expiresAt.toISOString() : null,
        notes: data.notes || null,
        sourceChannel: data.sourceChannel || null,
        status: data.status,
        isActive: data.isActive,
      };

      if (reservation?.id) {
        await dealerReservationService.update(reservation.id, payload);
      } else {
        await dealerReservationService.create(payload);
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
      id={formId || "dealer-reservation-form"}
      onSubmit={handleSubmit(onSubmit)}
      className="p-fluid"
    >
      <div className="grid formgrid">
        <div className="col-12 md:col-6 field">
          <label className="font-semibold">Unidad *</label>
          <Controller
            name="dealerUnitId"
            control={control}
            rules={{ required: "Debe seleccionar una unidad" }}
            render={({ field }) => (
              <Dropdown
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={unitOptions}
                className={errors.dealerUnitId ? "p-invalid" : ""}
                filter
                placeholder="Seleccione una unidad"
              />
            )}
          />
          {errors.dealerUnitId && (
            <small className="p-error">{errors.dealerUnitId.message}</small>
          )}
        </div>

        <div className="col-12 md:col-6 field">
          <label className="font-semibold">Estatus</label>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Dropdown
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={STATUS_OPTIONS}
              />
            )}
          />
        </div>

        <div className="col-12 md:col-6 field">
          <label className="font-semibold">Cliente *</label>
          <Controller
            name="customerName"
            control={control}
            rules={{ required: "El nombre del cliente es requerido" }}
            render={({ field }) => (
              <InputText
                {...field}
                className={errors.customerName ? "p-invalid" : ""}
                autoFocus
              />
            )}
          />
          {errors.customerName && (
            <small className="p-error">{errors.customerName.message}</small>
          )}
        </div>

        <div className="col-12 md:col-3 field">
          <label className="font-semibold">Documento</label>
          <Controller
            name="customerDocument"
            control={control}
            render={({ field }) => <InputText {...field} value={field.value || ""} />}
          />
        </div>

        <div className="col-12 md:col-3 field">
          <label className="font-semibold">Teléfono</label>
          <Controller
            name="customerPhone"
            control={control}
            render={({ field }) => <InputText {...field} value={field.value || ""} />}
          />
        </div>

        <div className="col-12 md:col-6 field">
          <label className="font-semibold">Email</label>
          <Controller
            name="customerEmail"
            control={control}
            render={({ field }) => <InputText {...field} value={field.value || ""} />}
          />
        </div>

        <div className="col-12 md:col-3 field">
          <label className="font-semibold">Canal</label>
          <Controller
            name="sourceChannel"
            control={control}
            render={({ field }) => <InputText {...field} value={field.value || ""} />}
          />
        </div>

        <div className="col-12 md:col-3 field">
          <label className="font-semibold">Moneda</label>
          <Controller
            name="currency"
            control={control}
            render={({ field }) => <InputText {...field} value={field.value || ""} />}
          />
        </div>

        <div className="col-12 md:col-4 field">
          <label className="font-semibold">Precio Ofertado</label>
          <Controller
            name="offeredPrice"
            control={control}
            render={({ field }) => (
              <InputNumber
                value={field.value ?? null}
                onValueChange={(e) => field.onChange(e.value ?? undefined)}
                mode="decimal"
                min={0}
                minFractionDigits={2}
                maxFractionDigits={2}
              />
            )}
          />
        </div>

        <div className="col-12 md:col-4 field">
          <label className="font-semibold">Depósito</label>
          <Controller
            name="depositAmount"
            control={control}
            render={({ field }) => (
              <InputNumber
                value={field.value ?? null}
                onValueChange={(e) => field.onChange(e.value ?? undefined)}
                mode="decimal"
                min={0}
                minFractionDigits={2}
                maxFractionDigits={2}
              />
            )}
          />
        </div>

        <div className="col-12 md:col-4 field">
          <label className="font-semibold">Vigencia</label>
          <Controller
            name="expiresAt"
            control={control}
            render={({ field }) => (
              <Calendar
                value={field.value ?? null}
                onChange={(e) => field.onChange((e.value as Date) || null)}
                showIcon
                dateFormat="dd/mm/yy"
              />
            )}
          />
        </div>

        <div className="col-12 field mb-0">
          <label className="font-semibold">Notas</label>
          <Controller
            name="notes"
            control={control}
            render={({ field }) => <InputText {...field} value={field.value || ""} />}
          />
        </div>
      </div>
    </form>
  );
}
