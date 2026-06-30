"use client";
import { logger } from "@/utils/logger";
import React from "react";
import { Control, useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Toast } from "primereact/toast";
import { handleFormError } from "@/utils/errorHandlers";
import { useBcvRate } from "@/hooks/useBcvRate";
import quotationService from "@/modules/workshop/quotations/services/quotationService";
import workshopOperationService from "@/modules/workshop/operations/services/workshopOperationService";
import { catalogSearchService } from "@/modules/workshop/catalogSearch/services/catalogSearchService";
import itemService from "@/modules/inventory/items/services/itemService";
import type { WorkshopQuotation } from "@/modules/workshop/quotations/interfaces/quotation.interface";
import {
  createQuotationSchema,
  updateQuotationSchema,
  type CreateQuotationFormValues,
} from "../schemas/quotationZod";
import { QUOTATION_ITEM_TYPE_OPTIONS } from "./QuotationStatusBadge";
import {
  WorkshopItemsTable,
  WorkshopFinancialSummary,
} from "@/modules/workshop/shared/components";
import { useServiceOrderCalculation } from "@/hooks/useServiceOrderCalculation";
import type { WorkshopItemType } from "@/modules/workshop/shared/components";
import CustomerSelector from "@/components/common/CustomerSelector";
import VehicleSelector from "@/components/common/VehicleSelector";

const CURRENCY_OPTIONS = [
  { label: "USD ($)", value: "USD" },
  { label: "VES (Bs.)", value: "VES" },
  { label: "EUR (€)", value: "EUR" },
];

function convertPriceFromUsd(
  priceUsd: number,
  currency: string,
  usdVesRate: number | null,
  currencyVesRate?: number | null,
): number {
  if (currency === "VES" && usdVesRate && usdVesRate > 0)
    return Math.round(priceUsd * usdVesRate * 100) / 100;
  if (
    currency === "EUR" &&
    usdVesRate &&
    currencyVesRate &&
    currencyVesRate > 0
  )
    return Math.round(((priceUsd * usdVesRate) / currencyVesRate) * 100) / 100;
  return priceUsd;
}

interface Props {
  quotation?: WorkshopQuotation | null;
  receptionId?: string;
  diagnosisId?: string;
  customerId?: string;
  customerVehicleId?: string;
  formId: string;
  onSave: () => void;
  onSubmittingChange: (v: boolean) => void;
  toast: React.RefObject<Toast>;
}

const EMPTY_ITEM = {
  type: "LABOR" as const,
  description: "",
  quantity: 1,
  unitPrice: 0,
  unitCost: 0,
  discountPct: 0,
  taxType: "IVA",
  taxRate: 0.16,
  taxAmount: 0,
  approved: true,
  order: 0,
};

