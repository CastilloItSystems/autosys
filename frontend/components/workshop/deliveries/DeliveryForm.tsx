"use client";
import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Calendar } from "primereact/calendar";
import { Checkbox } from "primereact/checkbox";
import { Divider } from "primereact/divider";
import { ProgressSpinner } from "primereact/progressspinner";
import { handleFormError } from "@/utils/errorHandlers";
import { deliveryService } from "@/app/api/workshop";
import { createDeliverySchema } from "@/libs/zods/workshop/deliveryZod";
import type { CreateDeliveryForm } from "@/libs/zods/workshop/deliveryZod";
import type { VehicleDelivery } from "@/libs/interfaces/workshop";
import SignaturePad from "@/components/workshop/shared/SignaturePad";

interface Props {
  delivery?: VehicleDelivery | null;
  defaultServiceOrderId?: string;
  onSave: () => void | Promise<void>;
  formId?: string;
  onSubmittingChange?: (v: boolean) => void;
  toast: React.RefObject<any>;
}

export default function DeliveryForm({
  delivery,
  defaultServiceOrderId,
  onSave,
  formId,
  onSubmittingChange,
  toast,
}: Props) {
  const [isLoading, setIsLoading] = useState(true);
  const [clientSignature, setClientSignature] = useState<string>("");

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateDeliveryForm>({
    resolver: zodResolver(createDeliverySchema),
    mode: "onBlur",
    defaultValues: {
      serviceOrderId: defaultServiceOrderId ?? "",
      deliveredBy: "",
      receivedByName: "",
      clientConformity: true,
      observations: "",
      nextVisitDate: undefined,
    },
  });

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 150);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (delivery) {
      reset({
        serviceOrderId: delivery.serviceOrderId ?? "",
        deliveredBy: delivery.deliveredBy ?? "",
        receivedByName: delivery.receivedByName ?? "",
        clientConformity: delivery.clientConformity ?? true,
        observations: delivery.observations ?? "",
        nextVisitDate: delivery.nextVisitDate ?? undefined,
      });
      setClientSignature(delivery.clientSignature ?? "");
    } else if (defaultServiceOrderId) {
      reset((prev) => ({ ...prev, serviceOrderId: defaultServiceOrderId }));
    }
  }, [delivery, defaultServiceOrderId, isLoading, reset]);

  const onSubmit = async (data: CreateDeliveryForm) => {
    onSubmittingChange?.(true);
    try {
      const payload = {
        ...data,
        clientSignature: clientSignature || undefined,
      };
      await deliveryService.create(payload);
      await onSave();
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      onSubmittingChange?.(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-column align-items-center justify-content-center p-4">
        <ProgressSpinner
          style={{ width: "40px", height: "40px" }}
          strokeWidth="4"
          fill="var(--surface-ground)"
          animationDuration=".5s"
        />
        <p className="mt-3 text-600 font-medium">Cargando formulario...</p>
      </div>
    );
  }

  return (
    <form
      id={formId ?? "delivery-form"}
      onSubmit={handleSubmit(onSubmit)}
      className="p-fluid"
    >
      <div className="grid">
        {/* Orden de Servicio */}
        <div className="col-12">
          <label htmlFor="serviceOrderId" className="block text-900 font-medium mb-2">
            ID Orden de Servicio <span className="text-red-500">*</span>
          </label>
          <Controller
            name="serviceOrderId"
            control={control}
            render={({ field }) => (
              <InputText
                id="serviceOrderId"
                {...field}
                placeholder="ID de la orden de servicio"
                className={errors.serviceOrderId ? "p-invalid" : ""}
              />
            )}
          />
          {errors.serviceOrderId && (
            <small className="p-error block mt-1">{errors.serviceOrderId.message}</small>
          )}
        </div>

        {/* Entregado por */}
        <div className="col-12 md:col-6">
          <label htmlFor="deliveredBy" className="block text-900 font-medium mb-2">
            Entregado por <span className="text-red-500">*</span>
          </label>
          <Controller
            name="deliveredBy"
            control={control}
            render={({ field }) => (
              <InputText
                id="deliveredBy"
                {...field}
                placeholder="Nombre del asesor/técnico que entrega"
                className={errors.deliveredBy ? "p-invalid" : ""}
              />
            )}
          />
          {errors.deliveredBy && (
            <small className="p-error block mt-1">{errors.deliveredBy.message}</small>
          )}
        </div>

        {/* Recibido por */}
        <div className="col-12 md:col-6">
          <label htmlFor="receivedByName" className="block text-900 font-medium mb-2">
            Recibido por <span className="text-red-500">*</span>
          </label>
          <Controller
            name="receivedByName"
            control={control}
            render={({ field }) => (
              <InputText
                id="receivedByName"
                {...field}
                placeholder="Nombre del cliente que recibe"
                className={errors.receivedByName ? "p-invalid" : ""}
              />
            )}
          />
          {errors.receivedByName && (
            <small className="p-error block mt-1">{errors.receivedByName.message}</small>
          )}
        </div>

        {/* Próxima visita */}
        <div className="col-12 md:col-6">
          <label htmlFor="nextVisitDate" className="block text-900 font-medium mb-2">
            Próxima visita sugerida
          </label>
          <Controller
            name="nextVisitDate"
            control={control}
            render={({ field }) => (
              <Calendar
                id="nextVisitDate"
                value={field.value ? new Date(field.value) : null}
                onChange={(e) =>
                  field.onChange(
                    e.value ? (e.value as Date).toISOString() : undefined
                  )
                }
                dateFormat="dd/mm/yy"
                placeholder="Sin fecha programada"
                showIcon
                minDate={new Date()}
              />
            )}
          />
        </div>

        {/* Conformidad del cliente */}
        <div className="col-12 md:col-6 flex align-items-center">
          <Controller
            name="clientConformity"
            control={control}
            render={({ field }) => (
              <div className="flex align-items-center gap-2 mt-4">
                <Checkbox
                  inputId="clientConformity"
                  checked={field.value ?? true}
                  onChange={(e) => field.onChange(e.checked)}
                />
                <label htmlFor="clientConformity" className="text-900 font-medium cursor-pointer">
                  Conforme — El cliente acepta la entrega del vehículo
                </label>
              </div>
            )}
          />
        </div>

        {/* Observaciones */}
        <div className="col-12">
          <label htmlFor="observations" className="block text-900 font-medium mb-2">
            Observaciones
          </label>
          <Controller
            name="observations"
            control={control}
            render={({ field }) => (
              <InputTextarea
                id="observations"
                {...field}
                value={field.value ?? ""}
                rows={3}
                placeholder="Notas adicionales sobre la entrega del vehículo..."
              />
            )}
          />
          {errors.observations && (
            <small className="p-error block mt-1">{errors.observations.message}</small>
          )}
        </div>

        {/* Firma Digital */}
        <div className="col-12">
          <Divider />
          <div className="flex align-items-center gap-2 mb-3">
            <i className="pi pi-pen-to-square text-primary text-xl" />
            <h5 className="m-0 text-900 font-semibold">Firma Digital del Cliente</h5>
          </div>
          <SignaturePad
            value={clientSignature}
            onChange={setClientSignature}
          />
        </div>
      </div>
    </form>
  );
}
