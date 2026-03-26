"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { InputTextarea } from "primereact/inputtextarea";
import { InputSwitch } from "primereact/inputswitch";
import { Divider } from "primereact/divider";
import { Toast } from "primereact/toast";
import { AutoCompleteCompleteEvent } from "primereact/autocomplete";

import ItemsTable from "@/components/inventory/common/ItemsTable";
import ItemRow, {
  ItemRowColWidths,
} from "@/components/inventory/common/ItemRow";
import { OrderFinancialSummary } from "@/components/inventory/common/OrderFinancialSummary";

import {
  createOrderSchema,
  CreateOrderInput,
} from "@/libs/zods/sales/orderZod";
import {
  Order,
  OrderCurrency,
  ORDER_CURRENCY_LABELS,
  TAX_TYPE_OPTIONS,
} from "@/libs/interfaces/sales/order.interface";
import { Item } from "@/app/api/inventory/itemService";
import { Warehouse } from "@/app/api/inventory/warehouseService";
import { Customer } from "@/app/api/sales/customerService";
import orderService from "@/app/api/sales/orderService";
import searchService from "@/app/api/inventory/searchService";
import { handleFormError } from "@/utils/errorHandlers";
import { useBcvRate } from "@/hooks/useBcvRate";
import { useOrderCalculation } from "@/hooks/useOrderCalculation";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import customerService from "@/app/api/sales/customerService";
import CustomerForm from "@/components/sales/customer/CustomerForm";
import FormActionButtons from "@/components/common/FormActionButtons";

/** Column widths */
const COLS: ItemRowColWidths = {
  handle: { width: "1.75rem", flexShrink: 0 },
  product: { width: "12rem", flexShrink: 0 },
  itemName: { flex: "1 1 0", minWidth: 0 },
  quantity: { width: "5rem", flexShrink: 0 },
  unitCost: { width: "6rem", flexShrink: 0 },
  discountPercent: { width: "4.5rem", flexShrink: 0 },
  taxType: { width: "6rem", flexShrink: 0 },
  totalLine: { width: "6rem", flexShrink: 0 },
  remove: { width: "1.75rem", flexShrink: 0 },
};

interface OrderFormProps {
  order?: Order | null;
  formId?: string;
  onSave: () => void | Promise<void>;
  onSubmittingChange?: (isSubmitting: boolean) => void;
  toast: React.RefObject<Toast> | null;
  items: Item[];
  warehouses: Warehouse[];
  customers: Customer[];
}

