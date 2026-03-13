"use client";
import React, { useEffect, useState } from "react";

// Form libraries
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// PrimeReact components
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { ProgressSpinner } from "primereact/progressspinner";

// API functions
import warehouseService, { Warehouse, WarehouseType } from "@/app/api/inventory/warehouseService";

// Schema de validación
import {
  createWarehouseSchema,
  updateWarehouseSchema,
  CreateWarehouse,
} from "@/libs/zods/inventory/warehouseZod";

interface WarehouseFormProps {
  warehouse: Warehouse | null;
  onSave: () => void;
  onCancel: () => void;
  toast: React.RefObject<any>;
}

// Opciones de tipo con etiquetas en español
const WAREHOUSE_TYPE_OPTIONS = [
  { label: "Principal", value: "PRINCIPAL" as WarehouseType },
  { label: "Sucursal", value: "SUCURSAL" as WarehouseType },
  { label: "Tránsito", value: "TRANSITO" as WarehouseType },
];

export default function WarehouseForm({
  warehouse,
  onSave,
  onCancel,
  toast,
}: WarehouseFormProps) {
  const [isLoading, setIsLoading] = useState(true);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateWarehouse>({
    resolver: zodResolver(
      warehouse ? updateWarehouseSchema : createWarehouseSchema,
    ),
    defaultValues: {
      code: "",
      name: "",
      type: "PRINCIPAL",
      address: "",
    },
  });

  // Simular loading inicial para consistencia visual
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Cargar datos del almacén si está en modo edición
  useEffect(() => {
    if (warehouse && !isLoading) {
      reset({
        code: warehouse.code || "",
        name: warehouse.name || "",
        type: warehouse.type || "PRINCIPAL",
        address: warehouse.address || "",
      });
    } else if (!warehouse && !isLoading) {
      reset({
        code: "",
        name: "",
        type: "PRINCIPAL",
        address: "",
      });
    }
  }, [warehouse, reset, isLoading]);

  /**
   * Maneja el envío del formulario
   */
  const onSubmit = async (data: CreateWarehouse) => {
    try {
      // Normalize address: convert null/empty to undefined
      const submitData = {
        ...data,
        address: data.address || undefined,
      };

      if (warehouse?.id) {
        await warehouseService.update(warehouse.id, submitData);
      } else {
        await warehouseService.create(submitData);
      }
      onSave();
    } catch (error: any) {
      console.error("Error saving warehouse:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.message || "Error al guardar el almacén",
        life: 3000,
      });
    }
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
          <div className="grid">
            {/* Código */}
            <div className="col-12 md:col-6">
              <label htmlFor="code" className="block text-900 font-medium mb-2">
                Código <span className="text-red-500">*</span>
              </label>
              <Controller
                name="code"
                control={control}
                render={({ field }) => (
                  <InputText
                    id="code"
                    {...field}
                    placeholder="Ej: ALM-001"
                    className={errors.code ? "p-invalid" : ""}
                    autoFocus
                    disabled={!!warehouse?.id}
                    title={
                      warehouse?.id ? "El código no puede ser modificado" : ""
                    }
                  />
                )}
              />
              {errors.code && (
                <small className="p-error block mt-1">
                  {errors.code.message}
                </small>
              )}
            </div>

            {/* Nombre */}
            <div className="col-12 md:col-6">
              <label htmlFor="name" className="block text-900 font-medium mb-2">
                Nombre <span className="text-red-500">*</span>
              </label>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <InputText
                    id="name"
                    {...field}
                    placeholder="Ej: Almacén Central"
                    className={errors.name ? "p-invalid" : ""}
                  />
                )}
              />
              {errors.name && (
                <small className="p-error block mt-1">
                  {errors.name.message}
                </small>
              )}
            </div>

            {/* Tipo */}
            <div className="col-12 md:col-6">
              <label htmlFor="type" className="block text-900 font-medium mb-2">
                Tipo <span className="text-red-500">*</span>
              </label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    {...field}
                    id="type"
                    options={WAREHOUSE_TYPE_OPTIONS}
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Seleccionar tipo"
                    className={errors.type ? "p-invalid" : ""}
                  />
                )}
              />
              {errors.type && (
                <small className="p-error block mt-1">
                  {errors.type.message}
                </small>
              )}
            </div>

            {/* Dirección */}
            <div className="col-12 md:col-6">
              <label
                htmlFor="address"
                className="block text-900 font-medium mb-2"
              >
                Dirección
              </label>
              <Controller
                name="address"
                control={control}
                render={({ field }) => (
                  <InputText
                    id="address"
                    {...field}
                    value={field.value || ""}
                    placeholder="Dirección del almacén"
                    className={errors.address ? "p-invalid" : ""}
                  />
                )}
              />
              {errors.address && (
                <small className="p-error block mt-1">
                  {errors.address.message}
                </small>
              )}
            </div>
          </div>

          {/* Action Buttons */}
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
              label={warehouse?.id ? "Actualizar" : "Crear"}
              icon="pi pi-check"
              type="submit"
              loading={isSubmitting}
            />
          </div>
        </>
      )}
    </form>
  );
}
