"use client";

import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { Message } from "primereact/message";
import {
  invoiceSchema,
  InvoiceFormData,
} from "@/libs/zods/workshop/invoiceZod";
import {
  createInvoice,
  updateInvoice,
} from "@/app/api/workshop/invoiceService";
import { getWorkOrders } from "@/app/api/workshop/workOrderService";
import { Invoice, WorkOrder } from "@/libs/interfaces/workshop";

interface InvoiceFormProps {
  invoice?: Invoice | null;
  onSave: () => void;
  onCancel: () => void;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({
  invoice,
  onSave,
  onCancel,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loadingWorkOrders, setLoadingWorkOrders] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      workOrder: invoice?.workOrder
        ? typeof invoice.workOrder === "string"
          ? invoice.workOrder
          : invoice.workOrder._id
        : "",
      issueDate: invoice?.issueDate ? new Date(invoice.issueDate) : new Date(),
      dueDate: invoice?.dueDate ? new Date(invoice.dueDate) : undefined,
      status: invoice?.status || "borrador",
      paymentTerms: invoice?.paymentTerms || "",
      notes: invoice?.notes || "",
    },
  });

  const selectedWorkOrder = watch("workOrder");
  const [selectedWO, setSelectedWO] = useState<WorkOrder | null>(null);

  useEffect(() => {
    loadWorkOrders();
  }, []);

  useEffect(() => {
    if (selectedWorkOrder) {
      const wo = workOrders.find((w) => w._id === selectedWorkOrder);
      setSelectedWO(wo || null);
    } else {
      setSelectedWO(null);
    }
  }, [selectedWorkOrder, workOrders]);

  const loadWorkOrders = async () => {
    setLoadingWorkOrders(true);
    try {
      const response = await getWorkOrders({});
      setWorkOrders(response.data);
    } catch (error) {
      console.error("Error loading work orders:", error);
    } finally {
      setLoadingWorkOrders(false);
    }
  };

  const onSubmit = async (data: InvoiceFormData) => {
    setLoading(true);
    setError(null);
    try {
      if (invoice?._id) {
        await updateInvoice(invoice._id, data);
      } else {
        await createInvoice(data);
      }
      onSave();
    } catch (err: any) {
      console.error("Error saving invoice:", err);
      setError(err.message || "Error al guardar la factura");
    } finally {
      setLoading(false);
    }
  };

  const statusOptions = [
    { label: "Borrador", value: "borrador" },
    { label: "Emitida", value: "emitida" },
    { label: "Pagada Parcial", value: "pagada_parcial" },
    { label: "Pagada Total", value: "pagada_total" },
    { label: "Vencida", value: "vencida" },
    { label: "Cancelada", value: "cancelada" },
  ];

  const workOrderOptionTemplate = (option: WorkOrder) => {
    if (!option) return null;
    return (
      <div className="flex flex-column">
        <span className="font-semibold">
          OT-{option._id?.slice(-6)} - {option.numeroOrden}
        </span>
        {option.customer && (
          <span className="text-sm text-gray-600">
            {typeof option.customer === "string"
              ? option.customer
              : option.customer.nombreCompleto || option.customer.nombre}
          </span>
        )}
        {option.vehicle && (
          <span className="text-xs text-gray-500">
            {typeof option.vehicle === "string"
              ? option.vehicle
              : option.vehicle.placa}
          </span>
        )}
      </div>
    );
  };

  const workOrderValueTemplate = (option: WorkOrder | undefined) => {
    if (!option) return "Seleccione una orden de trabajo";
    return `OT-${option._id?.slice(-6)} - ${option.numeroOrden || ""}`;
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
      {error && (
        <Message severity="error" text={error} className="mb-4 w-full" />
      )}

      <div className="formgrid grid">
        {/* Work Order */}
        <div className="field col-12">
          <label htmlFor="workOrder" className="font-semibold">
            Orden de Trabajo *
          </label>
          <Controller
            name="workOrder"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="workOrder"
                {...field}
                options={workOrders}
                optionLabel="numeroOrden"
                optionValue="_id"
                placeholder="Seleccione una orden de trabajo"
                filter
                filterBy="numeroOrden,customer.nombre,customer.nombreCompleto"
                loading={loadingWorkOrders}
                disabled={!!invoice?._id}
                itemTemplate={workOrderOptionTemplate}
                valueTemplate={() =>
                  workOrderValueTemplate(
                    workOrders.find((wo) => wo._id === field.value)!
                  )
                }
                className={errors.workOrder ? "p-invalid" : ""}
              />
            )}
          />
          {errors.workOrder && (
            <small className="p-error">{errors.workOrder.message}</small>
          )}
        </div>

        {/* Issue Date */}
        <div className="field col-12 md:col-6">
          <label htmlFor="issueDate" className="font-semibold">
            Fecha de Emisión *
          </label>
          <Controller
            name="issueDate"
            control={control}
            render={({ field }) => (
              <Calendar
                id="issueDate"
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                dateFormat="dd/mm/yy"
                showIcon
                className={errors.issueDate ? "p-invalid" : ""}
              />
            )}
          />
          {errors.issueDate && (
            <small className="p-error">{errors.issueDate.message}</small>
          )}
        </div>

        {/* Due Date */}
        <div className="field col-12 md:col-6">
          <label htmlFor="dueDate" className="font-semibold">
            Fecha de Vencimiento
          </label>
          <Controller
            name="dueDate"
            control={control}
            render={({ field }) => (
              <Calendar
                id="dueDate"
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                dateFormat="dd/mm/yy"
                showIcon
                minDate={watch("issueDate") || new Date()}
                className={errors.dueDate ? "p-invalid" : ""}
              />
            )}
          />
          {errors.dueDate && (
            <small className="p-error">{errors.dueDate.message}</small>
          )}
        </div>

        {/* Status */}
        <div className="field col-12 md:col-6">
          <label htmlFor="status" className="font-semibold">
            Estado *
          </label>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Dropdown
                id="status"
                {...field}
                options={statusOptions}
                placeholder="Seleccione un estado"
                className={errors.status ? "p-invalid" : ""}
              />
            )}
          />
          {errors.status && (
            <small className="p-error">{errors.status.message}</small>
          )}
        </div>

        {/* Payment Terms */}
        <div className="field col-12 md:col-6">
          <label htmlFor="paymentTerms" className="font-semibold">
            Términos de Pago
          </label>
          <Controller
            name="paymentTerms"
            control={control}
            render={({ field }) => (
              <InputText
                id="paymentTerms"
                {...field}
                placeholder="Ej: 30 días, contado, etc."
                className={errors.paymentTerms ? "p-invalid" : ""}
              />
            )}
          />
          {errors.paymentTerms && (
            <small className="p-error">{errors.paymentTerms.message}</small>
          )}
        </div>

        {/* Notes */}
        <div className="field col-12">
          <label htmlFor="notes" className="font-semibold">
            Notas
          </label>
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <InputTextarea
                id="notes"
                {...field}
                rows={3}
                placeholder="Notas adicionales..."
                className={errors.notes ? "p-invalid" : ""}
              />
            )}
          />
          {errors.notes && (
            <small className="p-error">{errors.notes.message}</small>
          )}
        </div>

        {/* Financial Summary - Only show when work order is selected */}
        {selectedWO && (
          <div className="field col-12">
            <div className="p-3 surface-100 border-round">
              <h5 className="mt-0 mb-3">
                Resumen Financiero de la Orden de Trabajo
              </h5>
              <div className="grid">
                <div className="col-12 md:col-6 lg:col-3">
                  <div className="text-500 text-sm mb-1">
                    Subtotal Servicios
                  </div>
                  <div className="text-900 font-semibold">
                    {new Intl.NumberFormat("es-VE", {
                      style: "currency",
                      currency: "VES",
                    }).format(selectedWO.subtotalServicios || 0)}
                  </div>
                </div>
                <div className="col-12 md:col-6 lg:col-3">
                  <div className="text-500 text-sm mb-1">
                    Subtotal Repuestos
                  </div>
                  <div className="text-900 font-semibold">
                    {new Intl.NumberFormat("es-VE", {
                      style: "currency",
                      currency: "VES",
                    }).format(selectedWO.subtotalRepuestos || 0)}
                  </div>
                </div>
                <div className="col-12 md:col-6 lg:col-3">
                  <div className="text-500 text-sm mb-1">Descuento</div>
                  <div className="text-900 font-semibold">
                    {new Intl.NumberFormat("es-VE", {
                      style: "currency",
                      currency: "VES",
                    }).format(selectedWO.descuento || 0)}
                  </div>
                </div>
                <div className="col-12 md:col-6 lg:col-3">
                  <div className="text-500 text-sm mb-1">Impuesto (IVA)</div>
                  <div className="text-900 font-semibold">
                    {new Intl.NumberFormat("es-VE", {
                      style: "currency",
                      currency: "VES",
                    }).format(selectedWO.impuesto || 0)}
                  </div>
                </div>
              </div>

              <div className="grid mt-2">
                <div className="col-12 md:col-6">
                  <div className="text-500 text-sm mb-1">Estado OT</div>
                  <div className="text-900 font-semibold">
                    {typeof selectedWO.estado === "string"
                      ? selectedWO.estado
                      : selectedWO.estado?.nombre || "N/A"}
                  </div>
                </div>
                <div className="col-12 md:col-6">
                  <div className="text-500 text-sm mb-1">Costo Total</div>
                  <div className="text-900 font-bold text-2xl text-primary">
                    {new Intl.NumberFormat("es-VE", {
                      style: "currency",
                      currency: "VES",
                    }).format(selectedWO.costoTotal || 0)}
                  </div>
                </div>
              </div>

              {selectedWO.items && selectedWO.items.length > 0 && (
                <div className="mt-3">
                  <div className="text-500 text-sm mb-2">Items de la Orden</div>
                  <div className="surface-0 border-round p-2">
                    {selectedWO.items.map((item: any, index: number) => (
                      <div
                        key={index}
                        className="flex justify-content-between align-items-center py-2 border-bottom-1 surface-border"
                      >
                        <div className="flex-1">
                          <div className="font-semibold">
                            {typeof item.service === "string"
                              ? item.service
                              : item.service?.nombre || ""}
                            {item.repuesto &&
                              ` - ${
                                typeof item.repuesto === "string"
                                  ? item.repuesto
                                  : item.repuesto?.nombre || ""
                              }`}
                          </div>
                          <div className="text-sm text-500">
                            {item.descripcion}
                          </div>
                        </div>
                        <div className="text-right ml-3">
                          <div className="text-sm text-500">
                            {item.cantidad} x{" "}
                            {new Intl.NumberFormat("es-VE", {
                              style: "currency",
                              currency: "VES",
                            }).format(item.precioUnitario || 0)}
                          </div>
                          <div className="font-semibold">
                            {new Intl.NumberFormat("es-VE", {
                              style: "currency",
                              currency: "VES",
                            }).format(item.total || 0)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-content-end gap-2 mt-4">
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
          label={invoice?._id ? "Actualizar" : "Crear"}
          icon="pi pi-check"
          loading={loading}
        />
      </div>
    </form>
  );
};

export default InvoiceForm;
