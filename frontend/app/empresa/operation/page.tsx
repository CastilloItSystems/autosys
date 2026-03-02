"use client";

import React, { useState } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Badge } from "primereact/badge";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { TabView, TabPanel } from "primereact/tabview";
import { Chart } from "primereact/chart";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { motion } from "framer-motion";
import { useRef } from "react";
import { WorkOrder } from "@/libs/interfaces/workshop";

// Store y servicios
import { useOperationsStore } from "@/store/operationsStore";
import { useInventoryStore } from "@/store/inventoryStore";

const OperationsDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(
    null
  );
  const [workOrderDialog, setWorkOrderDialog] = useState(false);
  const toast = useRef(null);

  // Usar los stores
  const { workOrders, services, serviceBays } = useOperationsStore();
  const { items, movements } = useInventoryStore();

  // Datos para gráficos
  const workOrderStatusChart = {
    labels: ["Pendiente", "En Progreso", "Completada", "Cancelada"],
    datasets: [
      {
        data: [5, 3, 8, 1],
        backgroundColor: ["#fbbf24", "#3b82f6", "#10b981", "#ef4444"],
      },
    ],
  };

  // Formatear fecha
  const formatDate = (date: string | Date | undefined) => {
    if (!date) return "Sin fecha";
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return "Fecha inválida";
      return new Intl.DateTimeFormat("es-MX", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(dateObj);
    } catch (error) {
      return "Fecha inválida";
    }
  };

  return (
    <div className="operations-dashboard bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen p-4">
      <Toast ref={toast} />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4"
      >
        <div className="flex justify-content-between align-items-center">
          <div>
            <h1 className="text-3xl font-bold text-900 m-0">
              🚗 Dashboard de Operaciones
            </h1>
            <p className="text-600 mt-2">
              Gestión de talleres y operaciones diarias
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              label="Nueva Orden"
              icon="pi pi-plus"
              className="p-button-primary"
            />
            <Button
              label="Actualizar"
              icon="pi pi-refresh"
              className="p-button-secondary"
            />
          </div>
        </div>
      </motion.div>

      {/* Estadísticas principales */}
      <div className="grid mb-4">
        <div className="col-12 md:col-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="shadow-2 border-round-lg text-center bg-blue-50 border-blue-200">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {workOrders.length}
              </div>
              <div className="text-sm text-600">Órdenes de Trabajo</div>
            </Card>
          </motion.div>
        </div>
        <div className="col-12 md:col-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="shadow-2 border-round-lg text-center bg-green-50 border-green-200">
              <div className="text-4xl font-bold text-green-600 mb-2">
                {serviceBays.length}
              </div>
              <div className="text-sm text-600">Bahías de Servicio</div>
            </Card>
          </motion.div>
        </div>
        <div className="col-12 md:col-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="shadow-2 border-round-lg text-center bg-orange-50 border-orange-200">
              <div className="text-4xl font-bold text-orange-600 mb-2">
                {services.length}
              </div>
              <div className="text-sm text-600">Servicios Disponibles</div>
            </Card>
          </motion.div>
        </div>
        <div className="col-12 md:col-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="shadow-2 border-round-lg text-center bg-red-50 border-red-200">
              <div className="text-4xl font-bold text-red-600 mb-2">0</div>
              <div className="text-sm text-600">Alertas de Stock</div>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Tabs principales */}
      <TabView
        activeIndex={activeTab}
        onTabChange={(e) => setActiveTab(e.index)}
        className="shadow-2 border-round-xl"
      >
        <TabPanel header="Vista General" leftIcon="pi pi-home">
          <div className="grid">
            {/* Gráficos */}
            <div className="col-12 lg:col-8">
              <Card className="shadow-2 border-round-lg mb-4">
                <h3 className="text-lg font-bold mb-3 text-900">
                  📊 Estado de Órdenes de Trabajo
                </h3>
                <Chart
                  type="doughnut"
                  data={workOrderStatusChart}
                  options={{ responsive: true, maintainAspectRatio: false }}
                  style={{ height: "300px" }}
                />
              </Card>
            </div>
            <div className="col-12 lg:col-4">
              <Card className="shadow-2 border-round-lg mb-4">
                <h3 className="text-lg font-bold mb-3 text-900">
                  📈 Resumen de Operaciones
                </h3>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-2">
                    {workOrders.length}
                  </div>
                  <div className="text-sm text-600">Total Órdenes</div>
                </div>
              </Card>
            </div>

            {/* Órdenes de trabajo recientes */}
            <div className="col-12">
              <Card className="shadow-2 border-round-lg">
                <h3 className="text-lg font-bold mb-3 text-900">
                  🔧 Órdenes de Trabajo Recientes
                </h3>
                <DataTable
                  value={workOrders.slice(0, 5)}
                  className="p-datatable-sm"
                  emptyMessage="No hay órdenes de trabajo"
                >
                  <Column field="workOrderNumber" header="Número" sortable />
                  <Column
                    field="customer"
                    header="Cliente"
                    body={(rowData) =>
                      typeof rowData.customer === "string"
                        ? rowData.customer
                        : rowData.customer?.nombre
                    }
                    sortable
                  />
                  <Column
                    field="vehicle"
                    header="Vehículo"
                    body={(rowData) =>
                      typeof rowData.vehicle === "string"
                        ? rowData.vehicle
                        : rowData.vehicle?.placa
                    }
                    sortable
                  />
                  <Column
                    field="fechaApertura"
                    header="Fecha"
                    body={(rowData) => formatDate(rowData.fechaApertura)}
                    sortable
                  />
                  <Column
                    header="Acciones"
                    body={(rowData) => (
                      <Button
                        icon="pi pi-eye"
                        className="p-button-rounded p-button-text"
                        onClick={() => {
                          setSelectedWorkOrder(rowData);
                          setWorkOrderDialog(true);
                        }}
                      />
                    )}
                  />
                </DataTable>
              </Card>
            </div>
          </div>
        </TabPanel>

        <TabPanel header="Órdenes de Trabajo" leftIcon="pi pi-wrench">
          <Card className="shadow-2 border-round-lg">
            <div className="flex justify-content-between align-items-center mb-3">
              <h3 className="text-lg font-bold text-900 m-0">
                🔧 Órdenes de Trabajo
              </h3>
              <Button
                label="Nueva Orden"
                icon="pi pi-plus"
                className="p-button-primary"
              />
            </div>
            <DataTable
              value={workOrders}
              className="p-datatable-sm"
              emptyMessage="No hay órdenes de trabajo"
              paginator
              rows={10}
            >
              <Column field="workOrderNumber" header="Número" sortable />
              <Column
                field="customer"
                header="Cliente"
                body={(rowData) =>
                  typeof rowData.customer === "string"
                    ? rowData.customer
                    : rowData.customer?.nombre
                }
                sortable
              />
              <Column
                field="vehicle"
                header="Vehículo"
                body={(rowData) =>
                  typeof rowData.vehicle === "string"
                    ? rowData.vehicle
                    : rowData.vehicle?.placa
                }
                sortable
              />
              <Column
                field="prioridad"
                header="Prioridad"
                body={(rowData) => (
                  <Badge
                    value={rowData?.prioridad?.toUpperCase()}
                    severity="warning"
                  />
                )}
                sortable
              />
              <Column
                field="fechaApertura"
                header="Fecha Apertura"
                body={(rowData) => formatDate(rowData.fechaApertura)}
                sortable
              />
              <Column
                header="Acciones"
                body={(rowData) => (
                  <div className="flex gap-2">
                    <Button
                      icon="pi pi-eye"
                      className="p-button-rounded p-button-text"
                      onClick={() => {
                        setSelectedWorkOrder(rowData);
                        setWorkOrderDialog(true);
                      }}
                    />
                    <Button
                      icon="pi pi-pencil"
                      className="p-button-rounded p-button-text p-button-warning"
                    />
                  </div>
                )}
              />
            </DataTable>
          </Card>
        </TabPanel>

        <TabPanel header="Bahías de Servicio" leftIcon="pi pi-building">
          <Card className="shadow-2 border-round-lg">
            <div className="flex justify-content-between align-items-center mb-3">
              <h3 className="text-lg font-bold text-900 m-0">
                🏢 Bahías de Servicio
              </h3>
              <Button
                label="Nueva Bahía"
                icon="pi pi-plus"
                className="p-button-primary"
              />
            </div>
            <DataTable
              value={serviceBays}
              className="p-datatable-sm"
              emptyMessage="No hay bahías configuradas"
            >
              <Column field="nombre" header="Nombre" sortable />
              <Column field="descripcion" header="Descripción" sortable />
              <Column field="capacidadMaxima" header="Capacidad" sortable />
              <Column
                header="Acciones"
                body={(rowData) => (
                  <Button
                    icon="pi pi-cog"
                    className="p-button-rounded p-button-text"
                  />
                )}
              />
            </DataTable>
          </Card>
        </TabPanel>

        <TabPanel header="Inventario" leftIcon="pi pi-box">
          <TabView className="w-full">
            <TabPanel header="Vista General" leftIcon="pi pi-chart-line">
              <div className="grid">
                <div className="col-12 lg:col-4">
                  <Card className="shadow-2 border-round-lg mb-4 text-center">
                    <div className="text-4xl font-bold text-blue-600 mb-2">
                      {items.length}
                    </div>
                    <div className="text-sm text-600">Artículos Totales</div>
                  </Card>
                </div>
                <div className="col-12 lg:col-4">
                  <Card className="shadow-2 border-round-lg mb-4 text-center">
                    <div className="text-4xl font-bold text-green-600 mb-2">
                      {movements.filter((m) => m.tipo === "entrada").length}
                    </div>
                    <div className="text-sm text-600">Entradas Recientes</div>
                  </Card>
                </div>
                <div className="col-12 lg:col-4">
                  <Card className="shadow-2 border-round-lg mb-4 text-center">
                    <div className="text-4xl font-bold text-orange-600 mb-2">
                      {movements.filter((m) => m.tipo === "salida").length}
                    </div>
                    <div className="text-sm text-600">Salidas Recientes</div>
                  </Card>
                </div>

                {/* Alertas de stock críticas */}
                <div className="col-12">
                  <Card className="shadow-2 border-round-lg">
                    <h3 className="text-lg font-bold mb-3 text-900">
                      🚨 Alertas de Stock Críticas
                    </h3>
                    <DataTable
                      value={[]}
                      className="p-datatable-sm"
                      emptyMessage="No hay alertas críticas"
                    >
                      <Column field="code" header="Código" sortable />
                      <Column field="item" header="Producto" sortable />
                      <Column
                        field="currentStock"
                        header="Stock Actual"
                        sortable
                      />
                      <Column field="minStock" header="Stock Mínimo" sortable />
                      <Column
                        header="Estado"
                        body={(rowData) => (
                          <Badge
                            value={rowData.status.toUpperCase()}
                            severity={
                              rowData.status === "critical"
                                ? "danger"
                                : "warning"
                            }
                          />
                        )}
                      />
                    </DataTable>
                  </Card>
                </div>
              </div>
            </TabPanel>

            <TabPanel header="Artículos" leftIcon="pi pi-list">
              <Card className="shadow-2 border-round-lg">
                <div className="flex justify-content-between align-items-center mb-3">
                  <h3 className="text-lg font-bold text-900 m-0">
                    📦 Artículos en Inventario
                  </h3>
                  <Button
                    label="Nuevo Artículo"
                    icon="pi pi-plus"
                    className="p-button-primary"
                  />
                </div>
                <DataTable
                  value={items}
                  className="p-datatable-sm"
                  emptyMessage="No hay artículos en inventario"
                  paginator
                  rows={10}
                >
                  <Column field="codigo" header="Código" sortable />
                  <Column field="nombre" header="Nombre" sortable />
                  <Column field="descripcion" header="Descripción" sortable />
                  <Column field="stockActual" header="Stock Actual" sortable />
                  <Column field="stockMinimo" header="Stock Mínimo" sortable />
                  <Column
                    header="Estado"
                    body={(rowData) => (
                      <Badge
                        value={rowData.activo ? "ACTIVO" : "INACTIVO"}
                        severity={rowData.activo ? "success" : "secondary"}
                      />
                    )}
                  />
                </DataTable>
              </Card>
            </TabPanel>
          </TabView>
        </TabPanel>

        <TabPanel header="Servicios" leftIcon="pi pi-cog">
          <Card className="shadow-2 border-round-lg">
            <div className="flex justify-content-between align-items-center mb-3">
              <h3 className="text-lg font-bold text-900 m-0">
                🔧 Servicios Disponibles
              </h3>
              <Button
                label="Nuevo Servicio"
                icon="pi pi-plus"
                className="p-button-secondary"
              />
            </div>
            <DataTable
              value={services}
              className="p-datatable-sm"
              emptyMessage="No hay servicios configurados"
            >
              <Column field="nombre" header="Servicio" sortable />
              <Column field="descripcion" header="Descripción" sortable />
              <Column field="precioBase" header="Precio Base" sortable />
              <Column
                field="tiempoEstimadoMinutos"
                header="Tiempo Estimado (min)"
                sortable
              />
              <Column
                header="Estado"
                body={(rowData) => (
                  <Badge
                    value={rowData.activo ? "ACTIVO" : "INACTIVO"}
                    severity={rowData.activo ? "success" : "secondary"}
                  />
                )}
              />
            </DataTable>
          </Card>
        </TabPanel>
      </TabView>

      {/* Diálogo de detalles de orden de trabajo */}
      <Dialog
        visible={workOrderDialog}
        onHide={() => setWorkOrderDialog(false)}
        header="Detalles de Orden de Trabajo"
        style={{ width: "90vw", maxWidth: "800px" }}
        maximizable
      >
        {selectedWorkOrder && (
          <div className="grid">
            <div className="col-12 md:col-6">
              <Card className="shadow-2 border-round-lg">
                <h3 className="text-lg font-bold mb-3 text-900">
                  👤 Información del Cliente
                </h3>
                <div>
                  <div>
                    <strong>Cliente:</strong>
                    {typeof selectedWorkOrder.customer === "string"
                      ? selectedWorkOrder.customer
                      : selectedWorkOrder.customer?.nombre}
                  </div>
                  <div>
                    <strong>Vehículo:</strong>
                    {typeof selectedWorkOrder.vehicle === "string"
                      ? selectedWorkOrder.vehicle
                      : selectedWorkOrder.vehicle?.placa}
                  </div>
                </div>
              </Card>
            </div>
            <div className="col-12 md:col-6">
              <Card className="shadow-2 border-round-lg">
                <h3 className="text-lg font-bold mb-3 text-900">
                  📋 Detalles de la Orden
                </h3>
                <div>
                  <div>
                    <strong>Número:</strong> {selectedWorkOrder!.numeroOrden}
                  </div>
                  <div>
                    <strong>Fecha:</strong>
                    {formatDate(selectedWorkOrder!.fechaApertura)}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};

export default OperationsDashboard;
