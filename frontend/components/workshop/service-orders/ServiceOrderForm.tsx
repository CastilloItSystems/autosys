"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputText } from "primereact/inputtext";
import CustomerSelector from "@/components/common/CustomerSelector";
import VehicleSelector from "@/components/common/VehicleSelector";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Divider } from "primereact/divider";
import { ProgressSpinner } from "primereact/progressspinner";
import {
  WorkshopItemsTable,
  WorkshopFinancialSummary,
} from "@/components/workshop/shared";
import { useServiceOrderCalculation } from "@/hooks/useServiceOrderCalculation";
import type { WorkshopItemType } from "@/components/workshop/shared";
import { handleFormError } from "@/utils/errorHandlers";
import {
  serviceOrderService,
  serviceTypeService,
  workshopBayService,
  workshopOperationService,
  catalogSearchService,
} from "@/app/api/workshop";
import itemService from "@/app/api/inventory/itemService";
import {
  createServiceOrderSchema,
  updateServiceOrderSchema,
  type CreateServiceOrderForm,
} from "@/libs/zods/workshop/serviceOrderZod";
import type {
  ServiceOrder,
  ServiceType,
  WorkshopBay,
} from "@/libs/interfaces/workshop";
import { SO_PRIORITY_OPTIONS } from "@/components/workshop/shared/ServiceOrderStatusBadge";

interface ServiceOrderFormProps {
  order: ServiceOrder | null;
  onSave: () => void | Promise<void>;
  formId?: string;
  onSubmittingChange?: (v: boolean) => void;
  toast: React.RefObject<any>;
  preloadData?: {
    receptionId?: string;
    customerId?: string;
    customerVehicleId?: string;
    vehiclePlate?: string;
    mileageIn?: string;
  };
}

