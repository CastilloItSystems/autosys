"use client";
import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from "primereact/inputnumber";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import FormActionButtons from "@/components/common/FormActionButtons";
import { garitaService } from "@/app/api/workshop";
import { handleFormError } from "@/utils/errorHandlers";
import {
  createGaritaEventSchema,
  GARITA_TYPE_LABELS,
  GARITA_EVENT_TYPES,
  type CreateGaritaFormValues,
} from "@/libs/zods/workshop";
import type { CreateGaritaEventInput, GaritaEventType } from "@/libs/interfaces/workshop";

interface Props {
  serviceOrderId?: string;
  totId?: string;
  defaultType?: GaritaEventType;
  toast: React.RefObject<any>;
  onSaved: () => void;
  onCancel: () => void;
}

const TYPE_OPTIONS = GARITA_EVENT_TYPES.map((t) => ({
  label: GARITA_TYPE_LABELS[t],
  value: t,
}));

const REQUIRES_EXIT_PASS: GaritaEventType[] = ["VEHICLE_OUT", "PART_OUT", "ROAD_TEST_OUT"];
const VEHICLE_EVENTS: GaritaEventType[] = ["VEHICLE_IN", "VEHICLE_OUT", "ROAD_TEST_OUT", "ROAD_TEST_IN"];
const SERIAL_EVENTS: GaritaEventType[] = ["VEHICLE_IN", "VEHICLE_OUT"];

