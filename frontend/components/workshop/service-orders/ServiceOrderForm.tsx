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
import { AutoComplete } from "primereact/autocomplete";
import { Button } from "primereact/button";
import { Divider } from "primereact/divider";
import { ProgressSpinner } from "primereact/progressspinner";
import { handleFormError } from "@/utils/errorHandlers";
import {
  serviceOrderService,
  serviceTypeService,
  workshopBayService,
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

const ITEM_TYPE_OPTIONS = [
  { label: "Mano de obra", value: "LABOR" },
  { label: "Refacción", value: "PART" },
  { label: "Otro", value: "OTHER" },
];

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
  const [itemSuggestions, setItemSuggestions] = useState<any[]>([]);

  const searchItems = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setItemSuggestions([]);
      return;
    }
    try {
      const res = await itemService.search(query);
      setItemSuggestions(res.data ?? []);
    } catch {
      setItemSuggestions([]);
    }
  }, []);

  const {
    control,
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

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

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
          discountPct: i.discountPct ?? 0,
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
        await serviceOrderService.update(order.id, payload);
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
        <div className="col-12">
          <Divider align="left">
            <span className="text-700 font-semibold text-sm">
              Ítems de la orden
            </span>
          </Divider>
        </div>

        <div className="col-12">
          <div className="flex flex-column gap-2">
            {fields.map((field, index) => {
              const itemType = watch(`items.${index}.type`);
              return (
                <div
                  key={field.id}
                  className="p-3 surface-100 border-round grid m-0 gap-2 align-items-end"
                >
                  {/* Tipo */}
                  <div className="col-12 md:col-2 p-0">
                    <label className="block text-700 text-sm mb-1">Tipo</label>
                    <Controller
                      name={`items.${index}.type`}
                      control={control}
                      render={({ field: f }) => (
                        <Dropdown
                          {...f}
                          options={ITEM_TYPE_OPTIONS}
                          placeholder="Tipo"
                          className={
                            errors.items?.[index]?.type ? "p-invalid" : ""
                          }
                          onChange={(e) => {
                            f.onChange(e.value);
                            // Al cambiar de tipo limpiar el itemId si ya no es PART
                            if (e.value !== "PART") {
                              setValue(
                                `items.${index}.itemId` as any,
                                undefined,
                              );
                            }
                          }}
                        />
                      )}
                    />
                  </div>

                  {/* Descripción / Selector de catálogo */}
                  <div className="col-12 md:col-4 p-0">
                    <label className="block text-700 text-sm mb-1">
                      {itemType === "PART"
                        ? "Refacción (catálogo)"
                        : "Descripción"}
                    </label>
                    {itemType === "PART" ? (
                      <Controller
                        name={`items.${index}.description`}
                        control={control}
                        render={({ field: f }) => (
                          <AutoComplete
                            value={f.value}
                            suggestions={itemSuggestions}
                            field="name"
                            completeMethod={(e) => {
                              f.onChange(e.query);
                              searchItems(e.query);
                            }}
                            onChange={(e) =>
                              f.onChange(
                                typeof e.value === "string"
                                  ? e.value
                                  : e.value?.name ?? "",
                              )
                            }
                            onSelect={(e) => {
                              const item = e.value;
                              f.onChange(item.name ?? "");
                              setValue(`items.${index}.itemId` as any, item.id);
                              // Precio de venta del catálogo si existe
                              const precio =
                                item.pricing?.salePrice ??
                                item.pricing?.price ??
                                0;
                              const costo = item.pricing?.costPrice ?? 0;
                              setValue(`items.${index}.unitPrice`, precio);
                              setValue(`items.${index}.unitCost` as any, costo);
                            }}
                            itemTemplate={(item) => (
                              <div className="flex align-items-center gap-2">
                                <span className="font-medium">{item.name}</span>
                                <span className="text-500 text-sm">
                                  ({item.sku})
                                </span>
                              </div>
                            )}
                            placeholder="Buscar refacción..."
                            className={`w-full ${
                              errors.items?.[index]?.description
                                ? "p-invalid"
                                : ""
                            }`}
                            forceSelection={false}
                          />
                        )}
                      />
                    ) : (
                      <Controller
                        name={`items.${index}.description`}
                        control={control}
                        render={({ field: f }) => (
                          <InputText
                            {...f}
                            placeholder="Descripción del servicio"
                            className={
                              errors.items?.[index]?.description
                                ? "p-invalid"
                                : ""
                            }
                          />
                        )}
                      />
                    )}
                    {errors.items?.[index]?.description && (
                      <small className="p-error">
                        {errors.items[index]?.description?.message}
                      </small>
                    )}
                  </div>

                  {/* Cantidad */}
                  <div className="col-6 md:col-1 p-0">
                    <label className="block text-700 text-sm mb-1">Cant.</label>
                    <Controller
                      name={`items.${index}.quantity`}
                      control={control}
                      render={({ field: f }) => (
                        <InputNumber
                          value={f.value}
                          onValueChange={(e) => f.onChange(e.value ?? 1)}
                          min={0.01}
                          minFractionDigits={0}
                          maxFractionDigits={2}
                          className={
                            errors.items?.[index]?.quantity ? "p-invalid" : ""
                          }
                        />
                      )}
                    />
                  </div>

                  {/* Precio unitario */}
                  <div className="col-6 md:col-2 p-0">
                    <label className="block text-700 text-sm mb-1">
                      Precio unit.
                    </label>
                    <Controller
                      name={`items.${index}.unitPrice`}
                      control={control}
                      render={({ field: f }) => (
                        <InputNumber
                          value={f.value}
                          onValueChange={(e) => f.onChange(e.value ?? 0)}
                          mode="currency"
                          currency="USD"
                          locale="es-VE"
                          minFractionDigits={2}
                          min={0}
                          className={
                            errors.items?.[index]?.unitPrice ? "p-invalid" : ""
                          }
                        />
                      )}
                    />
                  </div>

                  {/* Descuento */}
                  <div className="col-6 md:col-1 p-0">
                    <label className="block text-700 text-sm mb-1">
                      Dto. %
                    </label>
                    <Controller
                      name={`items.${index}.discountPct`}
                      control={control}
                      render={({ field: f }) => (
                        <InputNumber
                          value={f.value}
                          onValueChange={(e) => f.onChange(e.value ?? 0)}
                          suffix="%"
                          min={0}
                          max={100}
                        />
                      )}
                    />
                  </div>

                  {/* Eliminar */}
                  <div className="col-6 md:col-1 p-0 flex align-items-end pb-1">
                    <Button
                      icon="pi pi-trash"
                      rounded
                      text
                      severity="danger"
                      type="button"
                      onClick={() => remove(index)}
                      tooltip="Quitar ítem"
                    />
                  </div>
                </div>
              );
            })}

            <Button
              type="button"
              label="Agregar ítem"
              icon="pi pi-plus"
              outlined
              size="small"
              className="w-auto align-self-start mt-1"
              onClick={() =>
                append({
                  type: "LABOR",
                  description: "",
                  quantity: 1,
                  unitPrice: 0,
                  unitCost: 0,
                  discountPct: 0,
                  taxType: "IVA",
                  taxRate: 0.16,
                })
              }
            />
          </div>
        </div>
      </div>
    </form>
  );
}
