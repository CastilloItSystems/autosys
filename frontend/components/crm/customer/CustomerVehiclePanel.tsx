"use client";
import React, { useEffect, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from "primereact/inputnumber";
import { InputSwitch } from "primereact/inputswitch";
import { Dropdown } from "primereact/dropdown";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Divider } from "primereact/divider";

import customerVehicleService, { ServiceHistoryItem } from "@/app/api/crm/customerVehicleService";
import brandsService, { Brand } from "@/app/api/inventory/brandService";
import modelsService, { Model } from "@/app/api/inventory/modelService";
import {
  CustomerVehicle,
  FUEL_TYPE_OPTIONS,
  TRANSMISSION_TYPE_OPTIONS,
} from "@/libs/interfaces/crm/customerVehicle.interface";
import {
  createCustomerVehicleSchema,
  CreateCustomerVehicleInput,
} from "@/libs/zods/crm/customerVehicleZod";
import { handleFormError } from "@/utils/errorHandlers";

interface Props {
  customerId: string;
}

export default function CustomerVehiclePanel({ customerId }: Props) {
  const toast = useRef<Toast>(null);
  const [vehicles, setVehicles] = useState<CustomerVehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editing, setEditing] = useState<CustomerVehicle | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<Model[]>([]);

  // Service history
  const [historyVisible, setHistoryVisible] = useState(false);
  const [historyVehicle, setHistoryVehicle] = useState<CustomerVehicle | null>(null);
  const [serviceHistory, setServiceHistory] = useState<ServiceHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateCustomerVehicleInput>({
    resolver: zodResolver(createCustomerVehicleSchema),
    defaultValues: {
      purchasedHere: false,
    },
  });

  const watchedBrandId = watch("brandId");

  // ── Load vehicles ──────────────────────────────────────────────────────────

  const load = async () => {
    setLoading(true);
    try {
      const res = await customerVehicleService.getAllByCustomer(customerId, {
        limit: 50,
      });
      setVehicles((res.data as any)?.data ?? res.data ?? []);
    } catch {
      toast.current?.show({ severity: "error", summary: "Error al cargar vehículos" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [customerId]);

  // ── Load brands on mount ───────────────────────────────────────────────────

  useEffect(() => {
    brandsService.getActive("VEHICLE").then((res) => {
      setBrands((res.data as any) ?? []);
    }).catch(() => {});
  }, []);

  // ── Load models when brand changes ─────────────────────────────────────────

  useEffect(() => {
    if (!watchedBrandId) {
      setModels([]);
      return;
    }
    modelsService
      .getActive("VEHICLE")
      .then((res) => {
        const all: Model[] = (res as any).data ?? [];
        setModels(all.filter((m) => m.brandId === watchedBrandId));
      })
      .catch(() => {});
  }, [watchedBrandId]);

  // ── Open dialog ────────────────────────────────────────────────────────────

  const openNew = () => {
    setEditing(null);
    reset({ purchasedHere: false });
    setDialogVisible(true);
  };

  const openEdit = (v: CustomerVehicle) => {
    setEditing(v);
    reset({
      plate: v.plate,
      brandId: v.brandId ?? undefined,
      modelId: v.modelId ?? undefined,
      vin: v.vin ?? undefined,
      year: v.year ?? undefined,
      color: v.color ?? undefined,
      fuelType: (v.fuelType as any) ?? undefined,
      transmission: (v.transmission as any) ?? undefined,
      mileage: v.mileage ?? undefined,
      purchasedHere: v.purchasedHere,
      notes: v.notes ?? undefined,
    });
    setDialogVisible(true);
  };

  // ── Submit ─────────────────────────────────────────────────────────────────

  const onSubmit = async (data: CreateCustomerVehicleInput) => {
    setSubmitting(true);
    try {
      const payload = {
        ...data,
        brandId: data.brandId || undefined,
        modelId: data.modelId || undefined,
        vin: data.vin || undefined,
        color: data.color || undefined,
        notes: data.notes || undefined,
      };
      if (editing) {
        await customerVehicleService.update(customerId, editing.id, payload as any);
        toast.current?.show({ severity: "success", summary: "Vehículo actualizado" });
      } else {
        await customerVehicleService.create(customerId, payload as any);
        toast.current?.show({ severity: "success", summary: "Vehículo registrado" });
      }
      setDialogVisible(false);
      load();
    } catch (err) {
      handleFormError(err, toast);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Service history ────────────────────────────────────────────────────────

  const openHistory = async (v: CustomerVehicle) => {
    setHistoryVehicle(v);
    setHistoryVisible(true);
    setHistoryLoading(true);
    try {
      const res = await customerVehicleService.getServiceHistory(customerId, v.id);
      setServiceHistory((res as any)?.data?.serviceOrders ?? []);
    } catch {
      toast.current?.show({ severity: "error", summary: "Error al cargar historial" });
    } finally {
      setHistoryLoading(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────

  const confirmDelete = (v: CustomerVehicle) => {
    confirmDialog({
      message: `¿Eliminar el vehículo con placa ${v.plate}?`,
      header: "Confirmar eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      accept: async () => {
        try {
          await customerVehicleService.delete(customerId, v.id);
          toast.current?.show({ severity: "success", summary: "Vehículo eliminado" });
          load();
        } catch {
          toast.current?.show({ severity: "error", summary: "Error al eliminar" });
        }
      },
    });
  };

  // ── Columns ────────────────────────────────────────────────────────────────

  const vehicleBody = (v: CustomerVehicle) => (
    <div>
      <div className="font-semibold">{v.brand?.name ?? "—"} {v.vehicleModel?.name ?? ""}</div>
      <div className="text-xs text-500">{v.plate}{v.year ? ` · ${v.year}` : ""}{v.color ? ` · ${v.color}` : ""}</div>
    </div>
  );

  const mileageBody = (v: CustomerVehicle) =>
    v.mileage != null ? `${v.mileage.toLocaleString()} km` : "—";

  const statusBody = (v: CustomerVehicle) => (
    <Tag
      value={v.isActive ? "Activo" : "Inactivo"}
      severity={v.isActive ? "success" : "secondary"}
    />
  );

  const purchasedBody = (v: CustomerVehicle) =>
    v.purchasedHere ? <i className="pi pi-check-circle text-green-500" /> : null;

  const actionsBody = (v: CustomerVehicle) => (
    <div className="flex gap-1">
      <Button icon="pi pi-history" rounded text severity="info" size="small" tooltip="Historial de servicios" onClick={() => openHistory(v)} />
      <Button icon="pi pi-pencil" rounded text severity="secondary" size="small" onClick={() => openEdit(v)} />
      <Button icon="pi pi-trash" rounded text severity="danger" size="small" onClick={() => confirmDelete(v)} />
    </div>
  );

  // ── Form dialog ────────────────────────────────────────────────────────────

  const dialogFooter = (
    <div className="flex justify-content-end gap-2">
      <Button label="Cancelar" outlined severity="secondary" onClick={() => setDialogVisible(false)} disabled={submitting} />
      <Button
        label={editing ? "Guardar" : "Registrar"}
        icon="pi pi-check"
        form="vehicle-form"
        type="submit"
        loading={submitting}
      />
    </div>
  );

  return (
    <>
      <Toast ref={toast} />
      <ConfirmDialog />

      <div className="flex justify-content-between align-items-center mb-3">
        <span className="text-lg font-semibold text-primary">
          <i className="pi pi-car mr-2" />Vehículos del Cliente
        </span>
        <Button label="Agregar" icon="pi pi-plus" size="small" onClick={openNew} />
      </div>

      <DataTable
        value={vehicles}
        loading={loading}
        emptyMessage="No hay vehículos registrados"
        size="small"
        stripedRows
      >
        <Column header="Vehículo" body={vehicleBody} />
        <Column field="vin" header="VIN" body={(v) => v.vin || "—"} />
        <Column header="Combustible" body={(v) => v.fuelType || "—"} />
        <Column header="Transmisión" body={(v) => v.transmission || "—"} />
        <Column header="Kilometraje" body={mileageBody} />
        <Column header="Comprado aquí" body={purchasedBody} style={{ width: "8rem", textAlign: "center" }} />
        <Column header="Estado" body={statusBody} style={{ width: "7rem" }} />
        <Column header="" body={actionsBody} style={{ width: "6rem" }} />
      </DataTable>

      {/* Service History Dialog */}
      <Dialog
        visible={historyVisible}
        onHide={() => setHistoryVisible(false)}
        header={
          <div className="flex align-items-center gap-2">
            <i className="pi pi-history text-primary" />
            <span>Historial de Servicios · {historyVehicle?.plate ?? ""}</span>
            {historyVehicle?.brand?.name && (
              <span className="text-xs text-500 font-normal">
                {historyVehicle.brand.name} {historyVehicle.vehicleModel?.name ?? ""}
              </span>
            )}
          </div>
        }
        style={{ width: "860px" }}
        modal
        draggable={false}
      >
        <DataTable
          value={serviceHistory}
          loading={historyLoading}
          emptyMessage="Sin órdenes de servicio registradas"
          size="small"
          stripedRows
          expandedRows={undefined}
        >
          <Column field="folio" header="Folio" style={{ width: "8rem" }} />
          <Column
            field="status"
            header="Estado"
            body={(so) => <Tag value={so.status} severity={so.status === "DELIVERED" ? "success" : so.status === "CANCELLED" ? "danger" : "info"} />}
            style={{ width: "8rem" }}
          />
          <Column
            header="Recibido"
            body={(so) => so.receivedAt ? new Date(so.receivedAt).toLocaleDateString("es-VE") : "—"}
            style={{ width: "8rem" }}
          />
          <Column
            header="Entregado"
            body={(so) => so.deliveredAt ? new Date(so.deliveredAt).toLocaleDateString("es-VE") : "—"}
            style={{ width: "8rem" }}
          />
          <Column
            header="Km Entrada"
            body={(so) => so.mileageIn != null ? `${so.mileageIn.toLocaleString()} km` : "—"}
            style={{ width: "8rem" }}
          />
          <Column
            header="Km Salida"
            body={(so) => so.mileageOut != null ? `${so.mileageOut.toLocaleString()} km` : "—"}
            style={{ width: "8rem" }}
          />
          <Column
            header="Total"
            body={(so) => `$${Number(so.total).toFixed(2)}`}
            style={{ width: "7rem", textAlign: "right" }}
          />
          <Column field="diagnosisNotes" header="Diagnóstico" body={(so) => so.diagnosisNotes || "—"} />
        </DataTable>
      </Dialog>

      <Dialog
        visible={dialogVisible}
        onHide={() => setDialogVisible(false)}
        header={editing ? "Editar Vehículo" : "Registrar Vehículo"}
        style={{ width: "680px" }}
        footer={dialogFooter}
        modal
        draggable={false}
      >
        <form id="vehicle-form" onSubmit={handleSubmit(onSubmit)} className="p-fluid">
          <div className="grid formgrid row-gap-2">

            {/* Placa */}
            <div className="col-12 md:col-6 field">
              <label className="font-semibold">Placa <span className="text-red-500">*</span></label>
              <InputText
                {...register("plate")}
                placeholder="AAA-123"
                className={errors.plate ? "p-invalid" : ""}
                style={{ textTransform: "uppercase" }}
              />
              {errors.plate && <small className="p-error">{errors.plate.message}</small>}
            </div>

            {/* VIN */}
            <div className="col-12 md:col-6 field">
              <label>VIN / N° Carrocería</label>
              <InputText {...register("vin")} placeholder="17 caracteres" />
            </div>

            <div className="col-12"><Divider className="my-1" /></div>

            {/* Marca */}
            <div className="col-12 md:col-6 field">
              <label className="font-semibold">Marca</label>
              <Controller
                name="brandId"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    value={field.value || null}
                    onChange={(e) => {
                      field.onChange(e.value);
                    }}
                    options={brands}
                    optionLabel="name"
                    optionValue="id"
                    placeholder="Seleccionar marca"
                    showClear
                    filter
                  />
                )}
              />
            </div>

            {/* Modelo */}
            <div className="col-12 md:col-6 field">
              <label className="font-semibold">Modelo</label>
              <Controller
                name="modelId"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    value={field.value || null}
                    onChange={(e) => field.onChange(e.value)}
                    options={models}
                    optionLabel="name"
                    optionValue="id"
                    placeholder={watchedBrandId ? "Seleccionar modelo" : "Seleccione marca primero"}
                    disabled={!watchedBrandId}
                    showClear
                    filter
                  />
                )}
              />
            </div>

            {/* Año */}
            <div className="col-12 md:col-4 field">
              <label>Año</label>
              <Controller
                name="year"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    value={field.value ?? null}
                    onValueChange={(e) => field.onChange(e.value)}
                    min={1900}
                    max={2100}
                    useGrouping={false}
                    placeholder="2024"
                  />
                )}
              />
            </div>

            {/* Color */}
            <div className="col-12 md:col-4 field">
              <label>Color</label>
              <InputText {...register("color")} placeholder="Blanco, Negro..." />
            </div>

            {/* Km */}
            <div className="col-12 md:col-4 field">
              <label>Kilometraje</label>
              <Controller
                name="mileage"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    value={field.value ?? null}
                    onValueChange={(e) => field.onChange(e.value)}
                    min={0}
                    suffix=" km"
                    useGrouping
                  />
                )}
              />
            </div>

            {/* Combustible */}
            <div className="col-12 md:col-6 field">
              <label>Tipo de Combustible</label>
              <Controller
                name="fuelType"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    value={field.value || null}
                    onChange={(e) => field.onChange(e.value)}
                    options={FUEL_TYPE_OPTIONS}
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Seleccionar"
                    showClear
                  />
                )}
              />
            </div>

            {/* Transmisión */}
            <div className="col-12 md:col-6 field">
              <label>Transmisión</label>
              <Controller
                name="transmission"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    value={field.value || null}
                    onChange={(e) => field.onChange(e.value)}
                    options={TRANSMISSION_TYPE_OPTIONS}
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Seleccionar"
                    showClear
                  />
                )}
              />
            </div>

            {/* Comprado aquí */}
            <div className="col-12 field flex align-items-center gap-3">
              <Controller
                name="purchasedHere"
                control={control}
                render={({ field }) => (
                  <InputSwitch
                    checked={field.value ?? false}
                    onChange={(e) => field.onChange(e.value)}
                  />
                )}
              />
              <label className="mb-0">Vehículo comprado en esta empresa</label>
            </div>

            {/* Notas */}
            <div className="col-12 field">
              <label>Notas</label>
              <InputTextarea {...register("notes")} rows={2} placeholder="Observaciones del vehículo" />
            </div>

          </div>
        </form>
      </Dialog>
    </>
  );
}
