"use client";
import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { InputSwitch } from "primereact/inputswitch";
import { InputNumber } from "primereact/inputnumber";
import { Toast } from "primereact/toast";
import { Divider } from "primereact/divider";

import {
  createCustomerSchema,
  CreateCustomerInput,
} from "@/libs/zods/sales/customerZod";
import {
  Customer,
  CUSTOMER_TYPE_CONFIG,
} from "@/libs/interfaces/sales/customer.interface";
import customerService from "@/app/api/sales/customerService";
import { handleFormError } from "@/utils/errorHandlers";

// Componentes comunes
import PhoneInput from "@/components/common/PhoneInput";
import RifInput from "@/components/common/RifInput";
import MetadataInput from "@/components/common/MetadataInput";

interface CustomerFormProps {
  customer?: Customer | null;
  formId?: string;
  onSave: () => void | Promise<void>;
  onCreated?: (item: any) => void;
  onSubmittingChange?: (isSubmitting: boolean) => void;
  toast: React.RefObject<Toast> | null;
}

export default function CustomerForm({
  customer,
  formId,
  onSave,
  onCreated,
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
          mobile: customer.mobile || undefined,
          website: customer.website || undefined,
          contactPerson: customer.contactPerson || undefined,
          address: customer.address || undefined,
          shippingAddress: customer.shippingAddress || undefined,
          billingAddress: customer.billingAddress || undefined,
          type: customer.type || "INDIVIDUAL",
          isSpecialTaxpayer: customer.isSpecialTaxpayer ?? false,
          priceList: customer.priceList ?? 1,
          creditLimit: customer.creditLimit ?? 0,
          creditDays: customer.creditDays ?? 0,
          defaultDiscount: customer.defaultDiscount ?? 0,
          isActive: customer.isActive ?? true,
        }
      : {
          type: "INDIVIDUAL",
          isSpecialTaxpayer: false,
          priceList: 1,
          creditLimit: 0,
          creditDays: 0,
          defaultDiscount: 0,
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
      // Normalizamos strings vacíos a undefined
      const payload = {
        code: data.code,
        name: data.name,
        taxId: data.taxId || undefined,
        email: data.email || undefined,
        phone: data.phone || undefined,
        mobile: data.mobile || undefined,
        website: data.website || undefined,
        contactPerson: data.contactPerson || undefined,
        address: data.address || undefined,
        shippingAddress: data.shippingAddress || undefined,
        billingAddress: data.billingAddress || undefined,
        type: data.type,
        isSpecialTaxpayer: data.isSpecialTaxpayer,
        priceList: data.priceList,
        creditLimit: data.creditLimit,
        creditDays: data.creditDays,
        defaultDiscount: data.defaultDiscount,
        notes: data.notes || undefined,
        isActive: data.isActive,
      };

      if (isEditing && customer) {
        await customerService.update(customer.id, payload as any);
        await onSave();
      } else {
        const res = await customerService.create(payload as any);
        await onSave();
        if (onCreated) onCreated(res?.data ?? res);
      }
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
        {/* ========================================= */}
        {/* INFORMACIÓN BÁSICA                        */}
        {/* ========================================= */}
        <div className="col-12 mt-2">
          <h5 className="mb-0 text-primary">Información Básica</h5>
          <Divider className="mt-2 mb-3" />
        </div>

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

        <div className="col-12 md:col-8 field">
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

        <div className="col-12 md:col-4 field">
          <label className="font-semibold">RIF / Cédula</label>
          <Controller
            name="taxId"
            control={control}
            render={({ field }) => (
              <RifInput
                id="taxId"
                value={field.value || ""}
                onChange={field.onChange}
                error={errors.taxId}
                className={errors.taxId ? "p-invalid" : ""}
              />
            )}
          />
          {errors.taxId && (
            <small className="p-error block mt-1">{errors.taxId.message}</small>
          )}
        </div>

        {/* ========================================= */}
        {/* CONTACTO Y DIRECCIONES                    */}
        {/* ========================================= */}
        <div className="col-12 mt-3">
          <h5 className="mb-0 text-primary">Contacto y Ubicación</h5>
          <Divider className="mt-2 mb-3" />
        </div>

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

        <div className="col-12 md:col-6 field">
          <label>Persona de Contacto</label>
          <InputText
            {...register("contactPerson")}
            placeholder="Nombre del encargado"
          />
        </div>

        <div className="col-12 md:col-6 field">
          <label>Teléfono Fijo</label>
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <PhoneInput
                value={field.value || ""}
                onChange={field.onChange}
                error={errors.phone}
              />
            )}
          />
        </div>

        <div className="col-12 md:col-6 field">
          <label>Teléfono Móvil (Celular)</label>
          <Controller
            name="mobile"
            control={control}
            render={({ field }) => (
              <PhoneInput
                value={field.value || ""}
                onChange={field.onChange}
                error={errors.mobile}
              />
            )}
          />
        </div>

        <div className="col-12 field">
          <label>Dirección Fiscal</label>
          <InputTextarea
            {...register("address")}
            rows={2}
            placeholder="Dirección principal"
          />
        </div>

        <div className="col-12 field">
          <label>Dirección de Envío</label>
          <InputTextarea
            {...register("shippingAddress")}
            rows={2}
            placeholder="Opcional. Si es diferente a la dirección fiscal."
          />
        </div>

        {/* ========================================= */}
        {/* CONFIGURACIÓN COMERCIAL Y FISCAL          */}
        {/* ========================================= */}
        <div className="col-12 mt-3">
          <h5 className="mb-0 text-primary">Configuración Comercial</h5>
          <Divider className="mt-2 mb-3" />
        </div>

        <div className="col-12 md:col-4 field">
          <label className="font-semibold">Lista de Precio</label>
          <Controller
            name="priceList"
            control={control}
            render={({ field }) => (
              <InputNumber
                id={field.name}
                value={field.value}
                onValueChange={(e) => field.onChange(e.value)}
                min={1}
              />
            )}
          />
        </div>

        <div className="col-12 md:col-4 field">
          <label className="font-semibold">Límite de Crédito</label>
          <Controller
            name="creditLimit"
            control={control}
            render={({ field }) => (
              <InputNumber
                id={field.name}
                value={field.value}
                onValueChange={(e) => field.onChange(e.value)}
                min={0}
                mode="decimal"
                minFractionDigits={2}
              />
            )}
          />
        </div>

        <div className="col-12 md:col-4 field">
          <label className="font-semibold">Días de Crédito</label>
          <Controller
            name="creditDays"
            control={control}
            render={({ field }) => (
              <InputNumber
                id={field.name}
                value={field.value}
                onValueChange={(e) => field.onChange(e.value)}
                min={0}
                suffix=" días"
              />
            )}
          />
        </div>

        <div className="col-12 md:col-4 field">
          <label className="font-semibold">Descuento por Defecto</label>
          <Controller
            name="defaultDiscount"
            control={control}
            render={({ field }) => (
              <InputNumber
                id={field.name}
                value={field.value}
                onValueChange={(e) => field.onChange(e.value)}
                min={0}
                max={100}
                suffix="%"
              />
            )}
          />
        </div>

        <div className="col-12 md:col-4 field flex flex-column justify-content-center">
          <label className="font-semibold mb-2">Contribuyente Especial</label>
          <div className="flex align-items-center gap-3">
            <Controller
              name="isSpecialTaxpayer"
              control={control}
              render={({ field }) => (
                <InputSwitch
                  checked={field.value ?? false}
                  onChange={(e) => field.onChange(e.value)}
                />
              )}
            />
            <span className="text-sm">
              Agente de Retención (IGTF/IVA)
            </span>
          </div>
        </div>

        {isEditing && (
          <div className="col-12 md:col-4 field flex flex-column justify-content-center">
            <label className="font-semibold mb-2">Estado</label>
            <div className="flex align-items-center gap-3">
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

        {/* ========================================= */}
        {/* INFORMACIÓN ADICIONAL                     */}
        {/* ========================================= */}
        <div className="col-12 mt-3">
          <h5 className="mb-0 text-primary">Información Adicional</h5>
          <Divider className="mt-2 mb-3" />
        </div>

        <div className="col-12 field">
          <label>Notas Internas</label>
          <InputTextarea
            {...register("notes")}
            rows={3}
            placeholder="Notas o comentarios sobre el cliente"
          />
        </div>

        <div className="col-12 field">
          <label>Campos Adicionales</label>
          <small className="block text-500 mb-2">
            Información extra personalizada (hashtags, referencias, etc.)
          </small>
          <Controller
            name="metadata"
            control={control}
            render={({ field }) => (
              <MetadataInput value={field.value} onChange={field.onChange} />
            )}
          />
        </div>
      </div>
    </form>
  );
}
