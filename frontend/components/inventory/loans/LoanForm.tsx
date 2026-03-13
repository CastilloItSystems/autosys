"use client";

import { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from "primereact/inputnumber";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { AutoComplete } from "primereact/autocomplete";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Divider } from "primereact/divider";
import { Toast } from "primereact/toast";
import { z } from "zod";
import loanService, {
  Loan,
  CreateLoanInput,
} from "@/app/api/inventory/loanService";
import warehouseService, {
  Warehouse,
} from "@/app/api/inventory/warehouseService";
import itemService, { Item } from "@/app/api/inventory/itemService";

// ── Schema ────────────────────────────────────────────────────────────────────

const loanFormSchema = z.object({
  borrowerName: z.string().min(3, "Nombre del prestatario es requerido"),
  borrowerId: z.string().optional(),
  warehouseId: z.string().min(1, "Almacén es requerido"),
  startDate: z.date({ message: "Fecha de inicio es requerida" }),
  dueDate: z.date({ message: "Fecha de devolución es requerida" }),
  purpose: z.string().optional(),
  notes: z.string().optional(),
});

type LoanFormData = z.infer<typeof loanFormSchema>;

interface ItemRow {
  key: string;
  itemId: string;
  itemName: string;
  itemSku: string;
  quantityLoaned: number;
  unitCost: number;
  notes?: string;
}

interface LoanFormProps {
  loan?: Loan;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const LoanForm = ({ loan, onSuccess, onCancel }: LoanFormProps) => {
  const toast = useRef<Toast>(null);
  const isEdit = !!loan?.id;

  const [itemRows, setItemRows] = useState<ItemRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehousesLoading, setWarehousesLoading] = useState(false);
  const [itemSuggestions, setItemSuggestions] = useState<Item[]>([]);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoanFormData>({
    resolver: zodResolver(loanFormSchema),
    defaultValues: {
      borrowerName: loan?.borrowerName ?? "",
      borrowerId: loan?.borrowerId ?? "",
      warehouseId: loan?.warehouseId ?? "",
      startDate: loan?.startDate ? new Date(loan.startDate) : new Date(),
      dueDate: loan?.dueDate ? new Date(loan.dueDate) : new Date(),
      purpose: loan?.purpose ?? "",
      notes: loan?.notes ?? "",
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

  useEffect(() => {
    if (loan?.items?.length) {
      setItemRows(
        loan.items.map((item) => ({
          key: item.id,
          itemId: item.itemId,
          itemName: item.item?.name ?? item.itemId,
          itemSku: item.item?.sku ?? "",
          quantityLoaned: item.quantityLoaned,
          unitCost: item.unitCost,
          notes: item.notes,
        })),
      );
    }
  }, [loan]);

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
        quantityLoaned: 1,
        unitCost: 0,
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

  const onSubmit = async (data: LoanFormData) => {
    if (!isEdit) {
      if (!itemRows.length) {
        toast.current?.show({
          severity: "warn",
          summary: "Validación",
          detail: "Debe agregar al menos un artículo",
          life: 3000,
        });
        return;
      }
      if (itemRows.some((r) => !r.itemId || r.quantityLoaned < 1)) {
        toast.current?.show({
          severity: "warn",
          summary: "Validación",
          detail:
            "Todos los artículos deben estar seleccionados con cantidad mayor a 0",
          life: 4000,
        });
        return;
      }
    }
    setLoading(true);
    try {
      if (isEdit) {
        await loanService.update(loan!.id, data);
        toast.current?.show({
          severity: "success",
          summary: "Actualizado",
          detail: "Préstamo actualizado correctamente",
          life: 3000,
        });
      } else {
        const input: CreateLoanInput = {
          ...data,
          items: itemRows.map(({ key, itemName, itemSku, ...item }) => item),
        };
        await loanService.create(input);
        toast.current?.show({
          severity: "success",
          summary: "Creado",
          detail: "Préstamo creado correctamente",
          life: 3000,
        });
      }
      onSuccess?.();
    } catch (error: any) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          error?.response?.data?.message || "Error al guardar el préstamo",
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
          {/* ── Prestatario ─────────────────────────────────────────── */}
          <div className="col-12 md:col-6">
            <label className="block text-900 font-medium mb-2">
              Prestatario <span className="text-red-500">*</span>
            </label>
            <Controller
              name="borrowerName"
              control={control}
              render={({ field }) => (
                <InputText
                  {...field}
                  placeholder="Nombre del prestatario"
                  className={errors.borrowerName ? "p-invalid" : ""}
                />
              )}
            />
            {errors.borrowerName && (
              <small className="p-error block mt-1">
                {errors.borrowerName.message}
              </small>
            )}
          </div>

          <div className="col-12 md:col-6">
            <label className="block text-900 font-medium mb-2">
              ID Prestatario
            </label>
            <Controller
              name="borrowerId"
              control={control}
              render={({ field }) => (
                <InputText
                  {...field}
                  placeholder="Cédula / código (opcional)"
                />
              )}
            />
          </div>

          {/* ── Almacén y Propósito ──────────────────────────────────── */}
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

          <div className="col-12 md:col-6">
            <label className="block text-900 font-medium mb-2">Propósito</label>
            <Controller
              name="purpose"
              control={control}
              render={({ field }) => (
                <InputText
                  {...field}
                  placeholder="Propósito del préstamo (opcional)"
                />
              )}
            />
          </div>

          {/* ── Fechas ───────────────────────────────────────────────── */}
          <div className="col-12 md:col-6">
            <label className="block text-900 font-medium mb-2">
              Fecha de Inicio <span className="text-red-500">*</span>
            </label>
            <Controller
              name="startDate"
              control={control}
              render={({ field }) => (
                <Calendar
                  value={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  dateFormat="dd/mm/yy"
                  showIcon
                  className={errors.startDate ? "p-invalid" : ""}
                />
              )}
            />
            {errors.startDate && (
              <small className="p-error block mt-1">
                {errors.startDate.message}
              </small>
            )}
          </div>

          <div className="col-12 md:col-6">
            <label className="block text-900 font-medium mb-2">
              Fecha de Devolución <span className="text-red-500">*</span>
            </label>
            <Controller
              name="dueDate"
              control={control}
              render={({ field }) => (
                <Calendar
                  value={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  dateFormat="dd/mm/yy"
                  showIcon
                  className={errors.dueDate ? "p-invalid" : ""}
                />
              )}
            />
            {errors.dueDate && (
              <small className="p-error block mt-1">
                {errors.dueDate.message}
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

          {/* ── Artículos (solo creación) ─────────────────────────────── */}
          {!isEdit && (
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
                        value={row.quantityLoaned}
                        onValueChange={(e) =>
                          updateItemField(
                            row.key,
                            "quantityLoaned",
                            e.value ?? 1,
                          )
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
                    header="Costo Unit."
                    style={{ minWidth: "150px" }}
                    body={(row: ItemRow) => (
                      <InputNumber
                        value={row.unitCost}
                        onValueChange={(e) =>
                          updateItemField(row.key, "unitCost", e.value ?? 0)
                        }
                        min={0}
                        mode="currency"
                        currency="USD"
                        locale="en-US"
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
          )}

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
              label={isEdit ? "Guardar cambios" : "Crear Préstamo"}
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

export default LoanForm;
