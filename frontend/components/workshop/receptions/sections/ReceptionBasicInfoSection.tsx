"use client";
import React from "react";
import { Divider } from "primereact/divider";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Controller } from "react-hook-form";
import CustomerSelector from "@/components/common/CustomerSelector";
import VehicleSelector, {
  type VehicleSelectedData,
} from "@/components/common/VehicleSelector";
import type { Control, FieldErrors } from "react-hook-form";
import type { CreateReceptionForm } from "@/libs/zods/workshop/receptionZod";

interface ReceptionBasicInfoSectionProps {
  control: Control<CreateReceptionForm>;
  errors: FieldErrors<CreateReceptionForm>;
  isEditMode: boolean;
  onCustomerChange?: (id: string) => void;
  onVehicleSelect?: (data: VehicleSelectedData | null) => void;
}

export default function ReceptionBasicInfoSection({
  control,
  errors,
  isEditMode,
  onCustomerChange,
  onVehicleSelect,
}: ReceptionBasicInfoSectionProps) {
  return (
    <div className="grid">
      {/* Cliente y Vehículo */}
      <div className="col-12">
        <Divider align="left" className="mt-0 mb-3">
          <span className="text-sm font-semibold text-600">
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
              onChange={(id) => {
                field.onChange(id);
                onCustomerChange?.(id);
              }}
              invalid={!!errors.customerId}
              disabled={isEditMode}
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
        <label className="block text-900 font-medium mb-2">Vehículo</label>
        <Controller
          name="customerVehicleId"
          control={control}
          render={({ field }) => (
            <VehicleSelector
              value={field.value ?? undefined}
              onChange={field.onChange}
              customerId={control._formValues.customerId}
              onVehicleSelect={onVehicleSelect}
            />
          )}
        />
      </div>

      {/* Solicitud del cliente */}
      <div className="col-12">
        <Divider align="left" className="my-3">
          <span className="text-sm font-semibold text-600">
            Solicitud del cliente
          </span>
        </Divider>
      </div>

      <div className="col-12">
        <label className="block text-900 font-medium mb-2">
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
    </div>
  );
}
