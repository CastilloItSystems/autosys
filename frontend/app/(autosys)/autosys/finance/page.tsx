"use client";

import React, { useState, useEffect, useRef } from "react";

// PrimeReact Components
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Badge } from "primereact/badge";
import { ProgressBar } from "primereact/progressbar";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { TabView, TabPanel } from "primereact/tabview";
import { Chart } from "primereact/chart";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Toast } from "primereact/toast";

// Animation
import { motion, AnimatePresence } from "framer-motion";

// Stores & Services
import { useOperationsStore } from "@/store/operationsStore";
import { useInventoryStore } from "@/store/inventoryStore";
import { initializeMockData } from "@/api/operationsService";

// Interfaces
import { Invoice, Payment } from "@/libs/interfaces/workshop";
import { PurchaseOrder, SalesOrder } from "@/libs/interfaces/inventory";

// =============================================
// UTILITY FUNCTIONS
// =============================================

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(price);
};

const formatDate = (date: string | Date | undefined): string => {
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

// =============================================
// TEMPLATE COMPONENTS
// =============================================

const InvoiceStatusTemplate = ({ status }: { status: string }) => {
  const statusValue = status || "borrador";
  return (
    <Badge
      value={statusValue.toUpperCase()}
      severity={
        statusValue === "pagada_total"
          ? "success"
          : statusValue === "pagada_parcial"
          ? "warning"
          : statusValue === "vencida"
          ? "danger"
          : "info"
      }
    />
  );
};

const PurchaseOrderStatusTemplate = ({ status }: { status: string }) => {
  const statusValue = status || "pendiente";
  return (
    <Badge
      value={statusValue.toUpperCase()}
      severity={
        statusValue === "recibido"
          ? "success"
          : statusValue === "parcial"
          ? "warning"
          : statusValue === "pendiente"
          ? "info"
          : "danger"
      }
    />
  );
};

const SalesOrderStatusTemplate = ({ status }: { status: string }) => {
  const statusValue = status || "pendiente";
  return (
    <Badge
      value={statusValue.toUpperCase()}
      severity={
        statusValue === "entregado"
          ? "success"
          : statusValue === "parcial"
          ? "warning"
          : statusValue === "pendiente"
          ? "info"
          : "danger"
      }
    />
  );
};

// =============================================
// MAIN COMPONENT
// =============================================

const FinanceDashboard = () => {
  // =============================================
  // STATE MANAGEMENT
  // =============================================
  const [activeTab, setActiveTab] = useState<number>(0);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceDialog, setInvoiceDialog] = useState<boolean>(false);
  const [selectedPurchaseOrder, setSelectedPurchaseOrder] =
    useState<PurchaseOrder | null>(null);
  const [purchaseOrderDialog, setPurchaseOrderDialog] =
    useState<boolean>(false);
  const [selectedSalesOrder, setSelectedSalesOrder] =
    useState<SalesOrder | null>(null);
  const [salesOrderDialog, setSalesOrderDialog] = useState<boolean>(false);

  // =============================================
  // REFS
  // =============================================
  const toast = useRef<Toast>(null);

  // =============================================
  // STORE HOOKS
  // =============================================
  const { invoices, payments, obtenerEstadisticas, seleccionarInvoice } =
    useOperationsStore();
  const {
    purchaseOrders,
    salesOrders,
    seleccionarPurchaseOrder,
    seleccionarSalesOrder,
  } = useInventoryStore();

  // =============================================
  // EFFECTS
  // =============================================
  useEffect(() => {
    initializeMockData();
  }, []);

  // =============================================
  // FINANCIAL CALCULATIONS
  // =============================================
  const calculateFinancialStats = () => {
    const totalIngresos = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalPagado = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
    const totalPendiente = totalIngresos - totalPagado;

    const totalEgresos = purchaseOrders.reduce(
      (sum, po) =>
        sum +
        (po.items?.reduce(
          (itemSum, item) => itemSum + item.cantidad * item.precioUnitario,
          0
        ) || 0),
      0
    );

    const totalVentas = salesOrders.reduce(
      (sum, so) =>
        sum +
        (so.items?.reduce(
          (itemSum, item) => itemSum + item.cantidad * item.precioUnitario,
          0
        ) || 0),
      0
    );

    const margenGanancia =
      totalVentas > 0 ? ((totalVentas - totalEgresos) / totalVentas) * 100 : 0;

    // Cálculos adicionales
    const utilidadBruta = totalVentas - totalEgresos;
    const utilidadNeta = utilidadBruta - totalEgresos * 0.3; // Estimación de gastos operativos
    const roi = totalIngresos > 0 ? (utilidadNeta / totalIngresos) * 100 : 0;
    const ratioLiquidez = totalEgresos > 0 ? totalIngresos / totalEgresos : 1.5;

    return {
      totalIngresos,
      totalPagado,
      totalPendiente,
      totalEgresos,
      totalVentas,
      margenGanancia,
      flujoCaja: totalIngresos - totalEgresos,
      utilidadBruta,
      utilidadNeta,
      roi,
      ratioLiquidez,
    };
  };

  const stats = calculateFinancialStats();

  // =============================================
  // EVENT HANDLERS
  // =============================================
  const handleInvoiceSelect = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setInvoiceDialog(true);
  };

  const handlePurchaseOrderSelect = (order: PurchaseOrder) => {
    setSelectedPurchaseOrder(order);
    setPurchaseOrderDialog(true);
  };

  const handleSalesOrderSelect = (order: SalesOrder) => {
    setSelectedSalesOrder(order);
    setSalesOrderDialog(true);
  };

  // =============================================
  // CHART DATA
  // =============================================
  const cashFlowChart = {
    labels: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio"],
    datasets: [
      {
        label: "Ingresos",
        data: [45000, 52000, 48000, 61000, 55000, 67000],
        borderColor: "#22c55e",
        backgroundColor: "rgba(34, 197, 94, 0.1)",
        tension: 0.4,
        fill: true,
      },
      {
        label: "Egresos",
        data: [35000, 42000, 38000, 45000, 41000, 48000],
        borderColor: "#ef4444",
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const revenueChart = {
    labels: ["Servicios", "Refacciones", "Lubricantes", "Otros"],
    datasets: [
      {
        data: [45, 25, 20, 10],
        backgroundColor: ["#3b82f6", "#22c55e", "#f59e0b", "#8b5cf6"],
        hoverBackgroundColor: ["#2563eb", "#16a34a", "#d97706", "#7c3aed"],
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
      },
    },
  };

  // =============================================
  // RENDER
  // =============================================
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-6 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen"
    >
      <Toast ref={toast} />

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            💰 Dashboard Financiero
          </h1>
          <p className="text-gray-600 text-lg">
            Gestión completa de ingresos, egresos y flujo de caja
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            label="Exportar Reporte"
            icon="pi pi-download"
            className="p-button-outlined p-button-primary"
          />
          <Button
            label="Nuevo Ingreso"
            icon="pi pi-plus"
            className="p-button-primary"
          />
        </div>
      </div>

      {/* KPIs Principales */}
      <div className="grid mb-4">
        <div className="col-12 md:col-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="shadow-2 border-round-lg text-center bg-green-50 border-green-200">
              <div className="text-4xl font-bold text-green-600 mb-2">
                {formatPrice(stats.totalIngresos)}
              </div>
              <div className="text-sm text-600">Total Ingresos</div>
              <div className="text-xs text-green-500 mt-1">
                +12.5% vs mes anterior
              </div>
            </Card>
          </motion.div>
        </div>

        <div className="col-12 md:col-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="shadow-2 border-round-lg text-center bg-red-50 border-red-200">
              <div className="text-4xl font-bold text-red-600 mb-2">
                {formatPrice(stats.totalEgresos)}
              </div>
              <div className="text-sm text-600">Total Egresos</div>
              <div className="text-xs text-red-500 mt-1">
                -8.2% vs mes anterior
              </div>
            </Card>
          </motion.div>
        </div>

        <div className="col-12 md:col-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="shadow-2 border-round-lg text-center bg-blue-50 border-blue-200">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {formatPrice(stats.flujoCaja)}
              </div>
              <div className="text-sm text-600">Flujo de Caja</div>
              <div className="text-xs text-blue-500 mt-1">Estado actual</div>
            </Card>
          </motion.div>
        </div>

        <div className="col-12 md:col-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="shadow-2 border-round-lg text-center bg-purple-50 border-purple-200">
              <div className="text-4xl font-bold text-purple-600 mb-2">
                {stats.margenGanancia.toFixed(1)}%
              </div>
              <div className="text-sm text-600">Margen de Ganancia</div>
              <div className="text-xs text-purple-500 mt-1">Sobre ventas</div>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* KPIs Secundarios */}
      <div className="grid mb-6">
        <div className="col-12 md:col-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="shadow-2 border-round-lg text-center bg-orange-50 border-orange-200">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {formatPrice(stats.totalPendiente)}
              </div>
              <div className="text-sm text-600">Facturas Pendientes</div>
              <div className="text-xs text-orange-500 mt-1">Por cobrar</div>
            </Card>
          </motion.div>
        </div>

        <div className="col-12 md:col-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="shadow-2 border-round-lg text-center bg-cyan-50 border-cyan-200">
              <div className="text-3xl font-bold text-cyan-600 mb-2">
                {stats.roi ? stats.roi.toFixed(1) : "0.0"}%
              </div>
              <div className="text-sm text-600">ROI</div>
              <div className="text-xs text-cyan-500 mt-1">
                Retorno de inversión
              </div>
            </Card>
          </motion.div>
        </div>

        <div className="col-12 md:col-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 }}
          >
            <Card className="shadow-2 border-round-lg text-center bg-indigo-50 border-indigo-200">
              <div className="text-3xl font-bold text-indigo-600 mb-2">
                {stats.utilidadNeta
                  ? formatPrice(stats.utilidadNeta)
                  : formatPrice(0)}
              </div>
              <div className="text-sm text-600">Utilidad Neta</div>
              <div className="text-xs text-indigo-500 mt-1">
                Después de gastos
              </div>
            </Card>
          </motion.div>
        </div>

        <div className="col-12 md:col-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 }}
          >
            <Card className="shadow-2 border-round-lg text-center bg-teal-50 border-teal-200">
              <div className="text-3xl font-bold text-teal-600 mb-2">
                {stats.ratioLiquidez ? stats.ratioLiquidez.toFixed(2) : "1.50"}
              </div>
              <div className="text-sm text-600">Ratio de Liquidez</div>
              <div className="text-xs text-teal-500 mt-1">
                Activos / Pasivos
              </div>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid mb-6">
        <div className="col-12 lg:col-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="shadow-2 border-round-lg mb-4">
              <h3 className="text-lg font-bold mb-3 text-900 flex items-center gap-2">
                <span className="text-2xl">📊</span>
                Flujo de Caja Mensual
              </h3>
              <Chart
                type="line"
                data={cashFlowChart}
                options={{ responsive: true, maintainAspectRatio: false }}
                style={{ height: "300px" }}
              />
            </Card>
          </motion.div>
        </div>

        <div className="col-12 lg:col-4">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="shadow-2 border-round-lg mb-4">
              <h3 className="text-lg font-bold mb-3 text-900 flex items-center gap-2">
                <span className="text-2xl">🥧</span>
                Distribución de Ingresos
              </h3>
              <Chart
                type="doughnut"
                data={revenueChart}
                options={{ responsive: true, maintainAspectRatio: false }}
                style={{ height: "300px" }}
              />
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
        {/* Facturación Tab */}
        <TabPanel header="📄 Facturación" leftIcon="pi pi-file-pdf">
          <div className="p-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Gestión de Facturas
              </h2>
              <Button
                label="Nueva Factura"
                icon="pi pi-plus"
                className="p-button-primary"
              />
            </div>

            <DataTable
              value={invoices}
              className="p-datatable-sm"
              emptyMessage="No hay facturas registradas"
              paginator
              rows={10}
              stripedRows
            >
              <Column
                field="invoiceNumber"
                header="Factura"
                sortable
                style={{ fontWeight: "bold" }}
              />
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
                field="issueDate"
                header="Emisión"
                body={(rowData) => formatDate(rowData.issueDate)}
                sortable
              />
              <Column
                field="dueDate"
                header="Vencimiento"
                body={(rowData) => formatDate(rowData.dueDate)}
                sortable
              />
              <Column
                field="total"
                header="Total"
                body={(rowData) => formatPrice(rowData.total)}
                sortable
              />
              <Column
                field="paidAmount"
                header="Pagado"
                body={(rowData) => formatPrice(rowData.paidAmount)}
                sortable
              />
              <Column
                field="balance"
                header="Saldo"
                body={(rowData) => formatPrice(rowData.balance)}
                sortable
              />
              <Column
                header="Estado"
                body={(rowData) => (
                  <InvoiceStatusTemplate status={rowData.status} />
                )}
              />
              <Column
                header="Acciones"
                body={(rowData) => (
                  <div className="flex gap-2">
                    <Button
                      icon="pi pi-eye"
                      className="p-button-rounded p-button-text"
                      onClick={() => handleInvoiceSelect(rowData)}
                    />
                    <Button
                      icon="pi pi-pencil"
                      className="p-button-rounded p-button-text p-button-warning"
                    />
                    <Button
                      icon="pi pi-download"
                      className="p-button-rounded p-button-text p-button-info"
                    />
                  </div>
                )}
              />
            </DataTable>
          </div>
        </TabPanel>

        {/* Órdenes de Compra Tab */}
        <TabPanel header="📦 Órdenes de Compra" leftIcon="pi pi-shopping-cart">
          <div className="p-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Gestión de Compras
              </h2>
              <Button
                label="Nueva Orden"
                icon="pi pi-plus"
                className="p-button-primary"
              />
            </div>

            <DataTable
              value={purchaseOrders}
              className="p-datatable-sm"
              emptyMessage="No hay órdenes de compra"
              paginator
              rows={10}
              stripedRows
            >
              <Column
                field="numero"
                header="Orden"
                sortable
                style={{ fontWeight: "bold" }}
              />
              <Column
                field="proveedor"
                header="Proveedor"
                body={(rowData) =>
                  typeof rowData.proveedor === "string"
                    ? rowData.proveedor
                    : rowData.proveedor?.nombre
                }
                sortable
              />
              <Column
                field="fecha"
                header="Fecha"
                body={(rowData) => formatDate(rowData.fecha)}
                sortable
              />
              <Column
                header="Total"
                body={(rowData) =>
                  formatPrice(
                    rowData.items?.reduce(
                      (total: number, item: any) =>
                        total + item.cantidad * item.precioUnitario,
                      0
                    ) || 0
                  )
                }
                sortable
              />
              <Column
                header="Estado"
                body={(rowData) => (
                  <PurchaseOrderStatusTemplate status={rowData.estado} />
                )}
              />
              <Column
                header="Acciones"
                body={(rowData) => (
                  <div className="flex gap-2">
                    <Button
                      icon="pi pi-eye"
                      className="p-button-rounded p-button-text"
                      onClick={() => handlePurchaseOrderSelect(rowData)}
                    />
                    <Button
                      icon="pi pi-pencil"
                      className="p-button-rounded p-button-text p-button-warning"
                    />
                  </div>
                )}
              />
            </DataTable>
          </div>
        </TabPanel>

        {/* Ingresos (Ventas) Tab */}
        <TabPanel header="🛍️ Ingresos (Ventas)" leftIcon="pi pi-shopping-bag">
          <div className="p-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Gestión de Ventas
              </h2>
              <Button
                label="Nueva Venta"
                icon="pi pi-plus"
                className="p-button-primary"
              />
            </div>

            <DataTable
              value={salesOrders}
              className="p-datatable-sm"
              emptyMessage="No hay órdenes de venta"
              paginator
              rows={10}
              stripedRows
            >
              <Column
                field="numero"
                header="Orden"
                sortable
                style={{ fontWeight: "bold" }}
              />
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
                field="fecha"
                header="Fecha"
                body={(rowData) => formatDate(rowData.fecha)}
                sortable
              />
              <Column
                header="Total"
                body={(rowData) =>
                  formatPrice(
                    rowData.items?.reduce(
                      (total: number, item: any) =>
                        total + item.cantidad * item.precioUnitario,
                      0
                    ) || 0
                  )
                }
                sortable
              />
              <Column
                header="Estado"
                body={(rowData) => (
                  <SalesOrderStatusTemplate status={rowData.estado} />
                )}
              />
              <Column
                header="Acciones"
                body={(rowData) => (
                  <div className="flex gap-2">
                    <Button
                      icon="pi pi-eye"
                      className="p-button-rounded p-button-text"
                      onClick={() => handleSalesOrderSelect(rowData)}
                    />
                    <Button
                      icon="pi pi-pencil"
                      className="p-button-rounded p-button-text p-button-warning"
                    />
                  </div>
                )}
              />
            </DataTable>
          </div>
        </TabPanel>

        {/* Pagos Tab */}
        <TabPanel header="💳 Pagos" leftIcon="pi pi-credit-card">
          <div className="p-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Gestión de Pagos
              </h2>
              <Button
                label="Nuevo Pago"
                icon="pi pi-plus"
                className="p-button-primary"
              />
            </div>

            <DataTable
              value={payments}
              className="p-datatable-sm"
              emptyMessage="No hay pagos registrados"
              paginator
              rows={10}
              stripedRows
            >
              <Column field="reference" header="Referencia" sortable />
              <Column
                field="amount"
                header="Monto"
                body={(rowData) => formatPrice(rowData.amount)}
                sortable
              />
              <Column field="method" header="Método" sortable />
              <Column
                field="date"
                header="Fecha"
                body={(rowData) => formatDate(rowData.date)}
                sortable
              />
              <Column
                header="Acciones"
                body={(rowData) => (
                  <div className="flex gap-2">
                    <Button
                      icon="pi pi-eye"
                      className="p-button-rounded p-button-text"
                    />
                    <Button
                      icon="pi pi-pencil"
                      className="p-button-rounded p-button-text p-button-warning"
                    />
                  </div>
                )}
              />
            </DataTable>
          </div>
        </TabPanel>
      </TabView>

      {/* Invoice Dialog */}
      <Dialog
        header="Detalles de Factura"
        visible={invoiceDialog}
        onHide={() => setInvoiceDialog(false)}
        className="w-11/12 max-w-4xl"
      >
        {selectedInvoice && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <strong>Número de Factura:</strong>{" "}
                {selectedInvoice.invoiceNumber}
              </div>
              <div>
                <strong>Cliente:</strong>{" "}
                {typeof selectedInvoice.customer === "string"
                  ? selectedInvoice.customer
                  : selectedInvoice.customer.nombre}
              </div>
              <div>
                <strong>Fecha de Emisión:</strong>{" "}
                {formatDate(selectedInvoice.issueDate)}
              </div>
              <div>
                <strong>Fecha de Vencimiento:</strong>{" "}
                {formatDate(selectedInvoice.dueDate)}
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-bold mb-3">Items de la Factura</h3>
              <DataTable
                value={selectedInvoice.items}
                className="p-datatable-sm"
              >
                <Column field="description" header="Descripción" />
                <Column field="quantity" header="Cantidad" />
                <Column
                  field="unitPrice"
                  header="Precio Unit."
                  body={(rowData) => formatPrice(rowData.unitPrice)}
                />
                <Column
                  field="total"
                  header="Total"
                  body={(rowData) => formatPrice(rowData.total)}
                />
              </DataTable>
            </div>
          </div>
        )}
      </Dialog>

      {/* Purchase Order Dialog */}
      <Dialog
        header="Detalles de Orden de Compra"
        visible={purchaseOrderDialog}
        onHide={() => setPurchaseOrderDialog(false)}
        className="w-11/12 max-w-4xl"
      >
        {selectedPurchaseOrder && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <strong>Número de Orden:</strong> {selectedPurchaseOrder.numero}
              </div>
              <div>
                <strong>Proveedor:</strong>{" "}
                {typeof selectedPurchaseOrder.proveedor === "string"
                  ? selectedPurchaseOrder.proveedor
                  : selectedPurchaseOrder.proveedor?.nombre}
              </div>
              <div>
                <strong>Fecha:</strong>{" "}
                {formatDate(selectedPurchaseOrder.fecha)}
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-bold mb-3">Items de la Orden</h3>
              <DataTable
                value={selectedPurchaseOrder.items}
                className="p-datatable-sm"
              >
                <Column field="descripcion" header="Descripción" />
                <Column field="cantidad" header="Cantidad" />
                <Column
                  field="precioUnitario"
                  header="Precio Unit."
                  body={(rowData) => formatPrice(rowData.precioUnitario)}
                />
                <Column
                  header="Total"
                  body={(rowData) =>
                    formatPrice(rowData.cantidad * rowData.precioUnitario)
                  }
                />
              </DataTable>
            </div>
          </div>
        )}
      </Dialog>

      {/* Sales Order Dialog */}
      <Dialog
        header="Detalles de Orden de Venta"
        visible={salesOrderDialog}
        onHide={() => setSalesOrderDialog(false)}
        className="w-11/12 max-w-4xl"
      >
        {selectedSalesOrder && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <strong>Número de Orden:</strong> {selectedSalesOrder.numero}
              </div>
              <div>
                <strong>Cliente:</strong>{" "}
                {typeof selectedSalesOrder.customer === "string"
                  ? selectedSalesOrder.customer
                  : selectedSalesOrder.customer?.nombre}
              </div>
              <div>
                <strong>Fecha:</strong> {formatDate(selectedSalesOrder.fecha)}
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-bold mb-3">Items de la Orden</h3>
              <DataTable
                value={selectedSalesOrder.items}
                className="p-datatable-sm"
              >
                <Column field="descripcion" header="Descripción" />
                <Column field="cantidad" header="Cantidad" />
                <Column
                  field="precioUnitario"
                  header="Precio Unit."
                  body={(rowData) => formatPrice(rowData.precioUnitario)}
                />
                <Column
                  header="Total"
                  body={(rowData) =>
                    formatPrice(rowData.cantidad * rowData.precioUnitario)
                  }
                />
              </DataTable>
            </div>
          </div>
        )}
      </Dialog>
    </motion.div>
  );
};

export default FinanceDashboard;
