"use client";

import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Badge } from "primereact/badge";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Toast } from "primereact/toast";
import { ProgressBar } from "primereact/progressbar";
import { TabView, TabPanel } from "primereact/tabview";
import { Steps } from "primereact/steps";
import { Checkbox } from "primereact/checkbox";
import { InputTextarea } from "primereact/inputtextarea";
import { motion, AnimatePresence } from "framer-motion";
import { useVentasStore } from "@/store/ventasStore";

interface Cotizacion {
  id: string;
  fecha: Date;
  cliente: {
    nombre: string;
    email: string;
    telefono: string;
    documento: string;
  };
  vehiculo: {
    id: string;
    marca: string;
    modelo: string;
    anio: number;
    precio: number;
    imagen: string;
  };
  financiamiento?: {
    enganche: number;
    plazo: number;
    tasaInteres: number;
    pagoMensual: number;
  };
  estado: "pendiente" | "en_revision" | "aprobada" | "rechazada" | "vendida";
  prioridad: "baja" | "media" | "alta" | "urgente";
  notas: string;
  fechaSeguimiento?: Date;
}

interface Venta {
  id: string;
  cotizacionId: string;
  fechaVenta: Date;
  precioFinal: number;
  formaPago: "contado" | "financiado" | "leasing";
  documentosCompletos: boolean;
  fechaEntrega: Date;
  estado: "en_proceso" | "completada" | "cancelada";
}

