"use client";

import { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { AutoComplete } from "primereact/autocomplete";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Divider } from "primereact/divider";
import { Toast } from "primereact/toast";
import { z } from "zod";
import returnService, {
  ReturnType,
  CreateReturnInput,
  RETURN_TYPE_CONFIG,
} from "@/app/api/inventory/returnService";
import warehouseService, {
  Warehouse,
} from "@/app/api/inventory/warehouseService";
import itemService, { Item } from "@/app/api/inventory/itemService";

// ── Schema ────────────────────────────────────────────────────────────────────

const returnFormSchema = z.object({
  type: z.nativeEnum(ReturnType, { message: "Tipo es requerido" }),
  warehouseId: z.string().min(1, "Almacén es requerido"),
  reason: z.string().min(3, "Razón es requerida (mínimo 3 caracteres)"),
  notes: z.string().optional(),
});

type ReturnFormData = z.infer<typeof returnFormSchema>;

interface ItemRow {
  key: string;
  itemId: string;
  itemName: string;
  itemSku: string;
  quantity: number;
  unitPrice?: number;
  notes?: string;
}

interface ReturnFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const ReturnForm = ({ onSuccess, onCancel }: ReturnFormProps) => {
  const toast = useRef<Toast>(null);

  const [itemRows, setItemRows] = useState<ItemRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehousesLoading, setWarehousesLoading] = useState(false);
  const [itemSuggestions, setItemSuggestions] = useState<Item[]>([]);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ReturnFormData>({
    resolver: zodResolver(returnFormSchema),
    defaultValues: {
      type: ReturnType.SUPPLIER_RETURN,
      warehouseId: "",
      reason: "",
      notes: "",
    },
  });

  useEffect(() => {
    const load = async () => {
      setWarehousesLoading(true);
      try {
        const res = await warehouseService.getActive();
        setWarehouses(Array.isArray(res.data) ? res.data : []);
      } catch {
        toast.current?.show({
          severity: "warn",
          summary: "Advertencia",
          detail: "No se pudieron cargar los almacenes",
          life: 3000,
        });
      } finally {
        setWarehousesLoading(false);
      }
    };
    load();
  }, []);

  const typeOptions = Object.values(ReturnType).map((type) => ({
    label: RETURN_TYPE_CONFIG[type].label,
    value: type,
    icon: RETURN_TYPE_CONFIG[type].icon,
  }));

  const typeOptionTemplate = (option: { label: string; icon: string }) => (
    <div className="flex align-items-center gap-2">
      <i className={option.icon} />
      <span>{option.label}</span>
    </div>
  );

  const handleItemSearch = async (event: { query: string }) => {
    try {
      const results = await itemService.search(event.query);
      setItemSuggestions(Array.isArray(results.data) ? results.data : []);
    } catch {
      setItemSuggestions([]);
    }
  };

  const itemSuggestionTemplate = (item: Item) => (
    <div className="flex flex-column">
      <span className="font-semibold">{item.name}</span>
      <span className="text-xs text-500">{item.sku ?? item.code}</span>
    </div>
  );

  const addItem = () =>
    setItemRows((prev) => [
      ...prev,
      {
        key: Date.now().toString(),
        itemId: "",
        itemName: "",
        itemSku: "",
        quantity: 1,
      },
    ]);
  const removeItem = (key: string) =>
    setItemRows((prev) => prev.filter((r) => r.key !== key));
  const updateItemField = (key: string, field: keyof ItemRow, value: any) =>
    setItemRows((prev) =>
      prev.map((r) => (r.key === key ? { ...r, [field]: value } : r)),
    );
  const handleItemSelect = (key: string, item: Item) =>
    setItemRows((prev) =>
      prev.map((r) =>
        r.key === key
          ? {
              ...r,
              itemId: item.id,
              itemName: item.name,
              itemSku: item.sku ?? item.code,
            }
          : r,
      ),
    );

  const onSubmit = async (data: ReturnFormData) => {
    if (!itemRows.length) {
      toast.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "Debe agregar al menos un artículo",
        life: 3000,
      });
      return;
    }
    if (itemRows.some((r) => !r.itemId || r.quantity < 1)) {
      toast.current?.show({
        severity: "warn",
        summary: "Validación",
        detail:
          "Todos los artículos deben estar seleccionados con cantidad mayor a 0",
        life: 4000,
      });
      return;
    }
    setLoading(true);
    try {
      const input: CreateReturnInput = {
        ...data,
        items: itemRows.map(({ key, itemName, itemSku, ...item }) => item),
      };
      await returnService.create(input);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Devolución creada correctamente",
        life: 3000,
      });
      onSuccess?.();
    } catch (error: any) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          error?.response?.data?.message || "Error al crear la devolución",
        life: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toast ref={toast} />
      <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
        <div className="grid">
          {/* ── Tipo y Almacén ───────────────────────────────────────── */}
          <div className="col-12 md:col-6">
            <label className="block text-900 font-medium mb-2">
              Tipo de Devolución <span className="text-red-500">*</span>
            </label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Dropdown
                  {...field}
                  options={typeOptions}
                  optionLabel="label"
                  optionValue="value"
                  itemTemplate={typeOptionTemplate}
                  placeholder="Seleccionar tipo"
                  className={errors.type ? "p-invalid" : ""}
                />
              )}
            />
            {errors.type && (
              <small className="p-error block mt-1">
                {errors.type.message}
              </small>
            )}
          </div>

          <div className="col-12 md:col-6">
            <label className="block text-900 font-medium mb-2">
              Almacén <span className="text-red-500">*</span>
            </label>
            <Controller
              name="warehouseId"
              control={control}
              render={({ field }) => (
                <Dropdown
                  value={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  options={warehouses}
                  optionLabel="name"
                  optionValue="id"
                  placeholder={
                    warehousesLoading ? "Cargando..." : "Seleccionar almacén"
                  }
                  disabled={warehousesLoading}
                  filter
                  filterPlaceholder="Buscar almacén..."
                  emptyMessage="No hay almacenes activos"
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

          {/* ── Razón ────────────────────────────────────────────────── */}
          <div className="col-12">
            <label className="block text-900 font-medium mb-2">
              Razón <span className="text-red-500">*</span>
            </label>
            <Controller
              name="reason"
              control={control}
              render={({ field }) => (
                <InputText
                  {...field}
                  placeholder="Motivo de la devolución"
                  maxLength={500}
                  className={errors.reason ? "p-invalid" : ""}
                />
              )}
            />
            {errors.reason && (
              <small className="p-error block mt-1">
                {errors.reason.message}
              </small>
            )}
          </div>

          {/* ── Notas ────────────────────────────────────────────────── */}
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
                  placeholder="Observaciones opcionales..."
                />
              )}
            />
          </div>

          {/* ── Artículos ─────────────────────────────────────────────── */}
          <div className="col-12">
            <Divider align="left">
              <div className="flex align-items-center gap-2">
                <i className="pi pi-box text-primary" />
                <span className="text-900 font-medium">Artículos</span>
                <span className="text-red-500">*</span>
              </div>
            </Divider>

            <div className="flex justify-content-end mb-2">
              <Button
                type="button"
                icon="pi pi-plus"
                label="Agregar artículo"
                size="small"
                severity="secondary"
                onClick={addItem}
              />
            </div>

            {itemRows.length === 0 ? (
              <div className="flex flex-column align-items-center justify-content-center py-5 border-1 border-dashed surface-border border-round text-500">
                <i className="pi pi-inbox text-4xl mb-2 text-300" />
                <span>Sin artículos. Haz clic en "Agregar artículo".</span>
              </div>
            ) : (
              <DataTable
                value={itemRows}
                dataKey="key"
                size="small"
                responsiveLayout="scroll"
              >
                <Column
                  header="Artículo *"
                  style={{ minWidth: "220px" }}
                  body={(row: ItemRow) => (
                    <AutoComplete
                      value={row.itemName || ""}
                      suggestions={itemSuggestions}
                      completeMethod={handleItemSearch}
                      itemTemplate={itemSuggestionTemplate}
                      onSelect={(e) =>
                        handleItemSelect(row.key, e.value as Item)
                      }
                      onChange={(e) =>
                        updateItemField(
                          row.key,
                          "itemName",
                          typeof e.value === "string"
                            ? e.value
                            : e.value?.name ?? "",
                        )
                      }
                      field="name"
                      placeholder="Buscar artículo..."
                      className="w-full"
                      delay={300}
                      minLength={2}
                    />
                  )}
                />
                <Column
                  header="SKU"
                  style={{ minWidth: "90px" }}
                  body={(row: ItemRow) => (
                    <span className="text-500 text-sm">
                      {row.itemSku || "—"}
                    </span>
                  )}
                />
                <Column
                  header="Cantidad *"
                  style={{ minWidth: "140px" }}
                  body={(row: ItemRow) => (
                    <InputNumber
                      value={row.quantity}
                      onValueChange={(e) =>
                        updateItemField(row.key, "quantity", e.value ?? 1)
                      }
                      min={1}
                      showButtons
                      buttonLayout="horizontal"
                      decrementButtonClassName="p-button-secondary"
                      incrementButtonClassName="p-button-secondary"
                      incrementButtonIcon="pi pi-plus"
                      decrementButtonIcon="pi pi-minus"
                      inputClassName="w-4rem text-center"
                    />
                  )}
                />
                <Column
                  header="Precio Unit."
                  style={{ minWidth: "150px" }}
                  body={(row: ItemRow) => (
                    <InputNumber
                      value={row.unitPrice ?? null}
                      onValueChange={(e) =>
                        updateItemField(
                          row.key,
                          "unitPrice",
                          e.value ?? undefined,
                        )
                      }
                      min={0}
                      mode="currency"
                      currency="USD"
                      locale="en-US"
                      placeholder="Opcional"
                      className="w-full"
                    />
                  )}
                />
                <Column
                  header="Notas"
                  style={{ minWidth: "150px" }}
                  body={(row: ItemRow) => (
                    <InputText
                      value={row.notes ?? ""}
                      onChange={(e) =>
                        updateItemField(row.key, "notes", e.target.value)
                      }
                      placeholder="Opcional"
                      className="w-full"
                    />
                  )}
                />
                <Column
                  style={{ width: "60px" }}
                  body={(row: ItemRow) => (
                    <Button
                      icon="pi pi-trash"
                      severity="danger"
                      text
                      rounded
                      size="small"
                      type="button"
                      tooltip="Eliminar"
                      tooltipOptions={{ position: "left" }}
                      onClick={() => removeItem(row.key)}
                    />
                  )}
                />
              </DataTable>
            )}
          </div>

          {/* ── Botones ───────────────────────────────────────────────── */}
          <div className="col-12 flex justify-content-end gap-2 mt-2">
            <Button
              type="button"
              label="Cancelar"
              icon="pi pi-times"
              severity="secondary"
              onClick={onCancel}
              disabled={loading}
            />
            <Button
              type="submit"
              label="Crear Devolución"
              icon="pi pi-check"
              loading={loading}
              disabled={loading}
            />
          </div>
        </div>
      </form>
    </>
  );
};

export default ReturnForm;
