"use client";
import React, { useContext, useEffect, useState } from "react";

// Form libraries
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// PrimeReact components
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { classNames } from "primereact/utils";
import { Toast } from "primereact/toast";
import { Dropdown } from "primereact/dropdown";
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from "primereact/inputnumber";
import { Calendar } from "primereact/calendar";
import { Divider } from "primereact/divider";
import { ProgressSpinner } from "primereact/progressspinner";
import { Dialog } from "primereact/dialog";

// Interfaces and schemas
import { workOrderSchema, WorkOrderFormData } from "@/libs/zods/workshop";
import { WorkOrder, WorkOrderItem } from "@/libs/interfaces/workshop";

// API functions
import {
  createWorkOrder,
  updateWorkOrder,
  getWorkOrderStatuses,
  createWorkOrderItem,
  getWorkOrderItems,
} from "@/app/api/workshop/workOrderService";
import { getCustomers } from "@/app/api/inventory/customerService";
import { getVehicles } from "@/app/api/crm/vehicleService";
import { getUsers } from "@/app/api/userService";

// Utils
import { handleFormError } from "@/utils/errorHandlers";
import { LayoutContext } from "@/layout/context/layoutcontext";

// Components
import WorkOrderItemsForm from "./WorkOrderItemsForm";
import CustomerForm from "@/components/inventory/customers/CustomerForm";
import VehicleForm from "@/components/crm/vehicles/VehicleForm";

interface WorkOrderFormProps {
  workOrder: WorkOrder | null;
  onSave: () => void;
  onCancel: () => void;
  toast: React.RefObject<Toast>;
}

const prioridadOptions = [
  { label: "Baja", value: "baja" },
  { label: "Normal", value: "normal" },
  { label: "Alta", value: "alta" },
  { label: "Urgente", value: "urgente" },
];