export default function OrderForm({
  order,
  formId,
  onSave,
  onSubmittingChange,
  toast,
  items,
  warehouses,
  customers,
}: OrderFormProps) {
  const isEditing = !!order;
  const [localCustomers, setLocalCustomers] = useState<Customer[]>(customers);
  const [customerDialog, setCustomerDialog] = useState(false);
  const [isCustomerSubmitting, setIsCustomerSubmitting] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [itemSuggestions, setItemSuggestions] = useState<any[]>([]);
  const [selectedItemsMap, setSelectedItemsMap] = useState<Record<string, any>>(
    () => {
      if (order?.items) {
        const map: Record<string, any> = {};
        for (const row of order.items) {
          if (row.item) {
            map[row.itemId] = row.item;
          } else {
            const found = items.find((i) => i.id === row.itemId);
            if (found) map[row.itemId] = found;
          }
        }
        return map;
      }
      return {};
    },
  );

  const {
    control,
    handleSubmit,
    register,
    formState: { errors },
    watch,
    setValue,
  } = useForm<CreateOrderInput>({
    resolver: zodResolver(createOrderSchema),
    mode: "onBlur",
    defaultValues: order
      ? {
          customerId: order.customerId,
          warehouseId: order.warehouseId,
          currency: order.currency || "USD",
          exchangeRate: order.exchangeRate || undefined,
          exchangeRateSource: order.exchangeRateSource || undefined,
          paymentTerms: order.paymentTerms || undefined,
          creditDays: order.creditDays || undefined,
          deliveryTerms: order.deliveryTerms || undefined,
          discountAmount: Number(order.discountAmount) || 0,
          igtfApplies: order.igtfApplies || false,
          taxRate: Number(order.taxRate) || 16,
          igtfRate: Number(order.igtfRate) || 3,
          notes: order.notes || undefined,
          items: order.items.map((i) => ({
            itemId: i.itemId,
            itemName: i.itemName || i.item?.name || "",
            quantity: i.quantity,
            unitPrice: Number(i.unitPrice),
            discountPercent: Number(i.discountPercent) || 0,
            taxType: (i.taxType as "IVA" | "EXEMPT" | "REDUCED") || "IVA",
            totalLine: Number(i.totalLine) || 0,
          })),
        }
      : {
          currency: "USD",
          discountAmount: 0,
          igtfApplies: false,
          taxRate: 16,
          igtfRate: 3,
          items: [
            {
              itemId: "",
              itemName: "",
              quantity: 1,
              unitPrice: 0,
              discountPercent: 0,
              taxType: "IVA" as const,
            },
          ],
        },
  });

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "items",
  });

  const watchItems = watch("items");
  const watchDiscount = watch("discountAmount") || 0;
  const watchIgtf = watch("igtfApplies") || false;
  const watchCurrency = watch("currency");

  /* ── BCV Rate ── */
  const { rate: bcvRate, loading: bcvLoading } = useBcvRate();

  /* ── Real-time calculation ── */
  const watchItemsSerialized = JSON.stringify(watchItems);
  const calcItems = useMemo(
    () =>
      (watchItems || []).map((item) => ({
        quantityOrdered: item.quantity || 0,
        unitCost: item.unitPrice || 0,
        discountPercent: item.discountPercent || 0,
        taxType: (item.taxType as "IVA" | "EXEMPT" | "REDUCED") || "IVA",
      })),
    [watchItemsSerialized],
  );
  const calcResult = useOrderCalculation(
    calcItems,
    watchDiscount,
    watchIgtf,
    16,
    3,
  );

  /* ── Sync totalLine back to form fields ── */
  useEffect(() => {
    if (calcResult?.items) {
      calcResult.items.forEach((itemCalc, index) => {
        if (watchItems?.[index]) {
          setValue(`items.${index}.totalLine`, itemCalc.totalLine);
        }
      });
    }
  }, [calcResult]);

  /* ── Options ── */
  const customerOptions = useMemo(
    () =>
      localCustomers.map((c) => ({
        label: `${c.name} (${c.taxId || c.code})`,
        value: c.id,
      })),
    [localCustomers],
  );

  const handleCustomerCreated = async (created?: any) => {
    setCustomerDialog(false);
    if (created?.id) {
      setLocalCustomers((prev) => [...prev, created]);
      setValue("customerId", created.id);
    } else {
      setLoadingCustomers(true);
      try {
        const res = await customerService.getActive();
        setLocalCustomers(Array.isArray(res?.data) ? res.data : []);
      } finally {
        setLoadingCustomers(false);
      }
    }
  };

  const customerFooter = (
    <div className="p-2 border-top-1 surface-border">
      <Button
        label="Nuevo cliente"
        icon="pi pi-plus"
        text
        size="small"
        type="button"
        className="w-full justify-content-start"
        onClick={() => setCustomerDialog(true)}
      />
    </div>
  );

  const warehouseOptions = useMemo(
    () =>
      warehouses.map((w) => ({
        label: `${w.code} - ${w.name}`,
        value: w.id,
      })),
    [warehouses],
  );

  const currencyOptions = useMemo(
    () =>
      Object.entries(ORDER_CURRENCY_LABELS).map(([value, label]) => ({
        label,
        value,
      })),
    [],
  );

  const itemOptions = useMemo(
    () =>
      items.map((i) => ({
        label: i.sku || i.code ? `${i.sku || i.code} - ${i.name}` : i.name,
        value: i.id,
      })),
    [items],
  );

  /* ── Search ── */
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
      } catch {
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

  /* ── Submit ── */
  const onSubmit = async (data: CreateOrderInput) => {
    if (onSubmittingChange) onSubmittingChange(true);
    try {
      const payload = {
        customerId: data.customerId,
        warehouseId: data.warehouseId,
        currency: data.currency,
        exchangeRate: data.exchangeRate || undefined,
        exchangeRateSource: data.exchangeRateSource || undefined,
        paymentTerms: data.paymentTerms || undefined,
        creditDays: data.creditDays || undefined,
        deliveryTerms: data.deliveryTerms || undefined,
        discountAmount: data.discountAmount || 0,
        igtfApplies: data.igtfApplies || false,
        taxRate: data.taxRate || 16,
        igtfRate: data.igtfRate || 3,
        notes: data.notes || undefined,
        items: data.items.map((item) => {
          const mapped: Record<string, any> = {
            itemId: item.itemId,
            itemName: item.itemName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discountPercent: item.discountPercent || 0,
            taxType: item.taxType || "IVA",
          };
          if (item.notes) mapped.notes = item.notes;
          return mapped;
        }),
      };

      if (isEditing && order) {
        await orderService.update(order.id, payload);
      } else {
        await orderService.create(payload);
      }
      await onSave();
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      if (onSubmittingChange) onSubmittingChange(false);
    }
  };

  return (
    <>
      <form
        id={formId || "order-form"}
        onSubmit={handleSubmit(onSubmit)}
        className="p-fluid"
      >
        <div className="grid formgrid row-gap-2">
          {/* ══ 1. CLIENTE Y ALMACÉN ═════════════════════════════════════════ */}
          <div className="col-12 md:col-6 field">
            <label className="font-semibold">
              Cliente <span className="text-red-500">*</span>
            </label>
            <Controller
              name="customerId"
              control={control}
              render={({ field }) => (
                <Dropdown
                  id={field.name}
                  value={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  options={customerOptions}
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Seleccione cliente"
                  filter
                  loading={loadingCustomers}
                  panelFooterTemplate={customerFooter}
                  className={errors.customerId ? "p-invalid" : ""}
                />
              )}
            />
            {errors.customerId && (
              <small className="p-error">{errors.customerId.message}</small>
            )}
          </div>

          <div className="col-12 md:col-6 field">
            <label className="font-semibold">
              Almacén <span className="text-red-500">*</span>
            </label>
            <Controller
              name="warehouseId"
              control={control}
              render={({ field }) => (
                <Dropdown
                  id={field.name}
                  value={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  options={warehouseOptions}
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Seleccione almacén"
                  filter
                  className={errors.warehouseId ? "p-invalid" : ""}
                />
              )}
            />
            {errors.warehouseId && (
              <small className="p-error">{errors.warehouseId.message}</small>
            )}
          </div>

          {/* ══ 2. MONEDA Y CONDICIONES ══════════════════════════════════════ */}
          <div className="col-12">
            <Divider align="left" className="my-0">
              <span className="p-tag p-tag-secondary text-xs">
                Moneda y Condiciones
              </span>
            </Divider>
          </div>

          <div className="col-12 md:col-3 field">
            <label>Moneda</label>
            <Controller
              name="currency"
              control={control}
              render={({ field }) => (
                <Dropdown
                  id={field.name}
                  value={field.value}
                  onChange={(e) => {
                    field.onChange(e.value);
                    if (e.value !== "VES" && bcvRate) {
                      setValue("exchangeRate", bcvRate);
                      setValue("exchangeRateSource", "BCV_AUTO");
                    }
                  }}
                  options={currencyOptions}
                  optionLabel="label"
                  optionValue="value"
                />
              )}
            />
          </div>

          <div className="col-12 md:col-3 field">
            <label>Tasa BCV</label>
            <Controller
              name="exchangeRate"
              control={control}
              render={({ field }) => (
                <InputNumber
                  value={field.value}
                  onValueChange={(e) => {
                    field.onChange(e.value);
                    setValue("exchangeRateSource", "MANUAL");
                  }}
                  mode="decimal"
                  minFractionDigits={2}
                  maxFractionDigits={4}
                  placeholder={bcvLoading ? "Cargando..." : "Tasa"}
                  disabled={watchCurrency === "VES"}
                />
              )}
            />
          </div>

          <div className="col-12 md:col-3 field">
            <label>Condición de Pago</label>
            <InputText
              {...register("paymentTerms")}
              placeholder="Ej: Contado, Crédito 30 días"
            />
          </div>

          <div className="col-12 md:col-3 field">
            <label>Términos de Entrega</label>
            <InputText
              {...register("deliveryTerms")}
              placeholder="Ej: Puesto en almacén"
            />
          </div>

          {/* ══ 3. ARTÍCULOS ═════════════════════════════════════════════════ */}
          <ItemsTable
            fields={fields}
            append={append}
            remove={remove}
            move={move}
            defaultItem={{
              itemId: "",
              itemName: "",
              quantity: 1,
              unitPrice: 0,
              discountPercent: 0,
              taxType: "IVA",
            }}
            title="Artículos"
            columns={[
              { label: "", style: COLS.handle },
              { label: "Producto (SKU)", style: COLS.product },
              { label: "Nombre en Registro", style: COLS.itemName! },
              { label: "Cant.", style: COLS.quantity },
              { label: "Precio Unit.", style: COLS.unitCost },
              { label: "Desc. %", style: COLS.discountPercent! },
              { label: "Impuesto", style: COLS.taxType! },
              { label: "Total Línea", style: COLS.totalLine! },
              { label: "", style: COLS.remove },
            ]}
            renderRow={({ index, onAddRow, dragHandleProps, isDragging }) => (
              <ItemRow
                control={control}
                register={register}
                rowErrors={(errors.items as any)?.[index]}
                itemOptions={itemOptions}
                fieldPaths={{
                  itemId: `items.${index}.itemId`,
                  itemName: `items.${index}.itemName`,
                  quantity: `items.${index}.quantity`,
                  unitCost: `items.${index}.unitPrice`,
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
                onItemChange={(itemId) => {
                  const item =
                    itemSuggestions.find((i) => i.id === itemId) ||
                    items.find((i) => i.id === itemId);
                  if (item) {
                    setSelectedItemsMap((prev) => ({
                      ...prev,
                      [itemId]: item,
                    }));
                    setValue(`items.${index}.itemName`, item.name);
                    if (item.salePrice) {
                      setValue(
                        `items.${index}.unitPrice`,
                        Number(item.salePrice),
                      );
                    }
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

          {/* ══ 4. DESCUENTO GENERAL + IGTF ══════════════════════════════════ */}
          <div className="col-12 md:col-6 field">
            <label>Descuento General ($)</label>
            <Controller
              name="discountAmount"
              control={control}
              render={({ field }) => (
                <InputNumber
                  value={field.value}
                  onValueChange={(e) => field.onChange(e.value)}
                  mode="currency"
                  currency="USD"
                  locale="en-US"
                  min={0}
                />
              )}
            />
          </div>

          <div className="col-12 md:col-6 field">
            <div className="flex align-items-center gap-3 mt-4">
              <Controller
                name="igtfApplies"
                control={control}
                render={({ field }) => (
                  <InputSwitch
                    checked={field.value || false}
                    onChange={(e) => field.onChange(e.value)}
                  />
                )}
              />
              <div>
                <span className="font-semibold text-sm">
                  Pago en Divisas (IGTF 3%)
                </span>
                <div className="text-xs text-500">
                  Aplica impuesto a grandes transacciones financieras
                </div>
              </div>
            </div>
          </div>

          {/* ══ 5. RESUMEN FINANCIERO ════════════════════════════════════════ */}
          {calcResult && (
            <div className="col-12">
              <OrderFinancialSummary totals={calcResult} />
            </div>
          )}

          {/* ══ 6. OBSERVACIONES ═════════════════════════════════════════════ */}
          <div className="col-12 field my-0">
            <label>Observaciones</label>
            <InputTextarea
              {...register("notes")}
              rows={3}
              autoResize
              placeholder="Notas adicionales"
            />
          </div>
        </div>
      </form>

      <Dialog
        visible={customerDialog}
        onHide={() => setCustomerDialog(false)}
        header={
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-user mr-3 text-primary text-3xl"></i>
                Nuevo Cliente
              </h2>
            </div>
          </div>
        }
        style={{ width: "75vw" }}
        breakpoints={{ "1400px": "75vw", "900px": "85vw", "600px": "95vw" }}
        maximizable
        modal
        className="p-fluid"
        footer={
          <FormActionButtons
            formId="customer-form-inline"
            isUpdate={false}
            onCancel={() => setCustomerDialog(false)}
            isSubmitting={isCustomerSubmitting}
          />
        }
      >
        <CustomerForm
          customer={null}
          formId="customer-form-inline"
          onSave={() => {}}
          onCreated={handleCustomerCreated}
          onSubmittingChange={setIsCustomerSubmitting}
          toast={toast}
        />
      </Dialog>
    </>
  );
}
