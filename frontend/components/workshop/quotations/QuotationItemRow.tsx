"use client";
import React from "react";
import { Controller, Control } from "react-hook-form";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";
import { QUOTATION_ITEM_TYPE_OPTIONS } from "./QuotationStatusBadge";

export interface QuotationItemRowColWidths {
  handle: React.CSSProperties;
  type: React.CSSProperties;
  description: React.CSSProperties;
  quantity: React.CSSProperties;
  unitPrice: React.CSSProperties;
  discount: React.CSSProperties;
  tax: React.CSSProperties;
  totalLine: React.CSSProperties;
  remove: React.CSSProperties;
}

export interface QuotationItemRowProps {
  control: Control<any>;
  index: number;
  rowErrors?: Record<string, any>;
  colWidths: QuotationItemRowColWidths;
  onRemove: () => void;
  canRemove: boolean;
  dragHandleProps: Record<string, unknown>;
  isDragging?: boolean;
  itemValues: any; // The current values of this row for calculating totalLine
}

export default function QuotationItemRow({
  control,
  index,
  rowErrors,
  colWidths,
  onRemove,
  canRemove,
  dragHandleProps,
  isDragging = false,
  itemValues,
}: QuotationItemRowProps) {
  const rowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "4px 8px",
    borderBottom: "1px solid var(--surface-200)",
    backgroundColor: isDragging ? "var(--highlight-bg, #eff6ff)" : undefined,
    opacity: isDragging ? 0.75 : 1,
  };

  const inputStyle = {
    fontSize: "0.8rem",
    padding: "0.25rem 0.5rem",
    height: "30px",
  };

  const numberInputStyle = {
    fontSize: "0.8rem",
    padding: "0.25rem 0.5rem",
    height: "30px",
    width: "100%",
  };

  // Calculate read-only line total
  const qty = Number(itemValues?.quantity || 0);
  const price = Number(itemValues?.unitPrice || 0);
  const discPct = Number(itemValues?.discountPct || 0);
  const taxRate = Number(itemValues?.taxRate ?? 0.16);

  const subtotal = qty * price;
  const discountAmt = subtotal * (discPct / 100);
  const taxAmount = (subtotal - discountAmt) * taxRate;
  const lineTotal = subtotal - discountAmt + taxAmount;

  return (
    <div style={rowStyle}>
      {/* Drag Handle */}
      <div style={colWidths.handle}>
        <div
          {...dragHandleProps}
          style={{
            cursor: "grab",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <i className="pi pi-bars text-500" />
        </div>
      </div>

      {/* Type */}
      <div style={colWidths.type}>
        <Controller
          name={`items.${index}.type`}
          control={control}
          render={({ field }) => (
            <Dropdown
              {...field}
              options={QUOTATION_ITEM_TYPE_OPTIONS}
              placeholder="Tipo"
              className={`w-full ${rowErrors?.type ? "p-invalid" : ""}`}
              style={{ ...inputStyle, width: "100%", alignItems: "center" }}
              panelStyle={{ fontSize: "0.8rem" }}
            />
          )}
        />
      </div>

      {/* Description */}
      <div style={colWidths.description}>
        <Controller
          name={`items.${index}.description`}
          control={control}
          render={({ field }) => (
            <InputText
              {...field}
              placeholder="Descripción..."
              className={`w-full ${rowErrors?.description ? "p-invalid" : ""}`}
              style={inputStyle}
            />
          )}
        />
      </div>

      {/* Quantity */}
      <div style={colWidths.quantity}>
        <Controller
          name={`items.${index}.quantity`}
          control={control}
          render={({ field }) => (
            <InputNumber
              value={field.value}
              onValueChange={(e) => field.onChange(e.value)}
              minFractionDigits={0}
              maxFractionDigits={2}
              min={0.01}
              className={`w-full ${rowErrors?.quantity ? "p-invalid" : ""}`}
              inputStyle={numberInputStyle}
            />
          )}
        />
      </div>

      {/* Unit Price */}
      <div style={colWidths.unitPrice}>
        <Controller
          name={`items.${index}.unitPrice`}
          control={control}
          render={({ field }) => (
            <InputNumber
              value={field.value}
              onValueChange={(e) => field.onChange(e.value ?? 0)}
              minFractionDigits={2}
              maxFractionDigits={2}
              min={0}
              className={`w-full ${rowErrors?.unitPrice ? "p-invalid" : ""}`}
              inputStyle={numberInputStyle}
            />
          )}
        />
      </div>

      {/* Discount % */}
      <div style={colWidths.discount}>
        <Controller
          name={`items.${index}.discountPct`}
          control={control}
          render={({ field }) => (
            <InputNumber
              value={field.value}
              onValueChange={(e) => field.onChange(e.value ?? 0)}
              minFractionDigits={0}
              maxFractionDigits={2}
              min={0}
              max={100}
              suffix="%"
              className="w-full"
              inputStyle={numberInputStyle}
            />
          )}
        />
      </div>

      {/* Tax Amount (Read Only for now, based on 16%) */}
      <div style={colWidths.tax}>
        <Controller
          name={`items.${index}.taxAmount`}
          control={control}
          render={({ field }) => (
            <InputNumber
              value={taxAmount}
              readOnly
              minFractionDigits={2}
              maxFractionDigits={2}
              className="w-full"
              inputStyle={{ ...numberInputStyle, backgroundColor: "#f9fafb" }}
            />
          )}
        />
      </div>

      {/* Total Line (Read Only) */}
      <div
        style={colWidths.totalLine}
        className="text-right font-semibold text-sm"
      >
        ${" "}
        {lineTotal.toLocaleString("es-MX", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </div>

      {/* Remove Button */}
      <div style={colWidths.remove} className="flex justify-content-center">
        <Button
          type="button"
          icon="pi pi-trash"
          className="p-button-rounded p-button-text p-button-danger p-button-sm"
          disabled={!canRemove}
          onClick={onRemove}
          tooltip="Eliminar ítem"
          tooltipOptions={{ position: "top" }}
        />
      </div>
    </div>
  );
}
