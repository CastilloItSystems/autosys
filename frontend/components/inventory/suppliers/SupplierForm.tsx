"use client";
import React, { useContext, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { classNames } from "primereact/utils";
import { supplierSchema } from "@/libs/zods/inventory";
import {
  createSupplier,
  updateSupplier,
} from "@/app/api/inventory/supplierService";
import { Toast } from "primereact/toast";
import { Dropdown } from "primereact/dropdown";
import { InputTextarea } from "primereact/inputtextarea";
import { handleFormError } from "@/utils/errorHandlers";
import { LayoutContext } from "@/layout/context/layoutcontext";

type FormData = z.infer<typeof supplierSchema>;

interface SupplierFormProps {
  supplier: any;
  hideFormDialog: () => void;
  suppliers: any[];
  setSuppliers: (suppliers: any[]) => void;
  setSupplier: (supplier: any) => void;
  showToast: (
    severity: "success" | "error",
    summary: string,
    detail: string
  ) => void;
  toast: React.RefObject<Toast> | null;
}

const estadoOptions = [
  { label: "Activo", value: "activo" },
  { label: "Inactivo", value: "inactivo" },
];

const SupplierForm = ({
  supplier,
  toast,
  hideFormDialog,
  suppliers,
  setSuppliers,
  showToast,
}: SupplierFormProps) => {
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
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      estado: "activo",
    },
  });

  useEffect(() => {
    if (supplier) {
      Object.keys(supplier).forEach((key) =>
        setValue(key as keyof FormData, supplier[key])
      );
    }
  }, [supplier, setValue]);

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      if (supplier) {
        const updatedSupplier = await updateSupplier(supplier.id, data);
        const updatedSuppliers = suppliers.map((t) =>
          t.id === updatedSupplier.id ? updatedSupplier : t
        );
        setSuppliers(updatedSuppliers);
        showToast("success", "Éxito", "Proveedor actualizado");
      } else {
        const newSupplier = await createSupplier(data);
        setSuppliers([...suppliers, newSupplier]);
        showToast("success", "Éxito", "Proveedor creado");
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
                <i className="pi pi-users mr-3 text-primary text-3xl"></i>
                {supplier ? "Modificar Proveedor" : "Crear Proveedor"}
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

            {/* Contacto */}
            <div className="field col-12 md:col-6">
              <label htmlFor="contacto" className="font-medium text-900">
                Contacto
              </label>
              <InputText
                id="contacto"
                type="text"
                className={classNames("w-full", {
                  "p-filled": filledInput,
                })}
                {...register("contacto")}
              />
              {errors.contacto && (
                <small className="p-error">{errors.contacto.message}</small>
              )}
            </div>

            {/* Teléfono */}
            <div className="field col-12 md:col-4">
              <label htmlFor="telefono" className="font-medium text-900">
                Teléfono
              </label>
              <InputText
                id="telefono"
                type="text"
                className={classNames("w-full", {
                  "p-filled": filledInput,
                })}
                {...register("telefono")}
              />
              {errors.telefono && (
                <small className="p-error">{errors.telefono.message}</small>
              )}
            </div>

            {/* Correo */}
            <div className="field col-12 md:col-4">
              <label htmlFor="correo" className="font-medium text-900">
                Correo
              </label>
              <InputText
                id="correo"
                type="email"
                className={classNames("w-full", {
                  "p-invalid": errors.correo,
                  "p-filled": filledInput,
                })}
                {...register("correo")}
              />
              {errors.correo && (
                <small className="p-error">{errors.correo.message}</small>
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

            {/* Dirección */}
            <div className="field col-12">
              <label htmlFor="direccion" className="font-medium text-900">
                Dirección
              </label>
              <InputTextarea
                id="direccion"
                rows={2}
                className={classNames("w-full", {
                  "p-filled": filledInput,
                })}
                {...register("direccion")}
              />
              {errors.direccion && (
                <small className="p-error">{errors.direccion.message}</small>
              )}
            </div>

            {/* Condiciones de Pago */}
            <div className="field col-12">
              <label htmlFor="condicionesPago" className="font-medium text-900">
                Condiciones de Pago
              </label>
              <InputTextarea
                id="condicionesPago"
                rows={2}
                className={classNames("w-full", {
                  "p-filled": filledInput,
                })}
                {...register("condicionesPago")}
              />
              {errors.condicionesPago && (
                <small className="p-error">
                  {errors.condicionesPago.message}
                </small>
              )}
            </div>

            {/* Botón de Envío */}
            <div className="field col-12 text-right">
              <Button
                type="submit"
                label={supplier ? "Actualizar" : "Crear"}
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

export default SupplierForm;
