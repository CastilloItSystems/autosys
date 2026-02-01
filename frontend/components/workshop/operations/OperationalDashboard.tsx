"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "primereact/button";
import { SelectButton } from "primereact/selectbutton";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { ProgressSpinner } from "primereact/progressspinner";
import { AutoComplete } from "primereact/autocomplete";
import ServiceBayCard from "./ServiceBayCard";
import MetricsPanel from "./MetricsPanel";
import AssignWorkOrderDialog from "./AssignWorkOrderDialog";
import BayDetailsDialog from "./BayDetailsDialog";
import ReleaseBayDialog from "./ReleaseBayDialog";
import BayTimeline from "./BayTimeline";
import {
  BayWithDetails,
  BayDashboardMetrics,
  BAY_AREA_OPTIONS,
  BAY_STATUS_OPTIONS,
} from "@/libs/interfaces/workshop/serviceBayDashboard.interface";
import { BayArea, BayStatus } from "@/libs/interfaces/workshop";
import {
  getServiceBays,
  getTallerDashboard,
} from "@/app/api/serviceBayService";
import { runDiagnostics } from "@/app/api/healthCheck";
import { useServiceBayFilters } from "@/hooks/useServiceBayFilters";

type ViewMode = "grid" | "list";

export default function OperationalDashboard() {
  const toast = useRef<Toast>(null);

  // Hook de filtros con persistencia
  const {
    filters,
    searchHistory,
    setArea,
    setStatus,
    setSearch,
    setViewMode: setFilterViewMode,
    resetFilters,
    clearSearchHistory,
    hasActiveFilters,
  } = useServiceBayFilters();

  // Estado
  const [bays, setBays] = useState<BayWithDetails[]>([]);
  const [filteredBays, setFilteredBays] = useState<BayWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // AutoComplete para búsqueda con historial
  const [filteredSearchSuggestions, setFilteredSearchSuggestions] = useState<
    string[]
  >([]);

  // Auto-refresh
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [countdown, setCountdown] = useState(30);

  // Diálogos
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedBayForAssign, setSelectedBayForAssign] =
    useState<BayWithDetails | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedBayForDetails, setSelectedBayForDetails] =
    useState<BayWithDetails | null>(null);
  const [showReleaseDialog, setShowReleaseDialog] = useState(false);
  const [selectedBayForRelease, setSelectedBayForRelease] =
    useState<BayWithDetails | null>(null);
  const [showTimelineDialog, setShowTimelineDialog] = useState(false);
  const [selectedBayForTimeline, setSelectedBayForTimeline] =
    useState<BayWithDetails | null>(null);

  // Métricas calculadas
  const [metrics, setMetrics] = useState<BayDashboardMetrics>({
    totalBays: 0,
    availableBays: 0,
    occupiedBays: 0,
    maintenanceBays: 0,
    outOfServiceBays: 0,
    activeTechnicians: 0,
    activeWorkOrders: 0,
    averageOccupancyTime: 0,
  });

  // Opciones de vista
  const viewOptions = [
    { label: "Tarjetas", value: "grid", icon: "pi pi-th-large" },
    { label: "Lista", value: "list", icon: "pi pi-list" },
  ];

  // Generar datos MOCK para visualización
  const generateMockBays = (): BayWithDetails[] => {
    const areas: BayArea[] = [
      "mecanica",
      "electricidad",
      "pintura",
      "latoneria",
      "diagnostico",
      "cambio_aceite",
    ];
    const statuses: BayStatus[] = [
      "disponible",
      "ocupado",
      "mantenimiento",
      "fuera_servicio",
    ];

    const mockBays: BayWithDetails[] = [];

    for (let i = 1; i <= 12; i++) {
      const area = areas[Math.floor(Math.random() * areas.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const isOccupied = status === "ocupado";

      mockBays.push({
        _id: `bay-${i}`,
        name: `Bahía ${area} #${i}`,
        code: `BAY-${String(i).padStart(2, "0")}`,
        area,
        status,
        capacity: ["pequeña", "mediana", "grande"][
          Math.floor(Math.random() * 3)
        ] as any,
        maxTechnicians: Math.floor(Math.random() * 3) + 1,
        equipment: [
          "Elevador hidráulico",
          "Escáner OBD2",
          "Compresor de aire",
          "Soldadora",
          "Herramientas especializadas",
        ].slice(0, Math.floor(Math.random() * 4) + 1),
        currentTechnicians: [],
        order: i,
        eliminado: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        occupancyDuration: isOccupied
          ? Math.floor(Math.random() * 240) + 30
          : undefined,
        utilizationToday: Math.floor(Math.random() * 100),
        currentAssignment: isOccupied
          ? {
              _id: `assignment-${i}`,
              bay: `bay-${i}`,
              workOrder: `OT-${String(
                Math.floor(Math.random() * 1000)
              ).padStart(5, "0")}`,
              technicians: [
                {
                  technician: `tech-${i}-1`,
                  name: [
                    "Juan Pérez",
                    "María García",
                    "Carlos López",
                    "Ana Martínez",
                  ][Math.floor(Math.random() * 4)],
                  role: "principal",
                  assignedAt: new Date(),
                },
                ...(Math.random() > 0.5
                  ? [
                      {
                        technician: `tech-${i}-2`,
                        name: ["Pedro Sánchez", "Laura Torres", "Miguel Ruiz"][
                          Math.floor(Math.random() * 3)
                        ],
                        role: "asistente" as const,
                        assignedAt: new Date(),
                      },
                    ]
                  : []),
              ],
              entryTime: new Date(
                Date.now() - Math.random() * 4 * 60 * 60 * 1000
              ),
              status: "active",
            }
          : undefined,
        currentVehicle: isOccupied
          ? {
              marca: ["Toyota", "Honda", "Ford", "Chevrolet", "Nissan"][
                Math.floor(Math.random() * 5)
              ],
              modelo: ["Corolla", "Civic", "F-150", "Silverado", "Sentra"][
                Math.floor(Math.random() * 5)
              ],
              placa: `ABC-${Math.floor(Math.random() * 9000) + 1000}`,
              year: 2018 + Math.floor(Math.random() * 7),
            }
          : undefined,
        currentWorkOrderInfo: isOccupied
          ? {
              orderNumber: `OT-${String(
                Math.floor(Math.random() * 1000)
              ).padStart(5, "0")}`,
              clientName: ["Carlos Mendoza", "Elena Ruiz", "Roberto Silva"][
                Math.floor(Math.random() * 3)
              ],
              priority: (["baja", "media", "alta", "urgente"] as const)[
                Math.floor(Math.random() * 4)
              ],
              services: [
                "Mantenimiento general",
                "Reparación de frenos",
                "Cambio de aceite",
              ],
            }
          : undefined,
      });
    }

    return mockBays;
  };

  // Transformar datos del backend a BayWithDetails
  const transformBayData = (bayData: any): BayWithDetails => {
    // Para activeBays del dashboard (con información de asignación)
    console.log("baydata", bayData);
    const workOrder = bayData.workOrder;
    const technicians = bayData.technicians || [];
    const occupiedSince = bayData.occupiedSince;
    const estimatedEndTime = bayData.estimatedCompletion;

    // Obtener capacity con fallback seguro
    const rawCapacity = bayData.bay?.capacity || bayData.capacity;
    const validCapacities = [
      "individual",
      "pequeña",
      "mediana",
      "grande",
      "multiple",
    ];
    const capacity = validCapacities.includes(rawCapacity)
      ? rawCapacity
      : "mediana";

    return {
      // Datos básicos de la bahía
      _id: bayData.bay._id,
      name: bayData.bay.name,
      code: bayData.bay.code,
      area: bayData.bay.area as BayArea,
      status: bayData.status as BayStatus,
      capacity: capacity as
        | "individual"
        | "pequeña"
        | "mediana"
        | "grande"
        | "multiple",
      maxTechnicians: bayData.bay?.maxTechnicians,
      equipment: bayData.bay?.equipment || [],
      currentWorkOrder: workOrder,
      currentTechnicians: workOrder
        ? technicians.map((tech: any) => ({
            technician: tech._id || tech.technician,
            role: tech.role,
            entryTime: new Date(tech.entryTime || Date.now()),
          }))
        : bayData.currentTechnicians || [],

      order: bayData.bay?.order,
      occupiedSince: new Date(occupiedSince),

      estimatedEndTime: new Date(estimatedEndTime),
      eliminado: false,

      // Información de asignación actual (si existe)
      currentAssignment: workOrder
        ? {
            _id: workOrder._id,
            bay: bayData.bay._id, // El bay es un objeto con _id
            workOrder: workOrder._id,
            technicians: technicians.map((tech: any) => ({
              technician: tech._id, // Usar _id directamente del técnico
              name: tech.name, // Usar name del técnico
              role: tech.role, // Usar role del técnico
              assignedAt: new Date(tech.entryTime), // Usar entryTime como assignedAt
              hoursWorked: bayData.hoursInBay || 0, // Mantener hoursInBay
            })),
            entryTime: new Date(occupiedSince), // Usar occupiedSince como entryTime
            status: "active",
          }
        : undefined,

      // Información del vehículo actual
      currentVehicle: workOrder?.vehicle
        ? {
            marca: workOrder.vehicle.split(" ")[0] || "",
            modelo: workOrder.vehicle.split(" ")[1] || "",
            placa: workOrder.vehicle.split(" - ")[1] || "",
            year: undefined,
          }
        : undefined,

      // Información de la orden de trabajo actual
      currentWorkOrderInfo: workOrder
        ? {
            orderNumber: workOrder.numeroOrden,
            clientName: workOrder.customer || "N/A",
            priority: "media",
            services: [workOrder.motivo || "Servicio general"],
          }
        : undefined,

      // Duración de ocupación (en minutos)
      occupancyDuration: occupiedSince
        ? Math.floor(
            (Date.now() - new Date(occupiedSince).getTime()) / (1000 * 60)
          )
        : undefined,

      // Utilización hoy (no se calcula en las tarjetas, solo en detalles)
      utilizationToday: 0,

      // Tiempo estimado de completación
      estimatedCompletionTime: estimatedEndTime
        ? new Date(estimatedEndTime)
        : undefined,

      // Timestamps
      createdAt: new Date(bayData.bay?.createdAt || Date.now()),
      updatedAt: new Date(bayData.bay?.updatedAt || Date.now()),
    };
  };

  // Cargar bahías desde API
  const loadBays = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      console.log("🔄 Cargando bahías desde API...");

      const dashboardData = await getTallerDashboard();

      console.log("✅ Dashboard data:", dashboardData);
      // console.log("✅ All bays data:", allBaysData);

      // Transformar las bahías activas usando transformBayData
      const transformedBays = dashboardData.activeBays.map(transformBayData);

      setBays(transformedBays);

      // Usar métricas del backend
      setMetrics({
        totalBays: dashboardData.summary.totalBays,
        availableBays: dashboardData.summary.availableBays,
        occupiedBays: dashboardData.summary.occupiedBays,
        maintenanceBays: dashboardData.summary.maintenanceBays || 0,
        outOfServiceBays: dashboardData.summary.outOfServiceBays || 0,
        activeTechnicians: dashboardData.technicians.active,
        activeWorkOrders: dashboardData.summary.occupiedBays,
        averageOccupancyTime: 0, // Not provided in new API
      });

      if (!showLoading) {
        toast.current?.show({
          severity: "success",
          summary: "Actualizado",
          detail: `${transformedBays.length} bahías cargadas desde el backend`,
          life: 2000,
        });
      }

      console.log("✅ Dashboard listo con", transformedBays.length, "bahías");

      // Devolver la lista transformada para usos programáticos (p. ej. polling)
      return transformedBays;
    } catch (error: any) {
      console.error("❌ Error loading bays:", error);
      console.error("📋 Error details:", {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        url: error?.config?.url,
        baseURL: error?.config?.baseURL,
      });

      // Fallback a datos mock en caso de error
      const mockBays = generateMockBays();
      setBays(mockBays);
      calculateMetrics(mockBays);

      // Mensaje de error más específico
      let errorDetail =
        "No se pudo conectar al servidor. Mostrando datos de prueba.";
      let errorSummary = "Modo de prueba";

      if (error?.response?.status === 401) {
        errorDetail = "Sesión no válida. Por favor inicia sesión nuevamente.";
        errorSummary = "No autenticado";
      } else if (error?.response?.status === 404) {
        const endpoint = error?.config?.url || "desconocido";
        errorDetail = `Endpoint no encontrado: ${endpoint}. Verifica que el backend esté actualizado.`;
        errorSummary = "Endpoint no encontrado";
      } else if (error?.response?.status >= 500) {
        errorDetail =
          "Error del servidor. El backend puede estar caído. Mostrando datos de prueba.";
        errorSummary = "Error del servidor";
      } else if (error?.message?.includes("Network Error")) {
        errorDetail = "Error de red. Verifica tu conexión a internet.";
        errorSummary = "Error de conexión";
      } else if (error?.code === "ECONNREFUSED") {
        errorDetail =
          "No se pudo conectar al servidor. Verifica que el backend esté corriendo.";
        errorSummary = "Servidor no disponible";
      }

      toast.current?.show({
        severity: "warn",
        summary: errorSummary,
        detail: errorDetail,
        life: 6000,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
      setCountdown(30);
    }
  };

  // Calcular métricas
  const calculateMetrics = (baysList: BayWithDetails[]) => {
    const totalBays = baysList.length;
    const availableBays = baysList.filter(
      (b) => b.status === "disponible"
    ).length;
    const occupiedBays = baysList.filter((b) => b.status === "ocupado").length;
    const maintenanceBays = baysList.filter(
      (b) => b.status === "mantenimiento"
    ).length;
    const outOfServiceBays = baysList.filter(
      (b) => b.status === "fuera_servicio"
    ).length;

    const activeTechnicians = baysList
      .filter((b) => b.currentAssignment)
      .reduce(
        (sum, b) => sum + (b.currentAssignment?.technicians.length || 0),
        0
      );

    const activeWorkOrders = baysList.filter((b) => b.currentAssignment).length;

    const totalOccupancyTime = baysList
      .filter((b) => b.occupancyDuration)
      .reduce((sum, b) => sum + (b.occupancyDuration || 0), 0);
    const averageOccupancyTime =
      occupiedBays > 0 ? Math.floor(totalOccupancyTime / occupiedBays) : 0;

    setMetrics({
      totalBays,
      availableBays,
      occupiedBays,
      maintenanceBays,
      outOfServiceBays,
      activeTechnicians,
      activeWorkOrders,
      averageOccupancyTime,
    });
  };

  // Aplicar filtros
  // Aplicar filtros usando el hook
  useEffect(() => {
    let filtered = [...bays];

    if (filters.area) {
      filtered = filtered.filter((b) => b.area === filters.area);
    }

    if (filters.status) {
      filtered = filtered.filter((b) => b.status === filters.status);
    }

    if (filters.search) {
      const term = filters.search.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.name.toLowerCase().includes(term) ||
          b.code.toLowerCase().includes(term) ||
          b.currentAssignment?.workOrder.toLowerCase().includes(term)
      );
    }

    setFilteredBays(filtered);
  }, [bays, filters]);

  // Cargar al montar
  useEffect(() => {
    loadBays();
  }, []);

  // Auto-refresh countdown
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          loadBays(false);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Sugerencias de búsqueda desde historial
  const searchComplete = (event: { query: string }) => {
    const suggestions = searchHistory
      .map((item) => item.term)
      .filter((term) => term.toLowerCase().includes(event.query.toLowerCase()))
      .slice(0, 5);

    setFilteredSearchSuggestions(suggestions);
  };

  // Handlers
  const handleClearFilters = () => {
    resetFilters();
  };

  const handleBayClick = (bay: BayWithDetails) => {
    setSelectedBayForDetails(bay);
    setShowDetailsDialog(true);
  };

  const handleAssign = (bay: BayWithDetails) => {
    setSelectedBayForAssign(bay);
    setShowAssignDialog(true);
  };

  const handleAssignSuccess = () => {
    // Recargar bahías después de asignar
    loadBays(false);
  };

  const handleRelease = (bay: BayWithDetails) => {
    setSelectedBayForRelease(bay);
    setShowReleaseDialog(true);
  };

  const handleShowTimeline = (bay: BayWithDetails) => {
    setSelectedBayForTimeline(bay);
    setShowTimelineDialog(true);
  };

  // Diagnóstico del backend
  const handleRunDiagnostics = async () => {
    toast.current?.show({
      severity: "info",
      summary: "Ejecutando diagnóstico",
      detail: "Verificando conexión con el backend...",
      life: 3000,
    });

    const results = await runDiagnostics();

    // Mostrar resultados en consola (el usuario los verá en DevTools)
    console.log("🏥 Diagnóstico completo:", results);

    const allOk = Object.values(results.endpoints).every((r: any) => r.ok);

    toast.current?.show({
      severity: allOk ? "success" : "error",
      summary: allOk ? "Conexión exitosa" : "Problemas detectados",
      detail: allOk
        ? "Todos los endpoints están disponibles. Revisa la consola para detalles."
        : "Algunos endpoints no están disponibles. Revisa la consola del navegador (F12) para más detalles.",
      life: 5000,
    });
  };

  if (loading) {
    return (
      <div
        className="flex align-items-center justify-content-center"
        style={{ minHeight: "400px" }}
      >
        <ProgressSpinner />
      </div>
    );
  }

  return (
    <>
      <Toast ref={toast} />

      <div className="flex flex-column gap-4">
        {/* Header con controles */}
        <div className="flex flex-column md:flex-row gap-3 align-items-start md:align-items-center justify-content-between">
          <div className="flex align-items-center gap-3">
            <h2 className="m-0 text-2xl font-bold text-900">
              <i className="pi pi-sitemap mr-2" style={{ color: "#3b82f6" }} />
              Operaciones - Puestos de Servicio
            </h2>
            {refreshing && <i className="pi pi-spin pi-spinner text-primary" />}
          </div>

          <div className="flex flex-wrap gap-2 align-items-center">
            {/* Auto-refresh toggle */}
            <Button
              icon={autoRefresh ? "pi pi-pause" : "pi pi-play"}
              label={autoRefresh ? `${countdown}s` : "Pausado"}
              severity={autoRefresh ? "success" : "secondary"}
              outlined
              size="small"
              onClick={() => setAutoRefresh(!autoRefresh)}
              tooltip={
                autoRefresh
                  ? "Pausar actualización automática"
                  : "Reanudar actualización automática"
              }
              tooltipOptions={{ position: "bottom" }}
            />

            {/* Refresh manual */}
            <Button
              icon="pi pi-refresh"
              label="Actualizar"
              severity="info"
              outlined
              size="small"
              onClick={() => loadBays(false)}
              loading={refreshing}
              tooltip="Actualizar ahora"
              tooltipOptions={{ position: "bottom" }}
            />

            {/* Botón de diagnóstico (temporal para debugging) */}
            <Button
              icon="pi pi-heart-fill"
              label="Diagnóstico"
              onClick={handleRunDiagnostics}
              severity="help"
              outlined
              size="small"
              tooltip="Probar conexión con el backend"
              tooltipOptions={{ position: "bottom" }}
            />

            {/* Selector de vista */}
            <SelectButton
              value={filters.viewMode}
              onChange={(e) => setFilterViewMode(e.value)}
              options={viewOptions}
              optionLabel="label"
            />
          </div>
        </div>

        {/* Panel de Métricas */}
        <MetricsPanel metrics={metrics} loading={false} />

        {/* Barra de Filtros */}
        <div className="flex flex-wrap gap-3 p-3 bg-white border-round shadow-2">
          <div className="flex-1" style={{ minWidth: "250px" }}>
            <span className="p-input-icon-left w-full">
              <i className="pi pi-search" />
              <AutoComplete
                placeholder="Buscar por código, nombre o OT..."
                value={filters.search}
                onChange={(e) => setSearch(e.value)}
                suggestions={filteredSearchSuggestions}
                completeMethod={searchComplete}
                className="w-full"
                inputClassName="w-full"
                dropdown
                dropdownIcon="pi pi-history"
                emptyMessage={
                  searchHistory.length === 0
                    ? "No hay búsquedas recientes"
                    : "Sin coincidencias en el historial"
                }
              />
            </span>
            {searchHistory.length > 0 && filters.search === "" && (
              <small className="text-sm text-500 mt-1 block">
                <i className="pi pi-info-circle mr-1" />
                Haz clic en el ícono del reloj para ver búsquedas recientes
              </small>
            )}
          </div>

          <Dropdown
            value={filters.area}
            options={[
              { label: "Todas las áreas", value: null },
              ...BAY_AREA_OPTIONS,
            ]}
            onChange={(e) => setArea(e.value)}
            placeholder="Filtrar por área"
            className="w-full md:w-auto"
            style={{ minWidth: "200px" }}
          />

          <Dropdown
            value={filters.status}
            options={[
              { label: "Todos los estados", value: null },
              ...BAY_STATUS_OPTIONS,
            ]}
            onChange={(e) => setStatus(e.value)}
            placeholder="Filtrar por estado"
            className="w-full md:w-auto"
            style={{ minWidth: "200px" }}
          />

          {hasActiveFilters() && (
            <Button
              icon="pi pi-filter-slash"
              label="Limpiar"
              severity="secondary"
              outlined
              onClick={handleClearFilters}
              tooltip="Limpiar todos los filtros"
            />
          )}

          {searchHistory.length > 0 && (
            <Button
              icon="pi pi-trash"
              severity="danger"
              outlined
              onClick={clearSearchHistory}
              tooltip="Limpiar historial de búsqueda"
            />
          )}
        </div>

        {/* Grid/Lista de Bahías */}
        {filteredBays.length === 0 ? (
          <div className="text-center p-5 bg-white border-round shadow-2">
            <i className="pi pi-inbox text-6xl text-400 mb-3" />
            <p className="text-xl text-600 mb-3">No se encontraron bahías</p>
            {hasActiveFilters() && (
              <Button
                label="Limpiar filtros"
                icon="pi pi-filter-slash"
                onClick={handleClearFilters}
              />
            )}
          </div>
        ) : (
          <div
            className={
              filters.viewMode === "grid" ? "grid" : "flex flex-column gap-3"
            }
          >
            {filteredBays.map((bay) => (
              <div
                key={bay._id}
                className={
                  filters.viewMode === "grid"
                    ? "col-12 md:col-6 lg:col-4 xl:col-3"
                    : "col-12"
                }
              >
                <ServiceBayCard
                  bay={bay}
                  onClick={() => handleBayClick(bay)}
                  onAssign={() => handleAssign(bay)}
                  onRelease={() => handleRelease(bay)}
                  onTimeline={() => handleShowTimeline(bay)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Diálogos */}
      <AssignWorkOrderDialog
        visible={showAssignDialog}
        bay={selectedBayForAssign}
        onHide={() => setShowAssignDialog(false)}
        onSuccess={handleAssignSuccess}
      />

      <BayDetailsDialog
        visible={showDetailsDialog}
        bay={selectedBayForDetails}
        onHide={() => setShowDetailsDialog(false)}
      />

      <ReleaseBayDialog
        visible={showReleaseDialog}
        bay={selectedBayForRelease}
        onHide={() => setShowReleaseDialog(false)}
        onSuccess={async (
          updatedBay?: any,
          options?: { optimisticClearedId?: string }
        ) => {
          // If the backend returned the updated bay, apply it locally to avoid a full reload
          if (updatedBay) {
            try {
              const transformed = transformBayData({
                bay: updatedBay,
                ...updatedBay,
              });
              setBays((prev) =>
                prev.map((b) => (b._id === transformed._id ? transformed : b))
              );
              // Recalculate metrics from the new list
              calculateMetrics(
                bays.map((b) => (b._id === transformed._id ? transformed : b))
              );
            } catch (e) {
              console.error("Error applying updated bay locally:", e);
              await loadBays(false);
            }
          } else if (options?.optimisticClearedId) {
            // Apply optimistic clear: remove currentAssignment for the given bay id
            const clearedId = options.optimisticClearedId;
            setBays((prev) =>
              prev.map((b) =>
                b._id === clearedId
                  ? {
                      ...b,
                      currentAssignment: undefined,
                      status: "disponible" as any,
                    }
                  : b
              )
            );
            calculateMetrics(
              bays.map((b) =>
                b._id === clearedId
                  ? {
                      ...b,
                      currentAssignment: undefined,
                      status: "disponible" as any,
                    }
                  : b
              )
            );
          } else {
            // No updated payload provided: perform a short polling attempt to wait for backend consistency
            const maxAttempts = 4;
            const delayMs = 500;
            let attempt = 0;
            let finalBays: typeof bays | undefined = undefined;

            while (attempt < maxAttempts) {
              try {
                finalBays = await loadBays(false);

                // If we have a selected bay for release, check whether it's still assigned
                if (selectedBayForRelease && finalBays) {
                  const found = finalBays.find(
                    (b) => b._id === selectedBayForRelease._id
                  );
                  // If bay no longer has currentAssignment, we're done
                  if (!found?.currentAssignment) {
                    break;
                  }
                } else {
                  break;
                }
              } catch (e) {
                console.error("Error during polling loadBays:", e);
              }

              attempt += 1;
              await new Promise((res) => setTimeout(res, delayMs));
            }

            // If after polling the bay still appears assigned, leave it (backend may need more time)
            if (!finalBays) {
              // Ensure at least one final refresh
              await loadBays(false);
            }
          }
        }}
      />

      <BayTimeline
        visible={showTimelineDialog}
        onHide={() => setShowTimelineDialog(false)}
        bay={selectedBayForTimeline}
      />
    </>
  );
}
