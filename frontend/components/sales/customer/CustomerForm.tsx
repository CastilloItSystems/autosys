"use client";
import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { InputSwitch } from "primereact/inputswitch";
import { Toast } from "primereact/toast";

import {
  createCustomerSchema,
  CreateCustomerInput,
} from "@/libs/zods/sales/customerZod";
import {
  Customer,
  CustomerType,
  CUSTOMER_TYPE_CONFIG,
} from "@/libs/interfaces/sales/customer.interface";
import customerService from "@/app/api/sales/customerService";
import { handleFormError } from "@/utils/errorHandlers";

interface CustomerFormProps {
  customer?: Customer | null;
  formId?: string;
  onSave: () => void | Promise<void>;
  onSubmittingChange?: (isSubmitting: boolean) => void;
  toast: React.RefObject<Toast> | null;
}

export default function CustomerForm({
  customer,
  formId,
  onSave,
  onSubmittingChange,
  toast,
}: CustomerFormProps) {
  const isEditing = !!customer;

  const {
    control,
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<CreateCustomerInput>({
    resolver: zodResolver(createCustomerSchema),
    mode: "onBlur",
    defaultValues: customer
      ? {
          code: customer.code,
          taxId: customer.taxId || undefined,
          name: customer.name,
          email: customer.email || undefined,
          phone: customer.phone || undefined,
          address: customer.address || undefined,
          type: customer.type || "INDIVIDUAL",
          isActive: customer.isActive ?? true,
        }
      : {
          type: "INDIVIDUAL",
          isActive: true,
        },
  });

  const typeOptions = Object.entries(CUSTOMER_TYPE_CONFIG).map(
    ([value, config]) => ({
      label: config.label,
      value,
    }),
  );

  const onSubmit = async (data: CreateCustomerInput) => {
    if (onSubmittingChange) onSubmittingChange(true);
    try {
      const payload = {
        code: data.code,
        name: data.name,
        taxId: data.taxId || undefined,
        email: data.email || undefined,
        phone: data.phone || undefined,
        address: data.address || undefined,
        type: data.type,
        isActive: data.isActive,
      };

      if (isEditing && customer) {
        await customerService.update(customer.id, payload as any);
      } else {
        await customerService.create(payload as any);
      }
      await onSave();
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      if (onSubmittingChange) onSubmittingChange(false);
    }
  };

  return (
    <form
      id={formId || "customer-form"}
      onSubmit={handleSubmit(onSubmit)}
      className="p-fluid"
    >
      <div className="grid formgrid row-gap-2">
        {/* ── Tipo ── */}
        <div className="col-12 md:col-6 field">
          <label className="font-semibold">
            Tipo de Cliente <span className="text-red-500">*</span>
          </label>
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Dropdown
                id={field.name}
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={typeOptions}
                optionLabel="label"
                optionValue="value"
              />
            )}
          />
        </div>

        {/* ── Activo ── */}
        {isEditing && (
          <div className="col-12 md:col-6 field">
            <label className="font-semibold">Estado</label>
            <div className="flex align-items-center gap-3 mt-2">
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <InputSwitch
                    checked={field.value ?? true}
                    onChange={(e) => field.onChange(e.value)}
                  />
                )}
              />
              <span className="text-sm">Activo</span>
            </div>
          </div>
        )}

        {/* ── Código ── */}
        <div className="col-12 md:col-6 field">
          <label className="font-semibold">
            Código <span className="text-red-500">*</span>
          </label>
          <InputText
            {...register("code")}
            placeholder="Ej: CLI-001"
            className={errors.code ? "p-invalid" : ""}
          />
          {errors.code && (
            <small className="p-error">{errors.code.message}</small>
          )}
        </div>

        {/* ── RIF/Cédula ── */}
        <div className="col-12 md:col-6 field">
          <label className="font-semibold">RIF / Cédula</label>
          <InputText
            {...register("taxId")}
            placeholder="Ej: V-12345678 o J-12345678-9"
          />
        </div>

        {/* ── Nombre ── */}
        <div className="col-12 field">
          <label className="font-semibold">
            Nombre / Razón Social <span className="text-red-500">*</span>
          </label>
          <InputText
            {...register("name")}
            placeholder="Nombre completo o razón social"
            className={errors.name ? "p-invalid" : ""}
          />
          {errors.name && (
            <small className="p-error">{errors.name.message}</small>
          )}
        </div>

        {/* ── Email ── */}
        <div className="col-12 md:col-6 field">
          <label>Correo Electrónico</label>
          <InputText
            {...register("email")}
            placeholder="correo@ejemplo.com"
            className={errors.email ? "p-invalid" : ""}
          />
          {errors.email && (
            <small className="p-error">{errors.email.message}</small>
          )}
        </div>

        {/* ── Teléfono ── */}
        <div className="col-12 md:col-6 field">
          <label>Teléfono</label>
          <InputText {...register("phone")} placeholder="+58 412 123-4567" />
        </div>

        {/* ── Dirección ── */}
        <div className="col-12 field">
          <label>Dirección</label>
          <InputTextarea
            {...register("address")}
            rows={3}
            autoResize
            placeholder="Dirección completa"
          />
        </div>
      </div>
    </form>
  );
}
