"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Calendar } from "primereact/calendar";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputNumber } from "primereact/inputnumber";
import { Toast } from "primereact/toast";
import loanService, {
  Loan,
  CreateLoanInput,
} from "@/app/api/inventory/loanService";
import { z } from "zod";
import { useRef } from "react";

const loanFormSchema = z.object({
  borrowerName: z.string().min(3, "Nombre del prestatario es requerido"),
  warehouseId: z.string().min(1, "Almacén es requerido"),
  startDate: z.date({ message: "Fecha de inicio es requerida" }),
  dueDate: z.date({ message: "Fecha de devolución es requerida" }),
  purpose: z.string().optional(),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        itemId: z.string().min(1, "Artículo es requerido"),
        quantityLoaned: z.number().min(1, "Cantidad debe ser mayor a 0"),
        unitCost: z.number().min(0, "Costo unitario no puede ser negativo"),
        notes: z.string().optional(),
      }),
    )
    .min(1, "Debe agregar al menos un artículo"),
});

type LoanFormData = z.infer<typeof loanFormSchema>;

interface LoanFormProps {
  loan?: Loan;
  onSuccess?: () => void;
}

const LoanForm = ({ loan, onSuccess }: LoanFormProps) => {
  const toast = useRef<Toast>(null);
  const [items, setItems] = useState<
    (LoanFormData["items"][0] & { key: string })[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LoanFormData>({
    resolver: zodResolver(loanFormSchema),
    defaultValues: {
      borrowerName: loan?.borrowerName || "",
      warehouseId: loan?.warehouseId || "",
      startDate: loan?.startDate ? new Date(loan.startDate) : new Date(),
      dueDate: loan?.dueDate ? new Date(loan.dueDate) : new Date(),
      purpose: loan?.purpose || "",
      notes: loan?.notes || "",
      items: [],
    },
  });

  useEffect(() => {
    if (loan?.items) {
      setItems(
        loan.items.map((item) => ({
          ...item,
          key: item.id,
        })),
      );
    }
  }, [loan]);

  const onSubmit = async (data: LoanFormData) => {
    if (!items.length) {
      toast.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "Debe agregar al menos un artículo",
      });
      return;
    }

    setIsLoading(true);
    try {
      const input: CreateLoanInput = {
        ...data,
        items: items.map(({ key, ...item }) => item),
      };

      if (loan?.id) {
        const { items: _, ...updateData } = data;
        await loanService.updateLoan(loan.id, updateData);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Préstamo actualizado correctamente",
        });
      } else {
        await loanService.createLoan(input);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Préstamo creado correctamente",
        });
      }
      onSuccess?.();
    } catch (error: any) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.message || "Error al guardar préstamo",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        itemId: "",
        quantityLoaned: 1,
        unitCost: 0,
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

  return (
    <>
      <Toast ref={toast} />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block font-medium">Prestatario *</label>
            <Controller
              name="borrowerName"
              control={control}
              render={({ field }) => (
                <>
                  <InputText
                    {...field}
                    className="w-full"
                    placeholder="Nombre del prestatario"
                  />
                  {errors.borrowerName && (
                    <small className="text-red-500">
                      {errors.borrowerName.message}
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

          <div className="space-y-2">
            <label className="block font-medium">Fecha de Inicio *</label>
            <Controller
              name="startDate"
              control={control}
              render={({ field }) => (
                <>
                  <Calendar
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    dateFormat="dd/mm/yy"
                    showIcon
                    className="w-full"
                  />
                  {errors.startDate && (
                    <small className="text-red-500">
                      {errors.startDate.message}
                    </small>
                  )}
                </>
              )}
            />
          </div>

          <div className="space-y-2">
            <label className="block font-medium">Fecha de Devolución *</label>
            <Controller
              name="dueDate"
              control={control}
              render={({ field }) => (
                <>
                  <Calendar
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    dateFormat="dd/mm/yy"
                    showIcon
                    className="w-full"
                  />
                  {errors.dueDate && (
                    <small className="text-red-500">
                      {errors.dueDate.message}
                    </small>
                  )}
                </>
              )}
            />
          </div>
        </div>

        {/* Purpose and Notes */}
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <label className="block font-medium">Propósito</label>
            <Controller
              name="purpose"
              control={control}
              render={({ field }) => (
                <InputText
                  {...field}
                  className="w-full"
                  placeholder="Propósito del préstamo"
                />
              )}
            />
          </div>

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
              <Column field="itemId" header="ID Artículo" editor />
              <Column field="quantityLoaned" header="Cantidad" editor />
              <Column field="unitCost" header="Costo Unitario" editor />
              <Column field="notes" header="Notas" />
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
            label={loan ? "Guardar cambios" : "Crear préstamo"}
            icon="pi pi-check"
            loading={isLoading}
            disabled={isLoading}
          />
        </div>
      </form>
    </>
  );
};

export default LoanForm;
