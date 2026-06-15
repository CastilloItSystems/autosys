"use client";
import React, { useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Checkbox } from "primereact/checkbox";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { handleFormError } from "@/utils/errorHandlers";
import postRepairScanService from "../services/postRepairScanService";
import type {
  CreatePostRepairScanInput,
  PostRepairScanResult,
} from "../interfaces/postRepairScan.interface";

const RESULTS: { label: string; value: PostRepairScanResult }[] = [
  { label: "Aprobado", value: "PASS" },
  { label: "Con observaciones", value: "WITH_OBSERVATIONS" },
  { label: "Fallido", value: "FAIL" },
];

type FormValues = Omit<CreatePostRepairScanInput, "dtcCodesCleared"> & {
  dtcCodesCleared?: string;
};

export default function PostRepairScanForm({ onSaved }: { onSaved: () => void }) {
  const toast = useRef<Toast>(null);
  const [submitting, setSubmitting] = useState(false);
  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>({
    mode: "onBlur",
    defaultValues: {
      serviceOrderId: "",
      technicianId: "",
      technicianName: "",
      dtcCodesCleared: "",
      result: "PASS",
      reportUrl: "",
      reportPrinted: false,
      observations: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const codes = (values.dtcCodesCleared ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      await postRepairScanService.create({
        serviceOrderId: values.serviceOrderId,
        technicianId: values.technicianId,
        technicianName: values.technicianName || undefined,
        dtcCodesCleared: codes,
        result: values.result,
        reportUrl: values.reportUrl || undefined,
        reportPrinted: values.reportPrinted,
        observations: values.observations || undefined,
      });
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
        {errors.serviceOrderId && (
          <small className="text-red-500">{errors.serviceOrderId.message}</small>
        )}
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
        <label className="block mb-1">Códigos DTC borrados (separados por coma)</label>
        <Controller
          name="dtcCodesCleared"
          control={control}
          render={({ field }) => (
            <InputText
              {...field}
              value={field.value ?? ""}
              placeholder="P0301, P0420"
              className="w-full"
            />
          )}
        />
      </div>

      <div className="grid">
        <div className="col-6">
          <label className="block mb-1">Resultado *</label>
          <Controller
            name="result"
            control={control}
            render={({ field }) => (
              <Dropdown
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={RESULTS}
                className="w-full"
              />
            )}
          />
        </div>
        <div className="col-6 flex align-items-end">
          <Controller
            name="reportPrinted"
            control={control}
            render={({ field }) => (
              <div className="field-checkbox">
                <Checkbox
                  inputId="printed"
                  checked={!!field.value}
                  onChange={(e) => field.onChange(!!e.checked)}
                />
                <label htmlFor="printed" className="ml-2">
                  Reporte impreso y anexado físicamente
                </label>
              </div>
            )}
          />
        </div>
      </div>

      <div>
        <label className="block mb-1">URL Reporte (PDF/Imagen)</label>
        <Controller
          name="reportUrl"
          control={control}
          render={({ field }) => <InputText {...field} value={field.value ?? ""} className="w-full" />}
        />
      </div>

      <div>
        <label className="block mb-1">Observaciones</label>
        <Controller
          name="observations"
          control={control}
          render={({ field }) => (
            <InputTextarea
              {...field}
              value={field.value ?? ""}
              rows={3}
              className="w-full"
            />
          )}
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
