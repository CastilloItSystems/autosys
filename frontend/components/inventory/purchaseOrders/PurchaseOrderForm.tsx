"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { classNames } from "primereact/utils";
import {
  purchaseOrderSchema,
  PurchaseOrderFormData,
} from "@/libs/zods/inventory";
import purchaseOrderService from "@/app/api/inventory/purchaseOrderService";
import { Toast } from "primereact/toast";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { Checkbox } from "primereact/checkbox";
import { handleFormError } from "@/utils/errorHandlers";
import ItemsTable from "../common/ItemsTable";
import ItemRow, { ItemRowColWidths } from "../common/ItemRow";
import { OrderFinancialSummary } from "../common/OrderFinancialSummary";
import searchService from "@/app/api/inventory/searchService";
import { useBcvRate } from "@/hooks/useBcvRate";
import { useOrderCalculation } from "@/hooks/useOrderCalculation";
import { AutoCompleteCompleteEvent } from "primereact/autocomplete";
import type { PurchaseOrder } from "@/libs/interfaces/inventory";
import type { Item } from "@/app/api/inventory/itemService";
import type { Supplier } from "@/app/api/inventory/supplierService";
import type { Warehouse } from "@/app/api/inventory/warehouseService";

const COLS: ItemRowColWidths = {
  handle: { width: "1.75rem", flexShrink: 0 },
  product: { width: "12rem", flexShrink: 0 },
  quantity: { width: "5.5rem", flexShrink: 0 },
  unitCost: { width: "8rem", flexShrink: 0 },
  discountPercent: { width: "6rem", flexShrink: 0 },
  taxType: { width: "7rem", flexShrink: 0 },
  totalLine: { width: "8rem", flexShrink: 0 },
  remove: { width: "1.75rem", flexShrink: 0 },
};

/* Props */
interface PurchaseOrderFormProps {
  purchaseOrder: PurchaseOrder | null;
  formId?: string;
  onSave: () => void | Promise<void>;
  onSubmittingChange?: (isSubmitting: boolean) => void;
  toast: React.RefObject<Toast> | null;
  items: Item[];
  suppliers: Supplier[];
  warehouses: Warehouse[];
}

