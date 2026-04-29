"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Toast } from "primereact/toast";
import customerVehicleService from "@/app/api/crm/customerVehicleService";
import brandsService, { type Brand } from "@/app/api/inventory/brandService";
import modelsService, { type Model } from "@/app/api/inventory/modelService";
import FormActionButtons from "@/shared/components/FormActionButtons";
import {
  createCustomerVehicleSchema,
  type CreateCustomerVehicleInput,
} from "@/libs/zods/crm/customerVehicleZod";
import {
  FUEL_TYPE_OPTIONS,
  TRANSMISSION_TYPE_OPTIONS,
  type CustomerVehicle,
} from "@/libs/interfaces/crm/customerVehicle.interface";
import { handleFormError } from "@/utils/errorHandlers";

export interface VehicleSelectedData {
  id: string;
  plate: string;
  description: string;
}

interface VehicleSelectorProps {
  customerId: string | null | undefined;
  value: string | null | undefined;
  onChange: (vehicleId: string | null) => void;
  onVehicleSelect?: (data: VehicleSelectedData | null) => void;
  disabled?: boolean;
  invalid?: boolean;
  placeholder?: string;
  showCreate?: boolean;
}

export default function VehicleSelector({
  customerId,
  value,
  onChange,
  onVehicleSelect,
  disabled = false,
  invalid = false,
  placeholder = "Seleccionar vehículo...",
  showCreate = true,
}: VehicleSelectorProps) {
  const toast = useRef<Toast>(null);
  const [vehicles, setVehicles] = useState<CustomerVehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [createDialog, setCreateDialog] = useState(false);

  useEffect(() => {
    if (!customerId) {
      setVehicles([]);
      onChange(null);
      onVehicleSelect?.(null);
      return;
    }
    setLoading(true);
    customerVehicleService
      .getAllByCustomer(customerId, { limit: 100 })
      .then((res) => {
        const list = (res as any)?.data ?? res ?? [];
        setVehicles(Array.isArray(list) ? list : []);
      })
      .catch(() => setVehicles([]))
      .finally(() => setLoading(false));
  }, [customerId]);

  const options = useMemo(
    () =>
      vehicles.map((v) => {
        const brand = v.brand?.name ?? "";
        const model = v.vehicleModel?.name ?? "";
        const year = v.year ?? "";
        const detail = [brand, model, year].filter(Boolean).join(" ");
        return {
          label: detail ? `${v.plate} — ${detail}` : v.plate,
          value: v.id,
        };
      }),
    [vehicles],
  );

  const buildDescription = (v: CustomerVehicle): string => {
    const parts = [v.brand?.name, v.vehicleModel?.name, v.year, v.color].filter(
      Boolean,
    );
    return parts.join(" ");
  };

  const handleChange = (vehicleId: string | null) => {
    onChange(vehicleId);
    if (!vehicleId) {
      onVehicleSelect?.(null);
      return;
    }
    const v = vehicles.find((x) => x.id === vehicleId);
    if (v) {
      onVehicleSelect?.({
        id: v.id,
        plate: v.plate,
        description: buildDescription(v),
      });
    }
  };

  const handleCreated = (created: CustomerVehicle) => {
    setCreateDialog(false);
    setVehicles((prev) => [...prev, created]);
    onChange(created.id);
    onVehicleSelect?.({
      id: created.id,
      plate: created.plate,
      description: buildDescription(created),
    });
  };

  const noCustomer = !customerId;
  const noVehicles = !noCustomer && vehicles.length === 0 && !loading;

  const footer =
    showCreate && customerId ? (
      <div className="p-2 border-top-1 surface-border">
        <Button
          label="Nuevo vehículo"
          icon="pi pi-plus"
          text
          size="small"
          type="button"
          className="w-full justify-content-start"
          onClick={() => setCreateDialog(true)}
        />
      </div>
    ) : undefined;

  return (
    <>
      <Toast ref={toast} />

      <Dropdown
        value={value ?? null}
        options={options}
        onChange={(e) => handleChange(e.value)}
        placeholder={
          loading
            ? "Cargando vehículos..."
            : noCustomer
            ? "Selecciona un cliente primero"
            : noVehicles
            ? "Sin vehículos — cree uno"
            : placeholder
        }
        disabled={disabled || loading || noCustomer}
        filter
        showClear
        filterPlaceholder="Buscar por placa..."
        emptyMessage="Sin vehículos registrados"
        emptyFilterMessage="Sin resultados"
        panelFooterTemplate={footer}
        className={invalid ? "p-invalid w-full" : "w-full"}
      />

      {createDialog && customerId && (
        <VehicleCreateDialog
          customerId={customerId}
          visible={createDialog}
          onHide={() => setCreateDialog(false)}
          onCreated={handleCreated}
          toast={toast}
        />
      )}
    </>
  );
}

// ── Inline Create Dialog ────────────────────────────────────────────────────

