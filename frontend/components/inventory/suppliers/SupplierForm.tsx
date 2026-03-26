"use client";
import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { InputSwitch } from "primereact/inputswitch";
import { Divider } from "primereact/divider";
import { Toast } from "primereact/toast";

// API functions
import supplierService, {
  type Supplier,
} from "@/app/api/inventory/supplierService";

// Schema de validación
import {
  createSupplierSchema,
  CreateSupplier,
} from "@/libs/zods/inventory/supplierZod";
import { handleFormError } from "@/utils/errorHandlers";

// Componentes comunes
import PhoneInput from "@/components/common/PhoneInput";
import RifInput from "@/components/common/RifInput";
import MetadataInput from "@/components/common/MetadataInput";

interface SupplierFormProps {
  supplier?: Supplier | null;
  formId?: string;
  onSave: () => void | Promise<void>;
  onCreated?: (item: any) => void;
  onSubmittingChange?: (isSubmitting: boolean) => void;
  toast: React.RefObject<Toast> | null;
}

const typeOptions = [
  { label: "Persona Individual", value: "INDIVIDUAL" },
  { label: "Empresa", value: "COMPANY" },
];

const currencyOptions = [
  { label: "USD (Dólar)", value: "USD" },
  { label: "VES (Bolívar)", value: "VES" },
  { label: "EUR (Euro)", value: "EUR" },
];

export default function SupplierForm({
  supplier,
  formId,
  onSave,
  onCreated,
  onSubmittingChange,
  toast,
}: SupplierFormProps) {
  const isEditing = !!supplier;

  const {
    control,
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<CreateSupplier>({
    resolver: zodResolver(createSupplierSchema),
    mode: "onBlur",
    defaultValues: supplier
      ? {
          code: supplier.code,
          type: supplier.type || "COMPANY",
          name: supplier.name,
          taxId: supplier.taxId || undefined,
          contactName: supplier.contactName || undefined,
          email: supplier.email || undefined,
          phone: supplier.phone || undefined,
          mobile: supplier.mobile || undefined,
          website: supplier.website || undefined,
          address: supplier.address || undefined,
          isSpecialTaxpayer: supplier.isSpecialTaxpayer ?? false,
          creditDays: supplier.creditDays ?? 0,
          currency: supplier.currency || "USD",
          notes: supplier.notes || undefined,
        }
      : {
          type: "COMPANY",
          isSpecialTaxpayer: false,
          creditDays: 0,
          currency: "USD",
        },
  });

  const onSubmit = async (data: CreateSupplier) => {
    if (onSubmittingChange) onSubmittingChange(true);
    try {
      const payload = {
        code: data.code,
        name: data.name,
        type: data.type,
        taxId: data.taxId || undefined,
        contactName: data.contactName || undefined,
        email: data.email || undefined,
        phone: data.phone || undefined,
        mobile: data.mobile || undefined,
        website: data.website || undefined,
        address: data.address || undefined,
        isSpecialTaxpayer: data.isSpecialTaxpayer,
        creditDays: data.creditDays,
        currency: data.currency || "USD",
        notes: data.notes || undefined,
      };

      if (isEditing && supplier) {
        await supplierService.update(supplier.id, payload);
        await onSave();
      } else {
        const res = await supplierService.create(payload);
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
      id={formId || "supplier-form"}
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
            Tipo de Proveedor <span className="text-red-500">*</span>
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
                placeholder="Seleccionar tipo"
                className={errors.type ? "p-invalid" : ""}
              />
            )}
          />
          {errors.type && (
            <small className="p-error">{errors.type.message}</small>
          )}
        </div>

        <div className="col-12 md:col-6 field">
          <label className="font-semibold">
            Código <span className="text-red-500">*</span>
          </label>
          <InputText
            {...register("code")}
            placeholder="Ej: PROV-001"
            className={errors.code ? "p-invalid" : ""}
            disabled={isEditing}
            title={isEditing ? "El código no puede ser modificado" : ""}
          />
          {errors.code && (
            <small className="p-error">{errors.code.message}</small>
          )}
        </div>

        <div className="col-12 md:col-8 field">
          <label className="font-semibold">
            Nombre <span className="text-red-500">*</span>
          </label>
          <InputText
            {...register("name")}
            placeholder="Nombre del proveedor"
            className={errors.name ? "p-invalid" : ""}
          />
          {errors.name && (
            <small className="p-error">{errors.name.message}</small>
          )}
        </div>

        <div className="col-12 md:col-4 field">
          <label className="font-semibold">RIF / NIT</label>
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
            {...register("contactName")}
            placeholder="Nombre del encargado"
            className={errors.contactName ? "p-invalid" : ""}
          />
          {errors.contactName && (
            <small className="p-error">{errors.contactName.message}</small>
          )}
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
          <label>Sitio Web</label>
          <InputText
            {...register("website")}
            placeholder="https://ejemplo.com"
            className={errors.website ? "p-invalid" : ""}
          />
          {errors.website && (
            <small className="p-error">{errors.website.message}</small>
          )}
        </div>

        <div className="col-12 field">
          <label>Dirección</label>
          <InputTextarea
            {...register("address")}
            rows={2}
            placeholder="Dirección completa del proveedor"
            className={errors.address ? "p-invalid" : ""}
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
          <label className="font-semibold">Moneda</label>
          <Controller
            name="currency"
            control={control}
            render={({ field }) => (
              <Dropdown
                id={field.name}
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={currencyOptions}
                optionLabel="label"
                optionValue="value"
                placeholder="Seleccionar moneda"
                className={errors.currency ? "p-invalid" : ""}
              />
            )}
          />
          {errors.currency && (
            <small className="p-error">{errors.currency.message}</small>
          )}
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
                className={errors.creditDays ? "p-invalid" : ""}
              />
            )}
          />
          {errors.creditDays && (
            <small className="p-error">{errors.creditDays.message}</small>
          )}
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
            <span className="text-sm">Agente de Retención (IGTF/IVA)</span>
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
            placeholder="Notas o comentarios internos sobre el proveedor"
            className={errors.notes ? "p-invalid" : ""}
          />
          {errors.notes && (
            <small className="p-error">{errors.notes.message}</small>
          )}
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
