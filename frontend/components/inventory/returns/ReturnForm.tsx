"use client";

import { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputNumber } from "primereact/inputnumber";
import { Toast } from "primereact/toast";
import returnService, {
  ReturnType,
  CreateReturnInput,
  RETURN_TYPE_CONFIG,
} from "@/app/api/inventory/returnService";
import { z } from "zod";

const returnFormSchema = z.object({
  type: z.nativeEnum(ReturnType, { message: "Tipo es requerido" }),
  warehouseId: z.string().min(1, "Almacén es requerido"),
  reason: z.string().min(3, "Razón es requerida"),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        itemId: z.string().min(1, "Artículo es requerido"),
        quantity: z.number().min(1, "Cantidad debe ser mayor a 0"),
        unitPrice: z
          .number()
          .min(0, "Precio unitario no puede ser negativo")
          .optional(),
        notes: z.string().optional(),
      }),
    )
    .min(1, "Debe agregar al menos un artículo"),
});

type ReturnFormData = z.infer<typeof returnFormSchema>;

interface ReturnFormProps {
  onSuccess?: () => void;
}

const ReturnForm = ({ onSuccess }: ReturnFormProps) => {
  const toast = useRef<Toast>(null);
  const [items, setItems] = useState<
    (ReturnFormData["items"][0] & { key: string })[]
  >([]);
  const [loading, setLoading] = useState(false);

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
      items: [],
    },
  });

  const onSubmit = async (data: ReturnFormData) => {
    if (!items.length) {
      toast.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "Debe agregar al menos un artículo",
      });
      return;
    }

    setLoading(true);
    try {
      const input: CreateReturnInput = {
        ...data,
        items: items.map(({ key, ...item }) => item),
      };
      await returnService.createReturn(input);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Devolución creada correctamente",
      });
      onSuccess?.();
    } catch (error: any) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.message || "Error al crear devolución",
      });
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        itemId: "",
        quantity: 1,
        unitPrice: 0,
        notes: "",
        key: Date.now().toString(),
      },
    ]);
  };

  const removeItem = (key: string) => {
    setItems(items.filter((item) => item.key !== key));
  };

  const updateItem = (
    key: string,
    field: keyof (typeof items)[0],
    value: any,
  ) => {
    setItems(
      items.map((item) =>
        item.key === key ? { ...item, [field]: value } : item,
      ),
    );
  };

  const typeOptions = Object.values(ReturnType).map((type) => ({
    label: RETURN_TYPE_CONFIG[type].label,
    value: type,
  }));

  return (
    <>
      <Toast ref={toast} />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Type and Warehouse */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block font-medium">Tipo de Devolución *</label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <>
                  <Dropdown
                    {...field}
                    options={typeOptions}
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Seleccionar tipo"
                    className="w-full"
                  />
                  {errors.type && (
                    <small className="text-red-500">
                      {errors.type.message}
                    </small>
                  )}
                </>
              )}
            />
          </div>

          <div className="space-y-2">
            <label className="block font-medium">Almacén *</label>
            <Controller
              name="warehouseId"
              control={control}
              render={({ field }) => (
                <>
                  <InputText
                    {...field}
                    className="w-full"
                    placeholder="ID del almacén"
                  />
                  {errors.warehouseId && (
                    <small className="text-red-500">
                      {errors.warehouseId.message}
                    </small>
                  )}
                </>
              )}
            />
          </div>
        </div>

        {/* Reason */}
        <div className="space-y-2">
          <label className="block font-medium">Razón *</label>
          <Controller
            name="reason"
            control={control}
            render={({ field }) => (
              <>
                <InputText
                  {...field}
                  className="w-full"
                  placeholder="Razón de la devolución"
                />
                {errors.reason && (
                  <small className="text-red-500">
                    {errors.reason.message}
                  </small>
                )}
              </>
            )}
          />
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <label className="block font-medium">Notas</label>
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <InputTextarea
                {...field}
                className="w-full"
                rows={3}
                placeholder="Notas adicionales"
              />
            )}
          />
        </div>

        {/* Items Section */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="block font-medium">Artículos *</label>
            <Button
              type="button"
              icon="pi pi-plus"
              label="Agregar artículo"
              onClick={addItem}
              severity="secondary"
              size="small"
            />
          </div>

          {items.length > 0 && (
            <DataTable value={items} responsiveLayout="scroll">
              <Column
                field="itemId"
                header="ID Artículo"
                body={(rowData) => (
                  <InputText
                    value={rowData.itemId}
                    onChange={(e) =>
                      updateItem(rowData.key, "itemId", e.target.value)
                    }
                    className="w-full"
                  />
                )}
              />
              <Column
                field="quantity"
                header="Cantidad"
                body={(rowData) => (
                  <InputNumber
                    value={rowData.quantity}
                    onChange={(e) =>
                      updateItem(rowData.key, "quantity", e.value)
                    }
                    min={1}
                    className="w-full"
                  />
                )}
              />
              <Column
                field="unitPrice"
                header="Precio Unitario"
                body={(rowData) => (
                  <InputNumber
                    value={rowData.unitPrice}
                    onChange={(e) =>
                      updateItem(rowData.key, "unitPrice", e.value)
                    }
                    min={0}
                    currency="USD"
                    locale="en-US"
                    className="w-full"
                  />
                )}
              />
              <Column
                field="notes"
                header="Notas"
                body={(rowData) => (
                  <InputText
                    value={rowData.notes}
                    onChange={(e) =>
                      updateItem(rowData.key, "notes", e.target.value)
                    }
                    className="w-full"
                  />
                )}
              />
              <Column
                body={(rowData) => (
                  <Button
                    icon="pi pi-trash"
                    rounded
                    text
                    severity="danger"
                    onClick={() => removeItem(rowData.key)}
                    size="small"
                  />
                )}
                style={{ width: "80px" }}
              />
            </DataTable>
          )}

          {errors.items && (
            <small className="text-red-500">{errors.items.message}</small>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end pt-4">
          <Button
            type="submit"
            label="Crear devolución"
            icon="pi pi-check"
            loading={loading}
            disabled={loading}
          />
        </div>
      </form>
    </>
  );
};

export default ReturnForm;
