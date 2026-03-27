"use client";

import React, { useState, useEffect } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { MultiSelect } from "primereact/multiselect";
import { AutoComplete, AutoCompleteCompleteEvent } from "primereact/autocomplete";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { InputTextarea } from "primereact/inputtextarea";
import { Divider } from "primereact/divider";
import { ProgressSpinner } from "primereact/progressspinner";
import { classNames } from "primereact/utils";
import ItemsTable, { ColumnDef } from "../common/ItemsTable";

import cycleCountService, { CycleCount } from "../../../app/api/inventory/cycleCountService";
import stockService from "../../../app/api/inventory/stockService";
import { Warehouse } from "../../../app/api/inventory/warehouseService";
import { createCycleCountSchema, CreateCycleCountInput } from "../../../libs/zods/inventory/cycleCountZod";
import { handleFormError } from "../../../utils/errorHandlers";

// ── Column layout ────────────────────────────────────────────────────────────

const COLS: Record<string, React.CSSProperties> = {
  handle:   { width: "1.75rem", flexShrink: 0 },
  product:  { flex: "1 1 0", minWidth: "10rem" },
  location: { width: "9rem", flexShrink: 0 },
  stock:    { width: "7rem", flexShrink: 0 },
  remove:   { width: "1.75rem", flexShrink: 0 },
};

const COLUMNS: ColumnDef[] = [
  { label: "",             style: COLS.handle },
  { label: "Artículo",    style: COLS.product },
  { label: "Ubicación",   style: COLS.location },
  { label: "Stock Sist.", style: COLS.stock },
  { label: "",             style: COLS.remove },
];

const MODE_CONFIG = {
  manual:         { label: "Manual",         icon: "pi pi-hand-pointer" },
  all:            { label: "Todo el Stock",  icon: "pi pi-list" },
  positive_stock: { label: "Stock Positivo", icon: "pi pi-box" },
  random:         { label: "Aleatorio",      icon: "pi pi-refresh" },
  category:       { label: "Por Categoría",  icon: "pi pi-tag" },
} as const;

type SelectionMode = keyof typeof MODE_CONFIG;

// ── Props ────────────────────────────────────────────────────────────────────

