"use client";
import React, { useEffect, useState } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { AutoComplete } from "primereact/autocomplete";
import { Chips } from "primereact/chips";
import { Checkbox } from "primereact/checkbox";
import { Button } from "primereact/button";
import { Divider } from "primereact/divider";
import { ProgressSpinner } from "primereact/progressspinner";
import WorkshopItemsTable from "../shared/WorkshopItemsTable";
import {
  workshopOperationService,
  serviceTypeService,
  technicianSpecialtyService,
} from "@/app/api/workshop";
import itemService from "@/app/api/inventory/itemService";
import { handleFormError } from "@/utils/errorHandlers";
import {
  createWorkshopOperationSchema,
  updateWorkshopOperationSchema,
  DIFFICULTY_OPTIONS,
  type CreateWorkshopOperationForm,
} from "@/libs/zods/workshop/workshopOperationZod";
import type {
  WorkshopOperation,
  ServiceType,
  TechnicianSpecialty,
} from "@/libs/interfaces/workshop";

interface WorkshopOperationFormProps {
  operation: WorkshopOperation | null;
  onSave: () => void | Promise<void>;
  formId?: string;
  onSubmittingChange?: (v: boolean) => void;
  toast: React.RefObject<any>;
}

const EMPTY_DEFAULTS: CreateWorkshopOperationForm = {
  code: "",
  name: "",
  description: "",
  serviceTypeId: null,
  difficulty: "STANDARD",
  requiredSpecialtyId: null,
  standardMinutes: null,
  minMinutes: null,
  maxMinutes: null,
  listPrice: 0,
  costPrice: 0,
  warrantyDays: null,
  warrantyKm: null,
  requiredEquipment: "",
  procedure: "",
  isExternalService: false,
  tags: [],
  suggestedMaterials: [],
};

