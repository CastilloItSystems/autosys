"use client";

import React from "react";
import { Controller, useForm } from "react-hook-form";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import dealerTestDriveService, {
  SaveDealerTestDriveRequest,
} from "@/app/api/dealer/dealerTestDriveService";
import type { DealerTestDrive } from "@/libs/interfaces/dealer/dealerTestDrive.interface";
import { handleFormError } from "@/utils/errorHandlers";

const STATUS_OPTIONS = [
  { label: "Agendada", value: "SCHEDULED" },
  { label: "Confirmada", value: "CONFIRMED" },
  { label: "Completada", value: "COMPLETED" },
  { label: "No asistió", value: "NO_SHOW" },
  { label: "Cancelada", value: "CANCELLED" },
];

type DealerTestDriveFormValues = {
  dealerUnitId: string;
  customerName: string;
  customerDocument: string;
  customerPhone: string;
  customerEmail: string;
  driverLicense: string;
  scheduledAt: Date | null;
  advisorName: string;
  routeDescription: string;
  observations: string;
  customerFeedback: string;
  status: string;
  isActive: boolean;
};

interface DealerTestDriveFormProps {
  testDrive: DealerTestDrive | null;
  unitOptions: Array<{ label: string; value: string }>;
  onSave: () => void | Promise<void>;
  formId?: string;
  onSubmittingChange?: (isSubmitting: boolean) => void;
  toast: React.RefObject<Toast> | null;
}

export default function DealerTestDriveForm({
  testDrive,
  unitOptions,
  onSave,
  formId,
  onSubmittingChange,
  toast,
}: DealerTestDriveFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<DealerTestDriveFormValues>({
    mode: "onBlur",
    defaultValues: {
      dealerUnitId: testDrive?.dealerUnitId || "",
      customerName: testDrive?.customerName || "",
      customerDocument: testDrive?.customerDocument || "",
      customerPhone: testDrive?.customerPhone || "",
      customerEmail: testDrive?.customerEmail || "",
      driverLicense: testDrive?.driverLicense || "",
      scheduledAt: testDrive?.scheduledAt ? new Date(testDrive.scheduledAt) : null,
      advisorName: testDrive?.advisorName || "",
      routeDescription: testDrive?.routeDescription || "",
      observations: testDrive?.observations || "",
      customerFeedback: testDrive?.customerFeedback || "",
      status: testDrive?.status || "SCHEDULED",
      isActive: testDrive?.isActive ?? true,
    },
  });

  const onSubmit = async (data: DealerTestDriveFormValues) => {
    onSubmittingChange?.(true);
    try {
      const payload: SaveDealerTestDriveRequest = {
        dealerUnitId: data.dealerUnitId,
        customerName: data.customerName.trim(),
        customerDocument: data.customerDocument || null,
        customerPhone: data.customerPhone || null,
        customerEmail: data.customerEmail || null,
        driverLicense: data.driverLicense || null,
        scheduledAt: data.scheduledAt ? data.scheduledAt.toISOString() : "",
        advisorName: data.advisorName || null,
        routeDescription: data.routeDescription || null,
        observations: data.observations || null,
        customerFeedback: data.customerFeedback || null,
        status: data.status,
        isActive: data.isActive,
      };

      if (testDrive?.id) {
        await dealerTestDriveService.update(testDrive.id, payload);
      } else {
        await dealerTestDriveService.create(payload);
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
      id={formId || "dealer-test-drive-form"}
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

        <div className="col-12 md:col-3 field">
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

        <div className="col-12 md:col-3 field">
          <label className="font-semibold">Fecha/Hora *</label>
          <Controller
            name="scheduledAt"
            control={control}
            rules={{ required: "La fecha/hora es requerida" }}
            render={({ field }) => (
              <Calendar
                value={field.value}
                onChange={(e) => field.onChange((e.value as Date) || null)}
                showTime
                hourFormat="24"
                showIcon
                className={errors.scheduledAt ? "p-invalid" : ""}
              />
            )}
          />
          {errors.scheduledAt && (
            <small className="p-error">{errors.scheduledAt.message}</small>
          )}
        </div>

        <div className="col-12 md:col-4 field">
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

        <div className="col-12 md:col-4 field">
          <label className="font-semibold">Documento</label>
          <Controller
            name="customerDocument"
            control={control}
            render={({ field }) => <InputText {...field} value={field.value || ""} />}
          />
        </div>

        <div className="col-12 md:col-4 field">
          <label className="font-semibold">Licencia</label>
          <Controller
            name="driverLicense"
            control={control}
            render={({ field }) => <InputText {...field} value={field.value || ""} />}
          />
        </div>

        <div className="col-12 md:col-4 field">
          <label className="font-semibold">Teléfono</label>
          <Controller
            name="customerPhone"
            control={control}
            render={({ field }) => <InputText {...field} value={field.value || ""} />}
          />
        </div>

        <div className="col-12 md:col-4 field">
          <label className="font-semibold">Email</label>
          <Controller
            name="customerEmail"
            control={control}
            render={({ field }) => <InputText {...field} value={field.value || ""} />}
          />
        </div>

        <div className="col-12 md:col-4 field">
          <label className="font-semibold">Asesor</label>
          <Controller
            name="advisorName"
            control={control}
            render={({ field }) => <InputText {...field} value={field.value || ""} />}
          />
        </div>

        <div className="col-12 md:col-6 field">
          <label className="font-semibold">Ruta</label>
          <Controller
            name="routeDescription"
            control={control}
            render={({ field }) => <InputText {...field} value={field.value || ""} />}
          />
        </div>

        <div className="col-12 md:col-6 field">
          <label className="font-semibold">Observaciones</label>
          <Controller
            name="observations"
            control={control}
            render={({ field }) => <InputText {...field} value={field.value || ""} />}
          />
        </div>

        <div className="col-12 field mb-0">
          <label className="font-semibold">Feedback cliente</label>
          <Controller
            name="customerFeedback"
            control={control}
            render={({ field }) => <InputText {...field} value={field.value || ""} />}
          />
        </div>
      </div>
    </form>
  );
}