export default function WorkOrderForm({
  workOrder,
  onSave,
  onCancel,
  toast,
}: WorkOrderFormProps) {
  const { layoutConfig } = useContext(LayoutContext);

  // Estado de loading controlado
  const [isLoading, setIsLoading] = useState(true);
  const filledInput = layoutConfig.inputStyle === "filled";
  const [submitting, setSubmitting] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [items, setItems] = useState<WorkOrderItem[]>([]);
  const [customerDialog, setCustomerDialog] = useState(false);
  const [vehicleDialog, setVehicleDialog] = useState(false);

  // Simular loading inicial
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const {
    handleSubmit,
    formState: { errors },
    setValue,
    control,
    watch,
  } = useForm<WorkOrderFormData>({
    resolver: zodResolver(workOrderSchema),
    defaultValues: {
      motivo: "",
      kilometraje: 0,
      prioridad: "normal",
      descripcionProblema: "",
      subtotalRepuestos: 0,
      subtotalServicios: 0,
      descuento: 0,
      impuesto: 0,
      costoTotal: 0,
    },
  });

  useEffect(() => {
    loadFormData();
  }, []);

  useEffect(() => {
    if (workOrder) {
      // Set form values
      setValue(
        "customer",
        typeof workOrder.customer === "object"
          ? workOrder.customer._id
          : workOrder.customer
      );
      setValue(
        "vehicle",
        typeof workOrder.vehicle === "object"
          ? workOrder.vehicle._id
          : workOrder.vehicle
      );
      setValue("motivo", workOrder.motivo);
      setValue("kilometraje", workOrder.kilometraje);
      setValue("prioridad", workOrder.prioridad);
      setValue("descripcionProblema", workOrder.descripcionProblema || "");

      if (workOrder.estado) {
        const estadoId =
          typeof workOrder.estado === "object"
            ? workOrder.estado._id
            : workOrder.estado;
        if (estadoId) {
          setValue("estado", estadoId);
        }
      }

      if (workOrder.tecnicoAsignado) {
        setValue(
          "tecnicoAsignado",
          typeof workOrder.tecnicoAsignado === "object"
            ? workOrder.tecnicoAsignado._id
            : workOrder.tecnicoAsignado
        );
      }

      if (workOrder.fechaEstimadaEntrega) {
        setValue(
          "fechaEstimadaEntrega",
          new Date(workOrder.fechaEstimadaEntrega)
        );
      }

      setValue("observaciones", workOrder.observaciones || "");

      // Set customer for vehicle filtering
      if (typeof workOrder.customer === "object") {
        setSelectedCustomer(workOrder.customer._id);
      }

      // Load items if editing existing work order
      const workOrderId = workOrder._id || workOrder.id;
      if (workOrderId) {
        loadWorkOrderItems(workOrderId);
      }
    }
  }, [workOrder, setValue]);

  /**
   * Carga los items de la orden de trabajo
   */
  const loadWorkOrderItems = async (workOrderId: string) => {
    try {
      const itemsData = await getWorkOrderItems(workOrderId);
      setItems(itemsData || []);
    } catch (error) {
      console.error("Error loading work order items:", error);
      setItems([]);
    }
  };

  /**
   * Carga los datos iniciales del formulario
   */
  const loadFormData = async () => {
    try {
      const [customersRes, vehiclesRes, usersRes, statusesRes] =
        await Promise.all([
          getCustomers(),
          getVehicles(),
          getUsers(),
          getWorkOrderStatuses(),
        ]);
      console.log(vehiclesRes);
      setCustomers(
        Array.isArray(customersRes.customers) ? customersRes.customers : []
      );
      setVehicles(
        Array.isArray(vehiclesRes.vehicles) ? vehiclesRes.vehicles : []
      );
      setTechnicians(Array.isArray(usersRes.users) ? usersRes.users : []);
      setStatuses(Array.isArray(statusesRes) ? statusesRes : []);
    } catch (error) {
      console.error("Error loading form data:", error);
    }
  };

  /**
   * Maneja el envío del formulario para crear o actualizar una orden de trabajo
   */
  const onSubmit = async (data: WorkOrderFormData) => {
    try {
      setSubmitting(true);

      // Calculate totals from items
      const subtotalServicios = items
        .filter((item) => item.tipo === "servicio")
        .reduce((sum, item) => sum + item.precioFinal, 0);

      const subtotalRepuestos = items
        .filter((item) => item.tipo === "repuesto")
        .reduce((sum, item) => sum + item.precioFinal, 0);

      const costoTotal = subtotalServicios + subtotalRepuestos;

      // Update data with calculated totals
      const workOrderData = {
        ...data,
        subtotalServicios,
        subtotalRepuestos,
        costoTotal,
        items,
      };
      console.log("workOrderData", workOrderData);
      if (workOrder?._id || workOrder?.id) {
        const id = workOrder._id || workOrder.id!;
        await updateWorkOrder(id, workOrderData);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Orden de trabajo actualizada correctamente",
          life: 3000,
        });
      } else {
        const createdWorkOrder = await createWorkOrder(workOrderData);

        // Create items for the new work order
        if (items.length > 0 && createdWorkOrder._id) {
          await Promise.all(
            items.map((item) =>
              createWorkOrderItem(createdWorkOrder._id!, item)
            )
          );
        }

        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Orden de trabajo creada correctamente",
          life: 3000,
        });
      }
      onSave();
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setSubmitting(false);
    }
  };

  // Filter vehicles by selected customer
  const filteredVehicles = selectedCustomer
    ? vehicles.filter((v) => {
        const customerId =
          typeof v.customer === "object"
            ? v.customer._id || v.customer.id
            : v.customer;
        return customerId === selectedCustomer;
      })
    : vehicles;

  // Customer dropdown options with "Add new" option
  const customerOptions = [
    ...customers,
    { _id: "add-new", nombre: "+ Agregar nuevo cliente" },
  ];

  // Vehicle dropdown options with "Add new" option
  const vehicleOptions = [
    ...filteredVehicles,
    { _id: "add-new", placa: "+ Agregar nuevo vehículo" },
  ];

  /**
   * Abre el modal para crear un nuevo cliente
   */
  const openCustomerDialog = () => {
    setCustomerDialog(true);
  };

  /**
   * Cierra el modal del cliente
   */
  const hideCustomerDialog = () => {
    setCustomerDialog(false);
  };

  /**
   * Abre el modal para crear un nuevo vehículo
   */
  const openVehicleDialog = () => {
    setVehicleDialog(true);
  };

  /**
   * Cierra el modal del vehículo
   */
  const hideVehicleDialog = () => {
    setVehicleDialog(false);
  };

  /**
   * Maneja la selección del dropdown de clientes
   */
  const handleCustomerChange = (e: any) => {
    if (e.value === "add-new") {
      openCustomerDialog();
    } else {
      setSelectedCustomer(e.value);
      setValue("customer", e.value);
      setValue("vehicle", ""); // Reset vehicle when customer changes
    }
  };

  /**
   * Maneja la selección del dropdown de vehículos
   */
  const handleVehicleChange = (e: any) => {
    if (e.value === "add-new") {
      openVehicleDialog();
    } else {
      setValue("vehicle", e.value);
    }
  };

  /**
   * Callback cuando se crea un nuevo cliente
   */
  const onCustomerCreated = (newCustomer: any) => {
    // Agregar el nuevo cliente a la lista
    setCustomers((prev) => [...prev, newCustomer]);
    // Seleccionar automáticamente el nuevo cliente
    setSelectedCustomer(newCustomer._id);
    setValue("customer", newCustomer._id);
    setValue("vehicle", ""); // Reset vehicle
    // Cerrar el modal
    hideCustomerDialog();
  };

  /**
   * Callback cuando se crea un nuevo vehículo
   */
  const onVehicleCreated = (newVehicle: any) => {
    // Agregar el nuevo vehículo a la lista
    setVehicles((prev) => [...prev, newVehicle]);
    // Seleccionar automáticamente el nuevo vehículo
    setValue("vehicle", newVehicle._id || newVehicle.id);
    // Cerrar el modal
    hideVehicleDialog();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
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
          {/* Información del Cliente y Vehículo */}
          <div className="formgrid grid">
            {/* Customer */}
            <div className="col-12 md:col-6 lg:col-4 xl:col-3 ">
              <label
                htmlFor="customer"
                className="block text-900 font-medium mb-2"
              >
                Cliente *
              </label>
              <Controller
                name="customer"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="customer"
                    value={field.value}
                    options={customerOptions}
                    onChange={handleCustomerChange}
                    optionLabel="nombre"
                    optionValue="_id"
                    placeholder="Seleccione un cliente"
                    filter
                    className={classNames(
                      { "p-invalid": errors.customer },
                      filledInput ? "p-filled" : ""
                    )}
                    itemTemplate={(option) => {
                      if (option._id === "add-new") {
                        return (
                          <div className="flex align-items-center gap-2 p-2 border-top-1 border-200">
                            <i className="pi pi-plus text-primary"></i>
                            <span className="text-primary font-medium">
                              {option.nombre}
                            </span>
                          </div>
                        );
                      }
                      return <span>{option.nombre}</span>;
                    }}
                  />
                )}
              />
              {errors.customer && (
                <small className="p-error">{errors.customer.message}</small>
              )}
            </div>

            {/* Vehicle */}
            <div className="col-12 md:col-6 lg:col-4 xl:col-2 ">
              <label
                htmlFor="vehicle"
                className="block text-900 font-medium mb-2"
              >
                Vehículo *
              </label>
              <Controller
                name="vehicle"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="vehicle"
                    value={field.value}
                    options={vehicleOptions}
                    onChange={handleVehicleChange}
                    optionLabel="placa"
                    optionValue="_id"
                    placeholder={
                      selectedCustomer
                        ? "Seleccione un vehículo"
                        : "Primero seleccione un cliente"
                    }
                    filter
                    disabled={!selectedCustomer}
                    className={classNames(
                      { "p-invalid": errors.vehicle },
                      filledInput ? "p-filled" : ""
                    )}
                    itemTemplate={(option) => {
                      if (option._id === "add-new") {
                        return (
                          <div className="flex align-items-center gap-2 p-2 border-top-1 border-200">
                            <i className="pi pi-plus text-primary"></i>
                            <span className="text-primary font-medium">
                              {option.placa}
                            </span>
                          </div>
                        );
                      }
                      return <span>{option.placa}</span>;
                    }}
                  />
                )}
              />
              {errors.vehicle && (
                <small className="p-error">{errors.vehicle.message}</small>
              )}
            </div>
            {/* Kilometraje */}
            <div className="col-12 md:col-6 lg:col-4 xl:col-2 ">
              <label
                htmlFor="kilometraje"
                className="block text-900 font-medium mb-2"
              >
                Kilometraje *
              </label>
              <Controller
                name="kilometraje"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    id="kilometraje"
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    suffix=" km"
                    className={classNames({ "p-invalid": errors.kilometraje })}
                  />
                )}
              />
              {errors.kilometraje && (
                <small className="p-error">{errors.kilometraje.message}</small>
              )}
            </div>
            {/* Prioridad */}
            <div className="col-12 md:col-6 lg:col-4 xl:col-2">
              <label
                htmlFor="prioridad"
                className="block text-900 font-medium mb-2"
              >
                Prioridad *
              </label>
              <Controller
                name="prioridad"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="prioridad"
                    value={field.value}
                    options={prioridadOptions}
                    onChange={(e) => field.onChange(e.value)}
                    className={classNames({ "p-invalid": errors.prioridad })}
                  />
                )}
              />
              {errors.prioridad && (
                <small className="p-error">{errors.prioridad.message}</small>
              )}
            </div>
            {/* Estado */}
            <div className="col-12 md:col-6 lg:col-4 xl:col-3">
              <label
                htmlFor="estado"
                className="block text-900 font-medium mb-2"
              >
                Estado *
              </label>
              <Controller
                name="estado"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="estado"
                    value={field.value}
                    options={statuses}
                    onChange={(e) => field.onChange(e.value)}
                    optionLabel="nombre"
                    optionValue="_id"
                    placeholder="Seleccione un estado"
                    className={classNames({ "p-invalid": errors.estado })}
                  />
                )}
              />
              {errors.estado && (
                <small className="p-error">{errors.estado.message}</small>
              )}
            </div>
          </div>

          {/* Información del Servicio */}
          <div className="formgrid grid">
            {/* Motivo */}
            <div className="col-12 md:col-6 lg:col-4 xl:col-3">
              <label
                htmlFor="motivo"
                className="block text-900 font-medium mb-2"
              >
                Motivo *
              </label>
              <Controller
                name="motivo"
                control={control}
                render={({ field }) => (
                  <InputText
                    id="motivo"
                    {...field}
                    className={classNames(
                      { "p-invalid": errors.motivo },
                      filledInput ? "p-filled" : ""
                    )}
                    placeholder="Ej: Servicio de mantenimiento preventivo"
                  />
                )}
              />
              {errors.motivo && (
                <small className="p-error">{errors.motivo.message}</small>
              )}
            </div>
            {/* Técnico Asignado */}
            <div className="col-12 md:col-6 lg:col-4 xl:col-3">
              <label
                htmlFor="tecnicoAsignado"
                className="block text-900 font-medium mb-2"
              >
                Técnico Asignado
              </label>
              <Controller
                name="tecnicoAsignado"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="tecnicoAsignado"
                    value={field.value}
                    options={technicians}
                    onChange={(e) => field.onChange(e.value)}
                    optionLabel="nombre"
                    optionValue="_id"
                    placeholder="Seleccione un técnico"
                    filter
                    showClear
                  />
                )}
              />
            </div>
            <div className="col-12 md:col-6">
              <label
                htmlFor="fechaEstimadaEntrega"
                className="block text-900 font-medium mb-2"
              >
                Fecha Estimada de Entrega
              </label>
              <Controller
                name="fechaEstimadaEntrega"
                control={control}
                render={({ field }) => (
                  <Calendar
                    id="fechaEstimadaEntrega"
                    value={
                      field.value instanceof Date
                        ? field.value
                        : field.value
                        ? new Date(field.value)
                        : null
                    }
                    onChange={(e) => field.onChange(e.value)}
                    showTime
                    hourFormat="24"
                    placeholder="Seleccione fecha y hora"
                    dateFormat="dd/mm/yy"
                  />
                )}
              />
            </div>
          </div>

          {/* Estado y Técnico Asignado */}
          <div className="formgrid grid"></div>

          {/* Fecha Estimada de Entrega */}
          <div className="formgrid grid"></div>

          {/* Campos de Texto Largo */}
          <div className="formgrid grid">
            {/* Descripción del Problema */}
            <div className="col-12">
              <label
                htmlFor="descripcionProblema"
                className="block text-900 font-medium mb-2"
              >
                Descripción del Problema
              </label>
              <Controller
                name="descripcionProblema"
                control={control}
                render={({ field }) => (
                  <InputTextarea
                    id="descripcionProblema"
                    {...field}
                    rows={3}
                    placeholder="Describa el problema o los síntomas reportados"
                    className={filledInput ? "p-filled" : ""}
                  />
                )}
              />
            </div>

            {/* Observaciones */}
            <div className="col-12">
              <label
                htmlFor="observaciones"
                className="block text-900 font-medium mb-2"
              >
                Observaciones
              </label>
              <Controller
                name="observaciones"
                control={control}
                render={({ field }) => (
                  <InputTextarea
                    id="observaciones"
                    {...field}
                    rows={2}
                    placeholder="Notas adicionales"
                    className={filledInput ? "p-filled" : ""}
                  />
                )}
              />
            </div>
          </div>

          <Divider />

          {/* Items Section */}
          <WorkOrderItemsForm items={items} onChange={setItems} />

          {/* Buttons */}
          <div className="flex gap-2 justify-content-end mt-4">
            <Button
              label="Cancelar"
              icon="pi pi-times"
              severity="secondary"
              onClick={onCancel}
              type="button"
              disabled={submitting}
            />
            <Button
              label="Guardar"
              icon="pi pi-check"
              type="submit"
              loading={submitting}
            />
          </div>
        </>
      )}

      {/* Customer Creation Dialog */}
      <Dialog
        visible={customerDialog}
        style={{ width: "50rem" }}
        header="Crear Nuevo Cliente"
        modal
        className="p-fluid"
        onHide={hideCustomerDialog}
      >
        <CustomerForm
          customer={null}
          hideFormDialog={hideCustomerDialog}
          customers={customers}
          setCustomers={setCustomers}
          setCustomer={() => {}} // No necesitamos esto aquí
          showToast={(severity, summary, detail) => {
            toast.current?.show({
              severity,
              summary,
              detail,
              life: 3000,
            });
          }}
          toast={toast}
          onCustomerCreated={onCustomerCreated}
        />
      </Dialog>

      {/* Vehicle Creation Dialog */}
      <Dialog
        visible={vehicleDialog}
        style={{ width: "50rem" }}
        header="Crear Nuevo Vehículo"
        modal
        className="p-fluid"
        onHide={hideVehicleDialog}
      >
        <VehicleForm
          vehicle={null}
          hideFormDialog={hideVehicleDialog}
          vehicles={vehicles}
          setVehicles={setVehicles}
          setVehicle={() => {}} // No necesitamos esto aquí
          showToast={(severity, summary, detail) => {
            toast.current?.show({
              severity,
              summary,
              detail,
              life: 3000,
            });
          }}
          toast={toast}
          onVehicleCreated={onVehicleCreated}
          preselectedCustomer={selectedCustomer || undefined}
        />
      </Dialog>
    </form>
  );
}
