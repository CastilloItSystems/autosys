"use client";
import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { InputTextarea } from "primereact/inputtextarea";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";

import {
  updateQuoteStatusSchema,
  UpdateQuoteStatusInput,
} from "@/libs/zods/crm/quoteZod";
import {
  Quote,
  QUOTE_STATUS_CONFIG,
} from "@/libs/interfaces/crm/quote.interface";
import quoteService from "@/app/api/crm/quoteService";
import { handleFormError } from "@/utils/errorHandlers";

interface Props {
  quote: Quote | null;
  visible: boolean;
  onHide: () => void;
  onSaved: () => void;
  toast: React.RefObject<Toast> | null;
}

// Valid state transitions
const STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT:       ["ISSUED", "SENT"],
  ISSUED:      ["SENT", "NEGOTIATING", "APPROVED", "REJECTED", "EXPIRED"],
  SENT:        ["NEGOTIATING", "APPROVED", "REJECTED", "EXPIRED"],
  NEGOTIATING: ["APPROVED", "REJECTED", "EXPIRED"],
  APPROVED:    ["CONVERTED"],
  REJECTED:    [],
  EXPIRED:     [],
  CONVERTED:   [],
};

function getNextStatusOptions(currentStatus: string) {
  const next = STATUS_TRANSITIONS[currentStatus] ?? [];
  return next.map((value) => ({
    label: QUOTE_STATUS_CONFIG[value]?.label ?? value,
    value,
  }));
}

export default function QuoteStatusDialog({ quote, visible, onHide, onSaved, toast }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const nextOptions = getNextStatusOptions(quote?.status ?? "");
  const isTerminal = nextOptions.length === 0;

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateQuoteStatusInput>({
    resolver: zodResolver(updateQuoteStatusSchema),
  });

  useEffect(() => {
    if (quote && visible) {
      const first = nextOptions[0]?.value;
      reset({ status: first as any, notes: "" });
    }
  }, [quote, visible, reset]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = async (data: UpdateQuoteStatusInput) => {
    if (!quote) return;
    setSubmitting(true);
    try {
      await quoteService.updateStatus(quote.id, {
        status: data.status,
        notes: data.notes || undefined,
      });
      toast?.current?.show({ severity: "success", summary: "Estado actualizado" });
      onSaved();
      onHide();
    } catch (err) {
      handleFormError(err, toast);
    } finally {
      setSubmitting(false);
    }
  };

  const currentCfg = quote ? QUOTE_STATUS_CONFIG[quote.status] : null;

  const footer = (
    <div className="flex justify-content-end gap-2">
      <Button
        label="Cancelar"
        outlined
        severity="secondary"
        onClick={onHide}
        disabled={submitting}
        type="button"
      />
      <Button
        label="Actualizar Estado"
        icon="pi pi-check"
        form="quote-status-form"
        type="submit"
        loading={submitting}
        disabled={isTerminal}
      />
    </div>
  );

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={
        <div className="flex align-items-center gap-2">
          <i className="pi pi-exchange text-primary" />
          <span>Cambiar Estado · {quote?.quoteNumber ?? ""}</span>
        </div>
      }
      style={{ width: "440px" }}
      footer={footer}
      modal
      draggable={false}
    >
      <form id="quote-status-form" onSubmit={handleSubmit(onSubmit)} className="p-fluid">
        {/* Current status */}
        {currentCfg && (
          <div className="mb-3">
            <label className="font-semibold text-sm block mb-1">Estado actual</label>
            <Tag
              value={currentCfg.label}
              severity={currentCfg.severity}
              icon={currentCfg.icon}
            />
          </div>
        )}

        {isTerminal ? (
          <div className="p-3 bg-gray-100 border-round text-600 text-sm">
            Esta cotización se encuentra en un estado terminal y no puede ser modificada.
          </div>
        ) : (
          <>
            <div className="field">
              <label className="font-semibold">
                Nuevo Estado <span className="text-red-500">*</span>
              </label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    options={nextOptions}
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Seleccionar nuevo estado"
                    className={errors.status ? "p-invalid" : ""}
                  />
                )}
              />
              {errors.status && (
                <small className="p-error">{errors.status.message}</small>
              )}
            </div>

            <div className="field mt-3">
              <label>Notas (opcional)</label>
              <InputTextarea
                {...register("notes")}
                rows={3}
                placeholder="Motivo del cambio de estado, observaciones..."
              />
            </div>
          </>
        )}
      </form>
    </Dialog>
  );
}
