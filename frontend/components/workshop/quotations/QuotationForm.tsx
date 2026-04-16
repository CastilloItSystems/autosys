"use client";
import React from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputTextarea } from "primereact/inputtextarea";
import { Calendar } from "primereact/calendar";
import { Toast } from "primereact/toast";
import { handleFormError } from "@/utils/errorHandlers";
import {
  quotationService,
  workshopOperationService,
  catalogSearchService,
} from "@/app/api/workshop";
import itemService from "@/app/api/inventory/itemService";
import type { WorkshopQuotation } from "@/libs/interfaces/workshop";
import {
  createQuotationSchema,
  updateQuotationSchema,
  type CreateQuotationFormValues,
} from "@/libs/zods/workshop";
import { QUOTATION_ITEM_TYPE_OPTIONS } from "./QuotationStatusBadge";
import {
  WorkshopItemsTable,
  WorkshopFinancialSummary,
} from "@/components/workshop/shared";
import { useServiceOrderCalculation } from "@/hooks/useServiceOrderCalculation";
import type { WorkshopItemType } from "@/components/workshop/shared";
import CustomerSelector from "@/components/common/CustomerSelector";
import VehicleSelector from "@/components/common/VehicleSelector";

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
      console.log("[QuotationForm] handleItemSelect called:", { item, index });

      if (!item) return;
      setSelectedItemsMap((prev) => ({ ...prev, [item.id]: item }));

      // Auto-detect type from catalog (LABOR → LABOR, PART → PART)
      const autoType =
        item.type === "LABOR"
          ? "LABOR"
          : item.type === "PART"
          ? "PART"
          : "EXTERNAL_SERVICE";
      console.log("[QuotationForm] Setting type:", autoType);
      setValue(`items.${index}.type`, autoType);

      console.log("[QuotationForm] Setting referenceId:", item.id);
      setValue(`items.${index}.referenceId`, item.id);

      const descValue = item.name ?? "";
      console.log(
        "[QuotationForm] Setting description - raw value:",
        item.name,
        "- final:",
        descValue,
        "- length:",
        descValue.length,
      );
      setValue(`items.${index}.description`, descValue);

      console.log("[QuotationForm] Setting unitPrice:", item.price);
      setValue(`items.${index}.unitPrice`, item.price ?? 0);

      console.log("[QuotationForm] Setting unitCost:", item.cost);
      setValue(`items.${index}.unitCost`, item.cost ?? 0);

      console.log("[QuotationForm] Setting taxType:", item.taxType);
      setValue(`items.${index}.taxType`, item.taxType ?? "IVA");

      console.log("[QuotationForm] Setting taxRate:", item.taxRate);
      setValue(`items.${index}.taxRate`, item.taxRate ?? 0.16);

      if (item.type === "LABOR" && item.suggestedItems?.length > 0) {
        console.log(
          "[QuotationForm] Appending suggested items:",
          item.suggestedItems,
        );
        const suggestedCatalogMap = item.suggestedItems.reduce(
          (acc: Record<string, any>, suggested: any) => {
            const suggestedId = suggested.itemId ? String(suggested.itemId) : null;
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
    [setValue, append],
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
        <div className="col-12 md:col-6 lg:col-4">
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

        <div className="col-12 md:col-6 lg:col-4">
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

        <div className="col-12 md:col-6 lg:col-4">
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
          control={control}
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
        />
      </div>

      {/* Totales */}
      <WorkshopFinancialSummary totals={calcResult} />

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
