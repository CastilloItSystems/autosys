"use client";
import React from "react";
import { Divider } from "primereact/divider";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Checkbox } from "primereact/checkbox";
import { Chips } from "primereact/chips";
import { Controller } from "react-hook-form";
import type { Control, FieldErrors } from "react-hook-form";
import type { CreateReceptionForm } from "@/libs/zods/workshop/receptionZod";

const ACCESSORIES_LIST = [
  { id: "gata", label: "Gata/Gato hidráulico" },
  { id: "llanta_repuesto", label: "Llanta de repuesto" },
  { id: "herramientas", label: "Kit de herramientas" },
  { id: "extintor", label: "Extintor" },
  { id: "triangulos", label: "Triángulos de seguridad" },
  { id: "radio", label: "Radio/Panel frontal" },
  { id: "antena", label: "Antena" },
  { id: "manuales", label: "Manuales del vehículo" },
];

const ACCESSORIES_IDS = new Set(ACCESSORIES_LIST.map((a) => a.id));

const FUEL_LEVEL_OPTIONS = [
  { label: "Vacío", value: "EMPTY" },
  { label: "1/4", value: "QUARTER" },
  { label: "1/2", value: "HALF" },
  { label: "3/4", value: "THREE_QUARTERS" },
  { label: "Lleno", value: "FULL" },
];

interface ReceptionVehicleStatusSectionProps {
  control: Control<CreateReceptionForm>;
  errors: FieldErrors<CreateReceptionForm>;
  watch: any;
}

export default function ReceptionVehicleStatusSection({
  control,
  errors,
  watch,
}: ReceptionVehicleStatusSectionProps) {
  const hasPreExistingDamage = watch("hasPreExistingDamage");

  return (
    <div className="grid">
      {/* Placa y descripción */}
      <div className="col-12 md:col-4">
        <label className="block text-900 font-medium mb-2">Placa</label>
        <Controller
          name="vehiclePlate"
          control={control}
          render={({ field }) => (
            <InputText
              id="vehiclePlate"
              {...field}
              value={field.value ?? ""}
              placeholder="Ej: ABC-123"
            />
          )}
        />
      </div>

      <div className="col-12 md:col-8">
        <label className="block text-900 font-medium mb-2">Descripción del vehículo</label>
        <Controller
          name="vehicleDesc"
          control={control}
          render={({ field }) => (
            <InputText
              id="vehicleDesc"
              {...field}
              value={field.value ?? ""}
              placeholder="Ej: Hilux Gris 2020"
            />
          )}
        />
      </div>

      {/* Condición mecánica */}
      <div className="col-12">
        <Divider align="left" className="my-3">
          <span className="text-sm font-semibold text-600">Condición mecánica</span>
        </Divider>
      </div>

      <div className="col-12 md:col-4">
        <label className="block text-900 font-medium mb-2">Kilometraje</label>
        <Controller
          name="mileageIn"
          control={control}
          render={({ field }) => (
            <InputNumber
              value={field.value ?? undefined}
              onValueChange={(e) => field.onChange(e.value ?? undefined)}
              placeholder="Ej: 45000"
              useGrouping={false}
            />
          )}
        />
      </div>

      <div className="col-12 md:col-4">
        <label className="block text-900 font-medium mb-2">Nivel de combustible</label>
        <Controller
          name="fuelLevel"
          control={control}
          render={({ field }) => (
            <Dropdown
              value={field.value ?? undefined}
              onChange={field.onChange}
              options={FUEL_LEVEL_OPTIONS}
              placeholder="Seleccionar..."
            />
          )}
        />
      </div>

      <div className="col-12 md:col-4">
        <label className="block text-900 font-medium mb-2">Fecha de entrega estimada</label>
        <Controller
          name="estimatedDelivery"
          control={control}
          render={({ field }) => (
            <Calendar
              value={field.value ? new Date(field.value) : null}
              onChange={(e) => {
                if (e.value instanceof Date) {
                  field.onChange(e.value.toISOString().substring(0, 16));
                } else {
                  field.onChange(undefined);
                }
              }}
              showTime
              hourFormat="24"
              placeholder="Seleccionar fecha y hora"
              showIcon
              className="w-full"
            />
          )}
        />
      </div>

      {/* Accesorios */}
      <div className="col-12">
        <label className="block text-900 font-medium mb-2">Accesorios a bordo</label>
        <Controller
          name="accessories"
          control={control}
          render={({ field }) => {
            const values: string[] = field.value ?? [];

            const togglePredefined = (id: string) => {
              if (values.includes(id)) {
                field.onChange(values.filter((v) => v !== id));
              } else {
                field.onChange([...values, id]);
              }
            };

            const customValues = values.filter((v) => !ACCESSORIES_IDS.has(v));

            return (
              <div className="flex flex-column gap-3">
                <div className="grid">
                  {ACCESSORIES_LIST.map((acc) => (
                    <div key={acc.id} className="col-12 md:col-6 lg:col-3">
                      <div
                        className="flex align-items-center gap-2 p-2 border-round surface-100 hover:surface-200 cursor-pointer transition-colors transition-duration-150"
                        onClick={() => togglePredefined(acc.id)}
                      >
                        <Checkbox
                          inputId={acc.id}
                          checked={values.includes(acc.id)}
                          onChange={() => togglePredefined(acc.id)}
                        />
                        <label htmlFor={acc.id} className="cursor-pointer text-sm">
                          {acc.label}
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
                <div>
                  <label className="block text-600 text-sm mb-1">Otros accesorios</label>
                  <Chips
                    value={customValues}
                    onChange={(e) => {
                      const newCustom = e.value ?? [];
                      const predefined = values.filter((v) => ACCESSORIES_IDS.has(v));
                      field.onChange([...predefined, ...newCustom]);
                    }}
                    separator=","
                    placeholder="Agregar otro accesorio (presionar Enter)"
                  />
                </div>
              </div>
            );
          }}
        />
      </div>

      {/* Daños observados */}
      <div className="col-12">
        <Divider align="left" className="my-3">
          <span className="text-sm font-semibold text-600">Daños observados</span>
        </Divider>
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
          <label
            htmlFor="hasPreExistingDamage"
            className="text-900 font-medium cursor-pointer"
          >
            El vehículo presenta daños preexistentes
          </label>
        </div>
      </div>

      {hasPreExistingDamage && (
        <div className="col-12">
          <label className="block text-900 font-medium mb-2">Descripción de daños</label>
          <Controller
            name="damageNotes"
            control={control}
            render={({ field }) => (
              <InputTextarea
                id="damageNotes"
                {...field}
                value={field.value ?? ""}
                rows={3}
                placeholder="Describa los daños existentes en detalle..."
                className={errors.damageNotes ? "p-invalid" : ""}
              />
            )}
          />
        </div>
      )}
    </div>
  );
}
