"use client";
import React, { useEffect, useState } from "react";

// Form libraries
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// PrimeReact components
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { ProgressSpinner } from "primereact/progressspinner";

// API functions
import supplierService, {
  type Supplier,
} from "@/app/api/inventory/supplierService";

// Schema de validación
import {
  createSupplierSchema,
  updateSupplierSchema,
  CreateSupplier,
} from "@/libs/zods/inventory/supplierZod";

interface SupplierFormProps {
  supplier: Supplier | null;
  onSave: () => void;
  onCancel: () => void;
  toast: React.RefObject<any>;
}

export default function SupplierForm({
  supplier,
  onSave,
  onCancel,
  toast,
}: SupplierFormProps) {
  const [isLoading, setIsLoading] = useState(true);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateSupplier>({
    resolver: zodResolver(
      supplier ? updateSupplierSchema : createSupplierSchema,
    ),
    defaultValues: {
      code: "",
      name: "",
      contactName: "",
      email: "",
      phone: "",
      address: "",
      taxId: "",
    },
  });

  // Simular loading inicial para consistencia visual
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Cargar datos del proveedor si está en modo edición
  useEffect(() => {
    if (supplier && !isLoading) {
      reset({
        code: supplier.code || "",
        name: supplier.name || "",
        contactName: supplier.contactName || "",
        email: supplier.email || "",
        phone: supplier.phone || "",
        address: supplier.address || "",
        taxId: supplier.taxId || "",
      });
    } else if (!supplier && !isLoading) {
      reset({
        code: "",
        name: "",
        contactName: "",
        email: "",
        phone: "",
        address: "",
        taxId: "",
      });
    }
  }, [supplier, reset, isLoading]);

  /**
   * Maneja el envío del formulario
   */
  const onSubmit = async (data: CreateSupplier) => {
    try {
      // Normalize empty strings to undefined
      const submitData = {
        ...data,
        contactName: data.contactName || undefined,
        email: data.email || undefined,
        phone: data.phone || undefined,
        address: data.address || undefined,
        taxId: data.taxId || undefined,
      };

      if (supplier?.id) {
        await supplierService.update(supplier.id, submitData);
      } else {
        await supplierService.create(submitData);
      }
      onSave();
    } catch (error: any) {
      console.error("Error saving supplier:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          error.response?.data?.message || "Error al guardar el proveedor",
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
                    placeholder="Ej: PROV-001"
                    className={errors.code ? "p-invalid" : ""}
                    autoFocus
                    disabled={!!supplier?.id}
                    title={
                      supplier?.id ? "El código no puede ser modificado" : ""
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
                    placeholder="Nombre del proveedor"
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

            {/* Contacto */}
            <div className="col-12 md:col-6">
              <label
                htmlFor="contactName"
                className="block text-900 font-medium mb-2"
              >
                Contacto
              </label>
              <Controller
                name="contactName"
                control={control}
                render={({ field }) => (
                  <InputText
                    id="contactName"
                    {...field}
                    value={field.value || ""}
                    placeholder="Nombre del contacto"
                    className={errors.contactName ? "p-invalid" : ""}
                  />
                )}
              />
              {errors.contactName && (
                <small className="p-error block mt-1">
                  {errors.contactName.message}
                </small>
              )}
            </div>

            {/* Correo */}
            <div className="col-12 md:col-6">
              <label
                htmlFor="email"
                className="block text-900 font-medium mb-2"
              >
                Correo
              </label>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <InputText
                    id="email"
                    {...field}
                    value={field.value || ""}
                    placeholder="correo@ejemplo.com"
                    className={errors.email ? "p-invalid" : ""}
                  />
                )}
              />
              {errors.email && (
                <small className="p-error block mt-1">
                  {errors.email.message}
                </small>
              )}
            </div>

            {/* Teléfono */}
            <div className="col-12 md:col-6">
              <label
                htmlFor="phone"
                className="block text-900 font-medium mb-2"
              >
                Teléfono
              </label>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <InputText
                    id="phone"
                    {...field}
                    value={field.value || ""}
                    placeholder="Teléfono de contacto"
                    className={errors.phone ? "p-invalid" : ""}
                  />
                )}
              />
              {errors.phone && (
                <small className="p-error block mt-1">
                  {errors.phone.message}
                </small>
              )}
            </div>

            {/* RIF/NIT */}
            <div className="col-12 md:col-6">
              <label
                htmlFor="taxId"
                className="block text-900 font-medium mb-2"
              >
                RIF/NIT
              </label>
              <Controller
                name="taxId"
                control={control}
                render={({ field }) => (
                  <InputText
                    id="taxId"
                    {...field}
                    value={field.value || ""}
                    placeholder="Ej: J-12345678-9"
                    className={errors.taxId ? "p-invalid" : ""}
                  />
                )}
              />
              {errors.taxId && (
                <small className="p-error block mt-1">
                  {errors.taxId.message}
                </small>
              )}
            </div>

            {/* Dirección */}
            <div className="col-12">
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
                  <InputTextarea
                    id="address"
                    {...field}
                    value={field.value || ""}
                    rows={2}
                    placeholder="Dirección del proveedor"
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
              label={supplier?.id ? "Actualizar" : "Crear"}
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