export default function QuotationForm({
  quotation,
  receptionId,
  diagnosisId,
  customerId,
  customerVehicleId,
  formId,
  onSave,
  onSubmittingChange,
  toast,
}: Props) {
  const [selectedItemsMap, setSelectedItemsMap] = React.useState<
    Record<string, any>
  >({});

  React.useEffect(() => {
    if (!quotation?.items?.length) {
      setSelectedItemsMap({});
      return;
    }

    const hydrated = quotation.items.reduce((acc, it: any) => {
      const refId = it.referenceId ? String(it.referenceId) : null;
      if (!refId) return acc;
      acc[refId] = {
        id: refId,
        name: it.referenceName ?? it.description ?? "",
        code: it.referenceCode ?? undefined,
        sku: it.referenceSku ?? undefined,
        type: it.type === "LABOR" ? "LABOR" : "PART",
        price: Number(it.unitPrice ?? 0),
      };
      return acc;
    }, {} as Record<string, any>);

    setSelectedItemsMap(hydrated);
  }, [quotation]);

  const isUpdate = !!quotation?.id;
  const schema = isUpdate ? updateQuotationSchema : createQuotationSchema;

  const defaultValues: any = isUpdate
    ? {
        validUntil: quotation.validUntil
          ? new Date(quotation.validUntil)
          : null,
        notes: quotation.notes ?? "",
        internalNotes: quotation.internalNotes ?? "",
        currency: (quotation as any).currency ?? "USD",
        exchangeRate: (quotation as any).exchangeRate ?? null,
        items: quotation.items.map((it) => ({
          id: it.id,
          type: it.type,
          referenceId: it.referenceId ?? undefined,
          description: it.description,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          unitCost: it.unitCost,
          discountPct: (it as any).discountPct ?? 0,
          taxType: (it as any).taxType ?? "IVA",
          taxRate: (it as any).taxRate ?? 0.16,
          taxAmount: (it as any).taxAmount ?? 0,
          approved: it.approved,
          order: it.order,
        })),
      }
    : {
        customerId: customerId ?? "",
        customerVehicleId: customerVehicleId ?? undefined,
        receptionId: receptionId ?? undefined,
        diagnosisId: diagnosisId ?? undefined,
        isSupplementary: false,
        validUntil: null,
        notes: "",
        internalNotes: "",
        currency: "USD",
        exchangeRate: null,
        items: [EMPTY_ITEM],
      };

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateQuotationFormValues>({
    resolver: zodResolver(schema as any),
    defaultValues,
  });

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "items",
  });

  const watchCurrency = (watch("currency") as string) ?? "USD";

  // USD/VES rate is always needed — for VES documents AND as base for EUR conversion
  const { rate: usdVesRate } = useBcvRate("USD");
  // Currency-specific rate (only meaningful for EUR)
  const { rate: currencyVesRate } = useBcvRate(
    (watchCurrency === "EUR" ? "EUR" : "USD") as "USD" | "EUR" | "VES",
  );

  // Effective rate to store in the document (X/VES for the selected currency)
  const effectiveRate =
    watchCurrency === "USD"
      ? usdVesRate
      : watchCurrency === "EUR"
      ? currencyVesRate
      : usdVesRate; // VES → store USD/VES for cross-reference

  const prevCurrencyRef = React.useRef<string>(watchCurrency);
  // Flag: currency changed but rate not ready yet → reconvert once rate arrives
  const pendingReconversionRef = React.useRef(false);

  const reconvertItems = React.useCallback(
    (currency: string, usdRate: number | null, curRate: number | null) => {
      const currentItems = watch("items") as any[];
      if (!currentItems?.length) return;
      currentItems.forEach((item: any, idx: number) => {
        const refId = item.referenceId;
        const catalogItem = refId ? selectedItemsMap[refId] : null;
        if (!catalogItem?.price) return;
        const newPrice = convertPriceFromUsd(
          Number(catalogItem.price),
          currency,
          usdRate,
          curRate,
        );
        setValue(`items.${idx}.unitPrice`, newPrice);
      });
    },
    [selectedItemsMap, setValue, watch],
  );

  // Auto-fill exchangeRate field when BCV rate loads
  React.useEffect(() => {
    if (effectiveRate && effectiveRate > 0) {
      setValue("exchangeRate", effectiveRate);

      // If a reconversion was pending (rate arrived after currency change), do it now
      if (pendingReconversionRef.current) {
        pendingReconversionRef.current = false;
        reconvertItems(watchCurrency, usdVesRate, currencyVesRate);
      }
    }
  }, [
    effectiveRate,
    setValue,
    reconvertItems,
    watchCurrency,
    usdVesRate,
    currencyVesRate,
  ]);

  React.useEffect(() => {
    const prev = prevCurrencyRef.current;
    if (prev === watchCurrency) return;
    prevCurrencyRef.current = watchCurrency;

    const rateReady =
      watchCurrency === "USD" ||
      (watchCurrency === "VES" && usdVesRate && usdVesRate > 0) ||
      (watchCurrency === "EUR" &&
        currencyVesRate &&
        currencyVesRate > 0 &&
        usdVesRate &&
        usdVesRate > 0);

    if (rateReady) {
      reconvertItems(watchCurrency, usdVesRate, currencyVesRate);
    } else {
      // Rate still loading — mark pending, reconvert when it arrives via effectiveRate effect
      pendingReconversionRef.current = true;
    }
  }, [watchCurrency, usdVesRate, currencyVesRate, reconvertItems]);

  const watchedItems = (watch("items") ?? []) as any[];

  // Map quotation types to LABOR / PART / OTHER for the shared calculation hook
  const watchedTypes = watchedItems.map((i) =>
    (["LABOR", "PART"] as string[]).includes(i?.type)
      ? (i.type as WorkshopItemType)
      : ("OTHER" as WorkshopItemType),
  );

  const calcResult = useServiceOrderCalculation(
    watchedItems.map((i, idx) => ({
      type: watchedTypes[idx],
      quantity: Number(i?.quantity ?? 1),
      unitPrice: Number(i?.unitPrice ?? 0),
      discountPct: Number(i?.discountPct ?? 0),
      taxType: i?.taxType ?? "IVA",
    })),
  );

  const handleItemSelect = React.useCallback(
    (item: any, index: number) => {
      logger.debug("[QuotationForm] handleItemSelect called:", { item, index });

      if (!item) return;
      setSelectedItemsMap((prev) => ({ ...prev, [item.id]: item }));

      // Auto-detect type from catalog (LABOR → LABOR, PART → PART)
      const autoType =
        item.type === "LABOR"
          ? "LABOR"
          : item.type === "PART"
          ? "PART"
          : "EXTERNAL_SERVICE";
      logger.debug("[QuotationForm] Setting type:", autoType);
      setValue(`items.${index}.type`, autoType);

      logger.debug("[QuotationForm] Setting referenceId:", item.id);
      setValue(`items.${index}.referenceId`, item.id);

      const descValue = item.name ?? "";
      logger.debug(
        "[QuotationForm] Setting description - raw value:",
        item.name,
        "- final:",
        descValue,
        "- length:",
        descValue.length,
      );
      setValue(`items.${index}.description`, descValue);

      const convertedPrice = convertPriceFromUsd(
        Number(item.price ?? 0),
        watchCurrency,
        usdVesRate,
        currencyVesRate,
      );
      logger.debug("[QuotationForm] Setting unitPrice:", convertedPrice);
      setValue(`items.${index}.unitPrice`, convertedPrice);

      logger.debug("[QuotationForm] Setting unitCost:", item.cost);
      setValue(`items.${index}.unitCost`, item.cost ?? 0);

      logger.debug("[QuotationForm] Setting taxType:", item.taxType);
      setValue(`items.${index}.taxType`, item.taxType ?? "IVA");

      logger.debug("[QuotationForm] Setting taxRate:", item.taxRate);
      setValue(`items.${index}.taxRate`, item.taxRate ?? 0.16);

      if (item.type === "LABOR" && item.suggestedItems?.length > 0) {
        logger.debug(
          "[QuotationForm] Appending suggested items:",
          item.suggestedItems,
        );
        const suggestedCatalogMap = item.suggestedItems.reduce(
          (acc: Record<string, any>, suggested: any) => {
            const suggestedId = suggested.itemId
              ? String(suggested.itemId)
              : null;
            if (!suggestedId) return acc;
            acc[suggestedId] = {
              id: suggestedId,
              code: suggested.code ?? undefined,
              sku: suggested.sku ?? undefined,
              name: suggested.name ?? suggested.description ?? "",
              type: "PART",
              price: Number(suggested.unitPrice ?? 0),
              cost: Number(suggested.unitCost ?? 0),
              taxType: suggested.taxType ?? "IVA",
              taxRate: Number(suggested.taxRate ?? 0.16),
            };
            return acc;
          },
          {},
        );
        setSelectedItemsMap((prev) => ({ ...prev, ...suggestedCatalogMap }));

        const itemsToAppend = item.suggestedItems.map((suggested: any) => ({
          type: "PART",
          referenceId: suggested.itemId,
          description: suggested.description || "",
          quantity: suggested.quantity || 1,
          unitPrice: suggested.unitPrice || 0,
          unitCost: suggested.unitCost || 0,
          discountPct: 0,
          taxType: suggested.taxType || "IVA",
          taxRate: suggested.taxRate || 0.16,
          approved: true,
        }));
        append(itemsToAppend);
      }
    },
    [setValue, append, watchCurrency, usdVesRate, currencyVesRate],
  );

  const onSubmit = async (data: any) => {
    onSubmittingChange(true);
    try {
      const payload: any = {
        ...data,
        validUntil: data.validUntil
          ? new Date(data.validUntil).toISOString()
          : null,
      };
      if (isUpdate) {
        await quotationService.update(quotation!.id, payload);
      } else {
        await quotationService.create(payload);
      }
      onSave();
    } catch (err) {
      handleFormError(err, toast);
    } finally {
      onSubmittingChange(false);
    }
  };

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)} className="p-fluid">
      {/* Encabezado */}
      <div className="grid">
        <div className="col-12 md:col-6 lg:col-3">
          <label className="block mb-1 font-semibold text-sm">Cliente *</label>
          <Controller
            name="customerId"
            control={control}
            render={({ field, fieldState }) => (
              <CustomerSelector
                value={field.value}
                onChange={(id) => {
                  field.onChange(id);
                  setValue("customerVehicleId", ""); // Reset vehicle when customer changes
                }}
                invalid={!!fieldState.error}
              />
            )}
          />
          {errors.customerId && (
            <small className="p-error">{errors.customerId.message}</small>
          )}
        </div>

        <div className="col-12 md:col-6 lg:col-3">
          <label className="block mb-1 font-semibold text-sm">Vehículo</label>
          <Controller
            name="customerVehicleId"
            control={control}
            render={({ field, fieldState }) => (
              <VehicleSelector
                customerId={watch("customerId")}
                value={field.value}
                onChange={field.onChange}
                invalid={!!fieldState.error}
              />
            )}
          />
        </div>

        <div className="col-12 md:col-4 lg:col-2">
          <label className="block mb-1 font-semibold text-sm">Moneda</label>
          <Controller
            name="currency"
            control={control}
            render={({ field }) => (
              <Dropdown
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={CURRENCY_OPTIONS}
                className="w-full"
              />
            )}
          />
        </div>

        <div className="col-12 md:col-4 lg:col-2">
          <label className="block mb-1 font-semibold text-sm">
            Tasa de cambio
          </label>
          <Controller
            name="exchangeRate"
            control={control}
            render={({ field }) => (
              <InputNumber
                value={field.value ?? null}
                onValueChange={(e) => field.onChange(e.value ?? null)}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={4}
                placeholder="Tasa BCV"
                className="w-full"
                disabled={watchCurrency === "USD"}
              />
            )}
          />
        </div>

        <div className="col-12 md:col-4 lg:col-2">
          <label className="block mb-1 font-semibold text-sm">
            Válida hasta
          </label>
          <Controller
            name="validUntil"
            control={control}
            render={({ field }) => (
              <Calendar
                {...field}
                value={field.value ? new Date(field.value as any) : null}
                onChange={(e) => field.onChange(e.value)}
                dateFormat="dd/mm/yy"
                placeholder="Seleccionar fecha"
                showIcon
              />
            )}
          />
        </div>
      </div>

      {/* Ítems */}
      <div className="mb-4">
        <WorkshopItemsTable
          control={control as Control<any, any, any>}
          register={register}
          fields={fields}
          append={append}
          remove={remove}
          move={move}
          errors={errors}
          fieldArrayName="items"
          defaultItem={{ ...EMPTY_ITEM, order: fields.length }}
          calcResult={calcResult}
          watchedTypes={watchedTypes}
          title="Ítems de la cotización"
          typeOptions={QUOTATION_ITEM_TYPE_OPTIONS}
          onItemSelect={handleItemSelect}
          selectedItemsMap={selectedItemsMap}
          catalogRefField="referenceId"
          currency={watchCurrency}
        />
      </div>

      {/* Totales */}
      <WorkshopFinancialSummary
        totals={calcResult}
        currency={watchCurrency}
        exchangeRate={watch("exchangeRate") as number | null}
      />

      {/* Notas */}
      <div className="grid">
        <div className="col-12 md:col-6">
          <label className="block mb-1 font-semibold text-sm">
            Notas para el cliente
          </label>
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <InputTextarea
                {...field}
                value={field.value ?? ""}
                rows={3}
                placeholder="Condiciones, observaciones para el cliente..."
              />
            )}
          />
        </div>
        <div className="col-12 md:col-6">
          <label className="block mb-1 font-semibold text-sm">
            Notas internas
          </label>
          <Controller
            name="internalNotes"
            control={control}
            render={({ field }) => (
              <InputTextarea
                {...field}
                value={field.value ?? ""}
                rows={3}
                placeholder="Observaciones internas del equipo..."
              />
            )}
          />
        </div>
      </div>

      {/* Botón oculto para permitir el envío con la tecla Enter */}
      <button
        type="submit"
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
      />
    </form>
  );
}
