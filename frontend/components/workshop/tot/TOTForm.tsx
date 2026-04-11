"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";

const TAX_TYPE_OPTIONS = [
  { label: "IVA (16%)", value: "IVA" },
  { label: "Exento", value: "EXEMPT" },
  { label: "Reducido", value: "REDUCED" },
];
import { zodResolver } from "@hookform/resolvers/zod";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from "primereact/inputnumber";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { FileUpload, FileUploadSelectEvent } from "primereact/fileupload";
import { Image } from "primereact/image";
import { handleFormError } from "@/utils/errorHandlers";
import { totService } from "@/app/api/workshop";
import supplierService, {
  type Supplier,
} from "@/app/api/inventory/supplierService";
import ServiceOrderSelector from "@/components/common/ServiceOrderSelector";
import {
  createTOTSchema,
  type CreateTOTFormValues,
} from "@/libs/zods/workshop";
import type {
  WorkshopTOT,
  CreateTOTInput,
  UpdateTOTInput,
} from "@/libs/interfaces/workshop";

interface Props {
  item?: WorkshopTOT | null;
  serviceOrderId?: string;
  formId?: string;
  onSaved: () => void | Promise<void>;
  onSubmittingChange?: (isSubmitting: boolean) => void;
  toast: React.RefObject<any>;
}