function VehicleCreateDialog({
  customerId,
  visible,
  onHide,
  onCreated,
  toast,
}: {
  customerId: string;
  visible: boolean;
  onHide: () => void;
  onCreated: (v: CustomerVehicle) => void;
  toast: React.RefObject<Toast | null>;
}) {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [allModels, setAllModels] = useState<Model[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateCustomerVehicleInput>({
    resolver: zodResolver(createCustomerVehicleSchema),
    defaultValues: { plate: "", purchasedHere: false },
  });

  const watchedBrandId = watch("brandId");

  useEffect(() => {
    brandsService
      .getActive("VEHICLE")
      .then((res) => {
        setBrands(Array.isArray(res?.data) ? res.data : []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!watchedBrandId) {
      setModels([]);
      return;
    }
    modelsService
      .getAll({ brandId: watchedBrandId, limit: 200 })
      .then((res) => {
        const all = Array.isArray(res?.data) ? res.data : [];
        setAllModels(all);
        setModels(all.filter((m) => m.brandId === watchedBrandId));
      })
      .catch(() => setModels([]));
  }, [watchedBrandId]);

  const onSubmit = async (data: CreateCustomerVehicleInput) => {
    setIsSubmitting(true);
    try {
      const res = await customerVehicleService.create(customerId, {
        plate: data.plate,
        brandId: data.brandId || undefined,
        modelId: data.modelId || undefined,
        vin: data.vin || undefined,
        year: data.year ?? undefined,
        color: data.color || undefined,
        fuelType: data.fuelType ?? undefined,
        transmission: data.transmission ?? undefined,
        mileage: data.mileage ?? undefined,
        purchasedHere: data.purchasedHere ?? false,
      } as any);
      const created = (res as any)?.data ?? res;
      toast.current?.show({
        severity: "success",
        summary: "Vehículo creado",
        life: 3000,
      });
      onCreated(created);
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setIsSubmitting(false);
    }
  };

  const brandOptions = brands.map((b) => ({ label: b.name, value: b.id }));
  const modelOptions = models.map((m) => ({ label: m.name, value: m.id }));

  return (
    <Dialog
      visible={visible}
      style={{ width: "600px" }}
      breakpoints={{ "900px": "75vw", "600px": "100vw" }}
      header="Nuevo vehículo"
      modal
      onHide={onHide}
      footer={
        <FormActionButtons
          formId="vehicle-create-selector"
          isUpdate={false}
          onCancel={onHide}
          isSubmitting={isSubmitting}
        />
      }
    >
      <form
        id="vehicle-create-selector"
        onSubmit={handleSubmit(onSubmit)}
        className="p-fluid"
      >
        <div className="grid">
          <div className="col-12 md:col-6">
            <label className="block text-900 font-medium mb-2">
              Placa <span className="text-red-500">*</span>
            </label>
            <Controller
              name="plate"
              control={control}
              render={({ field }) => (
                <InputText
                  {...field}
                  placeholder="ABC-123"
                  className={errors.plate ? "p-invalid" : ""}
                  autoFocus
                />
              )}
            />
            {errors.plate && (
              <small className="p-error block mt-1">
                {errors.plate.message}
              </small>
            )}
          </div>

          <div className="col-12 md:col-6">
            <label className="block text-900 font-medium mb-2">VIN</label>
            <Controller
              name="vin"
              control={control}
              render={({ field }) => (
                <InputText
                  {...field}
                  value={field.value ?? ""}
                  placeholder="Opcional"
                />
              )}
            />
          </div>

          <div className="col-12 md:col-6">
            <label className="block text-900 font-medium mb-2">Marca</label>
            <Controller
              name="brandId"
              control={control}
              render={({ field }) => (
                <Dropdown
                  value={field.value ?? null}
                  options={brandOptions}
                  onChange={(e) => {
                    field.onChange(e.value);
                    setValue("modelId", undefined);
                  }}
                  placeholder="Seleccionar marca"
                  filter
                  showClear
                />
              )}
            />
          </div>

          <div className="col-12 md:col-6">
            <label className="block text-900 font-medium mb-2">Modelo</label>
            <Controller
              name="modelId"
              control={control}
              render={({ field }) => (
                <Dropdown
                  value={field.value ?? null}
                  options={modelOptions}
                  onChange={(e) => field.onChange(e.value)}
                  placeholder={
                    watchedBrandId
                      ? "Seleccionar modelo"
                      : "Selecciona marca primero"
                  }
                  disabled={!watchedBrandId}
                  filter
                  showClear
                />
              )}
            />
          </div>

          <div className="col-6 md:col-3">
            <label className="block text-900 font-medium mb-2">Año</label>
            <Controller
              name="year"
              control={control}
              render={({ field }) => (
                <InputNumber
                  value={field.value ?? null}
                  onValueChange={(e) => field.onChange(e.value)}
                  useGrouping={false}
                  placeholder="2024"
                />
              )}
            />
          </div>

          <div className="col-6 md:col-3">
            <label className="block text-900 font-medium mb-2">Color</label>
            <Controller
              name="color"
              control={control}
              render={({ field }) => (
                <InputText
                  {...field}
                  value={field.value ?? ""}
                  placeholder="Blanco"
                />
              )}
            />
          </div>

          <div className="col-6 md:col-3">
            <label className="block text-900 font-medium mb-2">
              Combustible
            </label>
            <Controller
              name="fuelType"
              control={control}
              render={({ field }) => (
                <Dropdown
                  value={field.value ?? null}
                  options={FUEL_TYPE_OPTIONS}
                  onChange={(e) => field.onChange(e.value)}
                  placeholder="Tipo"
                  showClear
                />
              )}
            />
          </div>

          <div className="col-6 md:col-3">
            <label className="block text-900 font-medium mb-2">
              Transmisión
            </label>
            <Controller
              name="transmission"
              control={control}
              render={({ field }) => (
                <Dropdown
                  value={field.value ?? null}
                  options={TRANSMISSION_TYPE_OPTIONS}
                  onChange={(e) => field.onChange(e.value)}
                  placeholder="Tipo"
                  showClear
                />
              )}
            />
          </div>

          <div className="col-12 md:col-6">
            <label className="block text-900 font-medium mb-2">
              Kilometraje
            </label>
            <Controller
              name="mileage"
              control={control}
              render={({ field }) => (
                <InputNumber
                  value={field.value ?? null}
                  onValueChange={(e) => field.onChange(e.value)}
                  suffix=" km"
                  placeholder="0"
                />
              )}
            />
          </div>
        </div>
      </form>
    </Dialog>
  );
}