interface CycleCountFormProps {
  cycleCount?: CycleCount;
  warehouses: Warehouse[];
  formId?: string;
  onSave: () => void | Promise<void>;
  onSubmittingChange?: (v: boolean) => void;
  toast: React.RefObject<Toast>;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function CycleCountForm({
  cycleCount,
  warehouses,
  formId = "cycle-count-form",
  onSave,
  onSubmittingChange,
  toast,
}: CycleCountFormProps) {
  const [items, setItems] = useState<any[]>([]);
  const [itemsStock, setItemsStock] = useState<Record<string, number>>({});
  const [itemsLocation, setItemsLocation] = useState<Record<string, string | null>>({});
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [selectionMode, setSelectionMode] = useState<SelectionMode>("manual");
  const [randomCount, setRandomCount] = useState(10);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  useEffect(() => { setMounted(true); }, []);

  // ── Form ──────────────────────────────────────────────────────────────────

  const { control, handleSubmit, watch, setValue, formState: { errors } } =
    useForm<CreateCycleCountInput>({
      resolver: zodResolver(createCycleCountSchema),
      mode: "onBlur",
      defaultValues: {
        warehouseId: cycleCount?.warehouseId || "",
        items: cycleCount?.items || [],
        notes: cycleCount?.notes || "",
      },
    });

  const selectedWarehouseId = watch("warehouseId");
  const { fields, append, remove, replace, move } = useFieldArray({ control, name: "items" });

  // ── Load stock on warehouse change ────────────────────────────────────────

  useEffect(() => {
    if (!selectedWarehouseId) {
      setItems([]);
      setItemsStock({});
      setItemsLocation({});
      return;
    }

    const loadStock = async () => {
      try {
        setInitialLoading(true);
        const response = await stockService.getByWarehouse(selectedWarehouseId);
        const stocks = response.data || [];

        const stockMap: Record<string, number> = {};
        const locationMap: Record<string, string | null> = {};
        stocks.forEach((s: any) => {
          stockMap[s.itemId] = s.quantityReal;
          locationMap[s.itemId] = s.location ?? null;
        });

        setItems(stocks.map((s: any) => s.item));
        setItemsStock(stockMap);
        setItemsLocation(locationMap);

        if (!cycleCount) {
          replace([]);
          setSelectionMode("manual");
        }
      } catch {
        toast.current?.show({ severity: "error", summary: "Error", detail: "Error al cargar stock del almacén", life: 3000 });
        setItems([]);
      } finally {
        setInitialLoading(false);
      }
    };

    loadStock();
  }, [selectedWarehouseId, cycleCount]);

  // ── AutoComplete search ───────────────────────────────────────────────────

  const handleSearch = (event: AutoCompleteCompleteEvent) => {
    const q = event.query.toLowerCase();
    setSuggestions(
      q
        ? items.filter((i) => i.sku?.toLowerCase().includes(q) || i.name?.toLowerCase().includes(q))
        : items
    );
  };

  const resolveItem = (val: any): any => {
    if (!val || typeof val !== "string") return val;
    return items.find((i) => i.id === val) ?? val;
  };

  // ── Selection modes ───────────────────────────────────────────────────────

  const applySelectionMode = () => {
    if (items.length === 0) return;

    let selected: any[] = [];

    switch (selectionMode) {
      case "all":
        selected = items;
        break;
      case "positive_stock":
        selected = items.filter((i) => (itemsStock[i.id] || 0) > 0);
        break;
      case "random": {
        const shuffled = [...items].sort(() => 0.5 - Math.random());
        selected = shuffled.slice(0, randomCount);
        break;
      }
      case "category":
        if (selectedCategories.length === 0) return;
        selected = items.filter((i) => i.category?.name && selectedCategories.includes(i.category.name));
        break;
      default:
        return;
    }

    // Sort by location so the route sheet follows physical order
    selected.sort((a, b) => {
      const locA = (itemsLocation[a.id] ?? "").toLowerCase();
      const locB = (itemsLocation[b.id] ?? "").toLowerCase();
      if (!itemsLocation[a.id] && itemsLocation[b.id]) return 1;
      if (itemsLocation[a.id] && !itemsLocation[b.id]) return -1;
      return locA.localeCompare(locB);
    });

    const formItems = selected.map((i) => ({
      itemId: i.id,
      expectedQuantity: itemsStock[i.id] || 0,
      location: itemsLocation[i.id] ?? undefined,
      notes: "",
    }));

    replace(formItems);
    toast.current?.show({ severity: "info", summary: "Selección Aplicada", detail: `${formItems.length} artículos agregados`, life: 2000 });
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const onSubmit = async (data: CreateCycleCountInput) => {
    if (onSubmittingChange) onSubmittingChange(true);
    try {
      if (cycleCount) {
        await cycleCountService.update(cycleCount.id, data);
      } else {
        await cycleCountService.create(data);
      }
      await onSave();
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      if (onSubmittingChange) onSubmittingChange(false);
    }
  };

  // ── Derived options ───────────────────────────────────────────────────────

  const warehouseOptions = warehouses.map((w) => ({ label: w.name, value: w.id }));
  const categoryOptions = [...new Set(items.map((i) => i.category?.name).filter(Boolean))].map((c) => ({ label: c, value: c }));

  // ── Render ────────────────────────────────────────────────────────────────

  if (initialLoading) {
    return (
      <div className="flex flex-column align-items-center justify-content-center p-6">
        <ProgressSpinner />
        <span className="mt-3 text-gray-600">Cargando inventario...</span>
      </div>
    );
  }

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)} className="p-fluid">

      {/* Header fields */}
      <div className="grid">
        <div className="col-12 md:col-6">
          <label className="block font-medium mb-2">Almacén *</label>
          <Controller
            name="warehouseId"
            control={control}
            render={({ field }) => (
              <Dropdown
                {...field}
                options={warehouseOptions}
                optionLabel="label"
                optionValue="value"
                placeholder="Seleccione almacén"
                className={classNames({ "p-invalid": errors.warehouseId })}
                disabled={!!cycleCount}
              />
            )}
          />
          {errors.warehouseId && <small className="p-error block">{errors.warehouseId.message}</small>}
        </div>

