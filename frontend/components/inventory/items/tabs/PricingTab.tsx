"use client";
import React from "react";
import { Control, FieldErrors, Controller } from "react-hook-form";
import { InputNumber } from "primereact/inputnumber";
import { IPricing } from "@/app/api/inventory/itemService";

interface PricingTabProps {
  control: Control<any>;
  errors: FieldErrors<any>;
  calculatedMargin: number;
  pricing: IPricing | null;
  onPricingChange: (p: IPricing) => void;
  priceLevels: { level: number; priceForeign: number }[];
  onPriceLevelsChange: (levels: { level: number; priceForeign: number }[]) => void;
}

export default function PricingTab({
  control,
  errors,
  calculatedMargin,
  pricing,
  onPricingChange,
  priceLevels,
  onPriceLevelsChange,
}: PricingTabProps) {
  const update = (patch: Partial<IPricing>) =>
    onPricingChange({ ...(pricing ?? { isActive: true }), ...patch } as IPricing);

  return (
    <div className="grid">
      {/* Precios Base */}
      <div className="col-12">
        <h3 className="text-base font-bold text-900 mb-2">Precios Base</h3>
      </div>

      <div className="col-12 md:col-3">
        <label htmlFor="costPrice" className="block text-900 font-medium mb-2">
          Precio Costo <span className="text-red-500">*</span>
        </label>
        <Controller
          name="costPrice"
          control={control}
          render={({ field }) => (
            <InputNumber
              id="costPrice"
              value={field.value}
              onValueChange={(e) => field.onChange(e.value)}
              mode="currency"
              currency="USD"
              locale="en-US"
              className={errors.costPrice ? "p-invalid" : ""}
            />
          )}
        />
        {errors.costPrice && (
          <small className="p-error block">{errors.costPrice.message as string}</small>
        )}
      </div>

      <div className="col-12 md:col-3">
        <label htmlFor="salePrice" className="block text-900 font-medium mb-2">
          Precio Venta <span className="text-red-500">*</span>
        </label>
        <Controller
          name="salePrice"
          control={control}
          render={({ field }) => (
            <InputNumber
              id="salePrice"
              value={field.value}
              onValueChange={(e) => field.onChange(e.value)}
              mode="currency"
              currency="USD"
              locale="en-US"
              className={errors.salePrice ? "p-invalid" : ""}
            />
          )}
        />
        {errors.salePrice && (
          <small className="p-error block">{errors.salePrice.message as string}</small>
        )}
      </div>

      <div className="col-12 md:col-3">
        <label htmlFor="wholesalePrice" className="block text-900 font-medium mb-2">
          Precio Mayoreo
        </label>
        <Controller
          name="wholesalePrice"
          control={control}
          render={({ field }) => (
            <InputNumber
              id="wholesalePrice"
              value={field.value}
              onValueChange={(e) => field.onChange(e.value)}
              mode="currency"
              currency="USD"
              locale="en-US"
            />
          )}
        />
      </div>

      <div className="col-12 md:col-3">
        <label className="block text-900 font-medium mb-2">Margen %</label>
        <div className="p-2 bg-blue-50 border-l-4 border-blue-500 rounded flex align-items-center justify-content-center h-full">
          <span className="text-lg font-bold text-blue-600">
            {calculatedMargin.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Modelo Moneda Extranjera */}
      <div className="col-12 mt-3">
        <h3 className="text-base font-bold text-900 mb-2">
          Modelo Moneda Extranjera (USD)
        </h3>
      </div>

      <div className="col-12 md:col-3">
        <label className="block text-900 font-medium mb-2">Costo USD</label>
        <InputNumber
          value={pricing?.costForeign ?? 0}
          onValueChange={(e) => update({ costForeign: e.value ?? 0 })}
          mode="decimal"
          minFractionDigits={2}
          maxFractionDigits={7}
          min={0}
          className="w-full"
        />
      </div>

      <div className="col-12 md:col-3">
        <label className="block text-900 font-medium mb-2">Tasa de Cambio</label>
        <InputNumber
          value={pricing?.exchangeRate ?? 1}
          onValueChange={(e) => update({ exchangeRate: e.value ?? 1 })}
          mode="decimal"
          minFractionDigits={2}
          maxFractionDigits={7}
          min={0}
          className="w-full"
        />
      </div>

      <div className="col-12 md:col-3">
        <label className="block text-900 font-medium mb-2">IVA Venta (%)</label>
        <InputNumber
          value={pricing?.taxRateSale ?? 0}
          onValueChange={(e) => update({ taxRateSale: e.value ?? 0 })}
          min={0}
          max={100}
          suffix="%"
          className="w-full"
        />
      </div>

      <div className="col-12 md:col-3">
        <label className="block text-900 font-medium mb-2">IVA Compra (%)</label>
        <InputNumber
          value={pricing?.taxRatePurchase ?? 0}
          onValueChange={(e) => update({ taxRatePurchase: e.value ?? 0 })}
          min={0}
          max={100}
          suffix="%"
          className="w-full"
        />
      </div>

      {/* Niveles de precio 1-8 */}
      <div className="col-12 mt-3">
        <h3 className="text-base font-bold text-900 mb-2">Niveles de Precio (USD)</h3>
        <small className="text-500 block mb-3">
          Precio en moneda extranjera por nivel. El sistema calcula automáticamente el precio
          local usando la tasa de cambio.
        </small>
        <div className="grid">
          {priceLevels.map((pl, idx) => (
            <div key={pl.level} className="col-6 md:col-3">
              <label className="block text-900 font-medium mb-2">Precio {pl.level}</label>
              <InputNumber
                value={pl.priceForeign}
                onValueChange={(e) => {
                  const updated = [...priceLevels];
                  updated[idx] = { ...pl, priceForeign: e.value ?? 0 };
                  onPriceLevelsChange(updated);
                }}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={7}
                min={0}
                className="w-full"
                placeholder="0.00"
              />
              {pricing?.exchangeRate && pl.priceForeign > 0 && (
                <small className="text-500">
                  ≈ {(pl.priceForeign * (pricing.exchangeRate ?? 1)).toFixed(2)} local
                </small>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Márgenes y Descuento */}
      <div className="col-12 mt-3">
        <h3 className="text-base font-bold text-900 mb-2">Márgenes y Descuento</h3>
      </div>

      <div className="col-12 md:col-4">
        <label htmlFor="minMargin" className="block text-900 font-medium mb-2">
          Margen Mín. (%)
        </label>
        <InputNumber
          id="minMargin"
          value={pricing?.minMargin ?? 0}
          onValueChange={(e) => update({ minMargin: e.value ?? 0 })}
          min={0}
          max={100}
        />
      </div>

      <div className="col-12 md:col-4">
        <label htmlFor="maxMargin" className="block text-900 font-medium mb-2">
          Margen Máx. (%)
        </label>
        <InputNumber
          id="maxMargin"
          value={pricing?.maxMargin ?? 0}
          onValueChange={(e) => update({ maxMargin: e.value ?? 0 })}
          min={0}
          max={100}
        />
      </div>

      <div className="col-12 md:col-4">
        <label htmlFor="discountPercentage" className="block text-900 font-medium mb-2">
          Descuento (%)
        </label>
        <InputNumber
          id="discountPercentage"
          value={pricing?.discountPercentage ?? 0}
          onValueChange={(e) => update({ discountPercentage: e.value })}
          min={0}
          max={100}
        />
      </div>
    </div>
  );
}
