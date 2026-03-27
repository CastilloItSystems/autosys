"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { InputTextarea } from "primereact/inputtextarea";
import ItemsTable from "../common/ItemsTable";
import ItemRow, { ItemRowColWidths } from "../common/ItemRow";
import { Divider } from "primereact/divider";
import { Toast } from "primereact/toast";

/** Column widths — shared between the ItemsTable header and each ItemRow cell */
const COLS: ItemRowColWidths = {
  handle: { width: "1.75rem", flexShrink: 0 },
  product: { width: "12rem", flexShrink: 0 },
  itemName: { flex: "1 1 0", minWidth: "8rem" },
  quantity: { width: "5.5rem", flexShrink: 0 },
  unitCost: { width: "8rem", flexShrink: 0 },
  location: { width: "6rem", flexShrink: 0 },
  batch: { width: "5.5rem", flexShrink: 0 },
  remove: { width: "1.75rem", flexShrink: 0 },
};

import {
  createEntryNoteSchema,
  CreateEntryNoteInput,
} from "@/libs/zods/inventory/entryNoteZod";
import type {
  EntryNote,
  EntryType,
} from "@/libs/interfaces/inventory/entryNote.interface";
import { ENTRY_TYPE_LABELS } from "@/libs/interfaces/inventory/entryNote.interface";
import { Item } from "@/app/api/inventory/itemService";
import { Warehouse } from "@/app/api/inventory/warehouseService";
import { Supplier } from "@/app/api/inventory/supplierService";
import purchaseOrderService from "@/app/api/inventory/purchaseOrderService";
import searchService from "@/app/api/inventory/searchService";
import { AutoCompleteCompleteEvent } from "primereact/autocomplete";
import entryNoteService, {
  CreateEntryNotePayload,
} from "@/app/api/inventory/entryNoteService";
import { handleFormError } from "@/utils/errorHandlers";

interface EntryNoteFormProps {
  entryNote?: EntryNote | null;
  formId?: string;
  onSave: () => void | Promise<void>;
  onSubmittingChange?: (isSubmitting: boolean) => void;
  toast: React.RefObject<Toast> | null;
  items: Item[];
  warehouses: Warehouse[];
  suppliers: Supplier[];
}