export default function WorkshopOperationForm({
  operation,
  onSave,
  formId,
  onSubmittingChange,
  toast,
}: WorkshopOperationFormProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [specialties, setSpecialties] = useState<TechnicianSpecialty[]>([]);
  const [itemSuggestions, setItemSuggestions] = useState<any[]>([]);
  const [selectedItemsMap, setSelectedItemsMap] = useState<Record<string, any>>(
    {},
  );

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CreateWorkshopOperationForm>({
    resolver: zodResolver(
      operation ? updateWorkshopOperationSchema : createWorkshopOperationSchema,
    ),
    mode: "onBlur",
    defaultValues: EMPTY_DEFAULTS,
  });

  const {
    fields: materialFields,
    append: appendMaterial,
    remove: removeMaterial,
    move: moveMaterial,
  } = useFieldArray({
    control,
    name: "suggestedMaterials",
  });

  const searchItems = async (query: string) => {
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
  };

  const resolveItem = (val: any): any => {
    if (!val) return "";
    if (typeof val !== "string") return val;
    const found =
      selectedItemsMap[val] ?? itemSuggestions.find((s) => s.id === val);
    return found ?? val;
  };

  useEffect(() => {
    Promise.all([
      serviceTypeService
        .getAll({ isActive: "true", limit: 200 })
        .then((r) => setServiceTypes(r.data ?? []))
        .catch(() => {}),
      technicianSpecialtyService
        .getAll({ isActive: "true", limit: 200 })
        .then((r) => setSpecialties(r.data ?? []))
        .catch(() => {}),
    ]).finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (operation) {
      reset({
        code: operation.code ?? "",
        name: operation.name ?? "",
        description: operation.description ?? "",
        serviceTypeId: operation.serviceTypeId ?? null,
        difficulty: (operation.difficulty as any) ?? "STANDARD",
        requiredSpecialtyId: operation.requiredSpecialtyId ?? null,
        standardMinutes: operation.standardMinutes ?? null,
        minMinutes: operation.minMinutes ?? null,
        maxMinutes: operation.maxMinutes ?? null,
        listPrice: operation.listPrice ?? 0,
        costPrice: operation.costPrice ?? 0,
        warrantyDays: operation.warrantyDays ?? null,
        warrantyKm: operation.warrantyKm ?? null,
        requiredEquipment: operation.requiredEquipment ?? "",
        procedure: operation.procedure ?? "",
        isExternalService: operation.isExternalService ?? false,
        tags: operation.tags ?? [],
        suggestedMaterials: (operation.suggestedMaterials ?? []).map((m) => {
          if (m.itemId && (m as any).item) {
            setSelectedItemsMap((prev) => ({
              ...prev,
              [m.itemId!]: (m as any).item,
            }));
          }
          return {
            itemId: m.itemId ?? null,
            description: m.description,
            quantity: m.quantity ?? 1,
            isRequired: m.isRequired ?? false,
            notes: m.notes ?? null,
          };
        }),
      });
    } else {
      reset(EMPTY_DEFAULTS);
    }
  }, [operation, reset, isLoading]);

  const onSubmit = async (data: CreateWorkshopOperationForm) => {
    onSubmittingChange?.(true);
    try {
      const payload = {
        ...data,
        description: data.description || undefined,
        serviceTypeId: data.serviceTypeId || undefined,
        requiredSpecialtyId: data.requiredSpecialtyId || undefined,
        requiredEquipment: data.requiredEquipment || undefined,
        procedure: data.procedure || undefined,
      };
      if (operation?.id) {
        await workshopOperationService.update(operation.id, payload as any);
      } else {
        await workshopOperationService.create(payload as any);
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
      id={formId ?? "workshop-operation-form"}
      onSubmit={handleSubmit(onSubmit)}
      className="p-fluid"
    >
      <div className="grid">
        {/* ── SECCIÓN: Información básica ── */}
        <div className="col-12">
          <h5 className="text-700 font-semibold mb-0 mt-1">
            Información básica
          </h5>
        </div>

        {/* Código */}
        <div className="col-12 md:col-4">
          <label htmlFor="code" className="block text-900 font-medium mb-2">
            Código <span className="text-red-500">*</span>
          </label>
          <Controller
            name="code"
            control={control}
            render={({ field }) => (
              <InputText
                id="code"
                {...field}
                placeholder="Ej: CAMB-ACEITE"
                className={errors.code ? "p-invalid" : ""}
                autoFocus
                disabled={!!operation?.id}
                title={operation?.id ? "El código no puede ser modificado" : ""}
              />
            )}
          />
          {errors.code && (
            <small className="p-error block mt-1">{errors.code.message}</small>
          )}
        </div>

        {/* Nombre */}
        <div className="col-12 md:col-8">
          <label htmlFor="name" className="block text-900 font-medium mb-2">
            Nombre <span className="text-red-500">*</span>
          </label>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <InputText
                id="name"
                {...field}
                placeholder="Ej: Cambio de aceite y filtro"
                className={errors.name ? "p-invalid" : ""}
              />
            )}
          />
          {errors.name && (
            <small className="p-error block mt-1">{errors.name.message}</small>
          )}
        </div>

        {/* Tipo de Servicio */}
        <div className="col-12 md:col-6">
          <label
            htmlFor="serviceTypeId"
            className="block text-900 font-medium mb-2"
          >
            Tipo de Servicio
          </label>
          <Controller
            name="serviceTypeId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="serviceTypeId"
                value={field.value ?? null}
                onChange={(e) => field.onChange(e.value ?? null)}
                options={serviceTypes}
                optionLabel="name"
                optionValue="id"
                showClear
                filter
                placeholder="Sin categoría"
                className={errors.serviceTypeId ? "p-invalid" : ""}
              />
            )}
          />
        </div>

        {/* Descripción */}
        <div className="col-12 md:col-6">
          <label
            htmlFor="description"
            className="block text-900 font-medium mb-2"
          >
            Descripción
          </label>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <InputTextarea
                id="description"
                {...field}
                value={field.value ?? ""}
                rows={2}
                placeholder="Descripción breve de la operación"
                className={errors.description ? "p-invalid" : ""}
              />
            )}
          />
        </div>

        {/* ── SECCIÓN: Clasificación ── */}
        <div className="col-12">
          <Divider className="my-2" />
          <h5 className="text-700 font-semibold mb-0">Clasificación técnica</h5>
        </div>

        {/* Dificultad */}
        <div className="col-12 md:col-6">
          <label
            htmlFor="difficulty"
            className="block text-900 font-medium mb-2"
          >
            Dificultad
          </label>
          <Controller
            name="difficulty"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="difficulty"
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={[...DIFFICULTY_OPTIONS]}
                optionLabel="label"
                optionValue="value"
                className={errors.difficulty ? "p-invalid" : ""}
              />
            )}
          />
        </div>

        {/* Especialidad requerida */}
        <div className="col-12 md:col-6">
          <label
            htmlFor="requiredSpecialtyId"
            className="block text-900 font-medium mb-2"
          >
            Especialidad requerida
          </label>
          <Controller
            name="requiredSpecialtyId"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="requiredSpecialtyId"
                value={field.value ?? null}
                onChange={(e) => field.onChange(e.value ?? null)}
                options={specialties}
                optionLabel="name"
                optionValue="id"
                showClear
                filter
                placeholder="Sin especialidad específica"
                className={errors.requiredSpecialtyId ? "p-invalid" : ""}
              />
            )}
          />
        </div>

        {/* Equipamiento requerido */}
        <div className="col-12 md:col-9">
          <label
            htmlFor="requiredEquipment"
            className="block text-900 font-medium mb-2"
          >
            Equipamiento / bahía requerida
          </label>
          <Controller
            name="requiredEquipment"
            control={control}
            render={({ field }) => (
              <InputText
                id="requiredEquipment"
                {...field}
                value={field.value ?? ""}
                placeholder="Ej: Elevador hidráulico, Escáner OBD2"
              />
            )}
          />
        </div>

        {/* Servicio externo */}
        <div className="col-12 md:col-3 flex align-items-end pb-2">
          <Controller
            name="isExternalService"
            control={control}
            render={({ field }) => (
              <div className="flex align-items-center gap-2">
                <Checkbox
                  inputId="isExternalService"
                  checked={field.value ?? false}
                  onChange={(e) => field.onChange(e.checked)}
                />
                <label
                  htmlFor="isExternalService"
                  className="text-900 cursor-pointer"
                >
                  Subcontratado
                </label>
              </div>
            )}
          />
        </div>

        {/* Tags */}
        <div className="col-12">
          <label htmlFor="tags" className="block text-900 font-medium mb-2">
            Etiquetas (tags)
          </label>
          <Controller
            name="tags"
            control={control}
            render={({ field }) => (
              <Chips
                id="tags"
                value={field.value ?? []}
                onChange={(e) => field.onChange(e.value ?? [])}
                placeholder="Escribe y presiona Enter"
                separator=","
              />
            )}
          />
          <small className="text-500">
            Presiona Enter o coma para agregar. Ej: frenos, ABS, pastillas
          </small>
        </div>

        {/* ── SECCIÓN: Tiempos ── */}
        <div className="col-12">
          <Divider className="my-2" />
          <h5 className="text-700 font-semibold mb-0">Tiempos</h5>
        </div>

        <div className="col-12 md:col-4">
          <label
            htmlFor="standardMinutes"
            className="block text-900 font-medium mb-2"
          >
            Min. facturados
          </label>
          <Controller
            name="standardMinutes"
            control={control}
            render={({ field }) => (
              <InputNumber
                id="standardMinutes"
                value={field.value ?? null}
                onValueChange={(e) => field.onChange(e.value ?? null)}
                min={0}
                placeholder="Ej: 60"
                suffix=" min"
              />
            )}
          />
          <small className="text-500">Lo que se le cobra al cliente</small>
        </div>

        <div className="col-12 md:col-4">
          <label
            htmlFor="minMinutes"
            className="block text-900 font-medium mb-2"
          >
            Min. mínimos
          </label>
          <Controller
            name="minMinutes"
            control={control}
            render={({ field }) => (
              <InputNumber
                id="minMinutes"
                value={field.value ?? null}
                onValueChange={(e) => field.onChange(e.value ?? null)}
                min={0}
                placeholder="Ej: 45"
                suffix=" min"
              />
            )}
          />
        </div>

        <div className="col-12 md:col-4">
          <label
            htmlFor="maxMinutes"
            className="block text-900 font-medium mb-2"
          >
            Min. máximos
          </label>
          <Controller
            name="maxMinutes"
            control={control}
            render={({ field }) => (
              <InputNumber
                id="maxMinutes"
                value={field.value ?? null}
                onValueChange={(e) => field.onChange(e.value ?? null)}
                min={0}
                placeholder="Ej: 90"
                suffix=" min"
              />
            )}
          />
        </div>

        {/* ── SECCIÓN: Precios ── */}
        <div className="col-12">
          <Divider className="my-2" />
          <h5 className="text-700 font-semibold mb-0">
            Precios de mano de obra
          </h5>
        </div>

        <div className="col-12 md:col-6">
          <label
            htmlFor="listPrice"
            className="block text-900 font-medium mb-2"
          >
            Precio lista <span className="text-red-500">*</span>
          </label>
          <Controller
            name="listPrice"
            control={control}
            render={({ field }) => (
              <InputNumber
                id="listPrice"
                value={field.value ?? null}
                onValueChange={(e) => field.onChange(e.value ?? 0)}
                mode="currency"
                currency="USD"
                locale="es-VE"
                minFractionDigits={2}
                min={0}
                placeholder="0.00"
                className={errors.listPrice ? "p-invalid" : ""}
              />
            )}
          />
          {errors.listPrice && (
            <small className="p-error block mt-1">
              {errors.listPrice.message}
            </small>
          )}
        </div>

        <div className="col-12 md:col-6">
          <label
            htmlFor="costPrice"
            className="block text-900 font-medium mb-2"
          >
            Costo interno
          </label>
          <Controller
            name="costPrice"
            control={control}
            render={({ field }) => (
              <InputNumber
                id="costPrice"
                value={field.value ?? null}
                onValueChange={(e) => field.onChange(e.value ?? 0)}
                mode="currency"
                currency="USD"
                locale="es-VE"
                minFractionDigits={2}
                min={0}
                placeholder="0.00"
              />
            )}
          />
          <small className="text-500">Para calcular margen de ganancia</small>
        </div>

        {/* ── SECCIÓN: Garantía ── */}
        <div className="col-12">
          <Divider className="my-2" />
          <h5 className="text-700 font-semibold mb-0">Garantía incluida</h5>
        </div>

        <div className="col-12 md:col-6">
          <label
            htmlFor="warrantyDays"
            className="block text-900 font-medium mb-2"
          >
            Días de garantía
          </label>
          <Controller
            name="warrantyDays"
            control={control}
            render={({ field }) => (
              <InputNumber
                id="warrantyDays"
                value={field.value ?? null}
                onValueChange={(e) => field.onChange(e.value ?? null)}
                min={0}
                placeholder="Ej: 30"
                suffix=" días"
              />
            )}
          />
        </div>

        <div className="col-12 md:col-6">
          <label
            htmlFor="warrantyKm"
            className="block text-900 font-medium mb-2"
          >
            Kilómetros de garantía
          </label>
          <Controller
            name="warrantyKm"
            control={control}
            render={({ field }) => (
              <InputNumber
                id="warrantyKm"
                value={field.value ?? null}
                onValueChange={(e) => field.onChange(e.value ?? null)}
                min={0}
                placeholder="Ej: 5000"
                suffix=" km"
                useGrouping
              />
            )}
          />
        </div>

        {/* ── SECCIÓN: Procedimiento ── */}
        <div className="col-12">
          <Divider className="my-2" />
          <h5 className="text-700 font-semibold mb-0">Procedimiento técnico</h5>
        </div>

        <div className="col-12">
          <label
            htmlFor="procedure"
            className="block text-900 font-medium mb-2"
          >
            Pasos / instrucciones
          </label>
          <Controller
            name="procedure"
            control={control}
            render={({ field }) => (
              <InputTextarea
                id="procedure"
                {...field}
                value={field.value ?? ""}
                rows={5}
                placeholder="Detalla los pasos técnicos para ejecutar esta operación..."
              />
            )}
          />
        </div>

        {/* ── SECCIÓN: Materiales sugeridos ── */}
        <div className="col-12">
          <Divider className="my-2" />
          <WorkshopItemsTable
            variant="suggested"
            control={control}
            register={register}
            fields={materialFields}
            append={appendMaterial as any}
            remove={removeMaterial}
            move={moveMaterial}
            errors={errors}
            fieldArrayName="suggestedMaterials"
            title="Insumos / repuestos sugeridos"
            itemSuggestions={itemSuggestions}
            onItemSearch={(e) => searchItems(e.query)}
            onItemSelect={(item, index) => {
              setSelectedItemsMap((prev) => ({
                ...prev,
                [item.id]: item,
              }));
              
              const currentDesc = control._formValues.suggestedMaterials?.[index]?.description;
              if (!currentDesc || currentDesc.trim() === "") {
                setValue(`suggestedMaterials.${index}.description` as any, item.name);
              }
            }}
            selectedItemsMap={selectedItemsMap}
          />
          {materialFields.length === 0 && (
            <p className="text-500 text-sm text-center py-2 mt-2">
              Sin materiales sugeridos. Al agregar esta operación a una OT, el
              sistema no propondrá insumos automáticamente.
            </p>
          )}
        </div>
      </div>
    </form>
  );
}