const VentasPage = () => {
  const { cotizaciones, actualizarEstadoCotizacion, obtenerEstadisticas } =
    useVentasStore();
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [selectedCotizacion, setSelectedCotizacion] =
    useState<Cotizacion | null>(null);
  const [ventaDialog, setVentaDialog] = useState(false);
  const [detalleDialog, setDetalleDialog] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [nuevaCotizacionNotificacion, setNuevaCotizacionNotificacion] =
    useState(false);
  const toast = useRef<Toast>(null);

  // Estados para nueva venta
  const [nuevaVenta, setNuevaVenta] = useState({
    precioFinal: 0,
    formaPago: "contado" as "contado" | "financiado" | "leasing",
    fechaEntrega: new Date(),
    documentosCompletos: false,
    notas: "",
  });

  // Filtros
  const [filtros, setFiltros] = useState({
    estado: "",
    prioridad: "",
    search: "",
  });

  // Efecto para detectar nuevas cotizaciones y mostrar notificación
  useEffect(() => {
    if (cotizaciones.length > 0) {
      // Mostrar notificación de nueva cotización
      setNuevaCotizacionNotificacion(true);
      setTimeout(() => setNuevaCotizacionNotificacion(false), 3000);

      toast.current?.show({
        severity: "info",
        summary: "Nueva Cotización Recibida",
        detail: `Se ha recibido una nueva cotización desde el concesionario`,
        life: 4000,
        icon: "pi pi-bell",
      });
    }
  }, [cotizaciones.length]);

  // Formatear precio
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Formatear fecha
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  // Template para estado
  const estadoTemplate = (rowData: Cotizacion) => {
    const severity = {
      pendiente: "warning",
      en_revision: "info",
      aprobada: "success",
      rechazada: "danger",
      vendida: "success",
    } as const;

    const label = {
      pendiente: "Pendiente",
      en_revision: "En Revisión",
      aprobada: "Aprobada",
      rechazada: "Rechazada",
      vendida: "Vendida",
    };

    return (
      <Badge
        value={label[rowData.estado]}
        severity={severity[rowData.estado]}
      />
    );
  };

  // Template para acciones
  const prioridadTemplate = (rowData: Cotizacion) => {
    const severity = {
      baja: "success",
      media: "info",
      alta: "warning",
      urgente: "danger",
    } as const;

    const label = {
      baja: "Baja",
      media: "Media",
      alta: "Alta",
      urgente: "Urgente",
    };

    const icon = {
      baja: "pi pi-arrow-down",
      media: "pi pi-minus",
      alta: "pi pi-arrow-up",
      urgente: "pi pi-exclamation-triangle",
    };

    return (
      <div className="flex align-items-center gap-2">
        <Badge
          value={label[rowData.prioridad]}
          severity={severity[rowData.prioridad]}
          className="flex align-items-center gap-1"
        >
          <i className={icon[rowData.prioridad]}></i>
        </Badge>
        {rowData.prioridad === "urgente" && (
          <i className="pi pi-bell text-red-500 animate-pulse"></i>
        )}
      </div>
    );
  };

  // Template para tiempo transcurrido
  const tiempoTemplate = (rowData: Cotizacion) => {
    const ahora = new Date();
    const fechaCotizacion = new Date(rowData.fecha);
    const diferenciaMs = ahora.getTime() - fechaCotizacion.getTime();
    const dias = Math.floor(diferenciaMs / (1000 * 60 * 60 * 24));
    const horas = Math.floor(
      (diferenciaMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );

    let tiempoTexto = "";
    let colorClass = "";

    if (dias > 0) {
      tiempoTexto = `${dias}d ${horas}h`;
      colorClass =
        dias > 7
          ? "text-red-600"
          : dias > 3
          ? "text-orange-600"
          : "text-green-600";
    } else {
      tiempoTexto = `${horas}h`;
      colorClass = horas > 24 ? "text-red-600" : "text-green-600";
    }

    return <span className={`font-medium ${colorClass}`}>{tiempoTexto}</span>;
  };

  // Template para acciones
  const accionesTemplate = (rowData: Cotizacion) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-eye"
          className="p-button-rounded p-button-info p-button-sm"
          tooltip="Ver detalles"
          onClick={() => {
            setSelectedCotizacion(rowData);
            setDetalleDialog(true);
          }}
        />
        <Button
          icon="pi pi-check"
          className="p-button-rounded p-button-success p-button-sm"
          tooltip="Aprobar cotización"
          onClick={() => aprobarCotizacion(rowData)}
          disabled={
            rowData.estado === "aprobada" || rowData.estado === "vendida"
          }
        />
        <Button
          icon="pi pi-shopping-cart"
          className="p-button-rounded p-button-primary p-button-sm"
          tooltip="Iniciar venta"
          onClick={() => iniciarVenta(rowData)}
          disabled={rowData.estado !== "aprobada"}
        />
      </div>
    );
  };

  // Funciones de acción
  const aprobarCotizacion = (cotizacion: Cotizacion) => {
    actualizarEstadoCotizacion(cotizacion.id, "aprobada");
    toast.current?.show({
      severity: "success",
      summary: "Cotización Aprobada",
      detail: `La cotización de ${cotizacion.cliente.nombre} ha sido aprobada`,
      life: 3000,
    });
  };

  const iniciarVenta = (cotizacion: Cotizacion) => {
    setSelectedCotizacion(cotizacion);
    setNuevaVenta({
      precioFinal: cotizacion.vehiculo.precio,
      formaPago: cotizacion.financiamiento ? "financiado" : "contado",
      fechaEntrega: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
      documentosCompletos: false,
      notas: "",
    });
    setVentaDialog(true);
    setActiveStep(0);
  };

  const completarVenta = () => {
    if (!selectedCotizacion) return;

    const nuevaVentaData: Venta = {
      id: `V${Date.now()}`,
      cotizacionId: selectedCotizacion.id,
      fechaVenta: new Date(),
      precioFinal: nuevaVenta.precioFinal,
      formaPago: nuevaVenta.formaPago,
      documentosCompletos: nuevaVenta.documentosCompletos,
      fechaEntrega: nuevaVenta.fechaEntrega,
      estado: "en_proceso",
    };

    setVentas((prev) => [...prev, nuevaVentaData]);

    // Actualizar estado de la cotización
    actualizarEstadoCotizacion(selectedCotizacion.id, "vendida");

    setVentaDialog(false);
    toast.current?.show({
      severity: "success",
      summary: "Venta Iniciada",
      detail: `La venta del ${selectedCotizacion.vehiculo.marca} ${selectedCotizacion.vehiculo.modelo} ha sido iniciada`,
      life: 5000,
    });
  };

  // Filtrar cotizaciones
  const cotizacionesFiltradas = cotizaciones.filter((cot) => {
    const matchesEstado = !filtros.estado || cot.estado === filtros.estado;
    const matchesPrioridad =
      !filtros.prioridad || cot.prioridad === filtros.prioridad;
    const matchesSearch =
      !filtros.search ||
      cot.cliente.nombre.toLowerCase().includes(filtros.search.toLowerCase()) ||
      cot.vehiculo.marca.toLowerCase().includes(filtros.search.toLowerCase()) ||
      cot.vehiculo.modelo.toLowerCase().includes(filtros.search.toLowerCase());

    return matchesEstado && matchesPrioridad && matchesSearch;
  });

  // Obtener estadísticas del store (se actualizan automáticamente)
  const estadisticasStore = obtenerEstadisticas();

  // Estadísticas locales incluyendo ventas y métricas adicionales
  const estadisticas = {
    totalCotizaciones: estadisticasStore.total,
    pendientes: estadisticasStore.pendientes,
    enRevision: estadisticasStore.enRevision,
    aprobadas: estadisticasStore.aprobadas,
    vendidas: estadisticasStore.vendidas,
    totalVentas: ventas.filter((v) => v.estado === "completada").length,
    ingresosProyectados: cotizaciones
      .filter((c) => c.estado === "aprobada" || c.estado === "vendida")
      .reduce((total, c) => total + c.vehiculo.precio, 0),
    conversionRate:
      estadisticasStore.total > 0
        ? Math.round(
            (estadisticasStore.vendidas / estadisticasStore.total) * 100
          )
        : 0,
    promedioPrecio:
      estadisticasStore.total > 0
        ? Math.round(
            cotizaciones.reduce((total, c) => total + c.vehiculo.precio, 0) /
              estadisticasStore.total
          )
        : 0,
  };

  // Debug: mostrar estadísticas en consola
  console.log("Estadísticas calculadas:", estadisticas);
  console.log("Estadísticas del store:", estadisticasStore);
  console.log("Cotizaciones en store:", cotizaciones.length);
  console.log("Valor totalCotizaciones:", estadisticas.totalCotizaciones);

  // Pasos del proceso de venta
  const pasosVenta = [
    { label: "Información del Cliente" },
    { label: "Detalles de Pago" },
    { label: "Documentación" },
    { label: "Confirmación" },
  ];

  if (loading) {
    return (
      <div className="flex justify-content-center align-items-center min-h-screen">
        <div className="text-center">
          <i className="pi pi-spin pi-spinner text-4xl text-primary mb-3"></i>
          <p className="text-600">Cargando sistema de ventas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ventas-page bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen p-4">
      <Toast ref={toast} />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4"
      >
        <div className="flex justify-content-between align-items-center mb-3">
          <div>
            <h1 className="text-4xl font-bold text-900 mb-2 flex align-items-center gap-3">
              <i className="pi pi-shopping-cart text-blue-600"></i>
              Gestión de Ventas
              {nuevaCotizacionNotificacion && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="inline-flex"
                >
                  <Badge
                    value="NUEVA"
                    severity="success"
                    className="ml-2 animate-pulse"
                  />
                </motion.div>
              )}
            </h1>
            <p className="text-600 text-lg">
              Administra cotizaciones y procesa ventas de vehículos
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-600">Última actualización</div>
            <div className="text-xs text-500">
              {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Estadísticas */}
      <div className="grid mb-4">
        <div className="col-12 md:col-6 lg:col-3">
          <Card className="shadow-2 border-round-xl hover:shadow-4 transition-shadow duration-300">
            <div className="text-center">
              <i className="pi pi-chart-line text-4xl mb-2 text-blue-600"></i>
              <div className="text-2xl font-bold text-900">
                {estadisticas.totalCotizaciones || 0}
              </div>
              <div className="text-sm text-600">Total Cotizaciones</div>
              <div className="text-xs text-500 mt-1">
                <i className="pi pi-clock mr-1"></i>
                Actualizado en tiempo real
              </div>
            </div>
          </Card>
        </div>
        <div className="col-12 md:col-6 lg:col-3">
          <Card className="shadow-2 border-round-xl hover:shadow-4 transition-shadow duration-300">
            <div className="text-center">
              <i className="pi pi-clock text-4xl mb-2 text-orange-600"></i>
              <div className="text-2xl font-bold text-900">
                {estadisticas.pendientes}
              </div>
              <div className="text-sm text-600">Pendientes</div>
              {estadisticas.pendientes > 0 && (
                <div className="text-xs text-500 mt-1">
                  <i className="pi pi-exclamation-triangle mr-1"></i>
                  Requieren atención
                </div>
              )}
            </div>
          </Card>
        </div>
        <div className="col-12 md:col-6 lg:col-3">
          <Card className="shadow-2 border-round-xl hover:shadow-4 transition-shadow duration-300">
            <div className="text-center">
              <i className="pi pi-check-circle text-4xl mb-2 text-green-600"></i>
              <div className="text-2xl font-bold text-900">
                {estadisticas.aprobadas}
              </div>
              <div className="text-sm text-600">Aprobadas</div>
              <div className="text-xs text-500 mt-1">
                <i className="pi pi-trending-up mr-1"></i>
                {estadisticas.conversionRate}% conversión
              </div>
            </div>
          </Card>
        </div>
        <div className="col-12 md:col-6 lg:col-3">
          <Card className="shadow-2 border-round-xl hover:shadow-4 transition-shadow duration-300">
            <div className="text-center">
              <i className="pi pi-shopping-bag text-4xl mb-2 text-purple-600"></i>
              <div className="text-2xl font-bold text-900">
                {estadisticas.totalVentas}
              </div>
              <div className="text-sm text-600">Ventas Completadas</div>
              <div className="text-xs text-500 mt-1">
                <i className="pi pi-dollar mr-1"></i>
                {formatPrice(estadisticas.ingresosProyectados)}
              </div>
            </div>
          </Card>
        </div>

        {/* Fila adicional de métricas */}
        <div className="col-12 md:col-6 lg:col-4">
          <Card className="shadow-2 border-round-xl hover:shadow-4 transition-shadow duration-300">
            <div className="text-center">
              <i className="pi pi-percentage text-4xl mb-2 text-indigo-600"></i>
              <div className="text-2xl font-bold text-900">
                {estadisticas.conversionRate}%
              </div>
              <div className="text-sm text-600">Tasa de Conversión</div>
              <div className="text-xs text-500 mt-1">
                <i className="pi pi-target mr-1"></i>
                Meta: 25%
              </div>
            </div>
          </Card>
        </div>
        <div className="col-12 md:col-6 lg:col-4">
          <Card className="shadow-2 border-round-xl hover:shadow-4 transition-shadow duration-300">
            <div className="text-center">
              <i className="pi pi-dollar text-4xl mb-2 text-teal-600"></i>
              <div className="text-2xl font-bold text-900">
                {formatPrice(estadisticas.promedioPrecio)}
              </div>
              <div className="text-sm text-600">Precio Promedio</div>
              <div className="text-xs text-500 mt-1">
                <i className="pi pi-chart-bar mr-1"></i>
                Por cotización
              </div>
            </div>
          </Card>
        </div>
        <div className="col-12 md:col-6 lg:col-4">
          <Card className="shadow-2 border-round-xl hover:shadow-4 transition-shadow duration-300">
            <div className="text-center">
              <i className="pi pi-money-bill text-4xl mb-2 text-pink-600"></i>
              <div className="text-2xl font-bold text-900">
                {formatPrice(estadisticas.ingresosProyectados)}
              </div>
              <div className="text-sm text-600">Ingresos Proyectados</div>
              <div className="text-xs text-500 mt-1">
                <i className="pi pi-star mr-1"></i>
                De ventas aprobadas
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Filtros */}
      <Card className="shadow-2 border-round-xl mb-4">
        <div className="grid">
          <div className="col-12 md:col-4">
            <label className="block text-900 font-semibold mb-2">Buscar</label>
            <InputText
              value={filtros.search}
              onChange={(e) =>
                setFiltros({ ...filtros, search: e.target.value })
              }
              placeholder="Nombre, marca o modelo..."
              className="w-full"
            />
          </div>
          <div className="col-12 md:col-4">
            <label className="block text-900 font-semibold mb-2">Estado</label>
            <Dropdown
              value={filtros.estado}
              options={[
                { label: "Todos", value: "" },
                { label: "Pendiente", value: "pendiente" },
                { label: "En Revisión", value: "en_revision" },
                { label: "Aprobada", value: "aprobada" },
                { label: "Rechazada", value: "rechazada" },
                { label: "Vendida", value: "vendida" },
              ]}
              onChange={(e) =>
                setFiltros({ ...filtros, estado: e.target.value })
              }
              className="w-full"
            />
          </div>
          <div className="col-12 md:col-4">
            <label className="block text-900 font-semibold mb-2">
              Prioridad
            </label>
            <Dropdown
              value={filtros.prioridad}
              options={[
                { label: "Todas", value: "" },
                { label: "Baja", value: "baja" },
                { label: "Media", value: "media" },
                { label: "Alta", value: "alta" },
                { label: "Urgente", value: "urgente" },
              ]}
              onChange={(e) =>
                setFiltros({ ...filtros, prioridad: e.target.value })
              }
              className="w-full"
            />
          </div>
        </div>
      </Card>

      {/* Tabla de cotizaciones */}
      <Card className="shadow-2 border-round-xl">
        <DataTable
          value={cotizacionesFiltradas}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          emptyMessage="No se encontraron cotizaciones"
          className="p-datatable-sm"
        >
          <Column
            field="fecha"
            header="Fecha"
            body={(rowData) => formatDate(rowData.fecha)}
            sortable
          />
          <Column field="cliente.nombre" header="Cliente" sortable />
          <Column
            field="vehiculo"
            header="Vehículo"
            body={(rowData) =>
              `${rowData.vehiculo.marca} ${rowData.vehiculo.modelo} ${rowData.vehiculo.anio}`
            }
            sortable
          />
          <Column
            field="vehiculo.precio"
            header="Precio"
            body={(rowData) => formatPrice(rowData.vehiculo.precio)}
            sortable
          />
          <Column
            field="estado"
            header="Estado"
            body={estadoTemplate}
            sortable
          />
          <Column
            field="prioridad"
            header="Prioridad"
            body={prioridadTemplate}
            sortable
          />
          <Column
            header="Tiempo"
            body={tiempoTemplate}
            style={{ width: "100px" }}
            sortable
          />
          <Column
            header="Acciones"
            body={accionesTemplate}
            style={{ width: "200px" }}
          />
        </DataTable>
      </Card>

      {/* Diálogo de detalles de cotización */}
      <Dialog
        visible={detalleDialog}
        onHide={() => setDetalleDialog(false)}
        header="Detalles de Cotización"
        style={{ width: "90vw", maxWidth: "800px" }}
        maximizable
        className="cotizacion-detail-dialog"
      >
        {selectedCotizacion && (
          <TabView>
            <TabPanel header="Información General">
              <div className="grid">
                <div className="col-12 md:col-6">
                  <Card className="shadow-2 border-round-lg">
                    <h3 className="text-lg font-bold mb-3 text-900">
                      👤 Información del Cliente
                    </h3>
                    <div className="space-y-2">
                      <div>
                        <strong>Nombre:</strong>{" "}
                        {selectedCotizacion.cliente.nombre}
                      </div>
                      <div>
                        <strong>Email:</strong>{" "}
                        {selectedCotizacion.cliente.email}
                      </div>
                      <div>
                        <strong>Teléfono:</strong>{" "}
                        {selectedCotizacion.cliente.telefono}
                      </div>
                      <div>
                        <strong>Documento:</strong>{" "}
                        {selectedCotizacion.cliente.documento}
                      </div>
                    </div>
                  </Card>
                </div>
                <div className="col-12 md:col-6">
                  <Card className="shadow-2 border-round-lg">
                    <h3 className="text-lg font-bold mb-3 text-900">
                      🚗 Información del Vehículo
                    </h3>
                    <div className="space-y-2">
                      <div>
                        <strong>Vehículo:</strong>{" "}
                        {selectedCotizacion.vehiculo.marca}{" "}
                        {selectedCotizacion.vehiculo.modelo}{" "}
                        {selectedCotizacion.vehiculo.anio}
                      </div>
                      <div>
                        <strong>Precio:</strong>{" "}
                        {formatPrice(selectedCotizacion.vehiculo.precio)}
                      </div>
                      <div>
                        <strong>Estado:</strong>{" "}
                        <Badge
                          value={selectedCotizacion.estado}
                          severity="info"
                        />
                      </div>
                      <div>
                        <strong>Prioridad:</strong>{" "}
                        <Badge
                          value={selectedCotizacion.prioridad}
                          severity="warning"
                        />
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </TabPanel>

            {selectedCotizacion.financiamiento && (
              <TabPanel header="💰 Financiamiento">
                <Card className="shadow-2 border-round-lg">
                  <h3 className="text-lg font-bold mb-3 text-900">
                    Detalles del Financiamiento
                  </h3>
                  <div className="grid">
                    <div className="col-6">
                      <div className="text-center p-3 bg-blue-50 border-round-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {formatPrice(
                            selectedCotizacion.financiamiento.enganche
                          )}
                        </div>
                        <div className="text-sm text-600">Enganche</div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="text-center p-3 bg-green-50 border-round-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {formatPrice(
                            selectedCotizacion.financiamiento.pagoMensual
                          )}
                        </div>
                        <div className="text-sm text-600">Pago Mensual</div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="text-center p-3 bg-orange-50 border-round-lg">
                        <div className="text-2xl font-bold text-orange-600">
                          {selectedCotizacion.financiamiento.plazo} meses
                        </div>
                        <div className="text-sm text-600">Plazo</div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="text-center p-3 bg-purple-50 border-round-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {selectedCotizacion.financiamiento.tasaInteres}%
                        </div>
                        <div className="text-sm text-600">Tasa Anual</div>
                      </div>
                    </div>
                  </div>
                </Card>
              </TabPanel>
            )}

            <TabPanel header="📝 Notas">
              <Card className="shadow-2 border-round-lg">
                <h3 className="text-lg font-bold mb-3 text-900">
                  Notas del Asesor
                </h3>
                <p className="text-700">{selectedCotizacion.notas}</p>
                {selectedCotizacion.fechaSeguimiento && (
                  <div className="mt-3 p-3 bg-yellow-50 border-round-lg border-left-4 border-yellow-400">
                    <i className="pi pi-calendar text-yellow-600"></i>
                    <strong className="text-yellow-800 ml-2">
                      Seguimiento programado:
                    </strong>
                    <span className="text-yellow-700 ml-1">
                      {formatDate(selectedCotizacion.fechaSeguimiento)}
                    </span>
                  </div>
                )}
              </Card>
            </TabPanel>
          </TabView>
        )}
      </Dialog>

      {/* Diálogo de proceso de venta */}
      <Dialog
        visible={ventaDialog}
        onHide={() => setVentaDialog(false)}
        header="Proceso de Venta"
        style={{ width: "95vw", maxWidth: "1000px" }}
        className="venta-process-dialog"
      >
        {selectedCotizacion && (
          <div>
            <Steps
              model={pasosVenta}
              activeIndex={activeStep}
              className="mb-4"
            />

            <AnimatePresence mode="wait">
              {activeStep === 0 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <Card className="shadow-2 border-round-lg">
                    <h3 className="text-lg font-bold mb-3 text-900">
                      👤 Verificación de Datos del Cliente
                    </h3>
                    <div className="grid">
                      <div className="col-12 md:col-6">
                        <div className="space-y-3">
                          <div>
                            <label className="block text-900 font-semibold mb-1">
                              Nombre Completo
                            </label>
                            <InputText
                              value={selectedCotizacion.cliente.nombre}
                              readOnly
                              className="w-full"
                            />
                          </div>
                          <div>
                            <label className="block text-900 font-semibold mb-1">
                              Email
                            </label>
                            <InputText
                              value={selectedCotizacion.cliente.email}
                              readOnly
                              className="w-full"
                            />
                          </div>
                          <div>
                            <label className="block text-900 font-semibold mb-1">
                              Teléfono
                            </label>
                            <InputText
                              value={selectedCotizacion.cliente.telefono}
                              readOnly
                              className="w-full"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="col-12 md:col-6">
                        <div className="space-y-3">
                          <div>
                            <label className="block text-900 font-semibold mb-1">
                              Documento de Identidad
                            </label>
                            <InputText
                              value={selectedCotizacion.cliente.documento}
                              readOnly
                              className="w-full"
                            />
                          </div>
                          <div>
                            <label className="block text-900 font-semibold mb-1">
                              Vehículo Seleccionado
                            </label>
                            <InputText
                              value={`${selectedCotizacion.vehiculo.marca} ${selectedCotizacion.vehiculo.modelo} ${selectedCotizacion.vehiculo.anio}`}
                              readOnly
                              className="w-full"
                            />
                          </div>
                          <div>
                            <label className="block text-900 font-semibold mb-1">
                              Precio Base
                            </label>
                            <InputText
                              value={formatPrice(
                                selectedCotizacion.vehiculo.precio
                              )}
                              readOnly
                              className="w-full"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}

              {activeStep === 1 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <Card className="shadow-2 border-round-lg">
                    <h3 className="text-lg font-bold mb-3 text-900">
                      💰 Detalles de Pago
                    </h3>
                    <div className="grid">
                      <div className="col-12 md:col-6">
                        <div>
                          <label className="block text-900 font-semibold mb-2">
                            Precio Final
                          </label>
                          <InputText
                            value={formatPrice(nuevaVenta.precioFinal)}
                            onChange={(e) =>
                              setNuevaVenta({
                                ...nuevaVenta,
                                precioFinal:
                                  parseFloat(
                                    e.target.value.replace(/[^0-9]/g, "")
                                  ) || 0,
                              })
                            }
                            className="w-full"
                          />
                        </div>
                      </div>
                      <div className="col-12 md:col-6">
                        <div>
                          <label className="block text-900 font-semibold mb-2">
                            Forma de Pago
                          </label>
                          <Dropdown
                            value={nuevaVenta.formaPago}
                            options={[
                              { label: "Contado", value: "contado" },
                              { label: "Financiado", value: "financiado" },
                              { label: "Leasing", value: "leasing" },
                            ]}
                            onChange={(e) =>
                              setNuevaVenta({
                                ...nuevaVenta,
                                formaPago: e.target.value,
                              })
                            }
                            className="w-full"
                          />
                        </div>
                      </div>
                      <div className="col-12 md:col-6">
                        <div>
                          <label className="block text-900 font-semibold mb-2">
                            Fecha de Entrega
                          </label>
                          <Calendar
                            value={nuevaVenta.fechaEntrega}
                            onChange={(e) =>
                              setNuevaVenta({
                                ...nuevaVenta,
                                fechaEntrega: e.value as Date,
                              })
                            }
                            className="w-full"
                            minDate={new Date()}
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}

              {activeStep === 2 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <Card className="shadow-2 border-round-lg">
                    <h3 className="text-lg font-bold mb-3 text-900">
                      📋 Documentación Requerida
                    </h3>
                    <div className="space-y-3">
                      <div className="flex align-items-center">
                        <Checkbox
                          inputId="docs1"
                          checked={nuevaVenta.documentosCompletos}
                          onChange={(e) =>
                            setNuevaVenta({
                              ...nuevaVenta,
                              documentosCompletos: e.checked || false,
                            })
                          }
                        />
                        <label htmlFor="docs1" className="ml-2 text-900">
                          Documentos completos (INE, comprobante de domicilio,
                          etc.)
                        </label>
                      </div>
                      <div>
                        <label className="block text-900 font-semibold mb-2">
                          Notas Adicionales
                        </label>
                        <InputTextarea
                          value={nuevaVenta.notas}
                          onChange={(e) =>
                            setNuevaVenta({
                              ...nuevaVenta,
                              notas: e.target.value,
                            })
                          }
                          rows={4}
                          className="w-full"
                          placeholder="Observaciones sobre la documentación o proceso de venta..."
                        />
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}

              {activeStep === 3 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <Card className="shadow-2 border-round-lg">
                    <h3 className="text-lg font-bold mb-3 text-900">
                      ✅ Confirmación de Venta
                    </h3>
                    <div className="bg-gray-50 border-round-lg p-4 mb-4">
                      <h4 className="text-lg font-bold mb-3 text-900">
                        Resumen de la Venta
                      </h4>
                      <div className="grid">
                        <div className="col-12 md:col-6">
                          <div className="space-y-2">
                            <div>
                              <strong>Cliente:</strong>{" "}
                              {selectedCotizacion.cliente.nombre}
                            </div>
                            <div>
                              <strong>Vehículo:</strong>{" "}
                              {selectedCotizacion.vehiculo.marca}{" "}
                              {selectedCotizacion.vehiculo.modelo}
                            </div>
                            <div>
                              <strong>Precio Final:</strong>{" "}
                              {formatPrice(nuevaVenta.precioFinal)}
                            </div>
                          </div>
                        </div>
                        <div className="col-12 md:col-6">
                          <div className="space-y-2">
                            <div>
                              <strong>Forma de Pago:</strong>{" "}
                              {nuevaVenta.formaPago}
                            </div>
                            <div>
                              <strong>Fecha de Entrega:</strong>{" "}
                              {formatDate(nuevaVenta.fechaEntrega)}
                            </div>
                            <div>
                              <strong>Documentos:</strong>{" "}
                              {nuevaVenta.documentosCompletos
                                ? "Completos"
                                : "Pendientes"}
                            </div>
                          </div>
                        </div>
                      </div>
                      {nuevaVenta.notas && (
                        <div className="mt-3">
                          <strong>Notas:</strong> {nuevaVenta.notas}
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <Button
                        label="Confirmar Venta"
                        icon="pi pi-check"
                        className="p-button-success p-button-lg"
                        onClick={completarVenta}
                      />
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-content-between mt-4">
              <Button
                label="Anterior"
                icon="pi pi-chevron-left"
                className="p-button-secondary"
                onClick={() => setActiveStep((prev) => Math.max(0, prev - 1))}
                disabled={activeStep === 0}
              />
              <Button
                label={
                  activeStep === pasosVenta.length - 1
                    ? "Finalizar"
                    : "Siguiente"
                }
                icon={
                  activeStep === pasosVenta.length - 1
                    ? "pi pi-check"
                    : "pi pi-chevron-right"
                }
                iconPos={
                  activeStep === pasosVenta.length - 1 ? "left" : "right"
                }
                className="p-button-primary"
                onClick={() => {
                  if (activeStep === pasosVenta.length - 1) {
                    completarVenta();
                  } else {
                    setActiveStep((prev) =>
                      Math.min(pasosVenta.length - 1, prev + 1)
                    );
                  }
                }}
              />
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};

export default VentasPage;
