"use client";
import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable, DataTablePageEvent } from "primereact/datatable";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { Dropdown, DropdownChangeEvent } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Tag } from "primereact/tag";
import { ProgressSpinner } from "primereact/progressspinner";
import { Sidebar } from "primereact/sidebar";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "primereact/skeleton";
import movementService, {
  MOVEMENT_TYPE_LABELS,
  MOVEMENT_TYPE_SEVERITY,
  Movement,
  MovementType,
  MovementDashboardMetrics,
} from "@/app/api/inventory/movementService";
import warehouseService, {
  Warehouse,
} from "@/app/api/inventory/warehouseService";
import itemService, { Item } from "@/app/api/inventory/itemService";
import MovementDetailForm from "./MovementDetailForm";

const MOVEMENT_TYPES: { label: string; value: MovementType | null }[] = [
  { label: "Todos", value: null },
  { label: "Compra", value: "PURCHASE" },
  { label: "Venta", value: "SALE" },
  { label: "Ajuste Entrada", value: "ADJUSTMENT_IN" },
  { label: "Ajuste Salida", value: "ADJUSTMENT_OUT" },
  { label: "Transferencia", value: "TRANSFER" },
  { label: "Retorno a Proveedor", value: "SUPPLIER_RETURN" },
  { label: "Retorno de Taller", value: "WORKSHOP_RETURN" },
  { label: "Liberación de Reserva", value: "RESERVATION_RELEASE" },
  { label: "Préstamo Salida", value: "LOAN_OUT" },
  { label: "Préstamo Devolución", value: "LOAN_RETURN" },
];

