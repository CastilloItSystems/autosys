"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "primereact/datatable";
import { DataView } from "primereact/dataview";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { Tag } from "primereact/tag";
import { Dropdown } from "primereact/dropdown";
import { SelectButton } from "primereact/selectbutton";
import { Skeleton } from "primereact/skeleton";
import { Menu } from "primereact/menu";
import { MenuItem } from "primereact/menuitem";
import FormActionButtons from "@/components/common/FormActionButtons";
import { motion } from "framer-motion";
import { ProgressSpinner } from "primereact/progressspinner";
import stockService, {
  Stock,
  DashboardMetrics,
} from "@/app/api/inventory/stockService";
import warehouseService, {
  Warehouse,
} from "@/app/api/inventory/warehouseService";
import movementService, {
  Movement,
  MOVEMENT_TYPE_LABELS,
  MOVEMENT_TYPE_SEVERITY,
} from "@/app/api/inventory/movementService";
import MovementDetailForm from "../movements/MovementDetailForm";
import StockForm from "./StockForm";
import StockAdjustDialog from "./StockAdjustDialog";

type StockFilter = "all" | "lowStock" | "outOfStock";

export default function StockList() {
  const router = useRouter();

  // Datos
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [dashboardMetrics, setDashboardMetrics] =
    useState<DashboardMetrics | null>(null);

  // Filtros y paginación
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState<number>(0);
  const [rows, setRows] = useState<number>(10);
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [warehouseFilter, setWarehouseFilter] = useState<string | null>(null);

  // UI
  const [loading, setLoading] = useState<boolean>(true);
  const [layout, setLayout] = useState<"table" | "list" | "grid">("table");
  const [formDialog, setFormDialog] = useState<boolean>(false);
  const [adjustDialog, setAdjustDialog] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isAdjustSubmitting, setIsAdjustSubmitting] = useState<boolean>(false);
  const [deleteDialog, setDeleteDialog] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [actionItem, setActionItem] = useState<Stock | null>(null);
  const menuRef = useRef<Menu>(null);
  const toast = useRef<Toast>(null);

  // Historial de movimientos (inline dialog)
  const [historyDialog, setHistoryDialog] = useState<boolean>(false);
  const [historyMovements, setHistoryMovements] = useState<Movement[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const [historyStock, setHistoryStock] = useState<Stock | null>(null);
  const [historyDetailDialog, setHistoryDetailDialog] =
    useState<boolean>(false);
  const [historySelectedMovement, setHistorySelectedMovement] =
    useState<Movement | null>(null);
  const [historyDetailLoading, setHistoryDetailLoading] =
    useState<boolean>(false);

  // Cargar almacenes y dashboard al montar
  useEffect(() => {
    loadWarehouses();
    loadDashboard();
  }, []);

  // Cargar stocks cuando cambien los filtros
  useEffect(() => {
    loadStocks();
  }, [page, rows, stockFilter, warehouseFilter]);

  const loadWarehouses = async () => {
    try {
      const response = await warehouseService.getActive();
      const data = response.data || [];
      setWarehouses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading warehouses:", error);
    }
  };

  const loadDashboard = async () => {
    try {
      const response = await stockService.getDashboardMetrics();
      setDashboardMetrics(response.data);
    } catch (error) {
      console.error("Error loading dashboard metrics:", error);
    }
  };

  const loadStocks = async () => {
    try {
      setLoading(true);

      let response;
      if (stockFilter === "lowStock") {
        response = await stockService.getLowStock(
          warehouseFilter || undefined,
          page + 1,
          rows,
        );
      } else if (stockFilter === "outOfStock") {
        response = await stockService.getOutOfStock(
          warehouseFilter || undefined,
          page + 1,
          rows,
        );
      } else {
        response = await stockService.getAll(page + 1, rows, {
          warehouseId: warehouseFilter || undefined,
        });
      }

      const stocksData = response.data || [];
      const total = response.meta?.total || 0;

      setStocks(Array.isArray(stocksData) ? stocksData : []);
      setTotalRecords(total);
    } catch (error) {
      console.error("Error loading stocks:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar el stock",
        life: 3000,
      });
      setStocks([]);
    } finally {
      setLoading(false);
    }
  };

  const onPageChange = (event: any) => {
    const newPage =
      event.page !== undefined
        ? event.page
        : Math.floor(event.first / event.rows);
    setPage(newPage);
    setRows(event.rows);
  };

  const editStock = (stock: Stock) => {
    setSelectedStock({ ...stock });
    setFormDialog(true);
  };

  const openAdjust = (stock: Stock) => {
    setSelectedStock({ ...stock });
    setAdjustDialog(true);
  };

  const handleSave = () => {
    toast.current?.show({
      severity: "success",
      summary: "Éxito",
      detail: "Stock actualizado correctamente",
      life: 3000,
    });
    loadStocks();
    loadDashboard();
    setFormDialog(false);
  };

  const handleAdjustSave = () => {
    toast.current?.show({
      severity: "success",
      summary: "Éxito",
      detail: "Ajuste de stock realizado correctamente",
      life: 3000,
    });
    loadStocks();
    loadDashboard();
    setAdjustDialog(false);
  };

  const confirmDeleteStock = (stock: Stock) => {
    setActionItem(stock);
    setDeleteDialog(true);
  };

  const handleDeleteStock = async () => {
    if (!actionItem?.id) return;
    setIsDeleting(true);
    try {
      // TODO: Implement delete method in stockService
      // await stockService.delete(actionItem.id);
      toast.current?.show({
        severity: "info",
        summary: "Información",
        detail: "Eliminación de stocks aún no disponible",
        life: 3000,
      });
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo eliminar el stock",
        life: 3000,
      });
      console.error("Error deleting stock:", error);
    } finally {
      setIsDeleting(false);
      setDeleteDialog(false);
      setActionItem(null);
    }
  };

  const getMenuItems = (stock: Stock | null): MenuItem[] => {
    if (!stock) return [];
    return [
      {
        label: "Ver Stock",
        icon: "pi pi-eye",
        command: () => {
          router.push(`/empresa/inventario/stock/item/${stock.itemId}`);
        },
      },
      {
        label: "Historial de Movimientos",
        icon: "pi pi-history",
        command: () => {
          openHistory(stock);
        },
      },
      {
        label: "Editar",
        icon: "pi pi-pencil",
        command: () => {
          editStock(stock);
        },
      },
      {
        label: "Ajustar Stock",
        icon: "pi pi-sliders-h",
        command: () => {
          openAdjust(stock);
        },
      },
      { separator: true },
      {
        label: "Eliminar",
        icon: "pi pi-trash",
        className: "p-menuitem-danger",
        command: () => {
          confirmDeleteStock(stock);
        },
      },
    ];
  };

  // ── Helpers ────────────────────────────────────────────────────────────

  const getStockSeverity = (stock: Stock): "success" | "warning" | "danger" => {
    const minStock = stock.item?.minStock ?? 5;
    if (stock.quantityAvailable <= 0) return "danger";
    if (stock.quantityAvailable <= minStock) return "warning";
    return "success";
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ── Historial de movimientos (inline) ────────────────────────────────

  const openHistory = async (stock: Stock) => {
    setHistoryStock(stock);
    setHistoryDialog(true);
    setHistoryLoading(true);
    setHistoryMovements([]);
    try {
      const res = await movementService.getByItem(stock.itemId, 50);
      setHistoryMovements(res.data);
    } catch (error) {
      console.error("Error fetching movements:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar los movimientos",
        life: 3000,
      });
    } finally {
      setHistoryLoading(false);
    }
  };

  const openHistoryDetail = async (movementId: string) => {
    setHistoryDetailLoading(true);
    setHistoryDetailDialog(true);
    try {
      const res = await movementService.getById(movementId);
      setHistorySelectedMovement(res.data);
    } catch {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar el detalle del movimiento",
        life: 3000,
      });
      setHistoryDetailDialog(false);
    } finally {
      setHistoryDetailLoading(false);
    }
  };

  const closeHistoryDetail = () => {
    setHistoryDetailDialog(false);
    setHistorySelectedMovement(null);
  };

  const handleHistoryDetailSave = (updated: Movement) => {
    setHistorySelectedMovement(updated);
    closeHistoryDetail();
    // Refresh the movements list for the current item
    if (historyStock) openHistory(historyStock);
  };

  const historyTypeTemplate = (row: Movement) => (
    <Tag
      value={MOVEMENT_TYPE_LABELS[row.type]}
      severity={MOVEMENT_TYPE_SEVERITY[row.type]}
      className="text-xs"
    />
  );

  const historyQtyTemplate = (row: Movement) => {
    const inTypes = [
      "PURCHASE",
      "ADJUSTMENT_IN",
      "WORKSHOP_RETURN",
      "RESERVATION_RELEASE",
      "LOAN_RETURN",
    ];
    // Para TRANSFER, determinar dirección por almacén destino (entrada) vs origen (salida)
    const isIn =
      row.type === "TRANSFER"
        ? !!row.warehouseToId && !row.warehouseFromId
        : inTypes.includes(row.type);
    return (
      <span className={`font-bold ${isIn ? "text-green-600" : "text-red-600"}`}>
        {isIn ? "+" : "-"}
        {row.quantity.toLocaleString()}
      </span>
    );
  };

  const historyDateTemplate = (row: Movement) => {
    if (!row.movementDate) return "—";
    return new Date(row.movementDate).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const historyCostTemplate = (row: Movement) => {
    if (row.unitCost == null) return "—";
    return formatCurrency(Number(row.unitCost));
  };

  const historyWarehouseTemplate = (row: Movement, field: "from" | "to") => {
    const wh = field === "from" ? row.warehouseFrom : row.warehouseTo;
    if (!wh) return "—";
    return (
      <span className="text-sm" title={wh.code}>
        {wh.name}
      </span>
    );
  };

  const historyActionTemplate = (row: Movement) => (
    <Button
      icon="pi pi-eye"
      rounded
      text
      severity="info"
      size="small"
      onClick={() => openHistoryDetail(row.id)}
      tooltip="Ver detalle"
      tooltipOptions={{ position: "top" }}
    />
  );

  // ── Action buttons (shared across views) ──────────────────────────────

  const renderActions = (stock: Stock) => (
    <div className="flex gap-1">
      <Button
        icon="pi pi-eye"
        rounded
        severity="success"
        text
        size="small"
        onClick={() =>
          router.push(`/empresa/inventario/stock/item/${stock.itemId}`)
        }
        tooltip="Ver stock por almacén"
        tooltipOptions={{ position: "top" }}
      />
      <Button
        icon="pi pi-history"
        rounded
        severity="help"
        text
        size="small"
        onClick={() => openHistory(stock)}
        tooltip="Historial de movimientos"
        tooltipOptions={{ position: "top" }}
      />
      <Button
        icon="pi pi-pencil"
        rounded
        severity="info"
        text
        size="small"
        onClick={() => editStock(stock)}
        tooltip="Editar"
        tooltipOptions={{ position: "top" }}
      />
      <Button
        icon="pi pi-sliders-h"
        rounded
        severity="warning"
        text
        size="small"
        onClick={() => openAdjust(stock)}
        tooltip="Ajustar Stock"
        tooltipOptions={{ position: "top" }}
      />
    </div>
  );

  const actionBodyTemplate = (rowData: Stock) => (
    <Button
      icon="pi pi-cog"
      rounded
      text
      onClick={(e) => {
        setActionItem(rowData);
        menuRef.current?.toggle(e);
      }}
      aria-controls="stock-menu"
      aria-haspopup
      tooltip="Opciones"
      tooltipOptions={{ position: "left" }}
    />
  );

  // ── DataTable column templates ───────────────────────────────────

  const quantityBodyTemplate = (rowData: Stock) => {
    return (
      <Tag
        value={String(rowData.quantityReal)}
        severity={getStockSeverity(rowData)}
        rounded
        className="text-sm"
      />
    );
  };

  const availableBodyTemplate = (rowData: Stock) => {
    return (
      <Tag
        value={String(rowData.quantityAvailable)}
        severity={getStockSeverity(rowData)}
        rounded
        className="text-sm"
      />
    );
  };

  const costBodyTemplate = (rowData: Stock) => (
    <span>{formatCurrency(rowData.averageCost)}</span>
  );

  const lastMovementBodyTemplate = (rowData: Stock) => {
    if (!rowData.lastMovementAt) return <span className="text-400">—</span>;
    return (
      <span className="text-sm">{formatDate(rowData.lastMovementAt)}</span>
    );
  };

  const itemBodyTemplate = (rowData: Stock) => (
    <div className="flex flex-column">
      <span className="font-semibold">
        {rowData.item?.name || rowData.itemId}
      </span>
      {rowData.item?.sku && (
        <span className="text-sm text-500">{rowData.item.sku}</span>
      )}
    </div>
  );

  const warehouseBodyTemplate = (rowData: Stock) => (
    <span>{rowData.warehouse?.name || rowData.warehouseId}</span>
  );

  // ── DataView templates (list / grid) ──────────────────────────────────

  const gridItemTemplate = (stock: Stock) => {
    const severity = getStockSeverity(stock);
    return (
      <div className="col-12 sm:col-6 lg:col-4 xl:col-3 p-2">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <div
            className="surface-card shadow-1 border-round p-3 h-full flex flex-column justify-content-between border-left-3"
            style={{
              borderLeftColor:
                severity === "danger"
                  ? "var(--red-500)"
                  : severity === "warning"
                  ? "var(--yellow-500)"
                  : "var(--green-500)",
            }}
          >
            {/* Header */}
            <div className="mb-3">
              <div className="flex align-items-start justify-content-between mb-2">
                <div className="flex-1 mr-2">
                  <h5
                    className="m-0 text-overflow-ellipsis white-space-nowrap overflow-hidden"
                    title={stock.item?.name || stock.itemId}
                  >
                    {stock.item?.name || stock.itemId}
                  </h5>
                  {stock.item?.sku && (
                    <span className="text-sm text-500">{stock.item.sku}</span>
                  )}
                </div>
                <Tag
                  value={
                    severity === "danger"
                      ? "Agotado"
                      : severity === "warning"
                      ? "Bajo"
                      : "OK"
                  }
                  severity={severity}
                  rounded
                  className="text-xs"
                />
              </div>
              <div className="flex align-items-center gap-1 text-sm text-600">
                <i className="pi pi-building text-xs" />
                <span>{stock.warehouse?.name || stock.warehouseId}</span>
              </div>
            </div>

            {/* Quantities */}
            <div className="grid mb-3">
              <div className="col-4 text-center">
                <div className="text-xs text-500 mb-1">Real</div>
                <Tag
                  value={String(stock.quantityReal)}
                  severity={severity}
                  rounded
                  className="text-sm"
                />
              </div>
              <div className="col-4 text-center">
                <div className="text-xs text-500 mb-1">Disponible</div>
                <Tag
                  value={String(stock.quantityAvailable)}
                  severity={severity}
                  rounded
                  className="text-sm"
                />
              </div>
              <div className="col-4 text-center">
                <div className="text-xs text-500 mb-1">Reservado</div>
                <span className="text-sm font-semibold">
                  {stock.quantityReserved}
                </span>
              </div>
            </div>

            {/* Footer info */}
            <div className="flex align-items-center justify-content-between mb-3 text-sm">
              <div className="text-600">
                <i className="pi pi-dollar text-xs mr-1" />
                {formatCurrency(stock.averageCost)}
              </div>
              <div className="text-500 text-xs">
                <i className="pi pi-clock text-xs mr-1" />
                {formatDate(stock.lastMovementAt)}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-content-center border-top-1 surface-border pt-2">
              {renderActions(stock)}
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  const listItemTemplate = (stock: Stock) => {
    const severity = getStockSeverity(stock);
    return (
      <div className="col-12 p-2">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div
            className="surface-card shadow-1 border-round p-3 flex flex-wrap align-items-center gap-3 border-left-3"
            style={{
              borderLeftColor:
                severity === "danger"
                  ? "var(--red-500)"
                  : severity === "warning"
                  ? "var(--yellow-500)"
                  : "var(--green-500)",
            }}
          >
            {/* Item info */}
            <div className="flex-1 min-w-min">
              <div className="flex align-items-center gap-2 mb-1">
                <span className="font-semibold text-lg">
                  {stock.item?.name || stock.itemId}
                </span>
                <Tag
                  value={
                    severity === "danger"
                      ? "Agotado"
                      : severity === "warning"
                      ? "Bajo"
                      : "OK"
                  }
                  severity={severity}
                  rounded
                  className="text-xs"
                />
              </div>
              <div className="flex align-items-center gap-3 text-sm text-600">
                {stock.item?.sku && (
                  <span>
                    <i className="pi pi-tag text-xs mr-1" />
                    {stock.item.sku}
                  </span>
                )}
                <span>
                  <i className="pi pi-building text-xs mr-1" />
                  {stock.warehouse?.name || stock.warehouseId}
                </span>
              </div>
            </div>

            {/* Quantities */}
            <div className="flex align-items-center gap-4">
              <div className="text-center">
                <div className="text-xs text-500">Real</div>
                <Tag
                  value={String(stock.quantityReal)}
                  severity={severity}
                  rounded
                  className="text-sm"
                />
              </div>
              <div className="text-center">
                <div className="text-xs text-500">Disponible</div>
                <Tag
                  value={String(stock.quantityAvailable)}
                  severity={severity}
                  rounded
                  className="text-sm"
                />
              </div>
              <div className="text-center">
                <div className="text-xs text-500">Reservado</div>
                <span className="text-sm font-semibold">
                  {stock.quantityReserved}
                </span>
              </div>
              <div className="text-center">
                <div className="text-xs text-500">Ubicación</div>
                <span className="text-sm font-semibold">
                  {stock.location || "N/A"}
                </span>
              </div>
              <div className="text-center">
                <div className="text-xs text-500">Costo</div>
                <span className="text-sm font-semibold">
                  {formatCurrency(stock.averageCost)}
                </span>
              </div>
              <div className="text-center">
                <div className="text-xs text-500">Último Mov.</div>
                <span className="text-sm">
                  {formatDate(stock.lastMovementAt)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex align-items-center">
              {renderActions(stock)}
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  const dataViewTemplate = (items: Stock[], currentLayout: string) => {
    if (!items || items.length === 0) {
      return (
        <div className="col-12 p-4 text-center">
          <i
            className="pi pi-inbox text-4xl text-400 mb-3"
            style={{ display: "block" }}
          />
          <p className="text-500 text-lg">No hay registros de stock</p>
        </div>
      );
    }
    return (
      <div className="grid grid-nogutter">
        {items.map((stock) =>
          currentLayout === "grid"
            ? gridItemTemplate(stock)
            : listItemTemplate(stock),
        )}
      </div>
    );
  };

  // ── Layout toggle ─────────────────────────────────────────────────────

  const layoutOptions = [
    { icon: "pi pi-table", value: "table" },
    { icon: "pi pi-list", value: "list" },
    { icon: "pi pi-th-large", value: "grid" },
  ];

  const layoutTemplate = (option: any) => <i className={option.icon}></i>;

  // Opciones del dropdown de almacén
  const warehouseOptions = [
    { label: "Todos los almacenes", value: null },
    ...warehouses.map((w) => ({ label: w.name, value: w.id })),
  ];

  // ── Dashboard KPI Cards ───────────────────────────────────────────────

  const renderDashboard = () => {
    const kpis = [
      {
        label: "En Stock",
        value: dashboardMetrics?.stockHealth.inStock ?? 0,
        icon: "pi pi-check-circle",
        color: "green",
        bgClass: "bg-green-50",
      },
      {
        label: "Stock Bajo",
        value: dashboardMetrics?.stockHealth.lowStock ?? 0,
        icon: "pi pi-exclamation-triangle",
        color: "orange",
        bgClass: "bg-orange-50",
      },
      {
        label: "Agotado",
        value: dashboardMetrics?.stockHealth.outOfStock ?? 0,
        icon: "pi pi-times-circle",
        color: "red",
        bgClass: "bg-red-50",
      },
      {
        label: "Valor Total",
        value: dashboardMetrics?.totalStockValue ?? 0,
        icon: "pi pi-dollar",
        color: "blue",
        bgClass: "bg-blue-50",
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

  // ── Header ────────────────────────────────────────────────────────────

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <div className="flex align-items-center gap-2">
        <h4 className="m-0">Stock</h4>
        <span className="text-600 text-sm">({totalRecords} registros)</span>
      </div>
      <div className="flex flex-wrap gap-2 align-items-center">
        {/* Filtro por estado de stock */}
        <div className="flex gap-1">
          <Button
            label="Todos"
            size="small"
            severity={stockFilter === "all" ? undefined : "secondary"}
            outlined={stockFilter !== "all"}
            onClick={() => {
              setStockFilter("all");
              setPage(0);
            }}
          />
          <Button
            label="Stock Bajo"
            size="small"
            severity={stockFilter === "lowStock" ? "warning" : "secondary"}
            outlined={stockFilter !== "lowStock"}
            icon="pi pi-exclamation-triangle"
            onClick={() => {
              setStockFilter("lowStock");
              setPage(0);
            }}
          />
          <Button
            label="Agotado"
            size="small"
            severity={stockFilter === "outOfStock" ? "danger" : "secondary"}
            outlined={stockFilter !== "outOfStock"}
            icon="pi pi-times-circle"
            onClick={() => {
              setStockFilter("outOfStock");
              setPage(0);
            }}
          />
        </div>

        {/* Filtro por almacén */}
        <Dropdown
          value={warehouseFilter}
          options={warehouseOptions}
          onChange={(e) => {
            setWarehouseFilter(e.value);
            setPage(0);
          }}
          placeholder="Almacén"
          className="w-12rem"
        />
      </div>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Toast ref={toast} />

      {/* Dashboard KPI Cards */}
      {renderDashboard()}

      <div className="card">
        {/* Header inside card for table, or standalone for DataView */}
        {layout === "table" ? (
          <>
            <DataTable
              value={stocks}
              paginator
              first={page * rows}
              rows={rows}
              totalRecords={totalRecords}
              rowsPerPageOptions={[5, 10, 25, 50]}
              onPage={onPageChange}
              dataKey="id"
              loading={loading}
              header={
                <div>
                  {header}
                  <div className="flex justify-content-end mt-2">
                    <SelectButton
                      value={layout}
                      onChange={(e) => e.value && setLayout(e.value)}
                      options={layoutOptions}
                      itemTemplate={layoutTemplate}
                      allowEmpty={false}
                    />
                  </div>
                </div>
              }
              emptyMessage="No hay registros de stock"
              sortMode="multiple"
              lazy
            >
              <Column
                header="Artículo"
                body={itemBodyTemplate}
                sortable
                sortField="item.name"
                style={{ minWidth: "200px" }}
              />
              <Column
                header="Almacén"
                body={warehouseBodyTemplate}
                sortable
                sortField="warehouse.name"
                style={{ minWidth: "150px" }}
              />
              <Column
                field="quantityReal"
                header="Cant. Real"
                body={quantityBodyTemplate}
                sortable
                style={{ minWidth: "100px" }}
              />
              <Column
                field="quantityAvailable"
                header="Disponible"
                body={availableBodyTemplate}
                sortable
                style={{ minWidth: "100px" }}
              />
              <Column
                field="quantityReserved"
                header="Reservado"
                sortable
                style={{ minWidth: "90px" }}
              />
              <Column
                field="location"
                header="Ubicación"
                body={(rowData) =>
                  rowData.location || (
                    <span className="text-500 font-italic">N/A</span>
                  )
                }
                sortable
                style={{ minWidth: "120px" }}
              />
              <Column
                field="averageCost"
                header="Costo Prom."
                body={costBodyTemplate}
                sortable
                style={{ minWidth: "120px" }}
              />
              <Column
                field="lastMovementAt"
                header="Último Mov."
                body={lastMovementBodyTemplate}
                sortable
                style={{ minWidth: "110px" }}
              />
              <Column
                header="Acciones"
                body={actionBodyTemplate}
                exportable={false}
                frozen={true}
                alignFrozen="right"
                style={{ width: "6rem", textAlign: "center" }}
                headerStyle={{ textAlign: "center" }}
              />
            </DataTable>
          </>
        ) : (
          <>
            {/* Header + layout toggle for DataView mode */}
            <div className="mb-3">
              {header}
              <div className="flex justify-content-end mt-2">
                <SelectButton
                  value={layout}
                  onChange={(e) => e.value && setLayout(e.value)}
                  options={layoutOptions}
                  itemTemplate={layoutTemplate}
                  allowEmpty={false}
                />
              </div>
            </div>

            <DataView
              value={stocks}
              listTemplate={(items) =>
                dataViewTemplate(items as Stock[], layout)
              }
              paginator
              first={page * rows}
              rows={rows}
              totalRecords={totalRecords}
              rowsPerPageOptions={[5, 10, 25, 50]}
              onPage={onPageChange}
              lazy
              loading={loading}
            />
          </>
        )}
      </div>

      {/* Form Dialog (edit only — stock creation removed) */}
      <Dialog
        visible={formDialog}
        style={{ width: "600px" }}
        header={
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-chart-bar mr-3 text-primary text-3xl"></i>
                Modificar Stock
              </h2>
            </div>
          </div>
        }
        footer={
          <FormActionButtons
            formId="stock-form"
            isSubmitting={isSubmitting}
            onCancel={() => {
              setFormDialog(false);
              setSelectedStock(null);
            }}
            submitLabel="Actualizar"
          />
        }
        modal
        className="p-fluid"
        onHide={() => {
          setFormDialog(false);
          setSelectedStock(null);
        }}
      >
        <StockForm
          formId="stock-form"
          stock={selectedStock}
          onSave={handleSave}
          onSubmittingChange={setIsSubmitting}
          toast={toast}
        />
      </Dialog>

      {/* Adjust Dialog */}
      <StockAdjustDialog
        visible={adjustDialog}
        stock={selectedStock}
        onSave={() => {
          handleAdjustSave();
          setAdjustDialog(false);
          setSelectedStock(null);
        }}
        onCancel={() => {
          setAdjustDialog(false);
          setSelectedStock(null);
        }}
        onSubmittingChange={setIsAdjustSubmitting}
        toast={toast}
      />

      {/* ── Historial de Movimientos Dialog ──────────────────────────── */}
      <Dialog
        visible={historyDialog}
        style={{ width: "960px" }}
        header={
          historyStock ? (
            <div className="flex align-items-center gap-3">
              <i className="pi pi-history text-primary text-2xl" />
              <div>
                <div className="text-lg font-bold text-900">
                  Historial de Movimientos
                </div>
                <div className="flex align-items-center gap-2 mt-1">
                  <span className="text-sm text-600">
                    {historyStock.item?.name || "Artículo"}
                  </span>
                  <Tag
                    value={historyStock.item?.sku || "—"}
                    severity="info"
                    className="text-xs"
                  />
                  <Tag
                    value={`Stock: ${historyStock.quantityAvailable}`}
                    severity={getStockSeverity(historyStock)}
                    className="text-xs"
                  />
                </div>
              </div>
            </div>
          ) : (
            "Historial de Movimientos"
          )
        }
        modal
        dismissableMask
        onHide={() => setHistoryDialog(false)}
      >
        {historyLoading ? (
          <div
            className="flex justify-content-center align-items-center"
            style={{ height: "200px" }}
          >
            <ProgressSpinner
              style={{ width: "50px", height: "50px" }}
              strokeWidth="4"
            />
          </div>
        ) : historyMovements.length === 0 ? (
          <div className="flex flex-column align-items-center justify-content-center py-6 text-center">
            <i
              className="pi pi-inbox text-400 mb-3"
              style={{ fontSize: "3rem" }}
            />
            <p className="text-lg text-600 m-0">
              No hay movimientos registrados para este artículo
            </p>
            <p className="text-sm text-400 mt-1">
              Los movimientos se crean al recibir mercancía, realizar ventas,
              ajustes o transferencias.
            </p>
          </div>
        ) : (
          <DataTable
            value={historyMovements}
            paginator
            rows={10}
            rowsPerPageOptions={[5, 10, 25]}
            size="small"
            emptyMessage="Sin movimientos"
            responsiveLayout="scroll"
            sortField="movementDate"
            sortOrder={-1}
            rowClassName={() => "animated-row"}
            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords}"
          >
            <Column
              field="movementNumber"
              header="# Mov."
              sortable
              style={{ width: "90px" }}
              body={(row: Movement) => (
                <span className="font-mono text-sm font-semibold">
                  {row.movementNumber}
                </span>
              )}
            />
            <Column
              header="Tipo"
              body={historyTypeTemplate}
              sortable
              sortField="type"
              style={{ width: "130px" }}
            />
            <Column
              header="Cantidad"
              body={historyQtyTemplate}
              sortable
              sortField="quantity"
              style={{ width: "100px" }}
            />
            <Column
              header="Costo Unit."
              body={historyCostTemplate}
              sortable
              sortField="unitCost"
              style={{ width: "110px" }}
            />
            <Column
              header="Origen"
              body={(row: Movement) => historyWarehouseTemplate(row, "from")}
              style={{ width: "120px" }}
            />
            <Column
              header="Destino"
              body={(row: Movement) => historyWarehouseTemplate(row, "to")}
              style={{ width: "120px" }}
            />
            <Column
              field="reference"
              header="Referencia"
              sortable
              style={{ width: "110px" }}
              body={(row: Movement) => (
                <span
                  className="text-sm text-overflow-ellipsis"
                  title={row.reference || ""}
                >
                  {row.reference || "—"}
                </span>
              )}
            />
            <Column
              header="Fecha"
              body={historyDateTemplate}
              sortable
              sortField="movementDate"
              style={{ width: "140px" }}
            />
            <Column
              body={historyActionTemplate}
              style={{ width: "50px" }}
              frozen
              alignFrozen="right"
            />
          </DataTable>
        )}
      </Dialog>

      {/* ── Detalle de Movimiento (sub-Dialog) ───────────────────────── */}
      <Dialog
        visible={historyDetailDialog}
        style={{ width: "720px" }}
        header={
          historySelectedMovement ? (
            <div className="flex align-items-center gap-2">
              <span>Movimiento #{historySelectedMovement.movementNumber}</span>
              <Tag
                value={MOVEMENT_TYPE_LABELS[historySelectedMovement.type]}
                severity={MOVEMENT_TYPE_SEVERITY[historySelectedMovement.type]}
                className="text-xs"
              />
            </div>
          ) : (
            "Detalle de Movimiento"
          )
        }
        modal
        onHide={closeHistoryDetail}
      >
        <MovementDetailForm
          movement={historySelectedMovement}
          isLoading={historyDetailLoading}
          onCancel={closeHistoryDetail}
          onSave={handleHistoryDetailSave}
          toast={toast}
        />
      </Dialog>

      <Menu
        model={getMenuItems(actionItem)}
        popup
        ref={menuRef}
        id="stock-menu"
      />
    </motion.div>
  );
}
