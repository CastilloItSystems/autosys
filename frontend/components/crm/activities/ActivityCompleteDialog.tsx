"use client";
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputTextarea } from "primereact/inputtextarea";
import { Toast } from "primereact/toast";

import {
  completeActivitySchema,
  CompleteActivityInput,
} from "@/libs/zods/crm/activityZod";
import { Activity } from "@/libs/interfaces/crm/activity.interface";
import activityService from "@/app/api/crm/activityService";
import { handleFormError } from "@/utils/errorHandlers";

interface Props {
  activity: Activity | null;
  visible: boolean;
  onHide: () => void;
  onSaved: () => void;
  toast: React.RefObject<Toast> | null;
}

export default function ActivityCompleteDialog({
  activity,
  visible,
  onHide,
  onSaved,
  toast,
}: Props) {
  const [submitting, setSubmitting] = React.useState(false);

  const { register, handleSubmit, reset } = useForm<CompleteActivityInput>({
    resolver: zodResolver(completeActivitySchema),
    defaultValues: { outcome: "" },
  });

  React.useEffect(() => {
    if (visible) reset({ outcome: activity?.outcome ?? "" });
  }, [visible, activity, reset]);

  const onSubmit = async (data: CompleteActivityInput) => {
    if (!activity) return;
    setSubmitting(true);
    try {
      await activityService.complete(activity.id, {
        outcome: data.outcome || undefined,
        completedAt: new Date().toISOString(),
      });
      toast?.current?.show({ severity: "success", summary: "Actividad completada" });
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
        label="Marcar como Completada"
        icon="pi pi-check-circle"
        severity="success"
        form="complete-activity-form"
        type="submit"
        loading={submitting}
      />
    </div>
  );

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={`Completar Actividad · ${activity?.title ?? ""}`}
      style={{ width: "420px" }}
      footer={footer}
      modal
      draggable={false}
    >
      <form id="complete-activity-form" onSubmit={handleSubmit(onSubmit)} className="p-fluid">
        <div className="field">
          <label>Resultado / Observaciones</label>
          <InputTextarea
            {...register("outcome")}
            rows={4}
            placeholder="¿Cuál fue el resultado de esta actividad? (opcional)"
          />
        </div>
      </form>
    </Dialog>
  );
}