        <div className="col-12 md:col-6">
          <label className="block font-medium mb-2">Notas</label>
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <InputTextarea {...field} rows={1} autoResize placeholder="Referencia o motivo del conteo..." />
            )}
          />
        </div>
      </div>

      <Divider />

      {/* Selection toolbar */}
      <div className="surface-100 p-3 border-round mb-3">
        <div className="flex flex-wrap gap-3 align-items-center justify-content-between">
          <div className="flex flex-column gap-2">
            <span className="font-bold text-gray-700">Modo de Selección:</span>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(MODE_CONFIG) as SelectionMode[]).map((mode) => (
                <Button
                  key={mode}
                  type="button"
                  label={MODE_CONFIG[mode].label}
                  icon={MODE_CONFIG[mode].icon}
                  size="small"
                  outlined={selectionMode !== mode}
                  onClick={() => setSelectionMode(mode)}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2 align-items-center align-self-end">
            {selectionMode === "random" && (
              <InputNumber
                value={randomCount}
                onValueChange={(e) => setRandomCount(e.value || 10)}
                min={1}
                max={items.length}
                inputClassName="text-center p-1"
                style={{ width: "5rem" }}
                placeholder="Cant."
              />
            )}
            {selectionMode !== "manual" && selectionMode !== "category" && (
              <Button
                type="button"
                label="Aplicar Selección"
                icon="pi pi-check"
                severity="warning"
                size="small"
                onClick={applySelectionMode}
                disabled={!selectedWarehouseId}
              />
            )}
          </div>
        </div>

        {selectionMode === "category" && (
          <div className="flex flex-column gap-2 mt-3">
            <div className="flex gap-2 align-items-center">
              <MultiSelect
                value={selectedCategories}
                onChange={(e) => setSelectedCategories(e.value)}
                options={categoryOptions}
                placeholder="Seleccione categorías"
                filter
                maxSelectedLabels={1}
                selectedItemsLabel="{0} categorías"
                style={{ flex: 1 }}
              />
              <Button
                type="button"
                label="Aplicar"
                icon="pi pi-check"
                severity="warning"
                size="small"
                onClick={applySelectionMode}
                disabled={!selectedWarehouseId || selectedCategories.length === 0}
              />
            </div>
            {selectedCategories.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selectedCategories.map((cat) => (
                  <span
                    key={cat}
                    className="flex align-items-center gap-1 px-2 py-1 border-round text-xs"
                    style={{ backgroundColor: "var(--primary-100)", color: "var(--primary-700)", border: "1px solid var(--primary-200)" }}
                  >
                    {cat}
                    <i
                      className="pi pi-times cursor-pointer"
                      style={{ fontSize: "0.6rem" }}
                      onClick={() => setSelectedCategories((prev) => prev.filter((c) => c !== cat))}
                    />
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Items header */}
      <div className="flex justify-content-between align-items-center mb-2">
        <h3 className="text-lg font-semibold m-0">Artículos ({fields.length})</h3>
        {fields.length > 0 && (
          <Button type="button" label="Limpiar Todo" icon="pi pi-trash" severity="danger" text size="small" onClick={() => replace([])} />
        )}
      </div>

      {/* Items table */}
      <div className="grid">
        <ItemsTable
          fields={fields}
          append={append}
          remove={remove}
          move={move}
          defaultItem={{ itemId: "", expectedQuantity: 0 }}
          columns={COLUMNS}
          minWidth={520}
          renderRow={({ field, index, dragHandleProps, isDragging }) => {
            const watchedItemId = watch(`items.${index}.itemId`);
            const systemLocation = itemsLocation[watchedItemId] ?? null;
            return (
              <div
                key={field.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 8px",
                  borderBottom: "1px solid var(--surface-200)",
                  backgroundColor: isDragging ? "var(--highlight-bg, #eff6ff)" : undefined,
                  opacity: isDragging ? 0.75 : 1,
                  transition: "background 0.12s",
                }}
              >
                {/* Drag handle */}
                <div
                  style={{ ...COLS.handle, display: "flex", alignItems: "center", justifyContent: "center", cursor: "grab" }}
                  {...(dragHandleProps as React.HTMLAttributes<HTMLDivElement>)}
                >
                  <i className="pi pi-bars" style={{ color: "var(--text-color-secondary)", fontSize: "0.7rem" }} />
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
                          return item.name ? `${item.sku} — ${item.name}` : (item.sku || "");
                        }}
                        placeholder="SKU o Nombre..."
                        className={classNames("w-full", { "p-invalid": errors.items?.[index]?.itemId })}
                        inputClassName="w-full text-xs"
                        inputStyle={{ padding: "0.2rem 0.5rem", height: "30px", fontSize: "0.8rem", width: "100%" }}
                        style={{ height: "30px", width: "100%" }}
                        itemTemplate={(item: any) => {
                          const stock = itemsStock[item.id] || 0;
                          const loc = itemsLocation[item.id];
                          return (
                            <div className="flex justify-content-between align-items-center w-full gap-2">
                              <div className="flex flex-column overflow-hidden">
                                <span className="white-space-nowrap overflow-hidden text-overflow-ellipsis" style={{ fontSize: "0.85rem" }}>
                                  {item.sku} — {item.name}
                                </span>
                                {loc && (
                                  <span className="text-xs text-400 font-mono">
                                    <i className="pi pi-map-marker mr-1" />{loc}
                                  </span>
                                )}
                              </div>
                              <span className={`text-xs px-2 py-1 border-round flex-shrink-0 ${stock > 0 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                                {stock}
                              </span>
                            </div>
                          );
                        }}
                        onSelect={(e) => {
                          const item = e.value;
                          f.onChange(item.id);
                          setValue(`items.${index}.expectedQuantity`, itemsStock[item.id] ?? 0);
                          setValue(`items.${index}.location`, itemsLocation[item.id] ?? undefined);
                        }}
                        onChange={(e) => { if (typeof e.value === "string") f.onChange(e.value); }}
                        appendTo={mounted ? document.body : "self"}
                        forceSelection={false}
                        showEmptyMessage
                      />
                    )}
                  />
                  {errors.items?.[index]?.itemId && (
                    <small className="p-error" style={{ fontSize: "0.65rem" }}>
                      {errors.items[index]?.itemId?.message}
                    </small>
                  )}
                </div>

                {/* Ubicación (read-only) */}
                <div style={{ ...COLS.location, display: "flex", alignItems: "center" }}>
                  {systemLocation ? (
                    <div
                      className="flex align-items-center gap-1 px-2 border-round border-1 border-blue-200"
                      style={{ height: "30px", backgroundColor: "var(--blue-50)", overflow: "hidden" }}
                    >
                      <i className="pi pi-map-marker text-blue-500" style={{ fontSize: "0.75rem" }} />
                      <span style={{ fontSize: "0.78rem", fontFamily: "monospace", color: "var(--blue-700)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {systemLocation}
                      </span>
                    </div>
                  ) : (
                    <span style={{ fontSize: "0.8rem", color: "var(--text-color-secondary)", fontStyle: "italic" }}>—</span>
                  )}
                </div>

                {/* Stock Sistema (read-only) */}
                <div style={COLS.stock}>
                  <Controller
                    name={`items.${index}.expectedQuantity`}
                    control={control}
                    render={({ field: f }) => (
                      <InputNumber
                        value={f.value}
                        readOnly
                        className="w-full"
                        inputClassName="w-full text-center surface-100"
                        inputStyle={{ padding: "0.25rem 0.4rem", height: "30px", fontSize: "0.8rem" }}
                        style={{ height: "30px" }}
                      />
                    )}
                  />
                </div>

                {/* Remove */}
                <div style={{ ...COLS.remove, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Button
                    type="button"
                    icon="pi pi-times"
                    className="p-button-rounded p-button-danger p-button-text"
                    style={{ width: "1.5rem", height: "1.5rem" }}
                    onClick={() => remove(index)}
                    tooltip="Eliminar fila"
                    tooltipOptions={{ position: "top" }}
                  />
                </div>
              </div>
            );
          }}
        />
      </div>
    </form>
  );
}
