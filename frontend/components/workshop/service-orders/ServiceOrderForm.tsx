"use client";
import React, { useEffect, useRef, useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Tag } from "primereact/tag";
import { Divider } from "primereact/divider";
import { Toast } from "primereact/toast";
import serviceOrderService, {
  ServiceOrder,
  ServiceOrderItem,
} from "@/app/api/workshop/serviceOrderService";
import customerCrmService from "@/app/api/crm/customerCrmService";
import customerVehicleService from "@/app/api/crm/customerVehicleService";

const itemSchema = z.object({
  type: z.enum(["LABOR", "PART", "OTHER"]).default("LABOR"),
  description: z.string().min(1, "Requerido"),
  quantity: z.number().positive().default(1),
  unitPrice: z.number().min(0).default(0),
});

const schema = z.object({
  customerId: z.string().min(1, "Selecciona un cliente"),
  customerVehicleId: z.string().optional(),
  vehiclePlate: z.string().optional(),
  vehicleDesc: z.string().optional(),
  mileageIn: z.number().optional(),
  diagnosisNotes: z.string().optional(),
  observations: z.string().optional(),
  assignedTechnicianId: z.string().optional(),
  estimatedDelivery: z.date().optional().nullable(),
  items: z.array(itemSchema).default([]),
});

type FormValues = z.infer<typeof schema>;

const ITEM_TYPE_OPTIONS = [
  { label: "Mano de obra", value: "LABOR" },
  { label: "Refacción", value: "PART" },
  { label: "Otro", value: "OTHER" },
];

interface Props {
  order?: ServiceOrder | null;
  onSave: () => void;
  onCancel: () => void;
  toast: React.RefObject<Toast | null>;
}

