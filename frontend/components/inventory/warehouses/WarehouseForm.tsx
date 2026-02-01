"use client";
import React, { useContext, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { classNames } from "primereact/utils";
import { warehouseSchema } from "@/libs/zods/inventory";
import {
  createWarehouse,
  updateWarehouse,
} from "@/app/api/inventory/warehouseService";
import { Toast } from "primereact/toast";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { handleFormError } from "@/utils/errorHandlers";
import { LayoutContext } from "@/layout/context/layoutcontext";

type FormData = z.infer<typeof warehouseSchema>;

interface WarehouseFormProps {
  warehouse: any;
  hideFormDialog: () => void;
  warehouses: any[];
  setWarehouses: (warehouses: any[]) => void;
  setWarehouse: (warehouse: any) => void;
  showToast: (
    severity: "success" | "error",
    summary: string,
    detail: string
  ) => void;
  toast: React.RefObject<Toast> | null;
}

const tipoOptions = [
  { label: "Almacén", value: "almacen" },
  { label: "Bodega", value: "bodega" },
  { label: "Taller", value: "taller" },
  { label: "Otro", value: "otro" },
];

const estadoOptions = [
  { label: "Activo", value: "activo" },
  { label: "Inactivo", value: "inactivo" },
];

const WarehouseForm = ({
  warehouse,
  toast,
  hideFormDialog,
  warehouses,
  setWarehouses,
  showToast,
}: WarehouseFormProps) => {
  const { layoutConfig } = useContext(LayoutContext);
  const filledInput = layoutConfig.inputStyle === "filled";

  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    control,
  } = useForm<FormData>({
    resolver: zodResolver(warehouseSchema),
    defaultValues: {
      tipo: "almacen",
      estado: "activo",
      capacidad: 0,
    },
  });

  useEffect(() => {
    if (warehouse) {
      Object.keys(warehouse).forEach((key) =>
        setValue(key as keyof FormData, warehouse[key])
      );
    }
  }, [warehouse, setValue]);

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      if (warehouse) {
        const updatedWarehouse = await updateWarehouse(warehouse.id, data);
        const updatedWarehouses = warehouses.map((t) =>
          t.id === updatedWarehouse.id ? updatedWarehouse : t
        );
        setWarehouses(updatedWarehouses);
        showToast("success", "Éxito", "Almacén actualizado");
      } else {
        const newWarehouse = await createWarehouse(data);
        setWarehouses([...warehouses, newWarehouse]);
        showToast("success", "Éxito", "Almacén creado");
      }
      hideFormDialog();
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="card p-fluid surface-50 p-3 border-round shadow-2">
          {/* Header del Formulario */}
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-building mr-3 text-primary text-3xl"></i>
                {warehouse ? "Modificar Almacén" : "Crear Almacén"}
              </h2>
            </div>
          </div>

          {/* Cuerpo del Formulario */}
          <div className="grid formgrid row-gap-2">
            {/* Nombre */}
            <div className="field col-12 md:col-6">
              <label htmlFor="nombre" className="font-medium text-900">
                Nombre <span className="text-red-500">*</span>
              </label>
              <InputText
                id="nombre"
                type="text"
                className={classNames("w-full", {
                  "p-invalid": errors.nombre,
                  "p-filled": filledInput,
                })}
                {...register("nombre")}
              />
              {errors.nombre && (
                <small className="p-error">{errors.nombre.message}</small>
              )}
            </div>

            {/* Ubicación */}
            <div className="field col-12 md:col-6">
              <label htmlFor="ubicacion" className="font-medium text-900">
                Ubicación
              </label>
              <InputText
                id="ubicacion"
                type="text"
                className={classNames("w-full", {
                  "p-filled": filledInput,
                })}
                {...register("ubicacion")}
              />
              {errors.ubicacion && (
                <small className="p-error">{errors.ubicacion.message}</small>
              )}
            </div>

            {/* Tipo */}
            <div className="field col-12 md:col-4">
              <label htmlFor="tipo" className="font-medium text-900">
                Tipo
              </label>
              <Controller
                name="tipo"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="tipo"
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    options={tipoOptions}
                    placeholder="Seleccione un tipo"
                    className={classNames("w-full", {
                      "p-invalid": errors.tipo,
                    })}
                  />
                )}
              />
              {errors.tipo && (
                <small className="p-error">{errors.tipo.message}</small>
              )}
            </div>

            {/* Capacidad */}
            <div className="field col-12 md:col-4">
              <label htmlFor="capacidad" className="font-medium text-900">
                Capacidad
              </label>
              <Controller
                name="capacidad"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    id="capacidad"
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value ?? 0)}
                    className={classNames("w-full", {
                      "p-invalid": errors.capacidad,
                    })}
                    min={0}
                    locale="es"
                  />
                )}
              />
              {errors.capacidad && (
                <small className="p-error">{errors.capacidad.message}</small>
              )}
            </div>

            {/* Estado */}
            <div className="field col-12 md:col-4">
              <label htmlFor="estado" className="font-medium text-900">
                Estado
              </label>
              <Controller
                name="estado"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="estado"
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    options={estadoOptions}
                    placeholder="Seleccione un estado"
                    className={classNames("w-full", {
                      "p-invalid": errors.estado,
                    })}
                  />
                )}
              />
              {errors.estado && (
                <small className="p-error">{errors.estado.message}</small>
              )}
            </div>

            {/* Botón de Envío */}
            <div className="field col-12 text-right">
              <Button
                type="submit"
                label={warehouse ? "Actualizar" : "Crear"}
                icon={submitting ? "pi pi-spin pi-spinner" : "pi pi-check"}
                className="p-button-success"
                disabled={submitting}
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default WarehouseForm;
