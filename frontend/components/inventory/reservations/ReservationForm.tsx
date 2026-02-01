"use client";
import React, { useContext, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { classNames } from "primereact/utils";
import { reservationSchema } from "@/libs/zods/inventory";
import {
  createReservation,
  updateReservation,
} from "@/app/api/inventory/reservationService";
import { Toast } from "primereact/toast";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { handleFormError } from "@/utils/errorHandlers";
import { LayoutContext } from "@/layout/context/layoutcontext";
import { Item, Warehouse } from "@/libs/interfaces/inventory";

type FormData = z.infer<typeof reservationSchema>;

interface ReservationFormProps {
  reservation: any;
  hideFormDialog: () => void;
  reservations: any[];
  setReservations: (reservations: any[]) => void;
  setReservation: (reservation: any) => void;
  showToast: (
    severity: "success" | "error",
    summary: string,
    detail: string
  ) => void;
  toast: React.RefObject<Toast> | null;
  items: Item[];
  warehouses: Warehouse[];
}

const estadoOptions = [
  { label: "Activo", value: "activo" },
  { label: "Liberado", value: "liberado" },
  { label: "Consumido", value: "consumido" },
  { label: "Cancelado", value: "cancelado" },
];

const ReservationForm = ({
  reservation,
  toast,
  hideFormDialog,
  reservations,
  setReservations,
  showToast,
  items,
  warehouses,
}: ReservationFormProps) => {
  const { layoutConfig } = useContext(LayoutContext);
  const filledInput = layoutConfig.inputStyle === "filled";

  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    control,
  } = useForm<FormData>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      cantidad: 1,
      estado: "activo",
    },
  });

  useEffect(() => {
    if (reservation) {
      Object.keys(reservation).forEach((key) =>
        setValue(key as keyof FormData, reservation[key])
      );
    }
  }, [reservation, setValue]);

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      if (reservation) {
        const updatedReservation = await updateReservation(
          reservation.id,
          data
        );
        const updatedReservations = reservations.map((t) =>
          t.id === updatedReservation.id ? updatedReservation : t
        );
        setReservations(updatedReservations);
        showToast("success", "Éxito", "Reserva actualizada");
      } else {
        const newReservation = await createReservation(data);
        setReservations([...reservations, newReservation]);
        showToast("success", "Éxito", "Reserva creada");
      }
      hideFormDialog();
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setSubmitting(false);
    }
  };

  const itemOptions = items.map((item) => ({
    label: item.nombre,
    value: item.id,
  }));

  const warehouseOptions = warehouses.map((warehouse) => ({
    label: warehouse.nombre,
    value: warehouse.id,
  }));

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="card p-fluid surface-50 p-3 border-round shadow-2">
          {/* Header del Formulario */}
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-bookmark mr-3 text-primary text-3xl"></i>
                {reservation ? "Modificar Reserva" : "Crear Reserva"}
              </h2>
            </div>
          </div>

          {/* Cuerpo del Formulario */}
          <div className="grid formgrid row-gap-2">
            {/* Artículo */}
            <div className="field col-12 md:col-6">
              <label htmlFor="item" className="font-medium text-900">
                Artículo <span className="text-red-500">*</span>
              </label>
              <Controller
                name="item"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="item"
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    options={itemOptions}
                    placeholder="Seleccione un artículo"
                    filter
                    className={classNames("w-full", {
                      "p-invalid": errors.item,
                    })}
                  />
                )}
              />
              {errors.item && (
                <small className="p-error">{errors.item.message}</small>
              )}
            </div>

            {/* Almacén */}
            <div className="field col-12 md:col-6">
              <label htmlFor="warehouse" className="font-medium text-900">
                Almacén <span className="text-red-500">*</span>
              </label>
              <Controller
                name="warehouse"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="warehouse"
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    options={warehouseOptions}
                    placeholder="Seleccione un almacén"
                    filter
                    className={classNames("w-full", {
                      "p-invalid": errors.warehouse,
                    })}
                  />
                )}
              />
              {errors.warehouse && (
                <small className="p-error">{errors.warehouse.message}</small>
              )}
            </div>

            {/* Cantidad */}
            <div className="field col-12 md:col-4">
              <label htmlFor="cantidad" className="font-medium text-900">
                Cantidad <span className="text-red-500">*</span>
              </label>
              <Controller
                name="cantidad"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    id="cantidad"
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    min={1}
                    className={classNames("w-full", {
                      "p-invalid": errors.cantidad,
                    })}
                  />
                )}
              />
              {errors.cantidad && (
                <small className="p-error">{errors.cantidad.message}</small>
              )}
            </div>

            {/* Reservado Por */}
            <div className="field col-12 md:col-4">
              <label htmlFor="reservadoPor" className="font-medium text-900">
                Reservado Por
              </label>
              <InputText
                id="reservadoPor"
                type="text"
                className={classNames("w-full", {
                  "p-filled": filledInput,
                })}
                {...register("reservadoPor")}
              />
              {errors.reservadoPor && (
                <small className="p-error">{errors.reservadoPor.message}</small>
              )}
            </div>

            {/* Estado */}
            <div className="field col-12 md:col-4">
              <label htmlFor="estado" className="font-medium text-900">
                Estado
              </label>
              <Controller
                name="estado"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="estado"
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    options={estadoOptions}
                    placeholder="Seleccione un estado"
                    className={classNames("w-full", {
                      "p-invalid": errors.estado,
                    })}
                  />
                )}
              />
              {errors.estado && (
                <small className="p-error">{errors.estado.message}</small>
              )}
            </div>

            {/* Motivo */}
            <div className="field col-12">
              <label htmlFor="motivo" className="font-medium text-900">
                Motivo
              </label>
              <InputTextarea
                id="motivo"
                rows={3}
                className={classNames("w-full", {
                  "p-filled": filledInput,
                })}
                {...register("motivo")}
              />
              {errors.motivo && (
                <small className="p-error">{errors.motivo.message}</small>
              )}
            </div>

            {/* Botón de Envío */}
            <div className="field col-12 text-right">
              <Button
                type="submit"
                label={reservation ? "Actualizar" : "Crear"}
                icon={submitting ? "pi pi-spin pi-spinner" : "pi pi-check"}
                className="p-button-success"
                disabled={submitting}
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ReservationForm;