export default function EntryNoteForm({
  entryNote,
  formId,
  onSave,
  onSubmittingChange,
  toast,
  items,
  warehouses,
  suppliers,
}: EntryNoteFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [loadingPOs, setLoadingPOs] = useState(false);
  const [itemSuggestions, setItemSuggestions] = useState<any[]>([]);
  // Map of itemId → item object for all selected items (persists across searches)
  const [selectedItemsMap, setSelectedItemsMap] = useState<Record<string, any>>(
    () => {
      // Pre-populate map when editing so existing rows resolve correctly
      if (entryNote?.items) {
        const map: Record<string, any> = {};
        for (const row of entryNote.items) {
          // Use the nested item object first (comes from API with sku, name, etc.)
          if ((row as any).item) {
            map[row.itemId] = (row as any).item;
          } else {
            // Fallback: try to find in the catalog
            const found = items.find((i) => i.id === row.itemId);
            if (found) {
              map[row.itemId] = found;
            }
          }
        }
        return map;
      }
      return {};
    },
  );

  const isEditing = !!entryNote;

  const {
    control,
    handleSubmit,
    register,
    formState: { errors },
    watch,
    setValue,
  } = useForm<CreateEntryNoteInput>({
    resolver: zodResolver(createEntryNoteSchema),
    mode: "onBlur",
    defaultValues: entryNote
      ? {
          type: entryNote.type as EntryType,
          warehouseId: entryNote.warehouseId,
          purchaseOrderId: entryNote.purchaseOrderId || undefined,
          catalogSupplierId: entryNote.catalogSupplierId || undefined,
          supplierName: entryNote.supplierName || undefined,
          supplierId: entryNote.supplierId || undefined,
          supplierPhone: entryNote.supplierPhone || undefined,
          reason: entryNote.reason || undefined,
          reference: entryNote.reference || undefined,
          notes: entryNote.notes || undefined,
          receivedBy: entryNote.receivedBy || undefined,
          authorizedBy: entryNote.authorizedBy || undefined,
          items: Array.isArray(entryNote.items)
            ? entryNote.items.map((i) => ({
                itemId: i.itemId,
                itemName: i.itemName || "",
                quantityReceived: i.quantityReceived,
                unitCost: Number(i.unitCost),
                storedToLocation: i.storedToLocation || undefined,
                batchNumber: i.batchNumber || undefined,
                notes: i.notes || undefined,
              }))
            : [{ itemId: "", itemName: "", quantityReceived: 1, unitCost: 0 }],
        }
      : {
          type: "PURCHASE" as EntryType,
          items: [
            { itemId: "", itemName: "", quantityReceived: 1, unitCost: 0 },
          ],
        },
  });

  const { fields, append, remove, replace, move } = useFieldArray({
    control,
    name: "items",
  });

  const selectedType = watch("type");
  const selectedPOId = watch("purchaseOrderId");
  const selectedSupplierId = watch("catalogSupplierId");

  // Load POs on mount
  useEffect(() => {
    const fetchPOs = async () => {
      setLoadingPOs(true);
      try {
        const res = await purchaseOrderService.getAll({
          limit: 100,
          // Only orders that can receive items
        });
        setPurchaseOrders(res.data || []);
      } catch (error) {
        console.error("Error fetching POs:", error);
      } finally {
        setLoadingPOs(false);
      }
    };
    fetchPOs();
  }, []);

  // When PO changes, auto-fill supplier and items
  useEffect(() => {
    if (isEditing || !selectedPOId) return;

    const po = purchaseOrders.find((p) => p.id === selectedPOId);
    if (po) {
      // Auto-select supplier if exists in catalog
      if (po.supplierId) {
        setValue("catalogSupplierId", po.supplierId);
        // Snapshots will be filled by the supplier useEffect
      } else {
        setValue("supplierName", po.supplier?.name || "");
      }

      // Pre-fill items from PO
      if (Array.isArray(po.items)) {
        // Register PO items in the map so they resolve correctly
        const newMap: Record<string, any> = {};
        const poItems = po.items.map((item: any) => {
          // Try to find item in catalog to get full data (sku, etc.)
          const catalogItem = items.find((i) => i.id === item.itemId);
          if (catalogItem) {
            newMap[item.itemId] = catalogItem;
          } else if (item.item) {
            newMap[item.itemId] = item.item;
          }
          return {
            itemId: item.itemId,
            itemName: item.item?.name || "",
            quantityReceived: Math.max(
              0,
              (item.quantityOrdered || 0) - (item.quantityReceived || 0),
            ),
            unitCost: Number(item.unitCost || 0),
            storedToLocation: "",
            batchNumber: "",
            _maxQuantity:
              (item.quantityOrdered || 0) - (item.quantityReceived || 0),
          };
        });
        if (Object.keys(newMap).length > 0) {
          setSelectedItemsMap((prev) => ({ ...prev, ...newMap }));
        }
        replace(poItems);
      }
    }
  }, [selectedPOId, purchaseOrders, isEditing, setValue, replace]);

  // When Supplier changes, fill snapshots
  useEffect(() => {
    if (isEditing || !selectedSupplierId) return;

    const supplier = suppliers.find((s) => s.id === selectedSupplierId);
    if (supplier) {
      setValue("supplierName", supplier.name);
      setValue("supplierId", supplier.taxId || "");
      setValue("supplierPhone", supplier.phone || "");
    }
  }, [selectedSupplierId, suppliers, isEditing, setValue]);

  // Sync itemName when itemId changes in rows
  const watchedItems = watch("items");
  useEffect(() => {
    watchedItems.forEach((row, index) => {
      if (row.itemId && !row.itemName) {
        const item = items.find((i) => i.id === row.itemId);
        if (item) {
          setValue(`items.${index}.itemName`, item.name);
        }
      }
    });
  }, [watchedItems, items, setValue]);

  // When type changes, reset items if not editing
  useEffect(() => {
    if (isEditing) return;
    if (selectedType !== "PURCHASE") {
      setValue("purchaseOrderId", null);
    }
    // replace([{ itemId: "", itemName: "", quantityReceived: 1, unitCost: 0 }]);
  }, [selectedType, isEditing, setValue]);

  /* ── Options ── */
  const warehouseOptions = useMemo(
    () =>
      warehouses.map((w) => ({
        label: `${w.code} - ${w.name}`,
        value: w.id,
      })),
    [warehouses],
  );

  const itemOptions = useMemo(
    () =>
      items.map((i) => ({
        label: i.sku || i.code ? `${i.sku || i.code} - ${i.name}` : i.name,
        value: i.id,
      })),
    [items],
  );

  const typeOptions = useMemo(
    () =>
      (Object.keys(ENTRY_TYPE_LABELS) as EntryType[]).map((t) => ({
        label: ENTRY_TYPE_LABELS[t],
        value: t,
      })),
    [],
  );

  /** Get item name from items array */
  const getItemName = useCallback(
    (itemId: string) => {
      const item = items.find((i) => i.id === itemId);
      return item
        ? item.sku || item.code
          ? `${item.sku || item.code} - ${item.name}`
          : item.name
        : "";
    },
    [items],
  );

  const supplierOptions = useMemo(
    () =>
      suppliers.map((s) => ({
        label: `${s.name} (${s.taxId || "S/R"})`,
        value: s.id,
      })),
    [suppliers],
  );

  const poOptions = useMemo(
    () =>
      purchaseOrders.map((po) => ({
        label: `${po.orderNumber} - ${po.supplier?.name || "Sin proveedor"}`,
        value: po.id,
      })),
    [purchaseOrders],
  );

  const onSearchItems = async (event: AutoCompleteCompleteEvent) => {
    try {
      const res = await searchService.search({
        query: event.query,
        page: 1,
        limit: 15,
        filters: { isActive: true },
      });
      setItemSuggestions(res.data || []);
    } catch (error) {
      console.error("Error searching items:", error);
      setItemSuggestions([]);
    }
  };

  const itemSuggestionTemplate = (item: any) => {
    return (
      <div className="flex align-items-center justify-content-between gap-2">
        <div className="flex flex-column">
          <span className="font-bold text-sm">{item.name}</span>
          <span className="text-xs text-600">
            {item.sku || item.code ? `${item.sku || item.code} - ` : ""}
            {item.categoryName || ""}
          </span>
        </div>
        <span className="font-semibold text-primary text-sm">
          ${item.salePrice}
        </span>
      </div>
    );
  };

  /* ── Totals (optional footer) ── */
  const subtotal =
    watchedItems?.reduce(
      (acc, it) => acc + (it.quantityReceived ?? 0) * (it.unitCost ?? 0),
      0,
    ) ?? 0;
  const totalsLines =
    subtotal > 0
      ? [{ label: "Subtotal", value: subtotal, highlight: true }]
      : undefined;

  /* ── Submit ── */
  const onSubmit = async (data: CreateEntryNoteInput) => {
    setSubmitting(true);
    if (onSubmittingChange) onSubmittingChange(true);
    try {
      if (isEditing) {
        const { items: itemsData, ...headerData } = data;

        await entryNoteService.update(entryNote!.id, {
          ...headerData,
          catalogSupplierId: headerData.catalogSupplierId || null,
          supplierName: headerData.supplierName || null,
          supplierId: headerData.supplierId || null,
          supplierPhone: headerData.supplierPhone || null,
          reason: headerData.reason || null,
          reference: headerData.reference || null,
          notes: headerData.notes || null,
          receivedBy: headerData.receivedBy || null,
          authorizedBy: headerData.authorizedBy || null,
          items: itemsData.map((item) => ({
            itemId: item.itemId,
            itemName: item.itemName,
            quantityReceived: item.quantityReceived,
            unitCost: item.unitCost,
            storedToLocation: item.storedToLocation || null,
            batchNumber: item.batchNumber || null,
            notes: item.notes || null,
          })),
        } as any);
      } else {
        // ── Create EntryNote + add items ──
        const { items: itemsData, ...headerData } = data;

        const payload: CreateEntryNotePayload = {
          ...headerData,
          type: headerData.type as EntryType,
          purchaseOrderId: headerData.purchaseOrderId || null,
          catalogSupplierId: headerData.catalogSupplierId || null,
          supplierName: headerData.supplierName || null,
          supplierId: headerData.supplierId || null,
          supplierPhone: headerData.supplierPhone || null,
          reason: headerData.reason || null,
          reference: headerData.reference || null,
          notes: headerData.notes || null,
          receivedBy: headerData.receivedBy || null,
          authorizedBy: headerData.authorizedBy || null,
        };

        const result = await entryNoteService.create(payload);
        const createdNote = result.data;

        for (const item of itemsData) {
          await entryNoteService.addItem(createdNote.id, {
            itemId: item.itemId,
            itemName: item.itemName,
            quantityReceived: item.quantityReceived,
            unitCost: item.unitCost,
            storedToLocation: item.storedToLocation || null,
            batchNumber: item.batchNumber || null,
            expiryDate: null,
            notes: item.notes || null,
          });
        }
      }

      await onSave();
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setSubmitting(false);
      if (onSubmittingChange) onSubmittingChange(false);
    }
  };

  return (
    <form
      id={formId || "entry-note-form"}
      onSubmit={handleSubmit(onSubmit)}
      className="p-fluid"
    >
      <div className="grid">
        {/* ══ 1. ENCABEZADO ═══════════════════════════════════════════════ */}
        <div className="col-12 md:col-4 field">
          <label htmlFor="type" className="block text-900 font-medium mb-2">
            Tipo de Entrada <span className="text-red-500">*</span>
          </label>
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="type"
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={typeOptions}
                optionLabel="label"
                optionValue="value"
                className={errors.type ? "p-invalid" : ""}
                disabled={isEditing}
              />
            )}
          />
          {errors.type && (
            <small className="p-error">{errors.type.message}</small>
          )}
        </div>

        <div className="col-12 md:col-4 field">
          <label
            htmlFor="warehouseId"
            className="block text-900 font-medium mb-2"
          >
            Almacén Destino <span className="text-red-500">*</span>
          </label>
          <Controller
            name="warehouseId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="warehouseId"
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={warehouseOptions}
                optionLabel="label"
                optionValue="value"
                placeholder="Seleccione almacén"
                className={errors.warehouseId ? "p-invalid" : ""}
              />
            )}
          />
          {errors.warehouseId && (
            <small className="p-error">{errors.warehouseId.message}</small>
          )}
        </div>

        <div className="col-12 md:col-4 field">
          <label
            htmlFor="reference"
            className="block text-900 font-medium mb-2"
          >
            Referencia
          </label>
          <InputText
            id="reference"
            {...register("reference")}
            placeholder="Nro. factura, guía, OC, etc."
          />
        </div>

        {/* ══ 2. RECEPCIÓN ════════════════════════════════════════════════ */}
        <div className="col-12">
          <Divider align="left" className="my-0">
            <span className="p-tag p-tag-secondary text-xs">Recepción</span>
          </Divider>
        </div>

        <div className="col-12 md:col-4 field">
          <label
            htmlFor="receivedBy"
            className="block text-900 font-medium mb-2"
          >
            Recibido Por
          </label>
          <InputText
            id="receivedBy"
            {...register("receivedBy")}
            placeholder="Nombre de quien recibe"
          />
        </div>

        <div className="col-12 md:col-4 field">
          <label htmlFor="reason" className="block text-900 font-medium mb-2">
            Motivo / Razón
          </label>
          <InputText
            id="reason"
            {...register("reason")}
            placeholder="Motivo de la entrada"
          />
        </div>

        {selectedType === "PURCHASE" && (
          <div className="col-12 md:col-4 field">
            <label
              htmlFor="purchaseOrderId"
              className="block text-900 font-medium mb-2"
            >
              Orden de Compra
            </label>
            <Controller
              name="purchaseOrderId"
              control={control}
              render={({ field }) => (
                <Dropdown
                  id="purchaseOrderId"
                  value={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  options={poOptions}
                  optionLabel="label"
                  optionValue="value"
                  placeholder={
                    loadingPOs ? "Cargando..." : "Seleccione OC (opcional)"
                  }
                  filter
                  showClear
                  disabled={isEditing}
                />
              )}
            />
          </div>
        )}

        {(selectedType === "DONATION" || selectedType === "SAMPLE") && (
          <div className="col-12 md:col-4 field">
            <label
              htmlFor="authorizedBy"
              className="block text-900 font-medium mb-2"
            >
              Autorizado Por <span className="text-red-500">*</span>
            </label>
            <InputText
              id="authorizedBy"
              {...register("authorizedBy")}
              placeholder="Nombre de quien autoriza"
              className={errors.authorizedBy ? "p-invalid" : ""}
            />
            {errors.authorizedBy && (
              <small className="p-error">{errors.authorizedBy.message}</small>
            )}
          </div>
        )}

        {/* ══ 3. PROVEEDOR / ORIGEN ═══════════════════════════════════════ */}
        <div className="col-12">
          <Divider align="left" className="my-0">
            <span className="p-tag p-tag-secondary text-xs">
              Proveedor / Origen
            </span>
          </Divider>
        </div>

        <div className="col-12 md:col-4 field">
          <label
            htmlFor="catalogSupplierId"
            className="block text-900 font-medium mb-2"
          >
            Nombre del Proveedor
          </label>
          <Controller
            name="catalogSupplierId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="catalogSupplierId"
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={supplierOptions}
                optionLabel="label"
                optionValue="value"
                placeholder="Seleccione proveedor del catálogo"
                filter
                showClear
                className={errors.catalogSupplierId ? "p-invalid" : ""}
                disabled={!!selectedPOId}
              />
            )}
          />
        </div>

        {/* Hidden Snapshots (Auto-filled) */}
        <input type="hidden" {...register("supplierName")} />
        <input type="hidden" {...register("supplierId")} />
        <input type="hidden" {...register("supplierPhone")} />

        {/* ── 4. ARTÍCULOS ──────────────────────────────────────────────────── */}
        <ItemsTable
          fields={fields}
          append={append}
          remove={remove}
          move={move}
          defaultItem={{
            itemId: "",
            itemName: "",
            quantityReceived: 1,
            unitCost: 0,
          }}
          title="Artículos a Recibir"
          totals={totalsLines}
          columns={[
            { label: "", style: COLS.handle },
            { label: "Producto (SKU)", style: COLS.product },
            { label: "Nombre en Registro", style: COLS.itemName! },
            { label: "Cant.", style: COLS.quantity },
            { label: "Costo Unit.", style: COLS.unitCost! },
            { label: "Ubicación", style: COLS.location! },
            { label: "Lote", style: COLS.batch! },
            { label: "", style: COLS.remove },
          ]}
          renderRow={({ index, onAddRow, dragHandleProps, isDragging, autoFocus }) => (
            <ItemRow
              control={control}
              register={register}
              autoFocus={autoFocus}
              rowErrors={(errors.items as any)?.[index]}
              itemOptions={itemOptions}
              fieldPaths={{
                itemId: `items.${index}.itemId`,
                itemName: `items.${index}.itemName`,
                quantity: `items.${index}.quantityReceived`,
                unitCost: `items.${index}.unitCost`,
                location: `items.${index}.storedToLocation`,
                batch: `items.${index}.batchNumber`,
              }}
              colWidths={COLS}
              onRemove={() => remove(index)}
              canRemove={fields.length > 1}
              onAddRow={onAddRow}
              dragHandleProps={dragHandleProps}
              isDragging={isDragging}
              locationPlaceholder="Ej: A-12"
              suggestions={itemSuggestions}
              onSearch={onSearchItems}
              itemTemplate={itemSuggestionTemplate}
              items={items}
              selectedItemsMap={selectedItemsMap}
              onItemChange={(itemId) => {
                const item =
                  itemSuggestions.find((i) => i.id === itemId) ||
                  items.find((i) => i.id === itemId);
                if (item) {
                  // Pre-fill location based on item.location if available
                  setValue(
                    `items.${index}.storedToLocation`,
                    item.location || "",
                  );

                  setValue(`items.${index}.itemName`, item.name);
                  // Persist the selected item so it can be resolved even after suggestions change
                  setSelectedItemsMap((prev) => ({ ...prev, [itemId]: item }));
                }
              }}
            />
          )}
        />

        {errors.items && typeof errors.items.message === "string" && (
          <div className="col-12">
            <small className="p-error">{errors.items.message}</small>
          </div>
        )}

        {/* ── 5. OBSERVACIONES ─────────────────────────────────────────────── */}
        <div className="col-12 field my-0">
          <label htmlFor="notes" className="block text-900 font-medium mb-2">
            Observaciones
          </label>
          <InputTextarea
            id="notes"
            {...register("notes")}
            rows={3}
            autoResize
            placeholder="Notas adicionales"
            className={errors.notes ? "p-invalid" : ""}
          />
          {errors.notes && (
            <small className="p-error">{errors.notes.message}</small>
          )}
        </div>

        {/* NOTE: Action buttons are rendered by the parent Dialog footer (per list/form standard) */}
      </div>
    </form>
  );
}
