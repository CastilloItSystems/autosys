"use client";

import React from "react";
import { Controller, useForm } from "react-hook-form";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import dealerUnitService, {
  SaveDealerUnitRequest,
} from "../services/dealerUnitService";
import { handleFormError } from "@/utils/errorHandlers";
import type {
  DealerUnitFormValues,
  DealerUnitFormProps,
} from "../interfaces/dealerUnitForm.interface";
import {
  UNIT_CONDITION_OPTIONS,
  UNIT_STATUS_OPTIONS,
  UNIT_BOOLEAN_OPTIONS,
} from "../utils/dealerUnit.utils";

export default function DealerUnitForm({
  unit,
  brandOptions,
  modelOptions,
  warehouseOptions,
  onSave,
  formId,
  onSubmittingChange,
  toast,
}: DealerUnitFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<DealerUnitFormValues>({
    mode: "onBlur",
    defaultValues: {
      brandId: unit?.brandId || "",
      warehouseId: unit?.warehouseId || "",
      modelId: unit?.modelId || "",
      code: unit?.code || "",
      version: unit?.version || "",
      year: unit?.year ?? undefined,
      vin: unit?.vin || "",
      plate: unit?.plate || "",
      condition: unit?.condition || "NEW",
      status: unit?.status || "AVAILABLE",
      listPrice: unit?.listPrice != null ? Number(unit.listPrice) : undefined,
      promoPrice:
        unit?.promoPrice != null ? Number(unit.promoPrice) : undefined,
      location: unit?.location || "",
      isPublished: unit?.isPublished ?? false,
      isActive: unit?.isActive ?? true,
    },
  });

  const onSubmit = async (data: DealerUnitFormValues) => {
    onSubmittingChange?.(true);
    try {
      const payload: SaveDealerUnitRequest = {
        brandId: data.brandId,
        warehouseId: data.warehouseId,
        modelId: data.modelId || null,
        code: data.code || null,
        version: data.version || null,
        year: data.year ?? null,
        vin: data.vin || null,
        plate: data.plate || null,
        condition: data.condition,
        status: data.status,
        listPrice: data.listPrice ?? null,
        promoPrice: data.promoPrice ?? null,
        location: data.location || null,
        isPublished: data.isPublished,
        isActive: data.isActive,
      };

      if (unit?.id) {
        await dealerUnitService.update(unit.id, payload);
      } else {
        await dealerUnitService.create(payload);
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
      id={formId || "dealer-unit-form"}
      onSubmit={handleSubmit(onSubmit)}
      className="p-fluid"
    >
      <div className="grid formgrid">
        <div className="col-12 md:col-6 field">
          <label className="font-semibold">Marca *</label>
          <Controller
            name="brandId"
            control={control}
            rules={{ required: "La marca es requerida" }}
            render={({ field }) => (
              <Dropdown
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={brandOptions}
                className={errors.brandId ? "p-invalid" : ""}
                filter
                placeholder="Seleccione marca"
              />
            )}
          />
          {errors.brandId && (
            <small className="p-error">{errors.brandId.message}</small>
          )}
        </div>

        <div className="col-12 md:col-6 field">
          <label className="font-semibold">Modelo</label>
          <Controller
            name="modelId"
            control={control}
            render={({ field }) => (
              <Dropdown
                value={field.value}
                onChange={(e) => field.onChange(e.value || "")}
                options={modelOptions}
                filter
                placeholder="Seleccione modelo"
              />
            )}
          />
        </div>

        <div className="col-12 md:col-6 field">
          <label className="font-semibold">Ítem Fiscal</label>
          <InputText
            value={
              unit?.item
                ? `${unit.item.code} - ${unit.item.name}`
                : "Se genera automáticamente al crear"
            }
            disabled
          />
        </div>

        <div className="col-12 md:col-6 field">
          <label className="font-semibold">Almacén Fiscal *</label>
          <Controller
            name="warehouseId"
            control={control}
            rules={{ required: "El almacén fiscal es requerido" }}
            render={({ field }) => (
              <Dropdown
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={warehouseOptions}
                className={errors.warehouseId ? "p-invalid" : ""}
                filter
                placeholder="Seleccione almacén"
              />
            )}
          />
          {errors.warehouseId && (
            <small className="p-error">{errors.warehouseId.message}</small>
          )}
        </div>

        <div className="col-12 md:col-4 field">
          <label className="font-semibold">Código</label>
          <Controller
            name="code"
            control={control}
            render={({ field }) => (
              <InputText {...field} value={field.value || ""} />
            )}
          />
        </div>

        <div className="col-12 md:col-4 field">
          <label className="font-semibold">Versión</label>
          <Controller
            name="version"
            control={control}
            render={({ field }) => (
              <InputText {...field} value={field.value || ""} />
            )}
          />
        </div>

        <div className="col-12 md:col-4 field">
          <label className="font-semibold">Año</label>
          <Controller
            name="year"
            control={control}
            render={({ field }) => (
              <InputNumber
                value={field.value ?? null}
                onValueChange={(e) => field.onChange(e.value ?? undefined)}
                useGrouping={false}
                min={1900}
                max={2100}
              />
            )}
          />
        </div>

        <div className="col-12 md:col-6 field">
          <label className="font-semibold">VIN</label>
          <Controller
            name="vin"
            control={control}
            render={({ field }) => (
              <InputText {...field} value={field.value || ""} />
            )}
          />
        </div>

        <div className="col-12 md:col-6 field">
          <label className="font-semibold">Placa</label>
          <Controller
            name="plate"
            control={control}
            render={({ field }) => (
              <InputText {...field} value={field.value || ""} />
            )}
          />
        </div>

        <div className="col-12 md:col-6 field">
          <label className="font-semibold">Condición</label>
          <Controller
            name="condition"
            control={control}
            render={({ field }) => (
              <Dropdown
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={UNIT_CONDITION_OPTIONS}
              />
            )}
          />
        </div>

        <div className="col-12 md:col-6 field">
          <label className="font-semibold">Estado</label>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Dropdown
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={UNIT_STATUS_OPTIONS}
              />
            )}
          />
        </div>

        <div className="col-12 md:col-4 field">
          <label className="font-semibold">Precio lista</label>
          <Controller
            name="listPrice"
            control={control}
            render={({ field }) => (
              <InputNumber
                value={field.value ?? null}
                onValueChange={(e) => field.onChange(e.value ?? undefined)}
                mode="currency"
                currency="USD"
                locale="en-US"
              />
            )}
          />
        </div>

        <div className="col-12 md:col-4 field">
          <label className="font-semibold">Precio promoción</label>
          <Controller
            name="promoPrice"
            control={control}
            render={({ field }) => (
              <InputNumber
                value={field.value ?? null}
                onValueChange={(e) => field.onChange(e.value ?? undefined)}
                mode="currency"
                currency="USD"
                locale="en-US"
              />
            )}
          />
        </div>

        <div className="col-12 md:col-4 field">
          <label className="font-semibold">Ubicación</label>
          <Controller
            name="location"
            control={control}
            render={({ field }) => (
              <InputText {...field} value={field.value || ""} />
            )}
          />
        </div>

        <div className="col-12 md:col-6 field">
          <label className="font-semibold">Publicada</label>
          <Controller
            name="isPublished"
            control={control}
            render={({ field }) => (
              <Dropdown
                value={field.value}
                onChange={(e) => field.onChange(Boolean(e.value))}
                options={UNIT_BOOLEAN_OPTIONS}
              />
            )}
          />
        </div>

        <div className="col-12 md:col-6 field mb-0">
          <label className="font-semibold">Activa</label>
          <Controller
            name="isActive"
            control={control}
            render={({ field }) => (
              <Dropdown
                value={field.value}
                onChange={(e) => field.onChange(Boolean(e.value))}
                options={UNIT_BOOLEAN_OPTIONS}
              />
            )}
          />
        </div>
      </div>
    </form>
  );
}
