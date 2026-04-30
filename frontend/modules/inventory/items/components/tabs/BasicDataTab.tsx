"use client";
import React from "react";
import { Control, FieldErrors, Controller } from "react-hook-form";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { InputSwitch } from "primereact/inputswitch";
import { Chips } from "primereact/chips";
import { Button } from "primereact/button";

interface BasicDataTabProps {
  control: Control<any>;
  errors: FieldErrors<any>;
  brands: any[];
  categories: any[];
  models: any[];
  units: any[];
  isEditMode: boolean;
  loadingBrands?: boolean;
  loadingCategories?: boolean;
  loadingModels?: boolean;
  loadingUnits?: boolean;
  onAddBrand: () => void;
  onAddCategory: () => void;
  onAddUnit: () => void;
  onAddModel: () => void;
}

export default function BasicDataTab({
  control,
  errors,
  brands,
  categories,
  models,
  units,
  isEditMode,
  loadingBrands,
  loadingCategories,
  loadingModels,
  loadingUnits,
  onAddBrand,
  onAddCategory,
  onAddUnit,
  onAddModel,
}: BasicDataTabProps) {
  const brandFooter = (
    <div className="p-2 border-top-1 surface-border">
      <Button
        label="Nueva marca"
        icon="pi pi-plus"
        text
        size="small"
        type="button"
        className="w-full justify-content-start"
        onClick={onAddBrand}
      />
    </div>
  );

  const categoryFooter = (
    <div className="p-2 border-top-1 surface-border">
      <Button
        label="Nueva categoría"
        icon="pi pi-plus"
        text
        size="small"
        type="button"
        className="w-full justify-content-start"
        onClick={onAddCategory}
      />
    </div>
  );

  const modelFooter = (
    <div className="p-2 border-top-1 surface-border">
      <Button
        label="Nuevo modelo"
        icon="pi pi-plus"
        text
        size="small"
        type="button"
        className="w-full justify-content-start"
        onClick={onAddModel}
      />
    </div>
  );

  const unitFooter = (
    <div className="p-2 border-top-1 surface-border">
      <Button
        label="Nueva unidad"
        icon="pi pi-plus"
        text
        size="small"
        type="button"
        className="w-full justify-content-start"
        onClick={onAddUnit}
      />
    </div>
  );
  return (
    <div className="grid">
      {/* Row 1: SKU, Código, Barcode, Identidad */}
      <div className="col-12 md:col-3">
        <label htmlFor="sku" className="block text-900 font-medium mb-2">
          SKU <span className="text-red-500">*</span>
        </label>
        <Controller
          name="sku"
          control={control}
          render={({ field }) => (
            <InputText
              id="sku"
              {...field}
              placeholder="ART-001"
              className={errors.sku ? "p-invalid" : ""}
              disabled={isEditMode}
              autoFocus
              value={field.value?.toUpperCase() || ""}
              onChange={(e) => field.onChange(e.target.value.toUpperCase())}
            />
          )}
        />
        {errors.sku && (
          <small className="p-error block">
            {errors.sku.message as string}
          </small>
        )}
      </div>

      <div className="col-12 md:col-3">
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
              placeholder="Código único"
              className={errors.code ? "p-invalid" : ""}
              disabled={isEditMode}
            />
          )}
        />
        {errors.code && (
          <small className="p-error block">
            {errors.code.message as string}
          </small>
        )}
      </div>

      <div className="col-12 md:col-3">
        <label htmlFor="barcode" className="block text-900 font-medium mb-2">
          Barcode
        </label>
        <Controller
          name="barcode"
          control={control}
          render={({ field }) => (
            <InputText id="barcode" {...field} placeholder="Código barras" />
          )}
        />
      </div>

      <div className="col-12 md:col-3">
        <label htmlFor="identity" className="block text-900 font-medium mb-2">
          Identidad
        </label>
        <Controller
          name="identity"
          control={control}
          render={({ field }) => (
            <InputText
              id="identity"
              {...field}
              placeholder="Identidad del artículo"
              className={errors.identity ? "p-invalid" : ""}
            />
          )}
        />
        {errors.identity && (
          <small className="p-error block">
            {errors.identity.message as string}
          </small>
        )}
      </div>

      {/* Row 2: Nombre, Nombre Corto, Referencia */}
      <div className="col-12 md:col-8">
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
              placeholder="Nombre del artículo"
              className={errors.name ? "p-invalid" : ""}
            />
          )}
        />
        {errors.name && (
          <small className="p-error block">
            {errors.name.message as string}
          </small>
        )}
      </div>

      <div className="col-12 md:col-2">
        <label htmlFor="shortName" className="block text-900 font-medium mb-2">
          Nombre Corto
        </label>
        <Controller
          name="shortName"
          control={control}
          render={({ field }) => (
            <InputText
              id="shortName"
              {...field}
              value={field.value ?? ""}
              placeholder="Max 20 car."
              maxLength={20}
            />
          )}
        />
      </div>

      <div className="col-12 md:col-2">
        <label htmlFor="reference" className="block text-900 font-medium mb-2">
          Referencia
        </label>
        <Controller
          name="reference"
          control={control}
          render={({ field }) => (
            <InputText
              id="reference"
              {...field}
              value={field.value ?? ""}
              placeholder="Ref. interna"
              maxLength={20}
            />
          )}
        />
      </div>

      {/* Row 3: Descripción + Contraindicaciones */}
      <div className="col-12 md:col-6">
        <label
          htmlFor="description"
          className="block text-900 font-medium mb-2"
        >
          Descripción
        </label>
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <InputTextarea
              id="description"
              {...field}
              placeholder="Descripción"
              rows={2}
              className={errors.description ? "p-invalid" : ""}
            />
          )}
        />
      </div>

      <div className="col-12 md:col-6">
        <label
          htmlFor="contraindications"
          className="block text-900 font-medium mb-2"
        >
          Contraindicaciones
        </label>
        <Controller
          name="contraindications"
          control={control}
          render={({ field }) => (
            <InputTextarea
              id="contraindications"
              {...field}
              value={field.value ?? ""}
              placeholder="Contraindicaciones o restricciones"
              rows={2}
            />
          )}
        />
      </div>

      {/* Tags */}
      <div className="col-12">
        <label htmlFor="tags" className="block text-900 font-medium mb-2">
          Etiquetas (Tags)
        </label>
        <Controller
          name="tags"
          control={control}
          render={({ field }) => (
            <Chips
              id="tags"
              value={field.value}
              onChange={(e) => field.onChange(e.value)}
              placeholder="Escribe y presiona Enter para añadir etiquetas"
              separator=","
              className="w-full"
            />
          )}
        />
        <small className="text-500">Ej: aceite, sintético, 10w40</small>
      </div>

      {/* Row 4: Marca, Categoría, Modelo, Unidad */}
      <div className="col-12 md:col-3">
        <label htmlFor="brandId" className="block text-900 font-medium mb-2">
          Marca <span className="text-red-500">*</span>
        </label>
        <Controller
          name="brandId"
          control={control}
          render={({ field }) => (
            <Dropdown
              id="brandId"
              {...field}
              options={brands}
              optionLabel="name"
              optionValue="id"
              placeholder="Marca"
              filter
              showClear
              loading={loadingBrands}
              panelFooterTemplate={brandFooter}
              className={errors.brandId ? "p-invalid" : ""}
            />
          )}
        />
        {errors.brandId && (
          <small className="p-error block">
            {errors.brandId.message as string}
          </small>
        )}
      </div>

      <div className="col-12 md:col-3">
        <label htmlFor="categoryId" className="block text-900 font-medium mb-2">
          Categoría <span className="text-red-500">*</span>
        </label>
        <Controller
          name="categoryId"
          control={control}
          render={({ field }) => (
            <Dropdown
              id="categoryId"
              {...field}
              options={categories}
              optionLabel="name"
              optionValue="id"
              placeholder="Categoría"
              filter
              showClear
              loading={loadingCategories}
              panelFooterTemplate={categoryFooter}
              className={errors.categoryId ? "p-invalid" : ""}
            />
          )}
        />
        {errors.categoryId && (
          <small className="p-error block">
            {errors.categoryId.message as string}
          </small>
        )}
      </div>

      <div className="col-12 md:col-3">
        <label htmlFor="modelId" className="block text-900 font-medium mb-2">
          Modelo
        </label>
        <Controller
          name="modelId"
          control={control}
          render={({ field }) => (
            <Dropdown
              id="modelId"
              {...field}
              options={models}
              optionLabel="name"
              optionValue="id"
              placeholder="Modelo"
              filter
              showClear
              loading={loadingModels}
              panelFooterTemplate={modelFooter}
            />
          )}
        />
      </div>

      <div className="col-12 md:col-3">
        <label htmlFor="unitId" className="block text-900 font-medium mb-2">
          Unidad <span className="text-red-500">*</span>
        </label>
        <Controller
          name="unitId"
          control={control}
          render={({ field }) => (
            <Dropdown
              id="unitId"
              {...field}
              options={units}
              optionLabel="name"
              optionValue="id"
              placeholder="Unidad"
              filter
              showClear
              loading={loadingUnits}
              panelFooterTemplate={unitFooter}
              className={errors.unitId ? "p-invalid" : ""}
            />
          )}
        />
        {errors.unitId && (
          <small className="p-error block">
            {errors.unitId.message as string}
          </small>
        )}
      </div>

      {/* Row 5: Stock Min, Max, Reorden, Ubicación */}
      <div className="col-12 md:col-3">
        <label htmlFor="minStock" className="block text-900 font-medium mb-2">
          Stock Mínimo
        </label>
        <Controller
          name="minStock"
          control={control}
          render={({ field }) => (
            <InputNumber
              id="minStock"
              value={field.value}
              onValueChange={(e) => field.onChange(e.value)}
              min={0}
              className="w-full"
            />
          )}
        />
      </div>

      <div className="col-12 md:col-3">
        <label htmlFor="maxStock" className="block text-900 font-medium mb-2">
          Stock Máximo
        </label>
        <Controller
          name="maxStock"
          control={control}
          render={({ field }) => (
            <InputNumber
              id="maxStock"
              value={field.value ?? undefined}
              onValueChange={(e) => field.onChange(e.value ?? null)}
              min={0}
              className="w-full"
            />
          )}
        />
      </div>

      <div className="col-12 md:col-3">
        <label
          htmlFor="reorderPoint"
          className="block text-900 font-medium mb-2"
        >
          Punto Reorden
        </label>
        <Controller
          name="reorderPoint"
          control={control}
          render={({ field }) => (
            <InputNumber
              id="reorderPoint"
              value={field.value}
              onValueChange={(e) => field.onChange(e.value)}
              min={0}
              className="w-full"
            />
          )}
        />
      </div>

      <div className="col-12 md:col-3">
        <label htmlFor="location" className="block text-900 font-medium mb-2">
          Ubicación (Referencial)
        </label>
        <Controller
          name="location"
          control={control}
          render={({ field }) => (
            <InputText id="location" {...field} placeholder="M1-R01" />
          )}
        />
      </div>

      {/* Row 6: Garantía y Empaque */}
      <div className="col-12 md:col-3">
        <label
          htmlFor="warrantyDays"
          className="block text-900 font-medium mb-2"
        >
          Garantía (días)
        </label>
        <Controller
          name="warrantyDays"
          control={control}
          render={({ field }) => (
            <InputNumber
              id="warrantyDays"
              value={field.value}
              onValueChange={(e) => field.onChange(e.value ?? 0)}
              min={0}
              className="w-full"
            />
          )}
        />
      </div>

      <div className="col-12 md:col-3">
        <label
          htmlFor="packagingQty"
          className="block text-900 font-medium mb-2"
        >
          Empaque (unidades)
        </label>
        <Controller
          name="packagingQty"
          control={control}
          render={({ field }) => (
            <InputNumber
              id="packagingQty"
              value={field.value}
              onValueChange={(e) => field.onChange(e.value ?? 1)}
              min={1}
              className="w-full"
            />
          )}
        />
      </div>

      {/* Row 7: Configuración */}
      <div className="col-12">
        <label className="block text-900 font-medium mb-2">Configuración</label>
        <div className="flex align-items-center gap-3 flex-wrap">
          {[
            { name: "isActive", label: "Activo" },
            { name: "useStock", label: "Usa Stock" },
            { name: "isSerialized", label: "Serializado" },
            { name: "hasBatch", label: "Lotes" },
            { name: "hasExpiry", label: "Vencimiento" },
            { name: "allowNegativeStock", label: "Stock Neg." },
            { name: "isFractionable", label: "Fraccionable" },
            { name: "isComposite", label: "Compuesto" },
            { name: "isInternalUse", label: "Uso Interno" },
            { name: "useServer", label: "Usa Servidor" },
            { name: "suspendedForPurchase", label: "Susp. Compra" },
          ].map(({ name, label }) => (
            <div key={name} className="flex align-items-center gap-2">
              <label className="text-sm text-900">{label}</label>
              <Controller
                name={name as any}
                control={control}
                render={({ field }) => (
                  <InputSwitch
                    checked={field.value}
                    onChange={(e) => field.onChange(e.value)}
                  />
                )}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
