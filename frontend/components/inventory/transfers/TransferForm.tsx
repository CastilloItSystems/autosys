"use client";

import React, { useState, useEffect } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// PrimeReact components
import { AutoComplete, AutoCompleteCompleteEvent } from "primereact/autocomplete";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { InputTextarea } from "primereact/inputtextarea";
import { ProgressSpinner } from "primereact/progressspinner";
import { Message } from "primereact/message";

// Common inventory components
import ItemsTable, { ColumnDef } from "@/components/inventory/common/ItemsTable";

// API functions
import transferService from "@/app/api/inventory/transferService";
import type { Transfer } from "@/libs/interfaces";
import stockService, { Stock } from "@/app/api/inventory/stockService";
import { Warehouse } from "@/app/api/inventory/warehouseService";

// Zod schema
import {
  createTransferSchema,
  CreateTransferInput,
} from "@/libs/zods/inventory/transferZod";

// Utils
import { handleFormError } from "@/utils/errorHandlers";

interface TransferFormProps {
  transfer: Transfer | null;
  warehouses: Warehouse[];
  onSave: () => void;
  onCancel: () => void;
  toast: React.RefObject<any>;
}

// ── Column layout ──────────────────────────────────────────────────────────────

const COLS: Record<string, React.CSSProperties> = {
  handle:   { width: "1.75rem", flexShrink: 0 },
  product:  { flex: "1 1 0", minWidth: "10rem" },
  quantity: { width: "7rem", flexShrink: 0 },
  unitCost: { width: "9rem", flexShrink: 0 },
  remove:   { width: "1.75rem", flexShrink: 0 },
};

