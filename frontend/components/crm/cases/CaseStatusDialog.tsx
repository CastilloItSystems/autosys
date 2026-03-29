"use client";
import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";

import {
  updateCaseStatusSchema,
  UpdateCaseStatusInput,
} from "@/libs/zods/crm/caseZod";
import {
  Case,
  CASE_STATUS_CONFIG,
} from "@/libs/interfaces/crm/case.interface";
import caseService from "@/app/api/crm/caseService";
import { handleFormError } from "@/utils/errorHandlers";

interface Props {
  caseRecord: Case | null;
  visible: boolean;
  onHide: () => void;
  onSaved: () => void;
  toast: React.RefObject<Toast> | null;
}

// Valid state transitions
const STATUS_TRANSITIONS: Record<string, string[]> = {
  OPEN:           ["IN_ANALYSIS", "IN_PROGRESS", "WAITING_CLIENT", "ESCALATED", "RESOLVED", "CLOSED", "REJECTED"],
  IN_ANALYSIS:    ["IN_PROGRESS", "WAITING_CLIENT", "ESCALATED", "RESOLVED", "CLOSED", "REJECTED"],
  IN_PROGRESS:    ["WAITING_CLIENT", "ESCALATED", "RESOLVED", "CLOSED", "REJECTED"],
  WAITING_CLIENT: ["IN_PROGRESS", "ESCALATED", "RESOLVED", "CLOSED", "REJECTED"],
  ESCALATED:      ["IN_PROGRESS", "RESOLVED", "CLOSED", "REJECTED"],
  RESOLVED:       ["CLOSED"],
  CLOSED:         [],
  REJECTED:       [],
};

const RESOLUTION_REQUIRED = ["RESOLVED", "CLOSED"];

function getNextStatusOptions(currentStatus: string) {
  const next = STATUS_TRANSITIONS[currentStatus] ?? [];
  return next.map((value) => ({
    label: CASE_STATUS_CONFIG[value]?.label ?? value,
    value,
  }));
}

export default function CaseStatusDialog({ caseRecord, visible, onHide, onSaved, toast }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const nextOptions = getNextStatusOptions(caseRecord?.status ?? "");
  const isTerminal = nextOptions.length === 0;

  const {
    control,
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<UpdateCaseStatusInput>({
    resolver: zodResolver(updateCaseStatusSchema),
  });

  const watchedStatus = watch("status");
  const resolutionRequired = RESOLUTION_REQUIRED.includes(watchedStatus ?? "");

  useEffect(() => {
    if (caseRecord && visible) {
      const first = nextOptions[0]?.value;
      reset({ status: first as any, resolution: "", rootCause: "" });
    }
  }, [caseRecord, visible, reset]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = async (data: UpdateCaseStatusInput) => {
    if (!caseRecord) return;
    setSubmitting(true);
    try {
      await caseService.updateStatus(caseRecord.id, {
        status: data.status,
        resolution: data.resolution || undefined,
        rootCause: data.rootCause || undefined,
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

  const currentCfg = caseRecord ? CASE_STATUS_CONFIG[caseRecord.status] : null;

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
        form="case-status-form"
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
          <span>Cambiar Estado · {caseRecord?.caseNumber ?? ""}</span>
        </div>
      }
      style={{ width: "480px" }}
      footer={footer}
      modal
      draggable={false}
    >
      <form id="case-status-form" onSubmit={handleSubmit(onSubmit)} className="p-fluid">
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
            Este caso se encuentra en un estado terminal y no puede ser modificado.
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
              <label className={resolutionRequired ? "font-semibold" : ""}>
                Resolución{resolutionRequired && <span className="text-red-500"> *</span>}
              </label>
              <InputTextarea
                {...register("resolution")}
                rows={3}
                placeholder="Describe cómo se resolvió el caso..."
                className={errors.resolution ? "p-invalid" : ""}
              />
              {errors.resolution && (
                <small className="p-error">{errors.resolution.message}</small>
              )}
            </div>

            <div className="field mt-2">
              <label>Causa raíz (opcional)</label>
              <InputText
                {...register("rootCause")}
                placeholder="Indica la causa raíz del problema"
              />
            </div>
          </>
        )}
      </form>
    </Dialog>
  );
}