export default function TOTForm({
  item,
  serviceOrderId,
  formId,
  onSaved,
  onSubmittingChange,
  toast,
}: Props) {
  const isEdit = !!item;
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [savedPhotoUrls, setSavedPhotoUrls] = useState<string[]>(
    item?.photoUrls ?? [],
  );
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [pendingPreviews, setPendingPreviews] = useState<string[]>([]);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateTOTFormValues>({
    resolver: zodResolver(createTOTSchema),
    mode: "onBlur",
    defaultValues: {
      serviceOrderId: item?.serviceOrderId ?? serviceOrderId ?? "",
      supplierId: item?.supplierId ?? null,
      providerName: item?.providerName ?? null,
      partDescription: item?.partDescription ?? "",
      partSerial: item?.partSerial ?? null,
      photoUrls: item?.photoUrls ?? [],
      requestedWork: item?.requestedWork ?? "",
      technicalInstruction: item?.technicalInstruction ?? null,
      estimatedReturnAt: item?.estimatedReturnAt
        ? item.estimatedReturnAt.split("T")[0]
        : null,
      providerQuote: item?.providerQuote ?? null,
      clientPrice: item?.clientPrice ?? null,
      discountPct: item?.discountPct ?? 0,
      taxType: (item?.taxType as any) ?? "IVA",
      taxRate: item?.taxRate ?? 0.16,
      notes: item?.notes ?? null,
    },
  });

  useEffect(() => {
    supplierService
      .getAll({ isActive: "true", limit: 200 } as any)
      .then((res) => setSuppliers(res.data ?? []))
      .catch(() => {});
  }, []);

  const watchedClientPrice = watch("clientPrice");
  const watchedDiscountPct = watch("discountPct");
  const watchedTaxType = watch("taxType");
  const watchedTaxRate = watch("taxRate");

  const pricingPreview = useMemo(() => {
    const cp = watchedClientPrice ?? 0;
    const disc = (watchedDiscountPct ?? 0) / 100;
    const base = cp - cp * disc;
    const taxAmt =
      watchedTaxType === "EXEMPT"
        ? 0
        : Math.round(base * (watchedTaxRate ?? 0.16) * 100) / 100;
    const total = Math.round((base + taxAmt) * 100) / 100;
    return { base, taxAmt, total };
  }, [watchedClientPrice, watchedDiscountPct, watchedTaxType, watchedTaxRate]);

  const fmtCurrency = (val: number) =>
    val.toLocaleString("es-VE", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    });

  const onFileSelect = (e: FileUploadSelectEvent) => {
    e.files.forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPendingPreviews((prev) => [...prev, event.target?.result as string]);
      };
      reader.readAsDataURL(file);
      setPendingFiles((prev) => [...prev, file]);
    });
  };

  const removePending = (idx: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== idx));
    setPendingPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  // Sube los archivos pendientes a R2 y retorna las URLs nuevas
  const uploadPendingFiles = async (totId: string): Promise<string[]> => {
    if (pendingFiles.length === 0) return [];
    setIsUploadingPhotos(true);
    try {
      const urls = await Promise.all(
        pendingFiles.map((file) =>
          totService
            .uploadPhoto(totId, file)
            .then((r: any) => r.data.url as string),
        ),
      );
      setPendingFiles([]);
      setPendingPreviews([]);
      return urls;
    } finally {
      setIsUploadingPhotos(false);
    }
  };

  const onSubmit = async (values: CreateTOTFormValues) => {
    if (onSubmittingChange) onSubmittingChange(true);
    try {
      if (isEdit && item) {
        // 1. Subir fotos pendientes
        const newUrls = await uploadPendingFiles(item.id);
        const allPhotoUrls = [...savedPhotoUrls, ...newUrls];
        setSavedPhotoUrls(allPhotoUrls);

        const payload: UpdateTOTInput = {
          supplierId: values.supplierId,
          providerName: values.providerName,
          partDescription: values.partDescription,
          partSerial: values.partSerial,
          photoUrls: allPhotoUrls,
          requestedWork: values.requestedWork,
          technicalInstruction: values.technicalInstruction,
          estimatedReturnAt: values.estimatedReturnAt,
          providerQuote: values.providerQuote,
          clientPrice: values.clientPrice,
          discountPct: values.discountPct,
          taxType: values.taxType,
          taxRate: values.taxRate,
          notes: values.notes,
        };
        await totService.update(item.id, payload);
      } else {
        // 1. Crear el TOT
        const payload: CreateTOTInput = {
          serviceOrderId: values.serviceOrderId,
          supplierId: values.supplierId,
          providerName: values.providerName,
          partDescription: values.partDescription,
          partSerial: values.partSerial,
          requestedWork: values.requestedWork,
          technicalInstruction: values.technicalInstruction,
          estimatedReturnAt: values.estimatedReturnAt,
          providerQuote: values.providerQuote,
          clientPrice: values.clientPrice,
          discountPct: values.discountPct,
          taxType: values.taxType,
          taxRate: values.taxRate,
          notes: values.notes,
        };
        const created = await totService.create(payload);
        const newId = (created as any).data.id as string;

        // 2. Subir fotos y actualizar el TOT si hay alguna
        if (pendingFiles.length > 0) {
          const newUrls = await uploadPendingFiles(newId);
          await totService.update(newId, { photoUrls: newUrls });
        }
      }
      await onSaved();
    } catch (error: any) {
      handleFormError(error, toast);
    } finally {
      if (onSubmittingChange) onSubmittingChange(false);
    }
  };

  const supplierOptions = suppliers.map((s) => ({
    label: `${s.code} - ${s.name}${s.specialty ? ` (${s.specialty})` : ""}`,
    value: s.id,
  }));

  return (
    <form
      id={formId || "tot-form"}
      onSubmit={handleSubmit(onSubmit)}
      className="p-fluid"
    >
      <div className="grid formgrid gap-3">
        {/* Orden de Servicio */}
        {!isEdit && (
          <div className="col-12 md:col-6">
            <label className="font-semibold">
              Orden de Servicio <span className="text-red-500">*</span>
            </label>
            <Controller
              name="serviceOrderId"
              control={control}
              render={({ field }) => (
                <ServiceOrderSelector
                  value={field.value}
                  onChange={field.onChange}
                  invalid={!!errors.serviceOrderId}
                />
              )}
            />
            {errors.serviceOrderId && (
              <small className="text-red-500">
                {errors.serviceOrderId.message}
              </small>
            )}
          </div>
        )}

        {/* Proveedor (Supplier) */}
        <div className="col-12 md:col-6">
          <label className="font-semibold">Proveedor (catálogo)</label>
          <Controller
            name="supplierId"
            control={control}
            render={({ field }) => (
              <Dropdown
                {...field}
                options={supplierOptions}
                placeholder="Seleccionar proveedor"
                showClear
                filter
                className="w-full"
              />
            )}
          />
        </div>

        {/* Nombre libre */}
        <div className="col-12 md:col-6">
          <label className="font-semibold">Nombre libre del proveedor</label>
          <Controller
            name="providerName"
            control={control}
            render={({ field }) => (
              <InputText
                {...field}
                value={field.value ?? ""}
                placeholder="Si no está en catálogo"
                className="w-full"
              />
            )}
          />
        </div>

        {/* Descripción de la pieza */}
        <div className="col-12">
          <label className="font-semibold">
            Descripción de la pieza <span className="text-red-500">*</span>
          </label>
          <Controller
            name="partDescription"
            control={control}
            render={({ field }) => (
              <InputTextarea
                {...field}
                rows={2}
                className="w-full"
                autoResize
              />
            )}
          />
          {errors.partDescription && (
            <small className="text-red-500">
              {errors.partDescription.message}
            </small>
          )}
        </div>

        {/* Serial */}
        <div className="col-12 md:col-6">
          <label className="font-semibold">Serial / identificación</label>
          <Controller
            name="partSerial"
            control={control}
            render={({ field }) => (
              <InputText
                {...field}
                value={field.value ?? ""}
                className="w-full"
              />
            )}
          />
        </div>

        {/* Fecha estimada retorno */}
        <div className="col-12 md:col-6">
          <label className="font-semibold">Fecha estimada de retorno</label>
          <Controller
            name="estimatedReturnAt"
            control={control}
            render={({ field }) => (
              <Calendar
                value={field.value ? new Date(field.value) : null}
                onChange={(e) =>
                  field.onChange(
                    e.value
                      ? (e.value as Date).toISOString().split("T")[0]
                      : null,
                  )
                }
                dateFormat="dd/mm/yy"
                showIcon
                className="w-full"
              />
            )}
          />
        </div>

        {/* Trabajo solicitado */}
        <div className="col-12">
          <label className="font-semibold">
            Trabajo solicitado <span className="text-red-500">*</span>
          </label>
          <Controller
            name="requestedWork"
            control={control}
            render={({ field }) => (
              <InputTextarea
                {...field}
                rows={3}
                className="w-full"
                autoResize
              />
            )}
          />
          {errors.requestedWork && (
            <small className="text-red-500">
              {errors.requestedWork.message}
            </small>
          )}
        </div>

        {/* Instrucción técnica */}
        <div className="col-12">
          <label className="font-semibold">Instrucción técnica</label>
          <Controller
            name="technicalInstruction"
            control={control}
            render={({ field }) => (
              <InputTextarea
                {...field}
                value={field.value ?? ""}
                rows={2}
                className="w-full"
                autoResize
              />
            )}
          />
        </div>

        {/* Presupuesto proveedor */}
        <div className="col-12 md:col-6">
          <label className="font-semibold">Presupuesto proveedor</label>
          <Controller
            name="providerQuote"
            control={control}
            render={({ field }) => (
              <InputNumber
                value={field.value ?? null}
                onValueChange={(e) => field.onChange(e.value ?? null)}
                mode="currency"
                currency="USD"
                locale="es-VE"
                className="w-full"
              />
            )}
          />
        </div>

        {/* ─── Precio al cliente ─────────────────────────────── */}
        <div className="col-12">
          <div className="border-top-1 border-surface-300 pt-3 mt-1">
            <span className="font-semibold text-900">Precio al cliente</span>
          </div>
        </div>

        <div className="col-12 md:col-4">
          <label className="font-semibold">Precio base (cliente)</label>
          <Controller
            name="clientPrice"
            control={control}
            render={({ field }) => (
              <InputNumber
                value={field.value ?? null}
                onValueChange={(e) => field.onChange(e.value ?? null)}
                mode="currency"
                currency="USD"
                locale="es-VE"
                className="w-full"
                placeholder="0.00"
              />
            )}
          />
        </div>

        <div className="col-12 md:col-4">
          <label className="font-semibold">Descuento (%)</label>
          <Controller
            name="discountPct"
            control={control}
            render={({ field }) => (
              <InputNumber
                value={field.value ?? 0}
                onValueChange={(e) => field.onChange(e.value ?? 0)}
                suffix=" %"
                min={0}
                max={100}
                minFractionDigits={0}
                maxFractionDigits={2}
                className="w-full"
              />
            )}
          />
        </div>

        <div className="col-12 md:col-4">
          <label className="font-semibold">Tipo de impuesto</label>
          <Controller
            name="taxType"
            control={control}
            render={({ field }) => (
              <Dropdown
                {...field}
                options={TAX_TYPE_OPTIONS}
                className="w-full"
              />
            )}
          />
        </div>

        {/* Preview calculado */}
        {(watchedClientPrice ?? 0) > 0 && (
          <div className="col-12">
            <div className="flex gap-4 p-3 border-round bg-surface-50 border-1 border-surface-200 text-sm">
              <span>
                <span className="text-600">Base: </span>
                <span className="font-semibold">
                  {fmtCurrency(pricingPreview.base)}
                </span>
              </span>
              <span>
                <span className="text-600">Impuesto: </span>
                <span className="font-semibold">
                  {fmtCurrency(pricingPreview.taxAmt)}
                </span>
              </span>
              <span>
                <span className="text-600">Total: </span>
                <span className="font-bold text-primary">
                  {fmtCurrency(pricingPreview.total)}
                </span>
              </span>
            </div>
          </div>
        )}

        {/* Notas */}
        <div className="col-12">
          <label className="font-semibold">Notas</label>
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <InputTextarea
                {...field}
                value={field.value ?? ""}
                rows={2}
                className="w-full"
                autoResize
              />
            )}
          />
        </div>

        {/* Fotos */}
        <div className="col-12">
          <div className="flex justify-between items-center mb-3">
            <label className="font-semibold">Fotos</label>
          </div>

          {/* FileUpload */}
          <div className="mb-4 p-3 border-round bg-surface-50 border-1 border-surface-200">
            <FileUpload
              name="photos[]"
              accept="image/*"
              maxFileSize={5000000}
              onSelect={onFileSelect}
              chooseLabel="Seleccionar fotos"
              uploadLabel="Subir"
              cancelLabel="Cancelar"
              mode="basic"
              auto={false}
              className="w-full"
            />
            <small className="text-500 block mt-2">
              Máximo 5MB por foto. Formatos: JPG, PNG, WEBP.
            </small>
          </div>

          {/* Vista previa de fotos pendientes (se subirán al guardar) */}
          {pendingPreviews.length > 0 && (
            <div className="mb-4 p-3 border-round bg-blue-50 border-1 border-blue-200">
              <div className="text-sm font-semibold text-900 mb-2">
                Fotos por subir ({pendingPreviews.length}) — se subirán al
                guardar
              </div>
              <div className="flex gap-2 flex-wrap">
                {pendingPreviews.map((url, idx) => (
                  <div key={idx} className="relative inline-block">
                    <Image
                      src={url}
                      alt={`Preview ${idx + 1}`}
                      width="100"
                      height="100"
                      className="border-round shadow-1"
                      preview
                      style={{ objectFit: "cover" }}
                    />
                    <Button
                      type="button"
                      icon="pi pi-times"
                      className="p-button-rounded p-button-danger p-button-sm absolute"
                      style={{ top: "-8px", right: "-8px" }}
                      onClick={() => removePending(idx)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fotos guardadas en R2 */}
          {savedPhotoUrls.length > 0 && (
            <div className="p-3 border-round bg-surface-50 border-1 border-surface-200">
              <div className="flex justify-between items-center mb-2">
                <div className="text-sm font-semibold text-900">
                  Fotos guardadas ({savedPhotoUrls.length})
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {savedPhotoUrls.map((url, idx) => (
                  <div key={idx} className="relative inline-block">
                    <Image
                      src={url}
                      alt={`Foto ${idx + 1}`}
                      width="100"
                      height="100"
                      className="border-round shadow-1"
                      preview
                      style={{ objectFit: "cover" }}
                    />
                    <Button
                      type="button"
                      icon="pi pi-trash"
                      className="p-button-rounded p-button-danger p-button-sm absolute"
                      style={{ top: "-8px", right: "-8px" }}
                      onClick={() =>
                        setSavedPhotoUrls((prev) =>
                          prev.filter((_, i) => i !== idx),
                        )
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {savedPhotoUrls.length === 0 && pendingPreviews.length === 0 && (
            <div className="p-3 border-round bg-surface-50 border-1 border-dashed border-surface-300 text-center">
              <p className="text-500 text-sm mb-0">
                <i className="pi pi-image mr-2" />
                No hay fotos. Selecciona archivos para subir.
              </p>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