const ServiceOrderForm = ({ order, onSave, onCancel, toast }: Props) => {
  const [saving, setSaving] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      customerId: order?.customerId ?? "",
      customerVehicleId: order?.customerVehicleId ?? undefined,
      vehiclePlate: order?.vehiclePlate ?? "",
      vehicleDesc: order?.vehicleDesc ?? "",
      mileageIn: order?.mileageIn ?? undefined,
      diagnosisNotes: order?.diagnosisNotes ?? "",
      observations: order?.observations ?? "",
      assignedTechnicianId: order?.assignedTechnicianId ?? undefined,
      estimatedDelivery: order?.estimatedDelivery
        ? new Date(order.estimatedDelivery)
        : null,
      items: order?.items?.map((i) => ({
        type: i.type,
        description: i.description,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })) ?? [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const watchedItems = watch("items");
  const watchedCustomerId = watch("customerId");

  const laborTotal = watchedItems
    .filter((i) => i.type === "LABOR")
    .reduce((s, i) => s + (i.quantity ?? 0) * (i.unitPrice ?? 0), 0);
  const partsTotal = watchedItems
    .filter((i) => i.type !== "LABOR")
    .reduce((s, i) => s + (i.quantity ?? 0) * (i.unitPrice ?? 0), 0);
  const total = laborTotal + partsTotal;

  // Load customers
  useEffect(() => {
    customerCrmService
      .getAll({ limit: 200 })
      .then((res) => {
        if (res.data)
          setCustomers(
            (res.data as any[]).map((c: any) => ({
              label: `${c.name} (${c.code})`,
              value: c.id,
            }))
          );
      })
      .catch(() => {});
  }, []);

  // Load vehicles when customer changes
  useEffect(() => {
    if (!watchedCustomerId) {
      setVehicles([]);
      return;
    }
    setLoadingVehicles(true);
    customerVehicleService
      .getAll(watchedCustomerId)
      .then((res) => {
        if (res.data)
          setVehicles(
            (res.data as any[]).map((v: any) => ({
              label: `${v.plate}${v.year ? ` · ${v.year}` : ""}${v.color ? ` · ${v.color}` : ""}`,
              value: v.id,
              plate: v.plate,
              brand: v.brand?.name,
              model: v.vehicleModel?.name,
              year: v.year,
              color: v.color,
            }))
          );
      })
      .catch(() => {})
      .finally(() => setLoadingVehicles(false));
  }, [watchedCustomerId]);

  const handleVehicleChange = (vehicleId: string) => {
    setValue("customerVehicleId", vehicleId);
    const v = vehicles.find((x) => x.value === vehicleId);
    if (v) {
      setValue("vehiclePlate", v.plate ?? "");
      setValue(
        "vehicleDesc",
        [v.brand, v.model, v.year, v.color].filter(Boolean).join(" ")
      );
    }
  };

  const onSubmit = async (data: FormValues) => {
    setSaving(true);
    try {
      const payload = {
        ...data,
        estimatedDelivery: data.estimatedDelivery?.toISOString() ?? undefined,
      };
      if (order?.id) {
        await serviceOrderService.update(order.id, payload);
        toast.current?.show({
          severity: "success",
          summary: "Actualizado",
          detail: "Orden actualizada",
          life: 3000,
        });
      } else {
        await serviceOrderService.create(payload);
        toast.current?.show({
          severity: "success",
          summary: "Creado",
          detail: "Orden creada",
          life: 3000,
        });
      }
      onSave();
    } catch (err: any) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: err?.response?.data?.error ?? "No se pudo guardar",
        life: 4000,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-column gap-4">
      {/* Cliente y vehículo */}
      <div className="grid">
        <div className="col-12 md:col-6">
          <label className="block text-sm font-medium mb-1">
            Cliente <span className="text-red-500">*</span>
          </label>
          <Controller
            name="customerId"
            control={control}
            render={({ field }) => (
              <Dropdown
                {...field}
                options={customers}
                filter
                placeholder="Seleccionar cliente"
                className={`w-full ${errors.customerId ? "p-invalid" : ""}`}
              />
            )}
          />
          {errors.customerId && (
            <small className="p-error">{errors.customerId.message}</small>
          )}
        </div>

        <div className="col-12 md:col-6">
          <label className="block text-sm font-medium mb-1">Vehículo registrado</label>
          <Dropdown
            value={watch("customerVehicleId")}
            options={vehicles}
            onChange={(e) => handleVehicleChange(e.value)}
            filter
            placeholder={
              loadingVehicles ? "Cargando..." : "Seleccionar vehículo"
            }
            disabled={!watchedCustomerId || loadingVehicles}
            className="w-full"
            showClear
          />
        </div>

        <div className="col-12 md:col-4">
          <label className="block text-sm font-medium mb-1">Placa</label>
          <Controller
            name="vehiclePlate"
            control={control}
            render={({ field }) => (
              <InputText {...field} className="w-full" placeholder="ABC-123" />
            )}
          />
        </div>

        <div className="col-12 md:col-8">
          <label className="block text-sm font-medium mb-1">
            Descripción del vehículo
          </label>
          <Controller
            name="vehicleDesc"
            control={control}
            render={({ field }) => (
              <InputText
                {...field}
                className="w-full"
                placeholder="Honda Civic 2020 Blanco"
              />
            )}
          />
        </div>

        <div className="col-12 md:col-4">
          <label className="block text-sm font-medium mb-1">
            Kilometraje entrada
          </label>
          <Controller
            name="mileageIn"
            control={control}
            render={({ field }) => (
              <InputNumber
                value={field.value ?? null}
                onValueChange={(e) => field.onChange(e.value ?? undefined)}
                className="w-full"
                placeholder="0 km"
                suffix=" km"
                min={0}
              />
            )}
          />
        </div>

        <div className="col-12 md:col-4">
          <label className="block text-sm font-medium mb-1">
            Entrega estimada
          </label>
          <Controller
            name="estimatedDelivery"
            control={control}
            render={({ field }) => (
              <Calendar
                value={field.value ?? null}
                onChange={(e) => field.onChange(e.value)}
                showTime
                hourFormat="12"
                className="w-full"
                placeholder="Fecha y hora"
                showIcon
              />
            )}
          />
        </div>
      </div>

      {/* Diagnóstico */}
      <div className="grid">
        <div className="col-12 md:col-6">
          <label className="block text-sm font-medium mb-1">
            Diagnóstico / Trabajo solicitado
          </label>
          <Controller
            name="diagnosisNotes"
            control={control}
            render={({ field }) => (
              <InputTextarea
                {...field}
                value={field.value ?? ""}
                rows={3}
                className="w-full"
                placeholder="Describe el problema o trabajo a realizar..."
              />
            )}
          />
        </div>
        <div className="col-12 md:col-6">
          <label className="block text-sm font-medium mb-1">
            Observaciones internas
          </label>
          <Controller
            name="observations"
            control={control}
            render={({ field }) => (
              <InputTextarea
                {...field}
                value={field.value ?? ""}
                rows={3}
                className="w-full"
                placeholder="Notas internas del taller..."
              />
            )}
          />
        </div>
      </div>

      {/* Items */}
      <Divider className="my-1" />
      <div className="flex align-items-center justify-content-between">
        <span className="font-semibold text-900">
          Items{" "}
          <Tag
            value={`${fields.length}`}
            severity={fields.length > 0 ? "success" : "secondary"}
          />
        </span>
        <Button
          type="button"
          label="Agregar línea"
          icon="pi pi-plus"
          size="small"
          outlined
          onClick={() =>
            append({ type: "LABOR", description: "", quantity: 1, unitPrice: 0 })
          }
        />
      </div>

      {fields.length > 0 && (
        <div className="flex flex-column gap-2">
          {fields.map((field, idx) => (
            <div key={field.id} className="grid align-items-end surface-50 border-round p-2">
              <div className="col-12 md:col-2">
                <Controller
                  name={`items.${idx}.type`}
                  control={control}
                  render={({ field: f }) => (
                    <Dropdown
                      {...f}
                      options={ITEM_TYPE_OPTIONS}
                      className="w-full"
                      placeholder="Tipo"
                    />
                  )}
                />
              </div>
              <div className="col-12 md:col-4">
                <Controller
                  name={`items.${idx}.description`}
                  control={control}
                  render={({ field: f }) => (
                    <InputText
                      {...f}
                      className={`w-full ${errors.items?.[idx]?.description ? "p-invalid" : ""}`}
                      placeholder="Descripción"
                    />
                  )}
                />
              </div>
              <div className="col-6 md:col-2">
                <Controller
                  name={`items.${idx}.quantity`}
                  control={control}
                  render={({ field: f }) => (
                    <InputNumber
                      value={f.value}
                      onValueChange={(e) => f.onChange(e.value ?? 1)}
                      min={0.01}
                      minFractionDigits={0}
                      maxFractionDigits={2}
                      className="w-full"
                      placeholder="Cant."
                    />
                  )}
                />
              </div>
              <div className="col-6 md:col-2">
                <Controller
                  name={`items.${idx}.unitPrice`}
                  control={control}
                  render={({ field: f }) => (
                    <InputNumber
                      value={f.value}
                      onValueChange={(e) => f.onChange(e.value ?? 0)}
                      min={0}
                      minFractionDigits={2}
                      maxFractionDigits={2}
                      className="w-full"
                      placeholder="Precio"
                    />
                  )}
                />
              </div>
              <div className="col-10 md:col-1 text-right text-sm font-medium">
                {(
                  (watchedItems[idx]?.quantity ?? 0) *
                  (watchedItems[idx]?.unitPrice ?? 0)
                ).toFixed(2)}
              </div>
              <div className="col-2 md:col-1 text-right">
                <Button
                  type="button"
                  icon="pi pi-trash"
                  text
                  severity="danger"
                  size="small"
                  onClick={() => remove(idx)}
                />
              </div>
            </div>
          ))}

          {/* Totales */}
          <div className="flex justify-content-end gap-4 mt-2 text-sm font-medium surface-100 border-round p-3">
            <span>Mano de obra: <b>{laborTotal.toFixed(2)}</b></span>
            <span>Refacciones: <b>{partsTotal.toFixed(2)}</b></span>
            <span className="text-lg text-primary">Total: <b>{total.toFixed(2)}</b></span>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-content-end gap-2 mt-2">
        <Button
          type="button"
          label="Cancelar"
          icon="pi pi-times"
          severity="secondary"
          onClick={onCancel}
          disabled={saving}
        />
        <Button
          type="submit"
          label={order ? "Guardar cambios" : "Crear orden"}
          icon="pi pi-save"
          loading={saving}
        />
      </div>
    </form>
  );
};

export default ServiceOrderForm;
