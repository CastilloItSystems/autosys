"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { AutoCompleteCompleteEvent } from "primereact/autocomplete";
import { Divider } from "primereact/divider";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Toast } from "primereact/toast";
import itemService, { Item } from "@/modules/inventory/items/services/itemService";
import searchService from "@/modules/inventory/search/services/searchService";
import supplierService from "@/modules/inventory/suppliers/services/supplierService";
import supplierBillService from "../services/supplierBillService";
import ItemsTable from "@/modules/inventory/common/ItemsTable";
import ItemRow, {
  ItemRowColWidths,
} from "@/modules/inventory/common/ItemRow";
import type {
  CreateSupplierBillData,
  SupplierBill,
  SupplierBillItemInput,
} from "../interfaces/supplierBill";
import { handleFormError } from "@/utils/errorHandlers";
import { useBcvRate } from "@/hooks/useBcvRate";

// ── Currency options ───────────────────────────────────────────────────────

const CURRENCY_OPTIONS = [
  { label: "USD - Dólar", value: "USD" },
  { label: "VES - Bolívar", value: "VES" },
  { label: "EUR - Euro", value: "EUR" },
];

// ── Column widths ──────────────────────────────────────────────────────────

const COLS: ItemRowColWidths = {
  handle: { width: "1.75rem", flexShrink: 0 },
  product: { width: "10rem", flexShrink: 0 },
  itemName: { flex: "1 1 0", minWidth: "9rem" },
  quantity: { width: "5.5rem", flexShrink: 0 },
  unitCost: { width: "8rem", flexShrink: 0 },
  discountPercent: { width: "5rem", flexShrink: 0 },
  taxType: { width: "7rem", flexShrink: 0 },
  totalLine: { width: "8rem", flexShrink: 0 },
  remove: { width: "1.75rem", flexShrink: 0 },
};

// ── Price conversion (same logic as OrderForm) ─────────────────────────────
// costPrice on items is stored in USD. Convert to target currency.

function convertCostFromUsd(
  costUsd: number,
  currency: string,
  usdVesRate: number | null, // Bs per 1 USD
  currencyVesRate: number | null | undefined, // Bs per 1 EUR (only for EUR)
): number {
  if (!costUsd) return 0;
  if (currency === "VES" && usdVesRate && usdVesRate > 0) {
    return Math.round(costUsd * usdVesRate * 100) / 100;
  }
  if (
    currency === "EUR" &&
    usdVesRate &&
    currencyVesRate &&
    currencyVesRate > 0
  ) {
    return Math.round(((costUsd * usdVesRate) / currencyVesRate) * 100) / 100;
  }
  return costUsd; // USD — no conversion needed
}

// ── Line calculation ───────────────────────────────────────────────────────

interface SupplierBillFormItem extends SupplierBillItemInput {
  subtotal?: number;
  discountAmount?: number;
  taxAmount?: number;
  totalLine?: number;
}

function taxRateFor(type?: string, currentRate?: number) {
  if (type === "EXEMPT") return 0;
  if (type === "REDUCED") return currentRate ?? 8;
  return currentRate ?? 16;
}

function calculateLine(item: SupplierBillFormItem) {
  const quantity = Number(item.quantity || 0);
  const unitCost = Number(item.unitCost || 0);
  const discountPercent = Number(item.discountPercent || 0);
  const taxType = item.taxType ?? "IVA";
  const taxRate = taxRateFor(taxType, item.taxRate);
  const gross = quantity * unitCost;
  const discountAmount = Number((gross * (discountPercent / 100)).toFixed(2));
  const subtotal = Number((gross - discountAmount).toFixed(2));
  const taxAmount = Number((subtotal * (taxRate / 100)).toFixed(2));
  const totalLine = Number((subtotal + taxAmount).toFixed(2));
  return { subtotal, discountAmount, taxAmount, totalLine, taxRate };
}

// ── Props ──────────────────────────────────────────────────────────────────