export default function ServiceOrderForm({
  order,
  onSave,
  formId,
  onSubmittingChange,
  toast,
  preloadData,
}: ServiceOrderFormProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [bays, setBays] = useState<WorkshopBay[]>([]);

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateServiceOrderForm>({
    resolver: zodResolver(
      order ? updateServiceOrderSchema : createServiceOrderSchema,
    ),
    mode: "onBlur",
    defaultValues: {
      customerId: "",
      customerVehicleId: undefined,
      priority: "NORMAL",
      vehiclePlate: "",
      vehicleDesc: "",
      mileageIn: undefined,
      serviceTypeId: undefined,
      bayId: undefined,
      assignedTechnicianId: undefined,
      estimatedDelivery: undefined,
      diagnosisNotes: "",
      observations: "",
      items: [],
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "items",
  });

  const [selectedItemsMap, setSelectedItemsMap] = useState<Record<string, any>>(
    {},
  );

  const watchedItems = (watch("items") ?? []) as any[];
  const watchedTypes = watchedItems.map(
    (i) => (i?.type ?? "LABOR") as WorkshopItemType,
  );

  const calcResult = useServiceOrderCalculation(
    watchedItems.map((i) => ({
      type: (i?.type ?? "LABOR") as WorkshopItemType,
      quantity: Number(i?.quantity ?? 1),
      unitPrice: Number(i?.unitPrice ?? 0),
      discountPct: Number(i?.discountPct ?? 0),
      taxType: i?.taxType ?? "IVA",
    })),
  );

  const handleItemSelect = useCallback(
    (item: any, index: number) => {
      console.log("[ServiceOrderForm] handleItemSelect called:", {
        item,
        index,
      });
      setSelectedItemsMap((prev) => ({ ...prev, [item.id]: item }));

      // Auto-detect type from catalog (LABOR → LABOR, PART → PART)
      const autoType =
        item.type === "LABOR"
          ? "LABOR"
          : item.type === "PART"
          ? "PART"
          : "OTHER";
      console.log("[ServiceOrderForm] Setting type:", autoType);
      setValue(`items.${index}.type`, autoType);

      // Auto-fill fields from catalog item
      console.log("[ServiceOrderForm] Setting itemId:", item.id);
      setValue(`items.${index}.itemId`, item.id);

      const descValue = item.name ?? "";
      console.log(
        "[ServiceOrderForm] Setting description - raw value:",
        item.name,
        "- final:",
        descValue,
        "- length:",
        descValue.length,
      );
      setValue(`items.${index}.description`, descValue);

      console.log("[ServiceOrderForm] Setting unitPrice:", item.price);
      setValue(`items.${index}.unitPrice`, item.price ?? 0);

      console.log("[ServiceOrderForm] Setting unitCost:", item.cost);
      setValue(`items.${index}.unitCost` as any, item.cost ?? 0);

      console.log("[ServiceOrderForm] Setting taxType:", item.taxType);
      setValue(`items.${index}.taxType` as any, item.taxType ?? "IVA");

      console.log("[ServiceOrderForm] Setting taxRate:", item.taxRate);
      setValue(`items.${index}.taxRate` as any, item.taxRate ?? 0.16);

      // Auto-append suggested items if LABOR with suggestedItems
      if (item.type === "LABOR" && item.suggestedItems?.length > 0) {
        console.log(
          "[ServiceOrderForm] Appending suggested items:",
          item.suggestedItems,
        );
        const itemsToAppend = item.suggestedItems.map((suggested: any) => ({
          type: "PART",
          itemId: suggested.itemId,
          description: suggested.description || "",
          quantity: suggested.quantity || 1,
          unitPrice: suggested.unitPrice || 0,
          unitCost: suggested.unitCost || 0,
          discountPct: 0,
          taxType: suggested.taxType || "IVA",
          taxRate: suggested.taxRate || 0.16,
          approved: true,
        }));
        append(itemsToAppend as any);
      }
    },
    [setValue, append],
  );

  useEffect(() => {
    const init = async () => {
      try {
        const [stRes, bayRes] = await Promise.all([
          serviceTypeService.getAll({ isActive: "true", limit: 100 }),
          workshopBayService.getAll({ isActive: "true", limit: 100 }),
        ]);
        setServiceTypes(stRes.data ?? []);
        setBays(bayRes.data ?? []);
      } catch {
        // catalogues fail silently
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (order) {
      reset({
        customerId: order.customerId ?? "",
        priority: order.priority ?? "NORMAL",
        customerVehicleId: order.customerVehicleId ?? undefined,
        vehiclePlate: order.vehiclePlate ?? "",
        vehicleDesc: order.vehicleDesc ?? "",
        mileageIn: order.mileageIn ?? undefined,
        serviceTypeId: order.serviceTypeId ?? undefined,
        bayId: order.bayId ?? undefined,
        assignedTechnicianId: order.assignedTechnicianId ?? undefined,
        estimatedDelivery: order.estimatedDelivery
          ? order.estimatedDelivery.substring(0, 16)
          : undefined,
        diagnosisNotes: order.diagnosisNotes ?? "",
        observations: order.observations ?? "",
        items: (order.items ?? []).map((i) => ({
          id: i.id,
          type: i.type,
          description: i.description,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          unitCost: (i as any).unitCost ?? 0,
          discountPct: i.discountPct ?? 0,
          taxType: i.taxType ?? "IVA",
          taxRate: i.taxRate ?? 0.16,
          operationId: i.operationId ?? undefined,
          itemId: i.itemId ?? undefined,
        })),
      });
    } else if (preloadData) {
      reset({
        customerId: preloadData.customerId ?? "",
        priority: "NORMAL",
        customerVehicleId: preloadData.customerVehicleId ?? undefined,
        vehiclePlate: preloadData.vehiclePlate ?? "",
        vehicleDesc: "",
        mileageIn: preloadData.mileageIn
          ? Number(preloadData.mileageIn)
          : undefined,
        serviceTypeId: undefined,
        bayId: undefined,
        assignedTechnicianId: undefined,
        estimatedDelivery: undefined,
        diagnosisNotes: "",
        observations: "",
        items: [],
      });
    } else {
      reset({
        customerId: "",
        priority: "NORMAL",
        vehiclePlate: "",
        vehicleDesc: "",
        mileageIn: undefined,
        serviceTypeId: undefined,
        bayId: undefined,
        estimatedDelivery: undefined,
        diagnosisNotes: "",
        observations: "",
        items: [],
      });
    }
  }, [order, reset, isLoading]);

  const onSubmit = async (data: CreateServiceOrderForm) => {
    onSubmittingChange?.(true);
    try {
      const payload = {
        ...data,
        receptionId: preloadData?.receptionId || undefined,
        vehiclePlate: data.vehiclePlate || undefined,
        vehicleDesc: data.vehicleDesc || undefined,
        diagnosisNotes: data.diagnosisNotes || undefined,
        observations: data.observations || undefined,
      };
      if (order?.id) {
        await serviceOrderService.update(order.id, payload as any);
      } else {
        await serviceOrderService.create(payload as any);
      }
      await onSave();
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      onSubmittingChange?.(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-column align-items-center justify-content-center p-4">
        <ProgressSpinner
          style={{ width: "40px", height: "40px" }}
          strokeWidth="4"
          fill="var(--surface-ground)"
          animationDuration=".5s"
        />
        <p className="mt-3 text-600 font-medium">Preparando formulario...</p>
      </div>
    );
  }

  return (
    <form
      id={formId ?? "service-order-form"}
      onSubmit={handleSubmit(onSubmit)}
      className="p-fluid"
    >
      <div className="grid">
        {/* ── Cliente y vehículo ──────────────────────────────────────────── */}
        <div className="col-12">
          <Divider align="left" className="mt-0">
            <span className="text-700 font-semibold text-sm">
              Cliente y vehículo
            </span>
          </Divider>
        </div>

        <div className="col-12 md:col-6">
          <label className="block text-900 font-medium mb-2">
            Cliente <span className="text-red-500">*</span>
          </label>
          <Controller
            name="customerId"
            control={control}
            render={({ field }) => (
              <CustomerSelector
                value={field.value}
                onChange={field.onChange}
                invalid={!!errors.customerId}
                disabled={!!order?.id}
              />
            )}
          />
          {errors.customerId && (
            <small className="p-error block mt-1">
              {errors.customerId.message}
            </small>
          )}
        </div>

        <div className="col-12 md:col-6">
          <label htmlFor="priority" className="block text-900 font-medium mb-2">
            Prioridad
          </label>
          <Controller
            name="priority"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="priority"
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={SO_PRIORITY_OPTIONS}
                className={errors.priority ? "p-invalid" : ""}
              />
            )}
          />
        </div>

        <div className="col-12 md:col-6">
          <label className="block text-900 font-medium mb-2">Vehículo</label>
          <Controller
            name="customerVehicleId"
            control={control}
            render={({ field }) => (
              <VehicleSelector
                customerId={control._formValues.customerId}
                value={field.value ?? undefined}
                onChange={field.onChange}
                onVehicleSelect={(v) => {
                  setValue("vehiclePlate", v?.plate ?? "");
                  setValue("vehicleDesc", v?.description ?? "");
                }}
                disabled={!!order?.id}
              />
            )}
          />
        </div>

        <div className="col-12 md:col-4">
          <label
            htmlFor="mileageIn"
            className="block text-900 font-medium mb-2"
          >
            Kilometraje entrada
          </label>
          <Controller
            name="mileageIn"
            control={control}
            render={({ field }) => (
              <InputNumber
                id="mileageIn"
                value={field.value ?? null}
                onValueChange={(e) => field.onChange(e.value ?? undefined)}
                min={0}
                placeholder="km"
              />
            )}
          />
        </div>

        {/* ── Asignación ─────────────────────────────────────────────────── */}
        <div className="col-12">
          <Divider align="left">
            <span className="text-700 font-semibold text-sm">Asignación</span>
          </Divider>
        </div>

        <div className="col-12 md:col-4">
          <label
            htmlFor="serviceTypeId"
            className="block text-900 font-medium mb-2"
          >
            Tipo de servicio
          </label>
          <Controller
            name="serviceTypeId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="serviceTypeId"
                value={field.value ?? null}
                onChange={(e) => field.onChange(e.value ?? undefined)}
                options={serviceTypes}
                optionLabel="name"
                optionValue="id"
                placeholder="Sin tipo"
                showClear
              />
            )}
          />
        </div>

        <div className="col-12 md:col-4">
          <label htmlFor="bayId" className="block text-900 font-medium mb-2">
            Bahía
          </label>
          <Controller
            name="bayId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="bayId"
                value={field.value ?? null}
                onChange={(e) => field.onChange(e.value ?? undefined)}
                options={bays}
                optionLabel="name"
                optionValue="id"
                placeholder="Sin asignar"
                showClear
              />
            )}
          />
        </div>

        <div className="col-12 md:col-4">
          <label
            htmlFor="estimatedDelivery"
            className="block text-900 font-medium mb-2"
          >
            Entrega estimada
          </label>
          <Controller
            name="estimatedDelivery"
            control={control}
            render={({ field }) => (
              <InputText
                id="estimatedDelivery"
                type="datetime-local"
                {...field}
                value={field.value ?? ""}
              />
            )}
          />
        </div>

        {/* ── Notas ──────────────────────────────────────────────────────── */}
        <div className="col-12">
          <Divider align="left">
            <span className="text-700 font-semibold text-sm">Notas</span>
          </Divider>
        </div>

        <div className="col-12 md:col-6">
          <label
            htmlFor="diagnosisNotes"
            className="block text-900 font-medium mb-2"
          >
            Diagnóstico
          </label>
          <Controller
            name="diagnosisNotes"
            control={control}
            render={({ field }) => (
              <InputTextarea
                id="diagnosisNotes"
                {...field}
                value={field.value ?? ""}
                rows={3}
                placeholder="Diagnóstico inicial..."
              />
            )}
          />
        </div>

        <div className="col-12 md:col-6">
          <label
            htmlFor="observations"
            className="block text-900 font-medium mb-2"
          >
            Observaciones
          </label>
          <Controller
            name="observations"
            control={control}
            render={({ field }) => (
              <InputTextarea
                id="observations"
                {...field}
                value={field.value ?? ""}
                rows={3}
                placeholder="Observaciones adicionales..."
              />
            )}
          />
        </div>

        {/* ── Ítems ──────────────────────────────────────────────────────── */}
        <WorkshopItemsTable
          control={control}
          register={register}
          fields={fields}
          append={append}
          remove={remove}
          move={move}
          errors={errors}
          fieldArrayName="items"
          calcResult={calcResult}
          watchedTypes={watchedTypes}
          onItemSelect={handleItemSelect}
          selectedItemsMap={selectedItemsMap}
          title="Ítems de la orden"
        />

        {/* ── Resumen financiero ── */}
        <div className="col-12">
          <WorkshopFinancialSummary totals={calcResult} />
        </div>
      </div>
    </form>
  );
}