const PurchaseOrderForm = ({
  purchaseOrder,
  formId,
  onSave,
  onSubmittingChange,
  toast,
  items,
  suppliers,
  warehouses,
}: PurchaseOrderFormProps) => {
  const isEditing = !!purchaseOrder;
  const isDraft = !purchaseOrder || purchaseOrder.status === "DRAFT";
  const [itemSuggestions, setItemSuggestions] = useState<any[]>([]);
  const [selectedItemsMap, setSelectedItemsMap] = useState<Record<string, any>>(
    () => {
      if (purchaseOrder?.items) {
        const map: Record<string, any> = {};
        for (const row of purchaseOrder.items) {
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

  const {
    handleSubmit,
    formState: { errors },
    control,
    watch,
    register,
    setValue,
  } = useForm<PurchaseOrderFormData>({
    resolver: zodResolver(purchaseOrderSchema),
    mode: "onBlur",
    defaultValues: {
      supplierId: purchaseOrder?.supplierId || "",
      warehouseId: purchaseOrder?.warehouseId || "",
      currency: purchaseOrder?.currency || "USD",
      exchangeRate: purchaseOrder?.exchangeRate || null,
      paymentTerms: purchaseOrder?.paymentTerms || null,
      creditDays: purchaseOrder?.creditDays || null,
      deliveryTerms: purchaseOrder?.deliveryTerms || null,
      discountAmount: purchaseOrder?.discountAmount || 0,
      igtfApplies: purchaseOrder?.igtfApplies || false,
      notes: purchaseOrder?.notes || "",
      expectedDate: purchaseOrder?.expectedDate
        ? new Date(purchaseOrder.expectedDate)
        : undefined,
      items: purchaseOrder?.items?.map((i) => ({
        itemId: i.itemId,
        quantityOrdered: i.quantityOrdered,
        unitCost: i.unitCost,
        discountPercent: i.discountPercent ?? 0,
        taxType: i.taxType ?? "IVA",
      })) || [
        {
          itemId: "",
          quantityOrdered: 1,
          unitCost: 0,
          discountPercent: 0,
          taxType: "IVA",
        },
      ],
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "items",
  });

  const watchItems = watch("items");
  const watchCurrency = watch("currency");
  const watchExchangeRate = watch("exchangeRate");
  const watchDiscountAmount = watch("discountAmount");
  const watchIgtfApplies = watch("igtfApplies");

  const { rate: bcvRate, loading: loadingBcv } = useBcvRate(
    watchCurrency as "USD" | "EUR" | "VES",
  );

  useEffect(() => {
    if (
      !isEditing &&
      bcvRate &&
      watchCurrency === "VES" &&
      !watchExchangeRate
    ) {
      setValue("exchangeRate", bcvRate, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [bcvRate, watchCurrency, watchExchangeRate, isEditing, setValue]);

  // Serialize watched items to detect deep changes (watch returns same reference)
  const watchItemsSerialized = JSON.stringify(watchItems);

  // Transform items for the calculation hook
  const calcItems = useMemo(() => {
    const parsed = JSON.parse(watchItemsSerialized);
    return parsed.map((it: any) => ({
      quantityOrdered: Number(it.quantityOrdered || 0),
      unitCost: Number(it.unitCost || 0),
      discountPercent: Number(it.discountPercent || 0),
      taxType: it.taxType || "IVA",
    }));
  }, [watchItemsSerialized]);

  const calcResult = useOrderCalculation(
    calcItems,
    Number(watchDiscountAmount || 0),
    Boolean(watchIgtfApplies),
  );

  // Sync calculated totalLine back to form
  useEffect(() => {
    if (calcResult?.items) {
      calcResult.items.forEach((calcItem, idx) => {
        setValue(`items.${idx}.totalLine`, calcItem.totalLine, {
          shouldDirty: false,
        });
      });
    }
  }, [calcResult, setValue]);

  /* Search items via autocomplete */
  const onSearchItems = useCallback(
    async (event: AutoCompleteCompleteEvent) => {
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
    },
    [],
  );

  const itemSuggestionTemplate = useCallback(
    (item: any) => (
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
    ),
    [],
  );

  /* Submit */
  const onSubmit = async (data: PurchaseOrderFormData) => {
    if (onSubmittingChange) onSubmittingChange(true);
    try {
      const payload = {
        supplierId: data.supplierId,
        warehouseId: data.warehouseId,
        currency: data.currency,
        exchangeRate: data.exchangeRate,
        paymentTerms: data.paymentTerms || undefined,
        creditDays: data.creditDays,
        deliveryTerms: data.deliveryTerms || undefined,
        discountAmount: data.discountAmount,
        igtfApplies: data.igtfApplies,
        notes: data.notes || undefined,
        expectedDate: data.expectedDate
          ? new Date(data.expectedDate).toISOString()
          : undefined,
        items: data.items.map((item) => ({
          itemId: item.itemId,
          quantityOrdered: item.quantityOrdered,
          unitCost: item.unitCost,
          discountPercent: item.discountPercent,
          taxType: item.taxType,
        })),
      };

      if (isEditing && purchaseOrder) {
        // Partial edit support can be added here
      } else {
        await purchaseOrderService.create(payload);
        await onSave();
      }
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      if (onSubmittingChange) onSubmittingChange(false);
    }
  };

  /* Opciones de dropdowns */
  const itemOptions = useMemo(
    () =>
      items.map((item) => ({
        label:
          item.sku || item.code
            ? `${item.sku || item.code} - ${item.name}`
            : item.name,
        value: item.id,
      })),
    [items],
  );

  const supplierOptions = useMemo(
    () =>
      suppliers.map((s) => ({
        label: s.code ? `${s.code} - ${s.name}` : s.name,
        value: s.id,
      })),
    [suppliers],
  );

  const warehouseOptions = useMemo(
    () =>
      warehouses.map((w) => ({
        label: `${w.code} - ${w.name}`,
        value: w.id,
      })),
    [warehouses],
  );

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)}>
      {/* Header descriptivo opcional */}
      {!isDraft && isEditing && (
        <div className="mb-3 p-3 bg-orange-100 border-round">
          <p className="text-orange-700 text-sm m-0">
            <i className="pi pi-exclamation-triangle mr-2 font-bold"></i>
            Solo se pueden editar órdenes en estado <strong>Borrador</strong>
          </p>
        </div>
      )}

      {/* Body */}
      <div className="grid formgrid row-gap-2">
        {/* Proveedor */}
        <div className="field col-12 md:col-4">
          <label
            htmlFor="supplierId"
            className="block text-900 font-medium mb-2"
          >
            Proveedor <span className="text-red-500">*</span>
          </label>
          <Controller
            name="supplierId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="supplierId"
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={supplierOptions}
                placeholder="Seleccione un proveedor"
                filter
                disabled={!isDraft}
                className={classNames("w-full", {
                  "p-invalid": errors.supplierId,
                })}
              />
            )}
          />
          {errors.supplierId && (
            <small className="p-error">{errors.supplierId.message}</small>
          )}
        </div>

        {/* Almacén */}
        <div className="field col-12 md:col-4">
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
                placeholder="Seleccione un almacén"
                filter
                disabled={!isDraft}
                className={classNames("w-full", {
                  "p-invalid": errors.warehouseId,
                })}
              />
            )}
          />
          {errors.warehouseId && (
            <small className="p-error">{errors.warehouseId.message}</small>
          )}
        </div>

        {/* Fecha esperada */}
        <div className="field col-12 md:col-4">
          <label
            htmlFor="expectedDate"
            className="block text-900 font-medium mb-2"
          >
            Fecha Estimada de Entrega
          </label>
          <Controller
            name="expectedDate"
            control={control}
            render={({ field }) => (
              <Calendar
                id="expectedDate"
                value={field.value ? new Date(field.value as string) : null}
                onChange={(e) => field.onChange(e.value)}
                dateFormat="dd/mm/yy"
                showIcon
                minDate={new Date()}
                className={classNames("w-full", {
                  "p-invalid": errors.expectedDate,
                })}
              />
            )}
          />
        </div>

        {/* Moneda */}
        <div className="field col-12 md:col-2">
          <label htmlFor="currency" className="block text-900 font-medium mb-2">
            Moneda
          </label>
          <Controller
            name="currency"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="currency"
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={[
                  { label: "USD", value: "USD" },
                  { label: "VES", value: "VES" },
                  { label: "EUR", value: "EUR" },
                ]}
                disabled={!isDraft}
                className={classNames("w-full", {
                  "p-invalid": errors.currency,
                })}
              />
            )}
          />
        </div>

        {/* Tasa de Cambio */}
        <div className="field col-12 md:col-2">
          <label
            htmlFor="exchangeRate"
            className="block text-900 font-medium mb-2"
          >
            Tasa de Cambio{" "}
            {loadingBcv && <i className="pi pi-spin pi-spinner text-sm ml-2" />}
          </label>
          <Controller
            name="exchangeRate"
            control={control}
            render={({ field }) => (
              <InputNumber
                id="exchangeRate"
                value={field.value ?? undefined}
                onValueChange={(e) => field.onChange(e.value)}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={4}
                disabled={!isDraft}
                className={classNames("w-full", {
                  "p-invalid": errors.exchangeRate,
                })}
              />
            )}
          />
        </div>

        {/* Términos de Pago */}
        <div className="field col-12 md:col-3">
          <label
            htmlFor="paymentTerms"
            className="block text-900 font-medium mb-2"
          >
            Términos de Pago
          </label>
          <Controller
            name="paymentTerms"
            control={control}
            render={({ field }) => (
              <InputText
                id="paymentTerms"
                value={field.value || ""}
                onChange={(e) => field.onChange(e.target.value)}
                disabled={!isDraft}
                className="w-full"
                placeholder="Ej. Contado, 15 días"
              />
            )}
          />
        </div>

        {/* Días de Crédito */}
        <div className="field col-12 md:col-2">
          <label
            htmlFor="creditDays"
            className="block text-900 font-medium mb-2"
          >
            Días de Crédito
          </label>
          <Controller
            name="creditDays"
            control={control}
            render={({ field }) => (
              <InputNumber
                id="creditDays"
                value={field.value ?? undefined}
                onValueChange={(e) => field.onChange(e.value)}
                min={0}
                disabled={!isDraft}
                className="w-full"
              />
            )}
          />
        </div>

        {/* Términos de Entrega */}
        <div className="field col-12 md:col-3">
          <label
            htmlFor="deliveryTerms"
            className="block text-900 font-medium mb-2"
          >
            Términos de Entrega
          </label>
          <Controller
            name="deliveryTerms"
            control={control}
            render={({ field }) => (
              <InputText
                id="deliveryTerms"
                value={field.value || ""}
                onChange={(e) => field.onChange(e.target.value)}
                disabled={!isDraft}
                className="w-full"
                placeholder="Ej. EXW, FOB"
              />
            )}
          />
        </div>

        {/* Descuento Global */}
        <div className="field col-12 md:col-3">
          <label
            htmlFor="discountAmount"
            className="block text-900 font-medium mb-2"
          >
            Descuento General ($)
          </label>
          <Controller
            name="discountAmount"
            control={control}
            render={({ field }) => (
              <InputNumber
                id="discountAmount"
                value={field.value ?? undefined}
                onValueChange={(e) => field.onChange(e.value)}
                mode="currency"
                currency="USD"
                min={0}
                disabled={!isDraft}
                className="w-full"
              />
            )}
          />
        </div>

        {/* Aplica IGTF */}
        <div className="field col-12 md:col-3 flex align-items-center mt-4">
          <Controller
            name="igtfApplies"
            control={control}
            render={({ field }) => (
              <div className="flex align-items-center">
                <Checkbox
                  inputId="igtfApplies"
                  checked={field.value || false}
                  onChange={(e) => field.onChange(e.checked)}
                  disabled={!isDraft}
                />
                <label
                  htmlFor="igtfApplies"
                  className="ml-2 font-medium text-900"
                >
                  Aplica IGTF (3%)
                </label>
              </div>
            )}
          />
        </div>

        {/* Notas */}
        <div className="field col-12">
          <label htmlFor="notes" className="block text-900 font-medium mb-2">
            Notas / Observaciones
          </label>
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <InputTextarea
                id="notes"
                value={field.value || ""}
                onChange={(e) => field.onChange(e.target.value)}
                rows={2}
                autoResize
                className="w-full"
                placeholder="Observaciones para la orden..."
              />
            )}
          />
        </div>

        {/* Items */}
        <ItemsTable
          fields={fields}
          append={append}
          remove={remove}
          move={move}
          defaultItem={{
            itemId: "",
            quantityOrdered: 1,
            unitCost: 0,
            discountPercent: 0,
            taxType: "IVA",
          }}
          title="Artículos"
          disabled={!isDraft}
          columns={[
            { label: "", style: COLS.handle },
            { label: "Producto (SKU)", style: COLS.product },
            { label: "Cant.", style: COLS.quantity },
            { label: "Costo Unit.", style: COLS.unitCost! },
            { label: "Desc. %", style: COLS.discountPercent! },
            { label: "Impuesto", style: COLS.taxType! },
            { label: "Total", style: COLS.totalLine! },
            { label: "", style: COLS.remove },
          ]}
          renderRow={({ index, onAddRow, dragHandleProps, isDragging }) => (
            <ItemRow
              control={control}
              register={register}
              rowErrors={(errors.items as any)?.[index]}
              itemOptions={itemOptions.map((opt) => ({
                label: opt.label,
                value: opt.value,
              }))}
              fieldPaths={{
                itemId: `items.${index}.itemId`,
                itemName: `items.${index}.itemId`,
                quantity: `items.${index}.quantityOrdered`,
                unitCost: `items.${index}.unitCost`,
                discountPercent: `items.${index}.discountPercent`,
                taxType: `items.${index}.taxType`,
                totalLine: `items.${index}.totalLine`, // Solo lectura en el componente si se envía
              }}
              colWidths={COLS}
              onRemove={() => remove(index)}
              canRemove={fields.length > 1}
              onAddRow={onAddRow}
              dragHandleProps={dragHandleProps}
              isDragging={isDragging}
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

        {/* Resumen Financiero */}
        <div className="col-12 md:col-6 md:col-offset-6 mt-4">
          <OrderFinancialSummary
            totals={calcResult}
            currencySymbol={
              watchCurrency === "VES"
                ? "Bs "
                : watchCurrency === "EUR"
                ? "€ "
                : "$ "
            }
          />
        </div>
      </div>
    </form>
  );
};

export default PurchaseOrderForm;
