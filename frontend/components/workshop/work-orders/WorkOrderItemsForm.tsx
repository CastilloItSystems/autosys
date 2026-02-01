"use client";
import React, { useState, useEffect } from "react";

// Form libraries
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// PrimeReact components
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { Tag } from "primereact/tag";
import { ProgressSpinner } from "primereact/progressspinner";

// Interfaces and schemas
import { WorkOrderItem } from "@/libs/interfaces/workshop";

// API functions
import { getServices } from "@/app/api/workshop/serviceService";
import { getItems } from "@/app/api/inventory/itemService";

interface WorkOrderItemsFormProps {
  items: WorkOrderItem[];
  onChange: (items: WorkOrderItem[]) => void;
}

/**
 * Formulario para gestionar items de órdenes de trabajo.
 * Permite agregar, editar y eliminar servicios y repuestos en una orden de trabajo.
 */
export default function WorkOrderItemsForm({
  items,
  onChange,
}: WorkOrderItemsFormProps) {
  // Estado de loading controlado
  const [isLoading, setIsLoading] = useState(true);
  const [itemDialog, setItemDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<WorkOrderItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<WorkOrderItem | null>(null);
  const [services, setServices] = useState<any[]>([]);
  const [repuestos, setRepuestos] = useState<any[]>([]);

  // Form state
  const [itemType, setItemType] = useState<"servicio" | "repuesto">("servicio");
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedRepuesto, setSelectedRepuesto] = useState<any>(null);
  const [cantidad, setCantidad] = useState<number>(1);
  const [precioUnitario, setPrecioUnitario] = useState<number>(0);
  const [descuento, setDescuento] = useState<number>(0);
  const [descripcion, setDescripcion] = useState<string>("");

  // Simular loading inicial
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  /**
   * Carga los datos iniciales del formulario (servicios y repuestos)
   */
  const loadData = async () => {
    try {
      console.log("=== LOADING DATA ===");
      const [servicesRes, itemsRes] = await Promise.all([
        getServices({}),
        getItems(),
      ]);

      console.log("Services response:", servicesRes);
      console.log("Items response:", itemsRes);

      // Handle services response
      let servicesData: any[] = [];
      if (
        servicesRes &&
        servicesRes.success &&
        Array.isArray(servicesRes.data)
      ) {
        servicesData = servicesRes.data;
      } else if (Array.isArray(servicesRes)) {
        servicesData = servicesRes;
      }

      // Handle items response
      let itemsData: any[] = [];
      if (itemsRes && itemsRes.items && Array.isArray(itemsRes.items)) {
        itemsData = itemsRes.items;
      } else if (itemsRes && Array.isArray(itemsRes)) {
        itemsData = itemsRes;
      } else if (itemsRes && itemsRes.data && Array.isArray(itemsRes.data)) {
        itemsData = itemsRes.data;
      }

      console.log("Final services data:", servicesData);
      console.log("Final items data:", itemsData);

      setServices(servicesData);
      setRepuestos(itemsData);
    } catch (error) {
      console.error("Error loading data:", error);
      setServices([]);
      setRepuestos([]);
    }
  };

  const openNew = () => {
    resetForm();
    setEditingItem(null);
    setItemDialog(true);
  };

  const resetForm = () => {
    setItemType("servicio");
    setSelectedService(null);
    setSelectedRepuesto(null);
    setCantidad(1);
    setPrecioUnitario(0);
    setDescuento(0);
    setDescripcion("");
  };

  const hideDialog = () => {
    resetForm();
    setItemDialog(false);
  };

  const saveItem = () => {
    let newItem: WorkOrderItem;

    if (itemType === "servicio" && selectedService) {
      const precioTotal = precioUnitario * cantidad;
      const precioFinal = precioTotal - (precioTotal * descuento) / 100;

      newItem = {
        tipo: "servicio",
        servicio: {
          _id: selectedService._id,
          nombre: selectedService.nombre,
          descripcion: selectedService.descripcion,
          precioBase: selectedService.precioBase,
          tiempoEstimadoMinutos: selectedService.tiempoEstimadoMinutos,
        },
        nombre: selectedService.nombre,
        descripcion: descripcion || selectedService.descripcion,
        cantidad,
        precioUnitario,
        descuento,
        tiempoEstimado: selectedService.tiempoEstimadoMinutos,
        estado: "pendiente",
        precioTotal,
        precioFinal,
      };
    } else if (itemType === "repuesto" && selectedRepuesto) {
      const precioTotal = precioUnitario * cantidad;
      const precioFinal = precioTotal - (precioTotal * descuento) / 100;

      newItem = {
        tipo: "repuesto",
        repuesto: {
          codigo: selectedRepuesto.codigo,
          nombre: selectedRepuesto.nombre,
          id: selectedRepuesto._id || selectedRepuesto.id,
          _id: selectedRepuesto._id,
        },
        nombre: selectedRepuesto.nombre,
        descripcion: descripcion || selectedRepuesto.descripcion,
        cantidad,
        precioUnitario,
        descuento,
        numeroParte: selectedRepuesto.codigo,
        estado: "pendiente",
        precioTotal,
        precioFinal,
      };
    } else {
      return;
    }

    if (editingItem) {
      const index = items.findIndex((item) => item === editingItem);
      const updatedItems = [...items];
      updatedItems[index] = { ...editingItem, ...newItem };
      onChange(updatedItems);
    } else {
      onChange([...items, newItem]);
    }

    hideDialog();
  };

  const confirmDeleteItem = (item: WorkOrderItem) => {
    setItemToDelete(item);
    setDeleteDialog(true);
  };

  const deleteItem = () => {
    const updatedItems = items.filter((item) => item !== itemToDelete);
    onChange(updatedItems);
    setDeleteDialog(false);
    setItemToDelete(null);
  };

  const onServiceChange = (service: any) => {
    setSelectedService(service);
    if (service) {
      setPrecioUnitario(service.precioBase || 0);
      setDescripcion(service.descripcion || "");
    }
  };

  const onRepuestoChange = (repuesto: any) => {
    setSelectedRepuesto(repuesto);
    if (repuesto) {
      setPrecioUnitario(repuesto.precio || repuesto.precioVenta || 0);
      setDescripcion(repuesto.descripcion || "");
    }
  };

  const tipoBodyTemplate = (rowData: WorkOrderItem) => {
    const severity = rowData.tipo === "servicio" ? "info" : "warning";
    const label = rowData.tipo === "servicio" ? "Servicio" : "Repuesto";
    return <Tag value={label} severity={severity} />;
  };

  const precioBodyTemplate = (
    rowData: WorkOrderItem,
    field: keyof Pick<
      WorkOrderItem,
      "precioUnitario" | "precioTotal" | "precioFinal"
    >
  ) => {
    const value = rowData[field];
    return new Intl.NumberFormat("es-VE", {
      style: "currency",
      currency: "VES",
    }).format(value);
  };

  const cantidadBodyTemplate = (rowData: WorkOrderItem) => {
    return new Intl.NumberFormat("es-VE").format(rowData.cantidad);
  };

  const descuentoBodyTemplate = (rowData: WorkOrderItem) => {
    if (!rowData.descuento) return "-";
    return `${rowData.descuento}%`;
  };

  const actionBodyTemplate = (rowData: WorkOrderItem) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-trash"
          rounded
          outlined
          severity="danger"
          type="button"
          onClick={() => confirmDeleteItem(rowData)}
        />
      </div>
    );
  };

  const calculateTotals = () => {
    const subtotalServicios = items
      .filter((item) => item.tipo === "servicio")
      .reduce((sum, item) => sum + item.precioFinal, 0);

    const subtotalRepuestos = items
      .filter((item) => item.tipo === "repuesto")
      .reduce((sum, item) => sum + item.precioFinal, 0);

    const total = subtotalServicios + subtotalRepuestos;

    return { subtotalServicios, subtotalRepuestos, total };
  };

  const totals = calculateTotals();

  const dialogFooter = (
    <div className="flex gap-2 my-4 w-full">
      <Button
        label="Cancelar"
        icon="pi pi-times"
        severity="secondary"
        onClick={hideDialog}
        type="button"
        className="flex-1"
        // disabled={submitting}
      />
      <Button
        label="Guardar"
        icon="pi pi-check"
        onClick={saveItem}
        className="flex-1"
      />
    </div>
  );

  const deleteDialogFooter = (
    <>
      <Button
        label="No"
        icon="pi pi-times"
        text
        type="button"
        onClick={() => setDeleteDialog(false)}
      />
      <Button
        label="Sí"
        icon="pi pi-check"
        text
        type="button"
        onClick={deleteItem}
      />
    </>
  );

  return (
    <div className="card">
      <div className="flex justify-content-between align-items-center mb-3">
        <h5 className="m-0">Items de la Orden</h5>
        <Button
          label="Agregar Item"
          icon="pi pi-plus"
          size="small"
          type="button"
          onClick={openNew}
        />
      </div>

      <DataTable
        value={items}
        emptyMessage="No hay items agregados"
        size="small"
      >
        <Column
          field="tipo"
          header="Tipo"
          body={tipoBodyTemplate}
          style={{ width: "8rem" }}
        />
        <Column field="nombre" header="Nombre" style={{ minWidth: "12rem" }} />
        <Column
          field="cantidad"
          header="Cant."
          body={cantidadBodyTemplate}
          style={{ width: "6rem" }}
        />
        <Column
          field="precioUnitario"
          header="Precio Unit."
          body={(rowData) => precioBodyTemplate(rowData, "precioUnitario")}
          style={{ width: "10rem" }}
        />
        <Column
          field="descuento"
          header="Desc."
          body={descuentoBodyTemplate}
          style={{ width: "6rem" }}
        />
        <Column
          field="precioFinal"
          header="Total"
          body={(rowData) => precioBodyTemplate(rowData, "precioFinal")}
          style={{ width: "10rem" }}
        />
        <Column
          body={actionBodyTemplate}
          exportable={false}
          style={{ width: "8rem" }}
        />
      </DataTable>

      <div className="mt-3 p-3 surface-100 border-round">
        <div className="flex justify-content-between mb-2">
          <span className="font-semibold">Subtotal Servicios:</span>
          <span>
            {new Intl.NumberFormat("es-VE", {
              style: "currency",
              currency: "VES",
            }).format(totals.subtotalServicios)}
          </span>
        </div>
        <div className="flex justify-content-between mb-2">
          <span className="font-semibold">Subtotal Repuestos:</span>
          <span>
            {new Intl.NumberFormat("es-VE", {
              style: "currency",
              currency: "VES",
            }).format(totals.subtotalRepuestos)}
          </span>
        </div>
        <div className="flex justify-content-between">
          <span className="font-bold text-lg">Total:</span>
          <span className="font-bold text-lg">
            {new Intl.NumberFormat("es-VE", {
              style: "currency",
              currency: "VES",
            }).format(totals.total)}
          </span>
        </div>
      </div>

      {/* Add/Edit Item Dialog */}
      <Dialog
        visible={itemDialog}
        style={{ width: "600px" }}
        header={
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-tags mr-3 text-primary text-3xl"></i>
                Agregar Item
              </h2>
            </div>
          </div>
        }
        modal
        className="p-fluid"
        footer={dialogFooter}
        onHide={hideDialog}
      >
        <div className="field">
          <label htmlFor="tipo" className="font-bold">
            Tipo *
          </label>
          <Dropdown
            id="tipo"
            value={itemType}
            options={[
              { label: "Servicio", value: "servicio" },
              { label: "Repuesto", value: "repuesto" },
            ]}
            onChange={(e) => {
              setItemType(e.value);
              setSelectedService(null);
              setSelectedRepuesto(null);
              setPrecioUnitario(0);
              setDescripcion("");
            }}
          />
        </div>

        {itemType === "servicio" ? (
          <div className="field">
            <label htmlFor="servicio" className="font-bold">
              Servicio *
            </label>
            <Dropdown
              id="servicio"
              value={selectedService}
              options={services}
              onChange={(e) => onServiceChange(e.value)}
              optionLabel="nombre"
              placeholder="Seleccione un servicio"
              filter
            />
          </div>
        ) : (
          <div className="field">
            <label htmlFor="repuesto" className="font-bold">
              Repuesto *
            </label>
            <Dropdown
              id="repuesto"
              value={selectedRepuesto}
              options={repuestos}
              onChange={(e) => onRepuestoChange(e.value)}
              optionLabel="nombre"
              placeholder="Seleccione un repuesto"
              filter
            />
          </div>
        )}

        <div className="formgrid grid">
          <div className="field col-6">
            <label htmlFor="cantidad" className="font-bold">
              Cantidad *
            </label>
            <InputNumber
              id="cantidad"
              value={cantidad}
              onValueChange={(e) => setCantidad(e.value || 1)}
              min={1}
              showButtons
            />
          </div>

          <div className="field col-6">
            <label htmlFor="precioUnitario" className="font-bold">
              Precio Unitario *
            </label>
            <InputNumber
              id="precioUnitario"
              value={precioUnitario}
              onValueChange={(e) => setPrecioUnitario(e.value || 0)}
              mode="currency"
              currency="VES"
              locale="es-VE"
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="descuento" className="font-bold">
            Descuento (%)
          </label>
          <InputNumber
            id="descuento"
            value={descuento}
            onValueChange={(e) => setDescuento(e.value || 0)}
            min={0}
            max={100}
            suffix="%"
          />
        </div>

        <div className="field">
          <label htmlFor="descripcion" className="font-bold">
            Descripción
          </label>
          <InputTextarea
            id="descripcion"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={3}
          />
        </div>

        <div className="surface-100 p-3 border-round">
          <div className="flex justify-content-between mb-2">
            <span>Subtotal:</span>
            <span>
              {new Intl.NumberFormat("es-VE", {
                style: "currency",
                currency: "VES",
              }).format(precioUnitario * cantidad)}
            </span>
          </div>
          <div className="flex justify-content-between mb-2">
            <span>Descuento ({descuento}%):</span>
            <span>
              {new Intl.NumberFormat("es-VE", {
                style: "currency",
                currency: "VES",
              }).format((precioUnitario * cantidad * descuento) / 100)}
            </span>
          </div>
          <div className="flex justify-content-between">
            <span className="font-bold">Total:</span>
            <span className="font-bold">
              {new Intl.NumberFormat("es-VE", {
                style: "currency",
                currency: "VES",
              }).format(
                precioUnitario * cantidad -
                  (precioUnitario * cantidad * descuento) / 100
              )}
            </span>
          </div>
        </div>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        visible={deleteDialog}
        style={{ width: "450px" }}
        header="Confirmar"
        modal
        footer={deleteDialogFooter}
        onHide={() => setDeleteDialog(false)}
      >
        <div className="confirmation-content flex align-items-center">
          <i
            className="pi pi-exclamation-triangle mr-3"
            style={{ fontSize: "2rem" }}
          />
          <span>
            ¿Está seguro que desea eliminar el item{" "}
            <b>{itemToDelete?.nombre}</b>?
          </span>
        </div>
      </Dialog>
    </div>
  );
}
