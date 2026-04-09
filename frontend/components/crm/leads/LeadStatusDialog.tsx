"use client";
import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { InputTextarea } from "primereact/inputtextarea";
import { Toast } from "primereact/toast";

import {
  updateLeadStatusSchema,
  UpdateLeadStatusInput,
} from "@/libs/zods/crm/leadZod";
import { Lead, LEAD_STATUS_CONFIG, CHANNEL_STAGE_LABELS } from "@/libs/interfaces/crm/lead.interface";
import leadService from "@/app/api/crm/leadService";
import { handleFormError } from "@/utils/errorHandlers";

interface Props {
  lead: Lead | null;
  visible: boolean;
  onHide: () => void;
  onSaved: () => void;
  toast: React.RefObject<Toast> | null;
}

function getStatusOptions(channel?: string | null) {
  const channelLabels = channel ? CHANNEL_STAGE_LABELS[channel] ?? {} : {}
  return Object.entries(LEAD_STATUS_CONFIG).map(([value, cfg]) => ({
    label: channelLabels[value] ?? cfg.label,
    value,
  }))
}

export default function LeadStatusDialog({ lead, visible, onHide, onSaved, toast }: Props) {
  const [submitting, setSubmitting] = React.useState(false);
  const statusOptions = getStatusOptions(lead?.channel);

  const {
    control,
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<UpdateLeadStatusInput>({
    resolver: zodResolver(updateLeadStatusSchema),
  });

  const watchedStatus = watch("status");

  React.useEffect(() => {
    if (lead) {
      reset({ status: lead.status as any, lostReason: lead.lostReason ?? "" });
    }
  }, [lead, reset]);

  const onSubmit = async (data: UpdateLeadStatusInput) => {
    if (!lead) return;
    setSubmitting(true);
    try {
      await leadService.updateStatus(lead.id, {
        status: data.status,
        lostReason: data.lostReason || undefined,
        closedAt: data.closedAt || undefined,
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

  const footer = (
    <div className="flex justify-content-end gap-2">
      <Button label="Cancelar" outlined severity="secondary" onClick={onHide} disabled={submitting} />
      <Button
        label="Actualizar Estado"
        icon="pi pi-check"
        form="lead-status-form"
        type="submit"
        loading={submitting}
      />
    </div>
  );

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={
        <div className="flex align-items-center gap-2">
          <span>{`Actualizar Estado · ${lead?.title ?? ""}`}</span>
          {lead?.channel && (
            <span className="text-xs text-500 font-normal">[{lead.channel}]</span>
          )}
        </div>
      }
      style={{ width: "420px" }}
      footer={footer}
      modal
      draggable={false}
    >
      <form id="lead-status-form" onSubmit={handleSubmit(onSubmit)} className="p-fluid">
        <div className="field">
          <label className="font-semibold">Nuevo Estado <span className="text-red-500">*</span></label>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Dropdown
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={statusOptions}
                optionLabel="label"
                optionValue="value"
                placeholder="Seleccionar estado"
                className={errors.status ? "p-invalid" : ""}
              />
            )}
          />
          {errors.status && <small className="p-error">{errors.status.message}</small>}
        </div>

        {watchedStatus === "LOST" && (
          <div className="field mt-3">
            <label className="font-semibold">Motivo de Pérdida <span className="text-red-500">*</span></label>
            <InputTextarea
              {...register("lostReason")}
              rows={3}
              placeholder="¿Por qué se perdió esta oportunidad?"
              className={errors.lostReason ? "p-invalid" : ""}
            />
            {errors.lostReason && <small className="p-error">{errors.lostReason.message}</small>}
          </div>
        )}
      </form>
    </Dialog>
  );
}
