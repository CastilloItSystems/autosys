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
import { Checkbox } from "primereact/checkbox";
import { Chips } from "primereact/chips";
import { Divider } from "primereact/divider";
import { ProgressSpinner } from "primereact/progressspinner";
import { handleFormError } from "@/utils/errorHandlers";
import { receptionService } from "@/app/api/workshop";
import {
  createReceptionSchema,
  updateReceptionSchema,
  type CreateReceptionForm,
} from "@/libs/zods/workshop/receptionZod";
import type { VehicleReception } from "@/libs/interfaces/workshop";

const FUEL_LEVEL_OPTIONS = [
  { label: "Vacío", value: "EMPTY" },
  { label: "1/4", value: "QUARTER" },
  { label: "1/2", value: "HALF" },
  { label: "3/4", value: "THREE_QUARTERS" },
  { label: "Lleno", value: "FULL" },
];

interface ReceptionFormProps {
  reception: VehicleReception | null;
  onSave: () => void | Promise<void>;
  formId?: string;
  onSubmittingChange?: (v: boolean) => void;
  toast: React.RefObject<any>;
}

export default function ReceptionForm({
  reception,
  onSave,
  formId,
  onSubmittingChange,
  toast,
}: ReceptionFormProps) {
  const [isLoading, setIsLoading] = useState(true);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateReceptionForm>({
    resolver: zodResolver(reception ? updateReceptionSchema : createReceptionSchema),
    mode: "onBlur",
    defaultValues: {
      customerId: "",
      vehiclePlate: "",
      vehicleDesc: "",
      mileageIn: undefined,
      fuelLevel: undefined,
      accessories: [],
      hasPreExistingDamage: false,
      damageNotes: "",
      clientDescription: "",
      authorizationName: "",
      authorizationPhone: "",
      estimatedDelivery: undefined,
      advisorId: undefined,
      appointmentId: undefined,
    },
  });

  const hasPreExistingDamage = watch("hasPreExistingDamage");

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 250);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (reception) {
      reset({
        customerId: reception.customerId ?? "",
        customerVehicleId: reception.customerVehicleId ?? undefined,
        vehiclePlate: reception.vehiclePlate ?? "",
        vehicleDesc: reception.vehicleDesc ?? "",
        mileageIn: reception.mileageIn ?? undefined,
        fuelLevel: (reception.fuelLevel as any) ?? undefined,
        accessories: (reception.accessories as string[]) ?? [],
        hasPreExistingDamage: reception.hasPreExistingDamage ?? false,
        damageNotes: reception.damageNotes ?? "",
        clientDescription: reception.clientDescription ?? "",
        authorizationName: reception.authorizationName ?? "",
        authorizationPhone: reception.authorizationPhone ?? "",
        estimatedDelivery: reception.estimatedDelivery
          ? reception.estimatedDelivery.substring(0, 16)
          : undefined,
        advisorId: reception.advisorId ?? undefined,
        appointmentId: reception.appointmentId ?? undefined,
      });
    } else {
      reset({
        customerId: "",
        vehiclePlate: "",
        vehicleDesc: "",
        mileageIn: undefined,
        fuelLevel: undefined,
        accessories: [],
        hasPreExistingDamage: false,
        damageNotes: "",
        clientDescription: "",
        authorizationName: "",
        authorizationPhone: "",
        estimatedDelivery: undefined,
      });
    }
  }, [reception, reset, isLoading]);

  const onSubmit = async (data: CreateReceptionForm) => {
    onSubmittingChange?.(true);
    try {
      const payload = {
        ...data,
        vehiclePlate: data.vehiclePlate || undefined,
        vehicleDesc: data.vehicleDesc || undefined,
        damageNotes: data.damageNotes || undefined,
        clientDescription: data.clientDescription || undefined,
        authorizationName: data.authorizationName || undefined,
        authorizationPhone: data.authorizationPhone || undefined,
      };
      if (reception?.id) {
        await receptionService.update(reception.id, payload);
      } else {
        await receptionService.create(payload as any);
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
        <ProgressSpinner style={{ width: "40px", height: "40px" }} strokeWidth="4" fill="var(--surface-ground)" animationDuration=".5s" />
        <p className="mt-3 text-600 font-medium">Preparando formulario...</p>
      </div>
    );
  }

  return (
    <form id={formId ?? "reception-form"} onSubmit={handleSubmit(onSubmit)} className="p-fluid">
      <div className="grid">

        {/* ── Cliente y vehículo ─────────────────────────────────────────── */}
        <div className="col-12">
          <Divider align="left" className="mt-0">
            <span className="text-700 font-semibold text-sm">Cliente y vehículo</span>
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
                disabled={!!reception?.id}
              />
            )}
          />
          {errors.customerId && <small className="p-error block mt-1">{errors.customerId.message}</small>}
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
            disabled={!!reception?.id}
          />
        </div>

        <div className="col-12 md:col-3">
          <label htmlFor="mileageIn" className="block text-900 font-medium mb-2">
            Kilometraje entrada
          </label>
          <Controller
            name="mileageIn"
            control={control}
            render={({ field }) => (
              <InputNumber
                id="mileageIn"
                value={field.value ?? null}
                onValueChange={(e) => field.onChange(e.value ?? undefined)}
                min={0}
                placeholder="km"
              />
            )}
          />
        </div>

        <div className="col-12 md:col-3">
          <label htmlFor="fuelLevel" className="block text-900 font-medium mb-2">
            Nivel de combustible
          </label>
          <Controller
            name="fuelLevel"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="fuelLevel"
                value={field.value ?? null}
                onChange={(e) => field.onChange(e.value ?? undefined)}
                options={FUEL_LEVEL_OPTIONS}
                placeholder="Seleccionar"
                showClear
              />
            )}
          />
        </div>

        {/* ── Estado del vehículo ───────────────────────────────────────── */}
        <div className="col-12">
          <Divider align="left">
            <span className="text-700 font-semibold text-sm">Estado del vehículo</span>
          </Divider>
        </div>

        <div className="col-12">
          <label htmlFor="accessories" className="block text-900 font-medium mb-2">
            Accesorios (presiona Enter para agregar)
          </label>
          <Controller
            name="accessories"
            control={control}
            render={({ field }) => (
              <Chips
                id="accessories"
                value={field.value ?? []}
                onChange={(e) => field.onChange(e.value ?? [])}
                placeholder="Ej: tapetes, llanta de refacción..."
                separator=","
              />
            )}
          />
        </div>

        <div className="col-12">
          <div className="flex align-items-center gap-2">
            <Controller
              name="hasPreExistingDamage"
              control={control}
              render={({ field }) => (
                <Checkbox
                  inputId="hasPreExistingDamage"
                  checked={field.value ?? false}
                  onChange={(e) => field.onChange(e.checked ?? false)}
                />
              )}
            />
            <label htmlFor="hasPreExistingDamage" className="text-900 font-medium cursor-pointer">
              El vehículo presenta daños preexistentes
            </label>
          </div>
        </div>

        {hasPreExistingDamage && (
          <div className="col-12">
            <label htmlFor="damageNotes" className="block text-900 font-medium mb-2">
              Descripción de daños
            </label>
            <Controller
              name="damageNotes"
              control={control}
              render={({ field }) => (
                <InputTextarea
                  id="damageNotes"
                  {...field}
                  value={field.value ?? ""}
                  rows={3}
                  placeholder="Describa los daños existentes..."
                  className={errors.damageNotes ? "p-invalid" : ""}
                />
              )}
            />
          </div>
        )}

        {/* ── Descripción del cliente ───────────────────────────────────── */}
        <div className="col-12">
          <Divider align="left">
            <span className="text-700 font-semibold text-sm">Solicitud del cliente</span>
          </Divider>
        </div>

        <div className="col-12">
          <label htmlFor="clientDescription" className="block text-900 font-medium mb-2">
            Descripción del problema / solicitud
          </label>
          <Controller
            name="clientDescription"
            control={control}
            render={({ field }) => (
              <InputTextarea
                id="clientDescription"
                {...field}
                value={field.value ?? ""}
                rows={3}
                placeholder="Lo que el cliente describe del problema..."
              />
            )}
          />
        </div>

        <div className="col-12 md:col-6">
          <label htmlFor="estimatedDelivery" className="block text-900 font-medium mb-2">
            Entrega estimada
          </label>
          <Controller
            name="estimatedDelivery"
            control={control}
            render={({ field }) => (
              <InputText
                id="estimatedDelivery"
                type="datetime-local"
                {...field}
                value={field.value ?? ""}
              />
            )}
          />
        </div>

        {/* ── Autorización ──────────────────────────────────────────────── */}
        <div className="col-12">
          <Divider align="left">
            <span className="text-700 font-semibold text-sm">Persona que autoriza</span>
          </Divider>
        </div>

        <div className="col-12 md:col-6">
          <label htmlFor="authorizationName" className="block text-900 font-medium mb-2">
            Nombre
          </label>
          <Controller
            name="authorizationName"
            control={control}
            render={({ field }) => (
              <InputText
                id="authorizationName"
                {...field}
                value={field.value ?? ""}
                placeholder="Nombre completo"
              />
            )}
          />
        </div>

        <div className="col-12 md:col-6">
          <label htmlFor="authorizationPhone" className="block text-900 font-medium mb-2">
            Teléfono de contacto
          </label>
          <Controller
            name="authorizationPhone"
            control={control}
            render={({ field }) => (
              <InputText
                id="authorizationPhone"
                {...field}
                value={field.value ?? ""}
                placeholder="Ej: 555-123-4567"
              />
            )}
          />
        </div>

      </div>
    </form>
  );
}