const MovementList = () => {
  const searchParams = useSearchParams();

  // State
  const [movements, setMovements] = useState<Movement[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  // Detail modal
  const [selectedMovement, setSelectedMovement] = useState<Movement | null>(
    null,
  );
  const [detailDialog, setDetailDialog] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);

  // Filters
  const [filterType, setFilterType] = useState<MovementType | null>(null);
  const [filterWarehouse, setFilterWarehouse] = useState<string | null>(null);
  const [filterItemId, setFilterItemId] = useState<string | null>(null);
  const [filterDateFrom, setFilterDateFrom] = useState<Date | null>(null);
  const [filterDateTo, setFilterDateTo] = useState<Date | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Dashboard metrics
  const [dashboardMetrics, setDashboardMetrics] =
    useState<MovementDashboardMetrics | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);

  const toast = useRef<Toast | null>(null);

  // Initialize filters from URL if present
  useEffect(() => {
    const itemIdParam = searchParams.get("itemId");
    if (itemIdParam) {
      setFilterItemId(itemIdParam);
      setShowFilters(true);
    }
  }, [searchParams]);

  // Fetch data on mount and when filters/pagination change
  useEffect(() => {
    fetchMovements();
  }, [
    page,
    limit,
    filterType,
    filterWarehouse,
    filterItemId,
    filterDateFrom,
    filterDateTo,
  ]);

  const fetchMovements = async () => {
    try {
      setLoading(true);
      const response = await movementService.getAll({
        page,
        limit,
        type: filterType || undefined,
        warehouseToId: filterWarehouse || undefined,
        warehouseFromId: filterWarehouse || undefined,
        itemId: filterItemId || undefined,
        dateFrom: filterDateFrom
          ? filterDateFrom.toISOString().split("T")[0]
          : undefined,
        dateTo: filterDateTo
          ? filterDateTo.toISOString().split("T")[0]
          : undefined,
      });

      setMovements(response.data);
      setTotalRecords(response.meta?.total ?? response.data.length);
    } catch (error) {
      console.error("Error fetching movements:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar los movimientos",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch warehouses, items, and dashboard on mount
  useEffect(() => {
    fetchWarehouses();
    fetchItems();
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setDashboardLoading(true);
      const response = await movementService.getDashboard();
      setDashboardMetrics(response.data);
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
    } finally {
      setDashboardLoading(false);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await warehouseService.getActive();
      setWarehouses(response.data);
    } catch (error) {
      console.error("Error fetching warehouses:", error);
    }
  };

  const fetchItems = async () => {
    try {
      const response = await itemService.getActive();
      setItems(response.data);
    } catch (error) {
      console.error("Error fetching items:", error);
    }
  };

  // Handlers
  const handlePageChange = (event: DataTablePageEvent) => {
    setPage((event.first ?? 0) / (event.rows ?? 20) + 1);
    setLimit(event.rows ?? 20);
  };

  const clearFilters = () => {
    setFilterType(null);
    setFilterWarehouse(null);
    setFilterItemId(null);
    setFilterDateFrom(null);
    setFilterDateTo(null);
    setPage(1);
  };

  // Template functions
  const typeBodyTemplate = (rowData: Movement) => {
    const severity = MOVEMENT_TYPE_SEVERITY[rowData.type];
    const label = MOVEMENT_TYPE_LABELS[rowData.type];
    return (
      <Tag value={label} severity={severity} rounded className="text-xs" />
    );
  };

  const itemBodyTemplate = (rowData: Movement) => {
    if (!rowData.item) return <Skeleton width="80px" />;
    return (
      <div className="flex flex-column">
        <span className="font-semibold text-900">{rowData.item.name}</span>
        <span className="text-xs text-500">{rowData.item.sku}</span>
      </div>
    );
  };

  const quantityBodyTemplate = (rowData: Movement) => {
    // Definir si es entrada o salida para colorear
    const inTypes = [
      "PURCHASE",
      "ADJUSTMENT_IN",
      "WORKSHOP_RETURN",
      "RESERVATION_RELEASE",
      "LOAN_RETURN",
    ];
    // Para TRANSFER, determinar dirección por almacén destino (entrada) vs origen (salida)
    const isIn =
      rowData.type === "TRANSFER"
        ? !!rowData.warehouseToId && !rowData.warehouseFromId
        : inTypes.includes(rowData.type);

    return (
      <span className={`font-bold ${isIn ? "text-green-600" : "text-red-600"}`}>
        {isIn ? "+" : "-"}
        {rowData.quantity.toLocaleString()}
      </span>
    );
  };

  const priceBodyTemplate = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "-";
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
    }).format(value);
  };

  const warehouseBodyTemplate = (rowData: Movement, field: "from" | "to") => {
    const warehouse =
      field === "from" ? rowData.warehouseFrom : rowData.warehouseTo;
    if (!warehouse) return <span className="text-300">-</span>;
    return (
      <div className="flex flex-column">
        <span className="text-sm font-medium text-900">{warehouse.name}</span>
        <span className="text-xs text-500">{warehouse.code}</span>
      </div>
    );
  };

  const dateBodyTemplate = (rowData: Movement) => {
    if (!rowData.movementDate) return "-";
    return (
      <div className="flex flex-column">
        <span className="text-900 font-medium">
          {new Date(rowData.movementDate).toLocaleDateString("es-CL", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
        <span className="text-xs text-500">
          {new Date(rowData.movementDate).toLocaleTimeString("es-CL", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    );
  };

  const statusBodyTemplate = (rowData: Movement) => {
    const isCancelled = rowData.notes?.includes("[CANCELADO]");
    if (isCancelled) {
      return (
        <Tag value="CANCELADO" severity="danger" icon="pi pi-ban" rounded />
      );
    }
    return (
      <span className="text-green-600 font-bold text-xs">
        <i className="pi pi-check-circle mr-1"></i>OK
      </span>
    );
  };

  const actionBodyTemplate = (rowData: Movement) => (
    <Button
      icon="pi pi-eye"
      rounded
      text
      severity="secondary"
      size="small"
      onClick={() => openDetail(rowData.id)}
      tooltip="Ver Detalle"
      tooltipOptions={{ position: "top" }}
    />
  );

  // Detail modal handlers
  const openDetail = async (id: string) => {
    setDetailLoading(true);
    setDetailDialog(true);
    try {
      const res = await movementService.getById(id);
      setSelectedMovement(res.data);
    } catch {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar el movimiento",
        life: 3000,
      });
      setDetailDialog(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetailDialog(false);
    setSelectedMovement(null);
  };

  const handleDetailSave = (updatedMovement: Movement) => {
    setSelectedMovement(updatedMovement);
    closeDetail();
    fetchMovements();
  };

  // ── Dashboard KPI Cards ───────────────────────────────────────────────

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
    }).format(value);

  const renderDashboard = () => {
    const kpis = [
      {
        label: "Total Movimientos",
        value: totalRecords,
        icon: "pi pi-list",
        color: "blue",
        bgClass: "bg-blue-50",
      },
      {
        label: "Entradas",
        value: dashboardMetrics?.totalEntries ?? 0,
        icon: "pi pi-arrow-down-left",
        color: "green",
        bgClass: "bg-green-50",
      },
      {
        label: "Salidas",
        value: dashboardMetrics?.totalExits ?? 0,
        icon: "pi pi-arrow-up-right",
        color: "orange",
        bgClass: "bg-orange-50",
      },
      {
        label: "Valor Neto",
        value: dashboardMetrics?.netValue ?? 0,
        icon: "pi pi-dollar",
        color: "purple",
        bgClass: "bg-purple-50",
        isCurrency: true,
      },
    ];

    return (
      <div className="grid mb-3">
        {kpis.map((kpi, idx) => (
          <div className="col-12 sm:col-6 lg:col-3" key={idx}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
            >
              <div
                className={`surface-card shadow-1 border-round p-3 ${kpi.bgClass}`}
              >
                <div className="flex align-items-center justify-content-between">
                  <div>
                    <span className="text-sm text-600 block mb-1">
                      {kpi.label}
                    </span>
                    {dashboardMetrics ? (
                      <span
                        className="text-2xl font-bold"
                        style={{ color: `var(--${kpi.color}-500)` }}
                      >
                        {kpi.isCurrency
                          ? formatCurrency(kpi.value)
                          : kpi.value.toLocaleString()}
                      </span>
                    ) : (
                      <Skeleton width="4rem" height="2rem" />
                    )}
                  </div>
                  <div
                    className="flex align-items-center justify-content-center border-round"
                    style={{
                      width: "3rem",
                      height: "3rem",
                      backgroundColor: `var(--${kpi.color}-100)`,
                    }}
                  >
                    <i
                      className={`${kpi.icon} text-2xl`}
                      style={{ color: `var(--${kpi.color}-500)` }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        ))}
      </div>
    );
  };

  const renderFilters = () => (
    <div className="flex flex-column gap-3 p-3">
      <div className="flex justify-content-between align-items-center mb-2">
        <span className="text-xl font-bold text-900">Filtros</span>
        <Button
          icon="pi pi-filter-slash"
          label="Limpiar"
          className="p-button-text p-button-sm"
          onClick={clearFilters}
        />
      </div>

      <div className="flex flex-column gap-2">
        <label className="text-sm font-semibold">Tipo de Movimiento</label>
        <Dropdown
          value={filterType}
          onChange={(e: DropdownChangeEvent) => {
            setFilterType(e.value);
            setPage(1);
          }}
          options={MOVEMENT_TYPES}
          optionLabel="label"
          optionValue="value"
          placeholder="Todos los tipos"
          className="w-full"
        />
      </div>

      <div className="flex flex-column gap-2">
        <label className="text-sm font-semibold">Almacén</label>
        <Dropdown
          value={filterWarehouse}
          onChange={(e: DropdownChangeEvent) => {
            setFilterWarehouse(e.value);
            setPage(1);
          }}
          options={warehouses}
          optionLabel="name"
          optionValue="id"
          placeholder="Cualquier almacén"
          className="w-full"
          showClear
        />
      </div>

      <div className="flex flex-column gap-2">
        <label className="text-sm font-semibold">Artículo</label>
        <Dropdown
          value={filterItemId}
          onChange={(e: DropdownChangeEvent) => {
            setFilterItemId(e.value);
            setPage(1);
          }}
          options={items}
          optionLabel="name"
          optionValue="id"
          placeholder="Buscar artículo..."
          filter
          showClear
          className="w-full"
        />
      </div>

      <div className="grid mt-1">
        <div className="col-6">
          <label className="block text-sm font-semibold mb-2">Desde</label>
          <Calendar
            value={filterDateFrom}
            onChange={(e) => {
              setFilterDateFrom(e.value || null);
              setPage(1);
            }}
            dateFormat="dd/mm/yy"
            placeholder="Fecha inicio"
            showIcon
            className="w-full"
          />
        </div>
        <div className="col-6">
          <label className="block text-sm font-semibold mb-2">Hasta</label>
          <Calendar
            value={filterDateTo}
            onChange={(e) => {
              setFilterDateTo(e.value || null);
              setPage(1);
            }}
            dateFormat="dd/mm/yy"
            placeholder="Fecha fin"
            showIcon
            className="w-full"
          />
        </div>
      </div>
    </div>
  );

  const activeFiltersCount = [
    filterType,
    filterWarehouse,
    filterItemId,
    filterDateFrom,
    filterDateTo,
  ].filter(Boolean).length;

  return (
    <>
      <Toast ref={toast} />

      {/* Header & Actions */}
      <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center mb-4 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-900 m-0">
            Movimientos de Inventario
          </h1>
          <p className="text-500 m-0 text-sm">
            Registro completo de entradas y salidas
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            icon="pi pi-filter"
            label={`Filtros ${
              activeFiltersCount > 0 ? `(${activeFiltersCount})` : ""
            }`}
            severity={activeFiltersCount > 0 ? undefined : "secondary"}
            outlined={activeFiltersCount === 0}
            onClick={() => setShowFilters(true)}
          />
          <Button
            icon="pi pi-download"
            label="Exportar"
            severity="success"
            outlined
          />
        </div>
      </div>

      {/* KPI Cards */}
      {renderDashboard()}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="card shadow-2 border-round p-0"
      >
        <DataTable
          value={movements}
          paginator
          alwaysShowPaginator
          paginatorPosition="both"
          lazy
          first={(page - 1) * limit}
          rows={limit}
          totalRecords={totalRecords}
          onPage={handlePageChange}
          loading={loading}
          responsiveLayout="scroll"
          paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
          currentPageReportTemplate="Mostrando {first}-{last} de {totalRecords}"
          rowsPerPageOptions={[5, 10, 20, 50, 100]}
          emptyMessage={
            <div className="flex flex-column align-items-center justify-content-center p-5">
              <i className="pi pi-inbox text-500 text-5xl mb-3"></i>
              <span className="text-xl text-900 font-medium">
                Sin movimientos encontrados
              </span>
              <span className="text-500">
                Intenta ajustar los filtros de búsqueda
              </span>
            </div>
          }
          size="small"
          rowClassName={(data) =>
            data.notes?.includes("[CANCELADO]")
              ? "bg-red-50 text-500 opacity-70"
              : ""
          }
          stripedRows
        >
          <Column
            field="movementNumber"
            header="#"
            style={{ width: "90px" }}
            body={(d) => (
              <span className="font-mono font-bold text-700">
                {d.movementNumber}
              </span>
            )}
          />
          <Column
            header="Estado"
            body={statusBodyTemplate}
            style={{ width: "100px" }}
          />
          <Column
            header="Fecha"
            body={dateBodyTemplate}
            style={{ width: "140px" }}
          />
          <Column
            header="Tipo"
            body={typeBodyTemplate}
            style={{ width: "130px" }}
          />
          <Column
            header="Artículo"
            body={itemBodyTemplate}
            style={{ minWidth: "200px" }}
          />
          <Column
            field="quantity"
            header="Cant."
            body={quantityBodyTemplate}
            style={{ width: "100px" }}
            align="right"
          />
          <Column
            header="Almacén Origen"
            body={(rowData) => warehouseBodyTemplate(rowData, "from")}
            style={{ width: "140px" }}
          />
          <Column
            header="Almacén Destino"
            body={(rowData) => warehouseBodyTemplate(rowData, "to")}
            style={{ width: "140px" }}
          />
          <Column
            field="reference"
            header="Referencia"
            style={{ width: "120px" }}
            body={(d) => (
              <span className="text-sm text-700">{d.reference || "-"}</span>
            )}
          />
          <Column
            body={actionBodyTemplate}
            style={{ width: "60px" }}
            alignFrozen="right"
            frozen
          />
        </DataTable>
      </motion.div>

      {/* Sidebar Filters */}
      <Sidebar
        visible={showFilters}
        onHide={() => setShowFilters(false)}
        position="right"
        className="w-full md:w-20rem lg:w-25rem"
      >
        {renderFilters()}
      </Sidebar>

      {/* ── Detail Modal ──────────────────────────────────── */}
      <Dialog
        visible={detailDialog}
        style={{ width: "60vw" }}
        breakpoints={{ "1400px": "60vw", "900px": "80vw", "600px": "95vw" }}
        maximizable
        header={
          selectedMovement ? (
            <div className="flex align-items-center gap-2">
              <span className="font-bold text-xl">
                #{selectedMovement.movementNumber}
              </span>
              <Tag
                value={MOVEMENT_TYPE_LABELS[selectedMovement.type]}
                severity={MOVEMENT_TYPE_SEVERITY[selectedMovement.type]}
                className="text-sm"
              />
              {selectedMovement.notes?.includes("[CANCELADO]") && (
                <Tag severity="danger" value="CANCELADO" icon="pi pi-ban" />
              )}
            </div>
          ) : (
            "Detalle de Movimiento"
          )
        }
        modal
        dismissableMask
        onHide={closeDetail}
        className="p-fluid"
      >
        <MovementDetailForm
          movement={selectedMovement}
          isLoading={detailLoading}
          onCancel={closeDetail}
          onSave={handleDetailSave}
          toast={toast}
        />
      </Dialog>
    </>
  );
};

export default MovementList;