const TABLE_COLS: ColumnDef[] = [
  { label: "",             style: COLS.handle },
  { label: "Artículo",     style: COLS.product },
  { label: "Cantidad",     style: COLS.quantity },
  { label: "Costo Unit.",  style: COLS.unitCost },
  { label: "",             style: COLS.remove },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function TransferForm({
  transfer,
  warehouses,
  onSave,
  onCancel,
  toast,
}: TransferFormProps) {
  const isEditing = !!transfer?.id;
  const [warehouseStocks, setWarehouseStocks] = useState<Stock[]>([]);
  const [loadingStocks, setLoadingStocks] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateTransferInput>({
    resolver: zodResolver(createTransferSchema),
    defaultValues: {
      fromWarehouseId: "",
      toWarehouseId: "",
      items: [{ itemId: "", quantity: 1, unitCost: 0 }],
      notes: "",
    },
  });

  const { fields, append, remove, replace, move } = useFieldArray({
    control,
    name: "items",
  });

  const fromWarehouseId = watch("fromWarehouseId");

  // Loading inicial para consistencia visual
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  // Cargar stocks del almacén origen cuando cambia
  useEffect(() => {
    if (!fromWarehouseId || isEditing) return;

    const loadWarehouseStocks = async () => {
      setLoadingStocks(true);
      try {
        const response = await stockService.getByWarehouse(fromWarehouseId, {
          page: 1,
          limit: 1000,
        });
        const stocks = (response.data || []).filter(
          (s) => s.quantityAvailable > 0,
        );
        setWarehouseStocks(stocks);
      } catch {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "Error al cargar stock del almacén",
          life: 3000,
        });
        setWarehouseStocks([]);
      } finally {
        setLoadingStocks(false);
      }
    };

    loadWarehouseStocks();
    replace([{ itemId: "", quantity: 1, unitCost: 0 }]);
  }, [fromWarehouseId]);

  // Cargar datos de la transferencia si está en modo edición
  useEffect(() => {
    if (transfer && !isLoading) {
      reset({
        fromWarehouseId: transfer.fromWarehouseId || "",
        toWarehouseId: transfer.toWarehouseId || "",
        items: transfer.items?.map((i) => ({
          itemId: i.itemId,
          quantity: i.quantity,
          unitCost: i.unitCost || 0,
        })) || [{ itemId: "", quantity: 1, unitCost: 0 }],
        notes: transfer.notes || "",
      });
    } else if (!transfer && !isLoading) {
      reset({
        fromWarehouseId: "",
        toWarehouseId: "",
        items: [{ itemId: "", quantity: 1, unitCost: 0 }],
        notes: "",
      });
    }
  }, [transfer, reset, isLoading]);

  // ── Derived data ────────────────────────────────────────────────────────────

  // Map stocks to a flat item catalog for AutoComplete
  const stockItems = warehouseStocks.map((s) => ({
    id: s.itemId,
    sku: s.item?.sku || s.itemId,
    name: s.item?.name || "",
    quantityAvailable: s.quantityAvailable,
    averageCost: s.averageCost,
  }));

  const stockItemsMap = Object.fromEntries(stockItems.map((i) => [i.id, i]));

  const warehouseOptions = warehouses.map((w) => ({
    label: w.name,
    value: w.id,
  }));

  const filteredToWarehouseOptions = warehouses
    .filter((w) => w.id !== fromWarehouseId)
    .map((w) => ({ label: w.name, value: w.id }));

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleSearch = (event: AutoCompleteCompleteEvent) => {
    const q = event.query.toLowerCase();
    setSuggestions(
      q
        ? stockItems.filter(
            (i) =>
              i.sku.toLowerCase().includes(q) ||
              i.name.toLowerCase().includes(q),
          )
        : stockItems,
    );
  };

  const resolveItem = (val: any): any => {
    if (!val || typeof val !== "string") return val;
    return stockItemsMap[val] ?? val;
  };

  const onSubmit = async (data: CreateTransferInput) => {
    try {
      if (isEditing) {
        await transferService.update(transfer!.id, { notes: data.notes });
      } else {
        await transferService.create(data);
      }
      onSave();
    } catch (error: any) {
      console.error("Error saving transfer:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          error.response?.data?.message || "Error al guardar la transferencia",
        life: 3000,
      });
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

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
            {/* Almacén Origen */}
            <div className="col-12 md:col-6">
              <label
                htmlFor="fromWarehouseId"
                className="block text-900 font-medium mb-2"
              >
                Almacén Origen <span className="text-red-500">*</span>
              </label>
              <Controller
                name="fromWarehouseId"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    {...field}
                    id="fromWarehouseId"
                    options={warehouseOptions}
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Seleccione almacén origen"
                    className={errors.fromWarehouseId ? "p-invalid" : ""}
                    disabled={isEditing}
                  />
                )}
              />
              {errors.fromWarehouseId && (
                <small className="p-error block mt-1">
                  {errors.fromWarehouseId.message}
                </small>
              )}
            </div>

            {/* Almacén Destino */}
            <div className="col-12 md:col-6">
              <label
                htmlFor="toWarehouseId"
                className="block text-900 font-medium mb-2"
              >
                Almacén Destino <span className="text-red-500">*</span>
              </label>
              <Controller
                name="toWarehouseId"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    {...field}
                    id="toWarehouseId"
                    options={filteredToWarehouseOptions}
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Seleccione almacén destino"
                    className={errors.toWarehouseId ? "p-invalid" : ""}
                    disabled={!fromWarehouseId || isEditing}
                  />
                )}
              />
              {errors.toWarehouseId && (
                <small className="p-error block mt-1">
                  {errors.toWarehouseId.message}
                </small>
              )}
            </div>

            {/* Notas */}
            <div className="col-12">
              <label
                htmlFor="notes"
                className="block text-900 font-medium mb-2"
              >
                Notas
              </label>
              <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                  <InputTextarea
                    {...field}
                    id="notes"
                    rows={3}
                    placeholder="Observaciones adicionales..."
                    className={errors.notes ? "p-invalid" : ""}
                  />
                )}
              />
              {errors.notes && (
                <small className="p-error block mt-1">
                  {errors.notes.message}
                </small>
              )}
            </div>
          </div>

          {/* ── Items section ─────────────────────────────────────────────── */}

          {!fromWarehouseId && !isEditing && (
            <Message
              severity="info"
              text="Seleccione un almacén origen para ver los artículos disponibles."
              className="w-full mb-3"
            />
          )}

          {fromWarehouseId &&
            !loadingStocks &&
            warehouseStocks.length === 0 &&
            !isEditing && (
              <Message
                severity="warn"
                text="No hay artículos con stock disponible en el almacén seleccionado."
                className="w-full mb-3"
              />
            )}

          {loadingStocks && (
            <div className="flex align-items-center gap-2 mb-3">
              <ProgressSpinner
                style={{ width: "20px", height: "20px" }}
                strokeWidth="4"
              />
              <span className="text-600">Cargando stock del almacén...</span>
            </div>
          )}

          <div
            className="grid"
            style={
              isEditing ? { pointerEvents: "none", opacity: 0.7 } : undefined
            }
          >
            <ItemsTable
              fields={fields}
              append={append}
              remove={remove}
              move={move}
              defaultItem={{ itemId: "", quantity: 1, unitCost: 0 }}
              columns={TABLE_COLS}
              title="Artículos"
              disabled={
                isEditing ||
                !fromWarehouseId ||
                warehouseStocks.length === 0
              }
              minWidth={520}
              renderRow={({ field, index, dragHandleProps, isDragging }) => (
                <div
                  key={field.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "4px 8px",
                    borderBottom: "1px solid var(--surface-200)",
                    backgroundColor: isDragging
                      ? "var(--highlight-bg, #eff6ff)"
                      : undefined,
                    opacity: isDragging ? 0.75 : 1,
                    transition: "background 0.12s",
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.preventDefault();
                  }}
                >
                  {/* Drag handle */}
                  <div
                    style={{
                      ...COLS.handle,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "grab",
                    }}
                    {...(dragHandleProps as React.HTMLAttributes<HTMLDivElement>)}
                  >
                    <i
                      className="pi pi-bars"
                      style={{
                        color: "var(--text-color-secondary)",
                        fontSize: "0.7rem",
                      }}
                    />
                  </div>

                  {/* Artículo — AutoComplete */}
                  <div style={COLS.product}>
                    <Controller
                      name={`items.${index}.itemId`}
                      control={control}
                      render={({ field: f }) => (
                        <AutoComplete
                          value={resolveItem(f.value)}
                          suggestions={suggestions}
                          completeMethod={handleSearch}
                          field="sku"
                          selectedItemTemplate={(item: any) => {
                            if (!item) return "";
                            if (typeof item === "string") return item;
                            return item.name
                              ? `${item.sku} — ${item.name}`
                              : (item.sku || "");
                          }}
                          placeholder="SKU o Nombre..."
                          className={`w-full ${errors.items?.[index]?.itemId ? "p-invalid" : ""}`}
                          inputClassName="w-full text-xs"
                          inputStyle={{
                            padding: "0.2rem 0.5rem",
                            height: "30px",
                            fontSize: "0.8rem",
                            width: "100%",
                          }}
                          style={{ height: "30px", width: "100%" }}
                          itemTemplate={(item: any) => {
                            const avail = item.quantityAvailable ?? 0;
                            return (
                              <div className="flex justify-content-between align-items-center w-full gap-2">
                                <div className="flex flex-column overflow-hidden">
                                  <span
                                    className="white-space-nowrap overflow-hidden text-overflow-ellipsis"
                                    style={{ fontSize: "0.85rem" }}
                                  >
                                    {item.sku} — {item.name}
                                  </span>
                                </div>
                                <span
                                  className={`text-xs px-2 py-1 border-round flex-shrink-0 ${avail > 0 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                                >
                                  {avail}
                                </span>
                              </div>
                            );
                          }}
                          onSelect={(e) => {
                            const item = e.value;
                            f.onChange(item.id);
                            setValue(
                              `items.${index}.unitCost`,
                              Number(item.averageCost) || 0,
                            );
                          }}
                          onChange={(e) => {
                            if (typeof e.value === "string") f.onChange(e.value);
                          }}
                          appendTo={mounted ? document.body : "self"}
                          forceSelection={false}
                          showEmptyMessage
                        />
                      )}
                    />
                    {errors.items?.[index]?.itemId && (
                      <small
                        className="p-error"
                        style={{ fontSize: "0.65rem", lineHeight: 1.2 }}
                      >
                        {errors.items[index]?.itemId?.message}
                      </small>
                    )}
                  </div>

                  {/* Cantidad */}
                  <div style={COLS.quantity}>
                    <Controller
                      name={`items.${index}.quantity`}
                      control={control}
                      render={({ field: f }) => (
                        <InputNumber
                          value={f.value}
                          onValueChange={(e) => f.onChange(e.value ?? 1)}
                          min={1}
                          className="w-full"
                          inputClassName={`w-full text-center ${errors.items?.[index]?.quantity ? "p-invalid" : ""}`}
                          inputStyle={{
                            padding: "0.25rem 0.4rem",
                            height: "30px",
                            fontSize: "0.8rem",
                          }}
                          style={{ height: "30px" }}
                        />
                      )}
                    />
                    {errors.items?.[index]?.quantity && (
                      <small
                        className="p-error"
                        style={{ fontSize: "0.65rem", lineHeight: 1.2 }}
                      >
                        {errors.items[index]?.quantity?.message}
                      </small>
                    )}
                  </div>

                  {/* Costo Unitario */}
                  <div style={COLS.unitCost}>
                    <Controller
                      name={`items.${index}.unitCost`}
                      control={control}
                      render={({ field: f }) => (
                        <InputNumber
                          value={f.value}
                          readOnly
                          minFractionDigits={2}
                          maxFractionDigits={2}
                          mode="currency"
                          currency="USD"
                          locale="es-VE"
                          className="w-full"
                          inputClassName="w-full text-right surface-100"
                          inputStyle={{
                            padding: "0.25rem 0.4rem",
                            height: "30px",
                            fontSize: "0.8rem",
                          }}
                          style={{ height: "30px" }}
                        />
                      )}
                    />
                  </div>

                  {/* Remove */}
                  <div
                    style={{
                      ...COLS.remove,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Button
                      type="button"
                      icon="pi pi-times"
                      className="p-button-rounded p-button-danger p-button-text"
                      style={{ width: "1.5rem", height: "1.5rem" }}
                      onClick={() => remove(index)}
                      disabled={fields.length <= 1}
                      tooltip="Eliminar fila"
                      tooltipOptions={{ position: "top" }}
                    />
                  </div>
                </div>
              )}
            />
          </div>

          {errors.items && typeof errors.items.message === "string" && (
            <small className="p-error block mt-1">{errors.items.message}</small>
          )}

          {isEditing && (
            <Message
              severity="warn"
              text="Solo las notas pueden editarse en borradores existentes. Para cambiar artículos o almacenes, elimine y cree una nueva transferencia."
              className="w-full mt-3"
            />
          )}

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
              label={isEditing ? "Actualizar" : "Crear"}
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
