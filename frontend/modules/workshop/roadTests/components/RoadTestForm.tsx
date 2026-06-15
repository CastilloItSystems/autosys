"use client";
import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import roadTestService from "../services/roadTestService";
import type { CreateRoadTestInput } from "../interfaces/roadTest.interface";
import { handleFormError } from "@/utils/errorHandlers";
import { Toast } from "primereact/toast";

export default function RoadTestForm({ onSaved }: { onSaved: () => void }) {
  const toast = React.useRef<Toast>(null);
  const [submitting, setSubmitting] = useState(false);
  const { control, handleSubmit, formState: { errors } } = useForm<CreateRoadTestInput>({
    mode: "onBlur",
    defaultValues: {
      serviceOrderId: "",
      motive: "",
      driverId: "",
      driverName: "",
      technicianId: "",
      technicianName: "",
      exitPassRef: "",
      notes: "",
    },
  });

  const onSubmit = async (values: CreateRoadTestInput) => {
    setSubmitting(true);
    try {
      await roadTestService.create(values);
      onSaved();
    } catch (e) {
      handleFormError(e, toast);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-column gap-3">
      <Toast ref={toast} />

      <div>
        <label className="block mb-1">OT ID *</label>
        <Controller
          name="serviceOrderId"
          control={control}
          rules={{ required: "Obligatorio" }}
          render={({ field }) => <InputText {...field} className="w-full" />}
        />
        {errors.serviceOrderId && <small className="text-red-500">{errors.serviceOrderId.message}</small>}
      </div>

      <div>
        <label className="block mb-1">Motivo *</label>
        <Controller
          name="motive"
          control={control}
          rules={{ required: "Obligatorio" }}
          render={({ field }) => <InputTextarea {...field} rows={2} className="w-full" />}
        />
        {errors.motive && <small className="text-red-500">{errors.motive.message}</small>}
      </div>

      <div className="grid">
        <div className="col-6">
          <label className="block mb-1">Chófer ID *</label>
          <Controller
            name="driverId"
            control={control}
            rules={{ required: true }}
            render={({ field }) => <InputText {...field} className="w-full" />}
          />
        </div>
        <div className="col-6">
          <label className="block mb-1">Nombre Chófer</label>
          <Controller
            name="driverName"
            control={control}
            render={({ field }) => <InputText {...field} value={field.value ?? ""} className="w-full" />}
          />
        </div>
      </div>

      <div className="grid">
        <div className="col-6">
          <label className="block mb-1">Técnico ID *</label>
          <Controller
            name="technicianId"
            control={control}
            rules={{ required: true }}
            render={({ field }) => <InputText {...field} className="w-full" />}
          />
        </div>
        <div className="col-6">
          <label className="block mb-1">Nombre Técnico</label>
          <Controller
            name="technicianName"
            control={control}
            render={({ field }) => <InputText {...field} value={field.value ?? ""} className="w-full" />}
          />
        </div>
      </div>

      <div>
        <label className="block mb-1">Referencia Pase de Salida</label>
        <Controller
          name="exitPassRef"
          control={control}
          render={({ field }) => <InputText {...field} value={field.value ?? ""} className="w-full" />}
        />
      </div>

      <div>
        <label className="block mb-1">Notas</label>
        <Controller
          name="notes"
          control={control}
          render={({ field }) => <InputTextarea {...field} value={field.value ?? ""} rows={2} className="w-full" />}
        />
      </div>

      <div className="flex w-full gap-2 mt-2">
        <Button
          type="submit"
          label="Registrar"
          icon="pi pi-check"
          loading={submitting}
          className="flex-1"
        />
      </div>
    </form>
  );
}