export default function GaritaForm({ serviceOrderId, totId, defaultType, toast, onSaved, onCancel }: Props) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateGaritaFormValues>({
    resolver: zodResolver(createGaritaEventSchema),
    defaultValues: {
      type: defaultType ?? "VEHICLE_IN",
      serviceOrderId: serviceOrderId ?? null,
      totId: totId ?? null,
      plateNumber: null,
      vehicleDesc: null,
      serialMotor: null,
      serialBody: null,
      kmIn: null,
      driverName: null,
      driverId: null,
      exitPassRef: null,
      notes: null,
      eventAt: new Date().toISOString(),
    },
  });

  const selectedType = watch("type") as GaritaEventType;
  const isVehicleEvent = VEHICLE_EVENTS.includes(selectedType);
  const isSerialEvent = SERIAL_EVENTS.includes(selectedType);
  const isExitEvent = REQUIRES_EXIT_PASS.includes(selectedType);

  const onSubmit = async (values: CreateGaritaFormValues) => {
    setIsSubmitting(true);
    try {
      const payload: CreateGaritaEventInput = {
        ...values,
        plateNumber: values.plateNumber || null,
      };
      await garitaService.create(payload);
      onSaved();
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form id="garita-form" onSubmit={handleSubmit(onSubmit)} className="p-fluid">
      <div className="grid">

        {/* ── Tipo de movimiento ── */}
        <div className="col-12 md:col-6">
          <label htmlFor="type" className="block text-900 font-medium mb-2">
            Tipo de movimiento <span className="text-red-500">*</span>
          </label>
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="type"
                {...field}
                options={TYPE_OPTIONS}
                className={`w-full${errors.type ? " p-invalid" : ""}`}
              />
            )}
          />
          {errors.type && <small className="p-error block mt-1">{errors.type.message}</small>}
        </div>

        {/* ── Fecha / Hora ── */}
        <div className="col-12 md:col-6">
          <label htmlFor="eventAt" className="block text-900 font-medium mb-2">
            Fecha / Hora
          </label>
          <Controller
            name="eventAt"
            control={control}
            render={({ field }) => (
              <Calendar
                inputId="eventAt"
                value={field.value ? new Date(field.value) : null}
                onChange={(e) => field.onChange(e.value ? (e.value as Date).toISOString() : null)}
                showTime
                dateFormat="dd/mm/yy"
                showIcon
                className="w-full"
              />
            )}
          />
        </div>

        {/* ── Placa + Vehículo + KM (una fila) ── */}
        <div className="col-12 md:col-3">
          <label htmlFor="plateNumber" className="block text-900 font-medium mb-2">
            Placa
          </label>
          <Controller
            name="plateNumber"
            control={control}
            render={({ field }) => (
              <InputText
                id="plateNumber"
                {...field}
                value={field.value ?? ""}
                placeholder="ABC-123"
                className="w-full uppercase"
              />
            )}
          />
        </div>

        <div className={`col-12 ${isVehicleEvent ? "md:col-6" : "md:col-9"}`}>
          <label htmlFor="vehicleDesc" className="block text-900 font-medium mb-2">
            Vehículo
          </label>
          <Controller
            name="vehicleDesc"
            control={control}
            render={({ field }) => (
              <InputText
                id="vehicleDesc"
                {...field}
                value={field.value ?? ""}
                placeholder="Marca, modelo, color"
                className="w-full"
              />
            )}
          />
        </div>

        {isVehicleEvent && (
          <div className="col-12 md:col-3">
            <label htmlFor="kmIn" className="block text-900 font-medium mb-2">
              Kilometraje
            </label>
            <Controller
              name="kmIn"
              control={control}
              render={({ field }) => (
                <InputNumber
                  inputId="kmIn"
                  value={field.value ?? null}
                  onValueChange={(e) => field.onChange(e.value ?? null)}
                  placeholder="km"
                  className="w-full"
                  useGrouping={false}
                />
              )}
            />
          </div>
        )}

        {/* ── Seriales (solo VEHICLE_IN / VEHICLE_OUT) ── */}
        {isSerialEvent && (
          <>
            <div className="col-12 md:col-6">
              <label htmlFor="serialMotor" className="block text-900 font-medium mb-2">
                Serial de motor
              </label>
              <Controller
                name="serialMotor"
                control={control}
                render={({ field }) => (
                  <InputText
                    id="serialMotor"
                    {...field}
                    value={field.value ?? ""}
                    className="w-full"
                  />
                )}
              />
            </div>

            <div className="col-12 md:col-6">
              <label htmlFor="serialBody" className="block text-900 font-medium mb-2">
                Serial de carrocería
              </label>
              <Controller
                name="serialBody"
                control={control}
                render={({ field }) => (
                  <InputText
                    id="serialBody"
                    {...field}
                    value={field.value ?? ""}
                    className="w-full"
                  />
                )}
              />
            </div>
          </>
        )}

        {/* ── Conductor / Responsable ── */}
        <div className="col-12 md:col-6">
          <label htmlFor="driverName" className="block text-900 font-medium mb-2">
            Conductor / Responsable
          </label>
          <Controller
            name="driverName"
            control={control}
            render={({ field }) => (
              <InputText
                id="driverName"
                {...field}
                value={field.value ?? ""}
                className="w-full"
              />
            )}
          />
        </div>

        <div className="col-12 md:col-6">
          <label htmlFor="driverId" className="block text-900 font-medium mb-2">
            Cédula
          </label>
          <Controller
            name="driverId"
            control={control}
            render={({ field }) => (
              <InputText
                id="driverId"
                {...field}
                value={field.value ?? ""}
                className="w-full"
              />
            )}
          />
        </div>

        {/* ── Pase de salida (solo eventos de salida) ── */}
        {isExitEvent && (
          <div className="col-12">
            <label htmlFor="exitPassRef" className="block text-900 font-medium mb-2">
              Referencia pase de salida{" "}
              <span className="text-orange-500 text-sm font-normal">(requerido para autorizar)</span>
            </label>
            <Controller
              name="exitPassRef"
              control={control}
              render={({ field }) => (
                <InputText
                  id="exitPassRef"
                  {...field}
                  value={field.value ?? ""}
                  placeholder="Nro. de pase o referencia"
                  className="w-full"
                />
              )}
            />
          </div>
        )}

        {/* ── Observaciones ── */}
        <div className="col-12">
          <label htmlFor="notes" className="block text-900 font-medium mb-2">
            Observaciones
          </label>
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <InputTextarea
                id="notes"
                {...field}
                value={field.value ?? ""}
                rows={2}
                className="w-full"
                autoResize
              />
            )}
          />
        </div>

      </div>

      <div className="mt-4">
        <FormActionButtons isSubmitting={isSubmitting} isEdit={false} onCancel={onCancel} />
      </div>
    </form>
  );
}
