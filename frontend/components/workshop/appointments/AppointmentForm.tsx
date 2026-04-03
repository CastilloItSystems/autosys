"use client";
import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputText } from "primereact/inputtext";
import CustomerSelector from "@/components/common/CustomerSelector";
import VehicleSelector from "@/components/common/VehicleSelector";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Divider } from "primereact/divider";
import { ProgressSpinner } from "primereact/progressspinner";
import { handleFormError } from "@/utils/errorHandlers";
import {
  appointmentService,
  serviceTypeService,
  workshopShiftService,
} from "@/app/api/workshop";
import {
  createAppointmentSchema,
  updateAppointmentSchema,
  type CreateAppointmentForm,
} from "@/libs/zods/workshop/appointmentZod";
import type {
  ServiceAppointment,
  ServiceType,
  WorkshopShift,
} from "@/libs/interfaces/workshop";

const formatLocal = (isoString: string) => {
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

interface AppointmentFormProps {
  appointment: ServiceAppointment | null;
  onSave: () => void | Promise<void>;
  formId?: string;
  onSubmittingChange?: (v: boolean) => void;
  toast: React.RefObject<any>;
}

export default function AppointmentForm({
  appointment,
  onSave,
  formId,
  onSubmittingChange,
  toast,
}: AppointmentFormProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [shifts, setShifts] = useState<WorkshopShift[]>([]);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<CreateAppointmentForm>({
    resolver: zodResolver(
      appointment ? updateAppointmentSchema : createAppointmentSchema,
    ),
    mode: "onBlur",
    defaultValues: {
      customerId: "",
      vehiclePlate: "",
      vehicleDesc: "",
      serviceTypeId: undefined,
      scheduledDate: "",
      estimatedMinutes: undefined,
      assignedAdvisorId: undefined,
      clientNotes: "",
      internalNotes: "",
    },
  });

  useEffect(() => {
    const init = async () => {
      try {
        const [res, shiftsRes] = await Promise.all([
          serviceTypeService.getAll({ isActive: "true", limit: 100 }),
          workshopShiftService.getAll({ isActive: "true", limit: 100 }),
        ]);
        setServiceTypes(res.data ?? []);
        setShifts(shiftsRes.data ?? []);
      } catch {
        // silently fail
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (appointment) {
      reset({
        customerId: appointment.customerId ?? "",
        customerVehicleId: appointment.customerVehicleId ?? undefined,
        vehiclePlate: appointment.vehiclePlate ?? "",
        vehicleDesc: appointment.vehicleDesc ?? "",
        serviceTypeId: appointment.serviceTypeId ?? undefined,
        scheduledDate: appointment.scheduledDate
          ? formatLocal(appointment.scheduledDate)
          : "",
        estimatedMinutes: appointment.estimatedMinutes ?? undefined,
        assignedAdvisorId: appointment.assignedAdvisorId ?? undefined,
        clientNotes: appointment.clientNotes ?? "",
        internalNotes: appointment.internalNotes ?? "",
      });
    } else {
      reset({
        customerId: "",
        vehiclePlate: "",
        vehicleDesc: "",
        serviceTypeId: undefined,
        scheduledDate: "",
        estimatedMinutes: undefined,
        clientNotes: "",
        internalNotes: "",
      });
    }
  }, [appointment, reset, isLoading]);

  const onSubmit = async (data: CreateAppointmentForm) => {
    onSubmittingChange?.(true);
    try {
      let finalScheduledDate = data.scheduledDate;

      if (data.scheduledDate) {
        const d = new Date(`${data.scheduledDate}:00`);
        if (shifts.length > 0) {
          const dayOfWeek = d.getDay(); // 0=Sun, 1=Mon...6=Sat
          const timeStr = `${String(d.getHours()).padStart(2, "0")}:${String(
            d.getMinutes(),
          ).padStart(2, "0")}`;

          const isValidShift = shifts.some((shift) => {
            if (!shift.workDays.includes(dayOfWeek)) return false;
            return timeStr >= shift.startTime && timeStr <= shift.endTime;
          });

          if (!isValidShift) {
            setError("scheduledDate", {
              type: "manual",
              message:
                "El horario no está dentro de los turnos de trabajo disponibles.",
            });
            onSubmittingChange?.(false);
            return;
          }
        }
        finalScheduledDate = d.toISOString();
      }

      const payload = {
        ...data,
        scheduledDate: finalScheduledDate,
        vehiclePlate: data.vehiclePlate || undefined,
        vehicleDesc: data.vehicleDesc || undefined,
        clientNotes: data.clientNotes || undefined,
        internalNotes: data.internalNotes || undefined,
      };
      if (appointment?.id) {
        await appointmentService.update(appointment.id, payload);
      } else {
        await appointmentService.create(payload as any);
      }
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
        <p className="mt-3 text-600 font-medium">Preparando formulario...</p>
      </div>
    );
  }

  return (
    <form
      id={formId ?? "appointment-form"}
      onSubmit={handleSubmit(onSubmit)}
      className="p-fluid"
    >
      <div className="grid">
        {/* ── Cliente y vehículo ─────────────────────────────────────────── */}
        <div className="col-12">
          <Divider align="left" className="mt-0">
            <span className="text-700 font-semibold text-sm">
              Cliente y vehículo
            </span>
          </Divider>
        </div>

        <div className="col-12 md:col-6">
          <label className="block text-900 font-medium mb-2">
            Cliente <span className="text-red-500">*</span>
          </label>
          <Controller
            name="customerId"
            control={control}
            render={({ field }) => (
              <CustomerSelector
                value={field.value}
                onChange={field.onChange}
                invalid={!!errors.customerId}
                disabled={!!appointment?.id}
              />
            )}
          />
          {errors.customerId && (
            <small className="p-error block mt-1">
              {errors.customerId.message}
            </small>
          )}
        </div>

        <div className="col-12 md:col-6">
          <label
            htmlFor="serviceTypeId"
            className="block text-900 font-medium mb-2"
          >
            Tipo de servicio
          </label>
          <Controller
            name="serviceTypeId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="serviceTypeId"
                value={field.value ?? null}
                onChange={(e) => field.onChange(e.value ?? undefined)}
                options={serviceTypes}
                optionLabel="name"
                optionValue="id"
                placeholder="Sin tipo"
                showClear
              />
            )}
          />
        </div>

        <div className="col-12 md:col-6">
          <label className="block text-900 font-medium mb-2">Vehículo</label>
          <VehicleSelector
            customerId={watch("customerId")}
            value={watch("customerVehicleId" as any) ?? null}
            onChange={(id) => {
              setValue("customerVehicleId" as any, id ?? undefined);
            }}
            onVehicleSelect={(v) => {
              setValue("vehiclePlate", v?.plate ?? "");
              setValue("vehicleDesc", v?.description ?? "");
            }}
            disabled={!!appointment?.id}
          />
        </div>

        {/* ── Programación ──────────────────────────────────────────────── */}
        <div className="col-12">
          <Divider align="left">
            <span className="text-700 font-semibold text-sm">Programación</span>
          </Divider>
        </div>

        <div className="col-12 md:col-6">
          <label
            htmlFor="scheduledDate"
            className="block text-900 font-medium mb-2"
          >
            Fecha y hora <span className="text-red-500">*</span>
          </label>
          <Controller
            name="scheduledDate"
            control={control}
            render={({ field }) => (
              <InputText
                id="scheduledDate"
                type="datetime-local"
                {...field}
                value={field.value ?? ""}
                className={errors.scheduledDate ? "p-invalid" : ""}
              />
            )}
          />
          {errors.scheduledDate ? (
            <small className="p-error block mt-1">
              {errors.scheduledDate.message}
            </small>
          ) : shifts.length > 0 ? (
            <small className="text-500 block mt-1">
              Debe coincidir con un turno:{" "}
              {shifts.map((s) => `${s.startTime}-${s.endTime}`).join(", ")}
            </small>
          ) : null}
        </div>

        <div className="col-12 md:col-6">
          <label
            htmlFor="estimatedMinutes"
            className="block text-900 font-medium mb-2"
          >
            Duración estimada (min)
          </label>
          <Controller
            name="estimatedMinutes"
            control={control}
            render={({ field }) => (
              <InputNumber
                id="estimatedMinutes"
                value={field.value ?? null}
                onValueChange={(e) => field.onChange(e.value ?? undefined)}
                min={1}
                placeholder="Ej: 60"
              />
            )}
          />
        </div>

        {/* ── Notas ─────────────────────────────────────────────────────── */}
        <div className="col-12">
          <Divider align="left">
            <span className="text-700 font-semibold text-sm">Notas</span>
          </Divider>
        </div>

        <div className="col-12 md:col-6">
          <label
            htmlFor="clientNotes"
            className="block text-900 font-medium mb-2"
          >
            Notas del cliente
          </label>
          <Controller
            name="clientNotes"
            control={control}
            render={({ field }) => (
              <InputTextarea
                id="clientNotes"
                {...field}
                value={field.value ?? ""}
                rows={3}
                placeholder="Lo que el cliente indicó..."
              />
            )}
          />
        </div>

        <div className="col-12 md:col-6">
          <label
            htmlFor="internalNotes"
            className="block text-900 font-medium mb-2"
          >
            Notas internas
          </label>
          <Controller
            name="internalNotes"
            control={control}
            render={({ field }) => (
              <InputTextarea
                id="internalNotes"
                {...field}
                value={field.value ?? ""}
                rows={3}
                placeholder="Notas para el taller..."
              />
            )}
          />
        </div>
      </div>
    </form>
  );
}
