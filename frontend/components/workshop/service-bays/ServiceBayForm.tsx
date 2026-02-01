"use client";
import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { Checkbox } from "primereact/checkbox";
import { Button } from "primereact/button";
import { Chips } from "primereact/chips";
import { Divider } from "primereact/divider";
import { ProgressSpinner } from "primereact/progressspinner";
import { Tooltip } from "primereact/tooltip";
import {
  ServiceBay,
  BayArea,
  BayStatus,
  BayCapacity,
  BAY_AREA_LABELS,
  BAY_STATUS_LABELS,
  BAY_CAPACITY_LABELS,
  BAY_AREA_ICONS,
} from "@/libs/interfaces/workshop/serviceBay.interface";
import {
  createServiceBaySchema,
  updateServiceBaySchema,
  CreateServiceBayInput,
  UpdateServiceBayInput,
} from "@/libs/zods/workshop/serviceBaySchemas";
import {
  createServiceBay,
  updateServiceBay,
} from "@/app/api/serviceBayService";

interface ServiceBayFormProps {
  serviceBay: ServiceBay | null;
  onSave: () => void;
  onCancel: () => void;
  toast: React.RefObject<any>;
}

export default function ServiceBayForm({
  serviceBay,
  onSave,
  onCancel,
  toast,
}: ServiceBayFormProps) {
  const isEditing = !!serviceBay?._id;

  // Estado de loading controlado
  const [isLoading, setIsLoading] = useState(true);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateServiceBayInput | UpdateServiceBayInput>({
    resolver: zodResolver(
      isEditing ? updateServiceBaySchema : createServiceBaySchema
    ),
    defaultValues: {
      name: "",
      code: "",
      area: "mecanica",
      capacity: "mediana",
      maxTechnicians: 2,
      equipment: [],
      notes: "",
      order: 0,
      ...(isEditing && { status: "disponible" }),
    },
  });

  // Simular loading inicial
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (serviceBay && !isLoading) {
      reset({
        name: serviceBay.name || "",
        code: serviceBay.code || "",
        area: serviceBay.area || "mecanica",
        status: serviceBay.status || "disponible",
        capacity: serviceBay.capacity || "mediana",
        maxTechnicians: serviceBay.maxTechnicians || 2,
        equipment: serviceBay.equipment || [],
        notes: serviceBay.notes || "",
        order: serviceBay.order || 0,
      });
    } else if (!serviceBay && !isLoading) {
      reset({
        name: "",
        code: "",
        area: "mecanica",
        capacity: "mediana",
        maxTechnicians: 2,
        equipment: [],
        notes: "",
        order: 0,
      });
    }
  }, [serviceBay, reset, isLoading]);

  const onSubmit = async (
    data: CreateServiceBayInput | UpdateServiceBayInput
  ) => {
    try {
      if (isEditing && serviceBay?._id) {
        await updateServiceBay(serviceBay._id, data as UpdateServiceBayInput);
      } else {
        await createServiceBay(data as CreateServiceBayInput);
      }
      onSave();
    } catch (error: any) {
      console.error("Error saving service bay:", error);
      const errorMessage =
        error.response?.data?.msg ||
        error.message ||
        "Error al guardar la bahía";
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: errorMessage,
        life: 4000,
      });
    }
  };

  // Opciones para los dropdowns
  const areaOptions = Object.entries(BAY_AREA_LABELS).map(([value, label]) => ({
    label,
    value,
    icon: BAY_AREA_ICONS[value as BayArea],
  }));

  const statusOptions = Object.entries(BAY_STATUS_LABELS).map(
    ([value, label]) => ({
      label,
      value,
    })
  );

  const capacityOptions = Object.entries(BAY_CAPACITY_LABELS).map(
    ([value, label]) => ({
      label,
      value,
    })
  );

  const itemTemplate = (option: { label: string; icon?: string }) => {
    return (
      <div className="flex align-items-center gap-2">
        {option.icon && <i className={`pi ${option.icon}`}></i>}
        <span>{option.label}</span>
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
      {isLoading ? (
        <div className="flex flex-column align-items-center justify-content-center p-4">
          <ProgressSpinner
            style={{ width: "40px", height: "40px" }}
            strokeWidth="4"
            fill="var(--surface-ground)"
            animationDuration=".5s"
          />
          <p className="mt-3 text-600 font-medium">Preparando formulario...</p>
        </div>
      ) : (
        <>
          {/* Información Básica */}
          <div className="">
            <h4 className="text-primary mb-3">
              <i className="pi pi-info-circle mr-2"></i>
              Información Básica
            </h4>

            <div className="grid">
              <div className="col-12 md:col-6 lg:col-4">
                <div className="field">
                  <label
                    htmlFor="name"
                    className="block text-900 font-medium mb-2"
                  >
                    Nombre <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name="name"
                    control={control}
                    render={({ field }) => (
                      <InputText
                        id="name"
                        {...field}
                        placeholder="Ej: Bahía Mecánica 1"
                        className={errors.name ? "p-invalid" : ""}
                      />
                    )}
                  />
                  {errors.name && (
                    <small className="p-error">{errors.name.message}</small>
                  )}
                </div>
              </div>

              <div className="col-12 md:col-6 lg:col-4">
                <div className="field">
                  <label
                    htmlFor="code"
                    className="block text-900 font-medium mb-2"
                  >
                    Código <span className="text-red-500">*</span>
                    <i
                      className="pi pi-info-circle ml-1 text-blue-500 cursor-pointer"
                      data-pr-tooltip="Solo letras mayúsculas, números y guiones"
                      data-pr-position="top"
                      style={{ fontSize: "0.8rem" }}
                    ></i>
                  </label>
                  <Controller
                    name="code"
                    control={control}
                    render={({ field }) => (
                      <InputText
                        id="code"
                        {...field}
                        onChange={(e) =>
                          field.onChange(e.target.value.toUpperCase())
                        }
                        placeholder="Ej: MEC-01"
                        className={errors.code ? "p-invalid" : ""}
                      />
                    )}
                  />
                  {errors.code && (
                    <small className="p-error">{errors.code.message}</small>
                  )}
                </div>
              </div>

              <div className="col-12 md:col-6 lg:col-4">
                <div className="field">
                  <label
                    htmlFor="area"
                    className="block text-900 font-medium mb-2"
                  >
                    Área de Especialización{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name="area"
                    control={control}
                    render={({ field }) => (
                      <Dropdown
                        id="area"
                        {...field}
                        options={areaOptions}
                        placeholder="Seleccione un área"
                        itemTemplate={itemTemplate}
                        valueTemplate={itemTemplate}
                        className={errors.area ? "p-invalid" : ""}
                      />
                    )}
                  />
                  {errors.area && (
                    <small className="p-error">{errors.area.message}</small>
                  )}
                </div>
              </div>

              <div className="col-12 md:col-6 lg:col-4">
                <div className="field">
                  <label
                    htmlFor="capacity"
                    className="block text-900 font-medium mb-2"
                  >
                    Capacidad <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name="capacity"
                    control={control}
                    render={({ field }) => (
                      <Dropdown
                        id="capacity"
                        {...field}
                        options={capacityOptions}
                        placeholder="Seleccione la capacidad"
                        className={errors.capacity ? "p-invalid" : ""}
                      />
                    )}
                  />
                  {errors.capacity && (
                    <small className="p-error">{errors.capacity.message}</small>
                  )}
                </div>
              </div>

              {isEditing && (
                <div className="col-12 md:col-6 lg:col-4">
                  <div className="field">
                    <label
                      htmlFor="status"
                      className="block text-900 font-medium mb-2"
                    >
                      Estado
                    </label>
                    <Controller
                      name="status"
                      control={control}
                      render={({ field }) => (
                        <Dropdown
                          id="status"
                          {...field}
                          options={statusOptions}
                          placeholder="Seleccione el estado"
                        />
                      )}
                    />
                  </div>
                </div>
              )}

              <div className="col-12 md:col-6 lg:col-4">
                <div className="field">
                  <label
                    htmlFor="maxTechnicians"
                    className="block text-900 font-medium mb-2"
                  >
                    Máximo de Técnicos <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name="maxTechnicians"
                    control={control}
                    render={({ field }) => (
                      <InputNumber
                        id="maxTechnicians"
                        value={field.value as number}
                        onValueChange={(e) => field.onChange(e.value)}
                        min={1}
                        max={10}
                        showButtons
                        className={errors.maxTechnicians ? "p-invalid" : ""}
                      />
                    )}
                  />
                  {errors.maxTechnicians && (
                    <small className="p-error">
                      {errors.maxTechnicians.message}
                    </small>
                  )}
                </div>
              </div>

              <div className="col-12 md:col-6 lg:col-4">
                <div className="field">
                  <label
                    htmlFor="order"
                    className="block text-900 font-medium mb-2"
                  >
                    Orden de Visualización
                    <i
                      className="pi pi-info-circle ml-1 text-blue-500 cursor-pointer"
                      data-pr-tooltip="Define el orden en que aparecerá en las listas"
                      data-pr-position="top"
                      style={{ fontSize: "0.8rem" }}
                    ></i>
                  </label>
                  <Controller
                    name="order"
                    control={control}
                    render={({ field }) => (
                      <InputNumber
                        id="order"
                        value={field.value as number}
                        onValueChange={(e) => field.onChange(e.value)}
                        min={0}
                        showButtons
                      />
                    )}
                  />
                </div>
              </div>
            </div>
          </div>

          <Divider />

          {/* Equipamiento */}
          <div className="">
            <h4 className="text-primary mb-3">
              <i className="pi pi-wrench mr-2"></i>
              Equipamiento y Notas
            </h4>

            <div className="grid">
              <div className="col-12">
                <div className="field">
                  <label
                    htmlFor="equipment"
                    className="block text-900 font-medium mb-2"
                  >
                    Equipo Disponible
                  </label>
                  <Controller
                    name="equipment"
                    control={control}
                    render={({ field }) => (
                      <Chips
                        id="equipment"
                        value={field.value as string[]}
                        onChange={(e) => field.onChange(e.value)}
                        placeholder="Escriba y presione Enter para agregar"
                        separator=","
                      />
                    )}
                  />
                  <small className="text-500">
                    Ej: Multímetro, Osciloscopio, Gato Hidráulico, etc.
                  </small>
                </div>
              </div>

              <div className="col-12">
                <div className="field">
                  <label
                    htmlFor="notes"
                    className="block text-900 font-medium mb-2"
                  >
                    Notas Adicionales
                  </label>
                  <Controller
                    name="notes"
                    control={control}
                    render={({ field }) => (
                      <InputTextarea
                        id="notes"
                        {...field}
                        value={field.value || ""}
                        rows={3}
                        placeholder="Información adicional sobre la bahía..."
                        className={errors.notes ? "p-invalid" : ""}
                      />
                    )}
                  />
                  {errors.notes && (
                    <small className="p-error">{errors.notes.message}</small>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Divider />

          {/* Botones */}
          <div className="flex justify-content-end gap-2 mt-4">
            <Button
              label="Cancelar"
              icon="pi pi-times"
              severity="secondary"
              onClick={onCancel}
              type="button"
              disabled={isSubmitting}
            />
            <Button
              type="submit"
              label={isEditing ? "Actualizar" : "Crear"}
              icon={isEditing ? "pi pi-check" : "pi pi-plus"}
              loading={isSubmitting}
            />
          </div>
        </>
      )}
      <Tooltip target="[data-pr-tooltip]" />
    </form>
  );
}
