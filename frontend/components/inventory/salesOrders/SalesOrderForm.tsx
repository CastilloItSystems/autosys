"use client";
import React, { useContext, useEffect, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { classNames } from "primereact/utils";
import { salesOrderSchema } from "@/libs/zods/inventory/salesOrderZod";
import salesOrderService from "@/app/api/inventory/salesOrderService";
import customerService from "@/app/api/sales/customerService";
import { Toast } from "primereact/toast";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { Calendar } from "primereact/calendar";
import { Dialog } from "primereact/dialog";
import { ProgressSpinner } from "primereact/progressspinner";
import { handleFormError } from "@/utils/errorHandlers";
import { LayoutContext } from "@/layout/context/layoutcontext";
import { Item } from "@/libs/interfaces/inventory";
import CustomerForm from "@/components/sales/customer/CustomerForm";
import FormActionButtons from "@/components/common/FormActionButtons";

type FormData = z.infer<typeof salesOrderSchema>;

interface SalesOrderFormProps {
  salesOrder: any;
  hideFormDialog: () => void;
  salesOrders: any[];
  setSalesOrders: (salesOrders: any[]) => void;
  setSalesOrder: (salesOrder: any) => void;
  showToast: (
    severity: "success" | "error",
    summary: string,
    detail: string,
  ) => void;
  toast: React.RefObject<Toast> | null;
  items: Item[];
}

const estadoOptions = [
  { label: "Borrador", value: "borrador" },
  { label: "Pendiente", value: "pendiente" },
  { label: "Confirmada", value: "confirmada" },
  { label: "Parcial", value: "parcial" },
  { label: "Despachada", value: "despachada" },
  { label: "Cancelada", value: "cancelada" },
];

const SalesOrderForm = ({
  salesOrder,
  toast,
  hideFormDialog,
  salesOrders,
  setSalesOrders,
  showToast,
  items,
}: SalesOrderFormProps) => {
  const { layoutConfig } = useContext(LayoutContext);
  const filledInput = layoutConfig.inputStyle === "filled";

  // Estado de loading controlado
  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerDialog, setCustomerDialog] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [isCustomerSubmitting, setIsCustomerSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    control,
  } = useForm<FormData>({
    resolver: zodResolver(salesOrderSchema),
    defaultValues: {
      estado: "borrador",
      items: [
        {
          item: "",
          cantidad: 1,
          precioUnitario: 0,
          reservado: 0,
          entregado: 0,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  // Simular loading inicial
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Load customers
  useEffect(() => {
    const loadCustomers = async () => {
      setLoadingCustomers(true);
      try {
        const customersRes = await customerService.getActive();
        setCustomers(Array.isArray(customersRes.data) ? customersRes.data : []);
      } catch (error) {
        console.error("Error loading customers:", error);
      } finally {
        setLoadingCustomers(false);
      }
    };
    loadCustomers();
  }, []);

  const hideCustomerDialog = () => setCustomerDialog(false);

  const onCustomerCreated = (created: any) => {
    if (created?.id) {
      setCustomers((prev) => [...prev, created]);
      setValue("customer", created.id);
    }
    hideCustomerDialog();
  };

  const customerFooter = (
    <div className="p-2 border-top-1 surface-border">
      <Button
        label="Nuevo cliente"
        icon="pi pi-plus"
        text
        size="small"
        type="button"
        className="w-full justify-content-start"
        onClick={() => setCustomerDialog(true)}
      />
    </div>
  );

  useEffect(() => {
    if (salesOrder) {
      Object.keys(salesOrder).forEach((key) => {
        if (key === "fecha" && salesOrder[key]) {
          setValue(key as keyof FormData, new Date(salesOrder[key]) as any);
        } else if (key === "customer") {
          setValue(
            key as keyof FormData,
            typeof salesOrder.customer === "object"
              ? salesOrder.customer._id
              : salesOrder.customer,
          );
        } else if (key === "items") {
          // Handle items that might be populated objects
          const processedItems = salesOrder.items.map((item: any) => ({
            ...item,
            item: typeof item.item === "object" ? item.item._id : item.item,
          }));
          setValue(key as keyof FormData, processedItems);
        } else {
          setValue(key as keyof FormData, salesOrder[key]);
        }
      });
    }
  }, [salesOrder, setValue]);

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      const formattedData = {
        ...data,
        fecha: data.fecha ? new Date(data.fecha).toISOString() : undefined,
      };

      if (salesOrder) {
        const orderId = salesOrder._id || salesOrder.id;
        const result = await salesOrderService.update(orderId, formattedData);
        const updatedSalesOrder = result.data;
        const updatedSalesOrders = salesOrders.map((t) =>
          (t._id || t.id) === (updatedSalesOrder._id || updatedSalesOrder.id)
            ? updatedSalesOrder
            : t,
        );
        setSalesOrders(updatedSalesOrders);
        showToast("success", "Éxito", "Orden de venta actualizada");
      } else {
        const result = await salesOrderService.create(formattedData);
        const newSalesOrder = result.data;
        setSalesOrders([...salesOrders, newSalesOrder]);
        showToast("success", "Éxito", "Orden de venta creada");
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
    value: item._id || item.id,
  }));

  return (
    <div>
      {isLoading ? (
        <div className="flex flex-column align-items-center justify-content-center p-4">
          <ProgressSpinner
            style={{ width: "40px", height: "40px" }}
            strokeWidth="4"
            fill="var(--surface-ground)"
            animationDuration=".5s"
          />
          <p className="mt-3 text-600 font-medium">Preparando formulario...</p>
        </div>
      ) : (
        <>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="card p-fluid surface-50 p-3 border-round shadow-2">
              {/* Header del Formulario */}
              <div className="mb-2 text-center md:text-left">
                <div className="border-bottom-2 border-primary pb-2">
                  <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                    <i className="pi pi-money-bill mr-3 text-primary text-3xl"></i>
                    {salesOrder
                      ? "Modificar Orden de Venta"
                      : "Crear Orden de Venta"}
                  </h2>
                </div>
              </div>

              {/* Cuerpo del Formulario */}
              <div className="grid formgrid row-gap-2">
                {/* Número de Orden */}
                <div className="field col-12 md:col-4">
                  <label htmlFor="numero" className="font-medium text-900">
                    Número de Orden
                  </label>
                  <InputText
                    id="numero"
                    type="text"
                    className={classNames("w-full", {
                      "p-invalid": errors.numero,
                      "p-filled": filledInput,
                    })}
                    {...register("numero")}
                    placeholder="SO-2025-001 (Auto-generado si vacío)"
                  />
                  {errors.numero && (
                    <small className="p-error">{errors.numero.message}</small>
                  )}
                </div>

                {/* Cliente */}
                <div className="field col-12 md:col-4">
                  <label htmlFor="customer" className="font-medium text-900">
                    Cliente
                  </label>
                  <Controller
                    name="customer"
                    control={control}
                    render={({ field }) => (
                      <Dropdown
                        id="customer"
                        value={field.value}
                        onChange={(e) => field.onChange(e.value)}
                        options={customers}
                        optionLabel="name"
                        optionValue="id"
                        placeholder="Seleccione un cliente"
                        filter
                        loading={loadingCustomers}
                        panelFooterTemplate={customerFooter}
                        className={classNames("w-full", {
                          "p-invalid": errors.customer,
                          "p-filled": filledInput,
                        })}
                      />
                    )}
                  />
                  {errors.customer && (
                    <small className="p-error">{errors.customer.message}</small>
                  )}
                </div>

                {/* Fecha */}
                <div className="field col-12 md:col-4">
                  <label htmlFor="fecha" className="font-medium text-900">
                    Fecha
                  </label>
                  <Controller
                    name="fecha"
                    control={control}
                    render={({ field }) => (
                      <Calendar
                        id="fecha"
                        value={field.value ? new Date(field.value) : null}
                        onChange={(e) => field.onChange(e.value)}
                        dateFormat="yy-mm-dd"
                        showIcon
                        className={classNames("w-full", {
                          "p-invalid": errors.fecha,
                        })}
                      />
                    )}
                  />
                  {errors.fecha && (
                    <small className="p-error">{errors.fecha.message}</small>
                  )}
                </div>

                {/* Estado (solo en edición) */}
                {salesOrder && (
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
                          disabled={
                            salesOrder?.estado === "confirmada" ||
                            salesOrder?.estado === "despachada" ||
                            salesOrder?.estado === "cancelada"
                          }
                        />
                      )}
                    />
                    {errors.estado && (
                      <small className="p-error">{errors.estado.message}</small>
                    )}
                  </div>
                )}
              </div>

              {/* Sección de Items */}
              <div className="mt-4">
                <div className="flex justify-content-between align-items-center mb-3">
                  <h3 className="m-0 text-xl font-semibold text-900">
                    <i className="pi pi-list mr-2 text-primary"></i>
                    Items de la Orden
                  </h3>
                  <Button
                    type="button"
                    icon="pi pi-plus"
                    label="Agregar Item"
                    className="p-button-sm p-button-success"
                    onClick={() =>
                      append({
                        item: "",
                        cantidad: 1,
                        precioUnitario: 0,
                        reservado: 0,
                        entregado: 0,
                      })
                    }
                  />
                </div>

                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="surface-100 border-round p-3 mb-3 relative"
                  >
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        icon="pi pi-times"
                        className="p-button-rounded p-button-danger p-button-text absolute top-0 right-0 m-2"
                        onClick={() => remove(index)}
                      />
                    )}

                    <div className="grid formgrid">
                      {/* Item */}
                      <div className="field col-12 md:col-6">
                        <label
                          htmlFor={`items.${index}.item`}
                          className="font-medium text-700"
                        >
                          Item <span className="text-red-500">*</span>
                        </label>
                        <Controller
                          name={`items.${index}.item`}
                          control={control}
                          render={({ field: itemField }) => (
                            <Dropdown
                              id={`items.${index}.item`}
                              value={itemField.value}
                              onChange={(e) => itemField.onChange(e.value)}
                              options={itemOptions}
                              filter
                              filterBy="label"
                              placeholder="Seleccione un item"
                              className={classNames("w-full", {
                                "p-invalid": errors.items?.[index]?.item,
                              })}
                            />
                          )}
                        />
                        {errors.items?.[index]?.item && (
                          <small className="p-error">
                            {errors.items[index]?.item?.message}
                          </small>
                        )}
                      </div>

                      {/* Cantidad */}
                      <div className="field col-12 md:col-2">
                        <label
                          htmlFor={`items.${index}.cantidad`}
                          className="font-medium text-700"
                        >
                          Cantidad <span className="text-red-500">*</span>
                        </label>
                        <Controller
                          name={`items.${index}.cantidad`}
                          control={control}
                          render={({ field: cantidadField }) => (
                            <InputNumber
                              id={`items.${index}.cantidad`}
                              value={cantidadField.value}
                              onValueChange={(e) =>
                                cantidadField.onChange(e.value ?? 1)
                              }
                              min={1}
                              showButtons
                              className={classNames("w-full", {
                                "p-invalid": errors.items?.[index]?.cantidad,
                              })}
                            />
                          )}
                        />
                        {errors.items?.[index]?.cantidad && (
                          <small className="p-error">
                            {errors.items[index]?.cantidad?.message}
                          </small>
                        )}
                      </div>

                      {/* Precio Unitario */}
                      <div className="field col-12 md:col-2">
                        <label
                          htmlFor={`items.${index}.precioUnitario`}
                          className="font-medium text-700"
                        >
                          Precio Unit.
                        </label>
                        <Controller
                          name={`items.${index}.precioUnitario`}
                          control={control}
                          render={({ field: precioField }) => (
                            <InputNumber
                              id={`items.${index}.precioUnitario`}
                              value={precioField.value}
                              onValueChange={(e) =>
                                precioField.onChange(e.value ?? 0)
                              }
                              min={0}
                              mode="currency"
                              currency="USD"
                              locale="en-US"
                              className={classNames("w-full", {
                                "p-invalid":
                                  errors.items?.[index]?.precioUnitario,
                              })}
                            />
                          )}
                        />
                        {errors.items?.[index]?.precioUnitario && (
                          <small className="p-error">
                            {errors.items[index]?.precioUnitario?.message}
                          </small>
                        )}
                      </div>

                      {/* Subtotal */}
                      <div className="field col-12 md:col-2">
                        <label className="font-medium text-700">Subtotal</label>
                        <div className="text-xl font-bold text-primary mt-2">
                          $
                          {(
                            (fields[index]?.cantidad || 0) *
                            (fields[index]?.precioUnitario || 0)
                          ).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {errors.items && typeof errors.items.message === "string" && (
                  <small className="p-error">{errors.items.message}</small>
                )}
              </div>

              {/* Footer con Total */}
              <div className="mt-4 pt-3 border-top-2 border-300">
                <div className="flex justify-content-between align-items-center">
                  <div className="text-2xl font-bold text-900">
                    Total: $
                    {fields
                      .reduce(
                        (sum, field) =>
                          sum +
                          (field.cantidad || 0) * (field.precioUnitario || 0),
                        0,
                      )
                      .toFixed(2)}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      label="Cancelar"
                      icon="pi pi-times"
                      className="p-button-text p-button-secondary"
                      onClick={hideFormDialog}
                      disabled={submitting}
                    />
                    <Button
                      type="submit"
                      label={salesOrder ? "Actualizar" : "Crear"}
                      icon="pi pi-check"
                      className="p-button-success"
                      loading={submitting}
                    />
                  </div>
                </div>
              </div>
            </div>
          </form>

          {/* Customer Creation Dialog */}
          <Dialog
            visible={customerDialog}
            style={{ width: "550px" }}
            header={
              <div className="mb-2 text-center md:text-left">
                <div className="border-bottom-2 border-primary pb-2">
                  <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                    <i className="pi pi-user mr-3 text-primary text-3xl"></i>
                    Nuevo Cliente
                  </h2>
                </div>
              </div>
            }
            modal
            className="p-fluid"
            onHide={hideCustomerDialog}
            footer={
              <FormActionButtons
                formId="customer-form-inline"
                isUpdate={false}
                onCancel={hideCustomerDialog}
                isSubmitting={isCustomerSubmitting}
              />
            }
          >
            <CustomerForm
              customer={null}
              formId="customer-form-inline"
              onSave={() => {}}
              onCreated={onCustomerCreated}
              onSubmittingChange={setIsCustomerSubmitting}
              toast={toast}
            />
          </Dialog>
        </>
      )}
    </div>
  );
};

export default SalesOrderForm;
