"use client";

import { useState, useEffect } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { InputTextarea } from "primereact/inputtextarea";
import { Divider } from "primereact/divider";
import { Skeleton } from "primereact/skeleton";
import { Tag } from "primereact/tag";

import reconciliationService, {
  Reconciliation,
  ReconciliationSource,
} from "../../../app/api/inventory/reconciliationService";
import itemService from "../../../app/api/inventory/itemService";
import { Warehouse } from "../../../app/api/inventory/warehouseService";
import {
  createReconciliationSchema,
  CreateReconciliationInput,
} from "../../../libs/zods/inventory/reconciliationZod";
import { handleFormError } from "../../../utils/errorHandlers";
import { RECONCILIATION_SOURCE_CONFIG } from "../../../libs/interfaces/inventory/reconciliation.interface";

interface ReconciliationFormProps {
  reconciliation?: Reconciliation;
  warehouses: Warehouse[];
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ReconciliationForm({
  reconciliation,
  warehouses,
  onSuccess,
  onCancel,
}: ReconciliationFormProps) {
  const [items, setItems] = useState<any[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateReconciliationInput>({
    resolver: zodResolver(createReconciliationSchema),
    defaultValues: {
      warehouseId: reconciliation?.warehouseId ?? "",
      source: reconciliation?.source ?? ReconciliationSource.PHYSICAL_INVENTORY,
      items: reconciliation?.items?.length
        ? reconciliation.items.map((i) => ({
            itemId: i.itemId,
            systemQuantity: i.systemQuantity,
            expectedQuantity: i.expectedQuantity,
          }))
        : [{ itemId: "", systemQuantity: 0, expectedQuantity: 0 }],
      notes: reconciliation?.notes ?? "",
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  useEffect(() => {
    (async () => {
      try {
        const response = await itemService.getActive();
        setItems(Array.isArray(response.data) ? response.data : []);
      } catch {
        // silencioso — opciones vacías
      } finally {
        setInitialLoading(false);
      }
    })();
  }, []);

  const onSubmit = async (data: CreateReconciliationInput) => {
    setIsSubmitting(true);
    try {
      if (reconciliation) {
        await reconciliationService.update(reconciliation.id, data);
      } else {
        await reconciliationService.create(data);
      }
      onSuccess();
    } catch (error) {
      handleFormError(error, { current: null } as any);
    } finally {
      setIsSubmitting(false);
    }
  };

  const warehouseOptions = warehouses.map((w) => ({
    label: w.name,
    value: w.id,
  }));

  const sourceOptions = Object.entries(RECONCILIATION_SOURCE_CONFIG).map(
    ([key, cfg]) => ({
      label: cfg.label,
      value: key,
    }),
  );

  const itemOptions = items.map((item) => ({
    label:
      item.sku || item.code
        ? `${item.sku || item.code} — ${item.name}`
        : item.name,
    value: item.id,
  }));

  if (initialLoading) {
    return (
      <div className="grid">
        <div className="col-12 md:col-6">
          <Skeleton height="2.5rem" className="mb-2" />
          <Skeleton height="2.5rem" />
        </div>
        <div className="col-12 md:col-6">
          <Skeleton height="2.5rem" className="mb-2" />
          <Skeleton height="2.5rem" />
        </div>
        <div className="col-12">
          <Skeleton height="6rem" />
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
      <div className="grid">
        {/* ── Almacén ──────────────────────────────────────────────────── */}
        <div className="col-12 md:col-6">
          <label className="block text-900 font-medium mb-2">
            Almacén <span className="text-red-500">*</span>
          </label>
          <Controller
            name="warehouseId"
            control={control}
            render={({ field }) => (
              <Dropdown
                {...field}
                options={warehouseOptions}
                optionLabel="label"
                optionValue="value"
                placeholder="Seleccione almacén"
                className={errors.warehouseId ? "p-invalid" : ""}
              />
            )}
          />
          {errors.warehouseId && (
            <small className="p-error block mt-1">
              {errors.warehouseId.message}
            </small>
          )}
        </div>

        {/* ── Origen de Discrepancia ───────────────────────────────────── */}
        <div className="col-12 md:col-6">
          <label className="block text-900 font-medium mb-2">
            Origen de Discrepancia <span className="text-red-500">*</span>
          </label>
          <Controller
            name="source"
            control={control}
            render={({ field }) => (
              <Dropdown
                {...field}
                options={sourceOptions}
                optionLabel="label"
                optionValue="value"
                placeholder="Seleccione origen"
                className={errors.source ? "p-invalid" : ""}
              />
            )}
          />
          {errors.source && (
            <small className="p-error block mt-1">
              {errors.source.message}
            </small>
          )}
        </div>

        {/* ── Notas ───────────────────────────────────────────────────── */}
        <div className="col-12">
          <label className="block text-900 font-medium mb-2">
            Notas adicionales
          </label>
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <InputTextarea
                {...field}
                rows={3}
                placeholder="Detalles sobre las discrepancias encontradas..."
              />
            )}
          />
        </div>

        {/* ── Artículos ────────────────────────────────────────────────── */}
        <div className="col-12">
          <Divider />
          <div className="flex align-items-center justify-content-between mb-3">
            <span className="text-900 font-medium">
              Artículos con Discrepancias{" "}
              <span className="text-red-500">*</span>
            </span>
            <Button
              type="button"
              label="Agregar artículo"
              icon="pi pi-plus"
              size="small"
              severity="info"
              text
              onClick={() =>
                append({ itemId: "", systemQuantity: 0, expectedQuantity: 0 })
              }
            />
          </div>

          {fields.length === 0 ? (
            <div
              className="flex flex-column align-items-center justify-content-center border-2 border-dashed border-300 border-round p-5 text-500"
              style={{ minHeight: "100px" }}
            >
              <i className="pi pi-list-check text-4xl mb-2 text-300" />
              <span>Agrega al menos un artículo con discrepancia</span>
            </div>
          ) : (
            <div className="flex flex-column gap-2">
              {fields.map((field, index) => {
                const itemErr = errors.items?.[index];
                return (
                  <div
                    key={field.id}
                    className="grid border-1 border-200 border-round p-2 m-0"
                  >
                    {/* Artículo */}
                    <div className="col-12 md:col-5">
                      <label
                        className="block text-900 font-medium mb-2"
                        style={{ fontSize: "0.875rem" }}
                      >
                        Artículo
                      </label>
                      <Controller
                        name={`items.${index}.itemId`}
                        control={control}
                        render={({ field }) => (
                          <Dropdown
                            {...field}
                            options={itemOptions}
                            optionLabel="label"
                            optionValue="value"
                            placeholder="Seleccione artículo"
                            filter
                            filterPlaceholder="Buscar..."
                            className={itemErr?.itemId ? "p-invalid" : ""}
                          />
                        )}
                      />
                      {itemErr?.itemId && (
                        <small className="p-error block mt-1">
                          {itemErr.itemId.message}
                        </small>
                      )}
                    </div>

                    {/* Stock Sistema */}
                    <div className="col-12 md:col-3">
                      <label
                        className="block text-900 font-medium mb-2"
                        style={{ fontSize: "0.875rem" }}
                      >
                        Stock Sistema
                        <Tag
                          value="actual"
                          severity="secondary"
                          className="ml-2"
                          style={{ fontSize: "0.7rem" }}
                        />
                      </label>
                      <Controller
                        name={`items.${index}.systemQuantity`}
                        control={control}
                        render={({ field }) => (
                          <InputNumber
                            value={field.value}
                            onValueChange={(e) => field.onChange(e.value ?? 0)}
                            min={0}
                            showButtons
                            className={
                              itemErr?.systemQuantity ? "p-invalid" : ""
                            }
                          />
                        )}
                      />
                      {itemErr?.systemQuantity && (
                        <small className="p-error block mt-1">
                          {itemErr.systemQuantity.message}
                        </small>
                      )}
                    </div>

                    {/* Stock Esperado */}
                    <div className="col-12 md:col-3">
                      <label
                        className="block text-900 font-medium mb-2"
                        style={{ fontSize: "0.875rem" }}
                      >
                        Stock Real/Contado
                        <Tag
                          value="físico"
                          severity="info"
                          className="ml-2"
                          style={{ fontSize: "0.7rem" }}
                        />
                      </label>
                      <Controller
                        name={`items.${index}.expectedQuantity`}
                        control={control}
                        render={({ field }) => (
                          <InputNumber
                            value={field.value}
                            onValueChange={(e) => field.onChange(e.value ?? 0)}
                            min={0}
                            showButtons
                            className={
                              itemErr?.expectedQuantity ? "p-invalid" : ""
                            }
                          />
                        )}
                      />
                      {itemErr?.expectedQuantity && (
                        <small className="p-error block mt-1">
                          {itemErr.expectedQuantity.message}
                        </small>
                      )}
                    </div>

                    {/* Eliminar */}
                    <div className="col-12 md:col-1 flex align-items-end justify-content-center">
                      <Button
                        type="button"
                        icon="pi pi-trash"
                        severity="danger"
                        text
                        rounded
                        size="small"
                        tooltip="Eliminar fila"
                        tooltipOptions={{ position: "top" }}
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {errors.items && !Array.isArray(errors.items) && (
            <small className="p-error block mt-2">
              {(errors.items as any).message}
            </small>
          )}
        </div>

        {/* ── Botones ──────────────────────────────────────────────────── */}
        <div className="col-12 flex justify-content-end gap-2 mt-2">
          <Button
            type="button"
            label="Cancelar"
            icon="pi pi-times"
            severity="secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          />
          <Button
            type="submit"
            label={reconciliation ? "Guardar cambios" : "Crear Reconciliación"}
            icon="pi pi-check"
            loading={isSubmitting}
          />
        </div>
      </div>
    </form>
  );
}