interface SupplierBillFormValues extends Omit<CreateSupplierBillData, "items"> {
  items: SupplierBillFormItem[];
}

interface Props {
  bill?: SupplierBill | null;
  purchaseOrderId?: string;
  supplierId?: string;
  onSave: () => void | Promise<void>;
  formId?: string;
  onSubmittingChange?: (v: boolean) => void;
  toast: React.RefObject<Toast>;
}

// ── Component ──────────────────────────────────────────────────────────────

export default function SupplierBillForm({
  bill,
  purchaseOrderId,
  supplierId,
  onSave,
  formId,
  onSubmittingChange,
  toast,
}: Props) {
  const [suppliers, setSuppliers] = useState<
    { label: string; value: string }[]
  >([]);
  const [items, setItems] = useState<Item[]>([]);
  const [itemSuggestions, setItemSuggestions] = useState<any[]>([]);
  const [availablePOs, setAvailablePOs] = useState<any[]>([]);
  const [selectedItemsMap, setSelectedItemsMap] = useState<Record<string, any>>(
    () => {
      const map: Record<string, any> = {};
      bill?.items?.forEach((line) => {
        if (line.item) map[line.item.id] = line.item;
      });
      return map;
    },
  );

  const isEditing = !!bill;

  const { control, handleSubmit, register, watch, setValue } =
    useForm<SupplierBillFormValues>({
      mode: "onBlur",
      defaultValues: {
        billNumber: bill?.billNumber ?? "",
        supplierId: bill?.supplierId ?? supplierId ?? "",
        purchaseOrderId: bill?.purchaseOrderId ?? purchaseOrderId ?? undefined,
        currency: bill?.currency ?? "USD",
        exchangeRate: bill?.exchangeRate ?? undefined,
        subtotal: bill ? Number(bill.subtotal) : 0,
        taxAmount: bill ? Number(bill.taxAmount) : 0,
        total: bill ? Number(bill.total) : 0,
        issueDate: bill?.issueDate
          ? bill.issueDate.split("T")[0]
          : new Date().toISOString().split("T")[0],
        dueDate: bill?.dueDate ? bill.dueDate.split("T")[0] : undefined,
        notes: bill?.notes ?? "",
        items: bill?.items?.map((line) => ({
          itemId: line.itemId ?? undefined,
          itemName: line.itemName ?? line.item?.name ?? "",
          quantity: Number(line.quantity || 1),
          unitCost: Number(line.unitCost || 0),
          discountPercent: Number(line.discountPercent || 0),
          taxType: line.taxType ?? "IVA",
          taxRate: Number(line.taxRate || 16),
          subtotal: Number(line.subtotal || 0),
          taxAmount: Number(line.taxAmount || 0),
          totalLine: Number(line.totalLine || 0),
          notes: line.notes ?? "",
        })) ?? [
          {
            itemId: "",
            itemName: "",
            quantity: 1,
            unitCost: 0,
            discountPercent: 0,
            taxType: "IVA",
            taxRate: 16,
            totalLine: 0,
          },
        ],
      },
    });

  const { fields, append, remove, move, replace } = useFieldArray({
    control,
    name: "items",
  });

  const watchedItems = useWatch({ control, name: "items" }) ?? [];
  const selectedPOId = watch("purchaseOrderId");
  const currency = (watch("currency") || "USD") as "USD" | "EUR" | "VES";
  const watchExchangeRate = watch("exchangeRate");

  // ── BCV rates (same pattern as OrderForm) ─────────────────────────────────
  const { rate: bcvRate, loading: bcvLoading } = useBcvRate(currency);
  const { rate: referenceUsdRate } = useBcvRate("USD"); // always Bs/USD
  const { rate: referenceEurRate } = useBcvRate("EUR"); // always Bs/EUR
  const prevCurrencyRef = useRef<string | undefined>(undefined);
  const prevRateRef = useRef<number | undefined>(undefined);

  // Auto-fill exchangeRate + reconvert item prices when currency changes
  useEffect(() => {
    const prev = prevCurrencyRef.current;
    const oldRate = prevRateRef.current; // rate that was active before this render
    const currencyChanged = prev !== undefined && prev !== currency;
    prevCurrencyRef.current = currency;

    const autoRate =
      currency === "VES"
        ? referenceUsdRate && referenceUsdRate > 1
          ? referenceUsdRate
          : bcvRate
        : currency === "EUR"
        ? referenceEurRate && referenceEurRate > 0
          ? referenceEurRate
          : bcvRate
        : bcvRate;

    if (autoRate && autoRate > 0 && (currencyChanged || !watchExchangeRate)) {
      setValue("exchangeRate", autoRate, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }

    if (currencyChanged) {
      const currentItems = (watch("items") || []) as SupplierBillFormItem[];
      currentItems.forEach((item, idx) => {
        const currentCost = Number(item.unitCost || 0);
        if (currentCost === 0) return;

        // Back-convert current price to USD using old currency + old rate
        let usdCost: number;
        if (!prev || prev === "USD") {
          usdCost = currentCost;
        } else if (prev === "VES" && oldRate && oldRate > 0) {
          usdCost = currentCost / oldRate;
        } else if (
          prev === "EUR" &&
          oldRate &&
          oldRate > 0 &&
          referenceUsdRate &&
          referenceUsdRate > 0
        ) {
          usdCost = (currentCost * oldRate) / referenceUsdRate;
        } else {
          usdCost = currentCost;
        }

        const newCost = convertCostFromUsd(
          usdCost,
          currency,
          currency === "VES" ? autoRate ?? referenceUsdRate : referenceUsdRate,
          currency === "EUR" ? autoRate ?? referenceEurRate : referenceEurRate,
        );
        if (Math.abs(newCost - currentCost) > 0.001) {
          setValue(`items.${idx}.unitCost`, newCost);
        }
      });
    }
  }, [currency, bcvRate, referenceUsdRate, referenceEurRate]); // eslint-disable-line react-hooks/exhaustive-deps

  // Capture the current exchange rate AFTER each render so currency-change effect
  // can read the OLD rate on next run (before the new rate is applied).
  // MUST be placed AFTER the currency-change effect above.
  useEffect(() => {
    prevRateRef.current = watchExchangeRate;
  });

  // ── Load form data ─────────────────────────────────────────────────────────

  useEffect(() => {
    Promise.all([
      supplierService.getAll({ isActive: "true", limit: 200 }),
      itemService.getActive(),
      supplierBillService.getAvailablePurchaseOrders(),
    ])
      .then(([suppliersRes, itemsRes, poRes]) => {
        setSuppliers(
          (suppliersRes.data ?? []).map((s: any) => ({
            label: s.name,
            value: s.id,
          })),
        );
        setItems(itemsRes.data ?? []);
        setAvailablePOs(poRes.data ?? []);
      })
      .catch(() => {});
  }, []);

  // ── Auto-fill from PO ──────────────────────────────────────────────────────

  useEffect(() => {
    if (isEditing || !selectedPOId) return;
    const po = availablePOs.find((row) => row.id === selectedPOId);
    if (!po) return;

    setValue("supplierId", po.supplierId);
    setValue("currency", po.currency ?? "USD");
    setValue("exchangeRate", po.exchangeRate ?? undefined);
    setValue("notes", `Factura asociada a OC ${po.orderNumber}`);

    const itemMap: Record<string, any> = {};
    const lines = (po.items ?? []).map((line: any) => {
      if (line.item) itemMap[line.itemId] = line.item;
      const quantity =
        Number(line.quantityReceived || 0) > 0
          ? Number(line.quantityReceived)
          : Number(line.quantityOrdered || 1);
      const calculated = calculateLine({
        quantity,
        unitCost: Number(line.unitCost || 0),
        discountPercent: Number(line.discountPercent || 0),
        taxType: line.taxType ?? "IVA",
        taxRate: Number(line.taxRate || 16),
      });
      return {
        itemId: line.itemId,
        itemName: line.itemName || line.item?.name || "",
        quantity,
        unitCost: Number(line.unitCost || 0),
        discountPercent: Number(line.discountPercent || 0),
        taxType: line.taxType ?? "IVA",
        ...calculated,
      };
    });

    setSelectedItemsMap((prev) => ({ ...prev, ...itemMap }));
    replace(lines.length ? lines : []);
  }, [availablePOs, isEditing, replace, selectedPOId, setValue]);

  // ── Recalculate totals on item change ──────────────────────────────────────

  useEffect(() => {
    let subtotal = 0,
      taxAmount = 0,
      total = 0;
    watchedItems.forEach((line, index) => {
      const calculated = calculateLine(line);
      subtotal += calculated.subtotal;
      taxAmount += calculated.taxAmount;
      total += calculated.totalLine;
      if (line.taxRate !== calculated.taxRate)
        setValue(`items.${index}.taxRate`, calculated.taxRate, {
          shouldDirty: true,
        });
      if (line.totalLine !== calculated.totalLine)
        setValue(`items.${index}.totalLine`, calculated.totalLine, {
          shouldDirty: true,
        });
    });
    setValue("subtotal", Number(subtotal.toFixed(2)));
    setValue("taxAmount", Number(taxAmount.toFixed(2)));
    setValue("total", Number(total.toFixed(2)));
  }, [setValue, watchedItems]);

  // ── Options ────────────────────────────────────────────────────────────────

  const poOptions = useMemo(
    () =>
      availablePOs.map((po) => ({
        label: `${po.orderNumber} - ${po.supplier?.name || "Sin proveedor"}`,
        value: po.id,
      })),
    [availablePOs],
  );

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

  const onSearchItems = async (event: AutoCompleteCompleteEvent) => {
    try {
      const res = await searchService.search({
        query: event.query,
        page: 1,
        limit: 15,
        filters: { isActive: true },
      });
      setItemSuggestions(res.data || []);
    } catch {
      setItemSuggestions([]);
    }
  };

  const itemSuggestionTemplate = useCallback(
    (item: any) => {
      const sym = currency === "VES" ? "Bs." : currency === "EUR" ? "€" : "$";
      const costUsd = Number(item.costPrice || 0);
      const displayCost = convertCostFromUsd(
        costUsd,
        currency,
        currency === "VES"
          ? watchExchangeRate ?? referenceUsdRate
          : referenceUsdRate,
        currency === "EUR"
          ? watchExchangeRate ?? referenceEurRate
          : referenceEurRate,
      );
      return (
        <div className="flex align-items-center justify-content-between gap-2">
          <div className="flex flex-column">
            <span className="font-bold text-sm">{item.name}</span>
            <span className="text-xs text-600">
              {item.sku || item.code || ""}
            </span>
          </div>
          <div className="flex flex-column align-items-end">
            <span className="font-semibold text-primary text-sm">
              {sym}{" "}
              {displayCost.toLocaleString("es-VE", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            {currency !== "USD" && costUsd > 0 && (
              <span className="text-xs text-400">
                $ {costUsd.toFixed(2)} USD
              </span>
            )}
          </div>
        </div>
      );
    },
    [currency, watchExchangeRate, referenceUsdRate, referenceEurRate],
  );

  // ── Totals ─────────────────────────────────────────────────────────────────

  const totals = [
    { label: "Subtotal", value: watch("subtotal") || 0 },
    { label: "IVA", value: watch("taxAmount") || 0 },
    { label: "Total", value: watch("total") || 0, highlight: true },
  ];

  // ── Exchange rate label ────────────────────────────────────────────────────

  const rateLabel =
    currency === "VES"
      ? "Tasa ref. Bs./USD"
      : currency === "EUR"
      ? "Tasa Bs./EUR"
      : "Tasa Bs./USD";

  // ── Submit ─────────────────────────────────────────────────────────────────

  const onSubmit = async (data: SupplierBillFormValues) => {
    if (onSubmittingChange) onSubmittingChange(true);
    try {
      const payload = {
        ...data,
        items: data.items.map((line) => ({
          itemId: line.itemId || null,
          itemName: line.itemName || null,
          quantity: Number(line.quantity || 0),
          unitCost: Number(line.unitCost || 0),
          discountPercent: Number(line.discountPercent || 0),
          taxType: line.taxType || "IVA",
          taxRate: Number(line.taxRate || 0),
          notes: line.notes || null,
        })),
      };
      if (bill) {
        await supplierBillService.update(bill.id, payload);
      } else {
        await supplierBillService.create(payload);
      }
      await onSave();
    } catch (err) {
      handleFormError(err, toast);
    } finally {
      if (onSubmittingChange) onSubmittingChange(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <form
      id={formId || "supplier-bill-form"}
      onSubmit={handleSubmit(onSubmit)}
      className="p-fluid"
    >
      <div className="grid">
        {/* ══ Datos de la factura ══════════════════════════════════════ */}
        <div className="col-12 md:col-4 field">
          <label className="block mb-1 font-medium">Orden de compra</label>
          <Controller
            name="purchaseOrderId"
            control={control}
            render={({ field }) => (
              <Dropdown
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={poOptions}
                placeholder="OC sin factura asociada"
                filter
                showClear
                disabled={isEditing}
              />
            )}
          />
        </div>

        <div className="col-12 md:col-4 field">
          <label className="block mb-1 font-medium">Proveedor *</label>
          <Controller
            name="supplierId"
            control={control}
            rules={{ required: "Requerido" }}
            render={({ field }) => (
              <Dropdown
                {...field}
                options={suppliers}
                placeholder="Seleccionar..."
                filter
                disabled={!!bill || !!supplierId || !!selectedPOId}
              />
            )}
          />
        </div>

        <div className="col-12 md:col-4 field">
          <label className="block mb-1 font-medium">
            # Factura proveedor *
          </label>
          <Controller
            name="billNumber"
            control={control}
            rules={{ required: "Requerido" }}
            render={({ field }) => (
              <InputText
                {...field}
                value={field.value ?? ""}
                placeholder="Nro. de control"
              />
            )}
          />
        </div>

        <div className="col-12 md:col-3 field">
          <label className="block mb-1 font-medium">Fecha emisión *</label>
          <Controller
            name="issueDate"
            control={control}
            rules={{ required: "Requerido" }}
            render={({ field }) => <InputText {...field} type="date" />}
          />
        </div>

        <div className="col-12 md:col-3 field">
          <label className="block mb-1 font-medium">Fecha vencimiento</label>
          <Controller
            name="dueDate"
            control={control}
            render={({ field }) => (
              <InputText {...field} value={field.value ?? ""} type="date" />
            )}
          />
        </div>

        {/* ══ Moneda y tasa ═══════════════════════════════════════════ */}
        <div className="col-12 md:col-3 field">
          <label className="block mb-1 font-medium">Moneda *</label>
          <Controller
            name="currency"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <Dropdown
                {...field}
                options={CURRENCY_OPTIONS}
                disabled={!!selectedPOId}
                onChange={(e) => {
                  field.onChange(e.value);
                  // Immediate rate fill on dropdown change
                  const newCur = e.value as "USD" | "EUR" | "VES";
                  const rate =
                    newCur === "VES"
                      ? referenceUsdRate ?? bcvRate
                      : newCur === "EUR"
                      ? referenceEurRate ?? bcvRate
                      : bcvRate;
                  if (rate && rate > 0) {
                    setValue("exchangeRate", rate, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }
                }}
              />
            )}
          />
        </div>

        <div className="col-12 md:col-3 field">
          <label className="block mb-1 font-medium flex align-items-center gap-2">
            {rateLabel}
            {bcvLoading && (
              <i className="pi pi-spin pi-spinner text-xs text-500" />
            )}
            {!bcvLoading && bcvRate && bcvRate > 1 && (
              <span className="text-xs text-green-600 font-normal">
                BCV:{" "}
                {bcvRate.toLocaleString("es-VE", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 4,
                })}
              </span>
            )}
          </label>
          <Controller
            name="exchangeRate"
            control={control}
            render={({ field }) => (
              <InputNumber
                value={field.value ?? null}
                onValueChange={(e) => field.onChange(e.value ?? undefined)}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={4}
                placeholder={
                  bcvLoading
                    ? "Cargando BCV..."
                    : `Bs. por 1 ${currency === "VES" ? "USD" : currency}`
                }
              />
            )}
          />
        </div>

        {/* ══ Items ════════════════════════════════════════════════════ */}
        <div className="col-12">
          <Divider align="left" className="my-1">
            <span className="p-tag p-tag-secondary text-xs">Items</span>
          </Divider>
        </div>

        <ItemsTable
          fields={fields}
          append={append}
          remove={remove}
          move={move}
          defaultItem={{
            itemId: "",
            itemName: "",
            quantity: 1,
            unitCost: 0,
            discountPercent: 0,
            taxType: "IVA",
            taxRate: 16,
            totalLine: 0,
          }}
          title="Items de la factura"
          totals={totals}
          currency={currency}
          exchangeRate={watchExchangeRate}
          columns={[
            { label: "", style: COLS.handle },
            { label: "Producto", style: COLS.product },
            { label: "Nombre", style: COLS.itemName! },
            { label: "Cant.", style: COLS.quantity },
            { label: "Costo", style: COLS.unitCost! },
            { label: "Desc.", style: COLS.discountPercent! },
            { label: "Impuesto", style: COLS.taxType! },
            { label: "Total", style: COLS.totalLine! },
            { label: "", style: COLS.remove },
          ]}
          renderRow={({
            index,
            onAddRow,
            dragHandleProps,
            isDragging,
            autoFocus,
          }) => (
            <ItemRow
              control={control}
              register={register}
              autoFocus={autoFocus}
              itemOptions={itemOptions}
              fieldPaths={{
                itemId: `items.${index}.itemId`,
                itemName: `items.${index}.itemName`,
                quantity: `items.${index}.quantity`,
                unitCost: `items.${index}.unitCost`,
                discountPercent: `items.${index}.discountPercent`,
                taxType: `items.${index}.taxType`,
                totalLine: `items.${index}.totalLine`,
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
              currency={currency}
              identityLocked={!!selectedPOId}
              onItemChange={(itemId) => {
                const item =
                  itemSuggestions.find((r) => r.id === itemId) ||
                  items.find((r) => r.id === itemId);
                if (!item) return;
                setValue(`items.${index}.itemName`, item.name);
                setSelectedItemsMap((prev) => ({ ...prev, [itemId]: item }));

                // Convert costPrice (USD) → target currency
                const costUsd = Number(item.costPrice || 0);
                if (costUsd > 0) {
                  const converted = convertCostFromUsd(
                    costUsd,
                    currency,
                    currency === "VES"
                      ? watchExchangeRate ?? referenceUsdRate
                      : referenceUsdRate,
                    currency === "EUR"
                      ? watchExchangeRate ?? referenceEurRate
                      : referenceEurRate,
                  );
                  setValue(`items.${index}.unitCost`, converted);
                }
              }}
            />
          )}
        />

        {/* ══ Notas ════════════════════════════════════════════════════ */}
        <div className="col-12 field">
          <label className="block mb-1 font-medium">Notas</label>
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <InputTextarea
                {...field}
                value={field.value ?? ""}
                rows={3}
                autoResize
              />
            )}
          />
        </div>
      </div>
    </form>
  );
}
