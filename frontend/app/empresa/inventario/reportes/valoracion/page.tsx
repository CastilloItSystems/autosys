"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import { Skeleton } from "primereact/skeleton";
import { ProgressBar } from "primereact/progressbar";
import { Tag } from "primereact/tag";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { ToggleButton } from "primereact/togglebutton";
import { motion } from "framer-motion";
import ReportsTable from "@/components/inventory/reports/ReportsTable";
import reportService, {
  StockValueFilters,
} from "@/app/api/inventory/reportService";
import warehouseService from "@/app/api/inventory/warehouseService";

const fmt = (n: number) =>
  n.toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const SORT_OPTIONS = [
  { label: "Mayor valor primero", value: "value_desc" },
  { label: "Menor valor primero", value: "value_asc" },
  { label: "Mayor cantidad primero", value: "quantity_desc" },
  { label: "Nombre A→Z", value: "name_asc" },
];

const StockValuePage = () => {
  const toast = useRef<Toast>(null);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const [items, setItems] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [rows, setRows] = useState(20);

  // Warehouses for dropdown
  const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>(
    [],
  );

  // Filters
  const [search, setSearch] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [zeroCostOnly, setZeroCostOnly] = useState(false);
  const [sortBy, setSortBy] =
    useState<StockValueFilters["sortBy"]>("value_desc");

  // Active filter count badge
  const activeFilters = [
    search ? 1 : 0,
    warehouseId ? 1 : 0,
    zeroCostOnly ? 1 : 0,
    sortBy !== "value_desc" ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  useEffect(() => {
    warehouseService.getActive().then((res: any) => {
      const list = res.data ?? res;
      setWarehouses(Array.isArray(list) ? list : []);
    });
  }, []);

  const loadData = useCallback(
    async (overridePage?: number) => {
      setLoading(true);
      try {
        const response = await reportService.getStockValue(
          overridePage ?? page,
          rows,
          {
            warehouseId: warehouseId || undefined,
            search: search || undefined,
            zeroCostOnly,
            sortBy,
          },
        );
        setItems(response.data);
        setTotalRecords(
          (response as any).meta?.total ??
            (response as any).pagination?.total ??
            (response as any).total ??
            0,
        );
        const s = (response as any).summary;
        setSummary(s ?? { totalInventoryValue: 0 });
      } catch {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "No se pudieron cargar los datos de valoración",
          life: 3000,
        });
      } finally {
        setLoading(false);
      }
    },
    [page, rows, warehouseId, zeroCostOnly, sortBy, search],
  );

  // Reload when non-search filters change (instant)
  useEffect(() => {
    setPage(1);
    loadData(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warehouseId, zeroCostOnly, sortBy, rows]);

  // Reload when page changes
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Debounce search
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setPage(1);
      loadData(1);
    }, 400);
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const resetFilters = () => {
    setSearch("");
    setWarehouseId("");
    setZeroCostOnly(false);
    setSortBy("value_desc");
  };

  // KPI cards
  const kpiCards = summary
    ? [
        {
          label: "Valor Total Inventario",
          value: `$${fmt(summary.totalInventoryValue ?? 0)}`,
          sub: summary.isFiltered
            ? `Filtrado: $${fmt(summary.filteredValue ?? 0)}`
            : null,
          icon: "pi pi-dollar",
          iconColor: "#22C55E",
          bg: "#F0FDF4",
        },
        {
          label: "Artículos distintos",
          value: summary.distinctItems ?? 0,
          sub: `${summary.totalStockEntries ?? 0} entradas de stock`,
          icon: "pi pi-box",
          iconColor: "#3B82F6",
          bg: "#EFF6FF",
        },
        {
          label: "Almacenes",
          value: summary.byWarehouse?.length ?? 0,
          sub: null,
          icon: "pi pi-building",
          iconColor: "#8B5CF6",
          bg: "#F5F3FF",
        },
        {
          label: "Sin costo asignado",
          value: summary.zeroCostCount ?? 0,
          sub:
            summary.zeroCostCount > 0 ? "Revisar costeo" : "Todo costificado",
          icon: "pi pi-exclamation-triangle",
          iconColor: summary.zeroCostCount > 0 ? "#F97316" : "#22C55E",
          bg: summary.zeroCostCount > 0 ? "#FFF7ED" : "#F0FDF4",
        },
      ]
    : [];

  const warehouseColors = [
    "#3B82F6",
    "#8B5CF6",
    "#22C55E",
    "#F97316",
    "#EF4444",
    "#06B6D4",
  ];

  const columns = [
    { field: "itemName", header: "Artículo", sortable: true, width: "20%" },
    { field: "itemSKU", header: "SKU", sortable: true, width: "11%" },
    {
      field: "quantity",
      header: "Cantidad",
      sortable: true,
      width: "9%",
      body: (row: any) => (
        <span className="font-semibold">
          {Number(row.quantity || 0).toFixed(0)}
        </span>
      ),
    },
    {
      field: "unitPrice",
      header: "Costo Prom.",
      sortable: true,
      width: "12%",
      body: (row: any) => (
        <span
          className={row.unitPrice === 0 ? "text-orange-500 font-medium" : ""}
        >
          ${fmt(Number(row.unitPrice || 0))}
        </span>
      ),
    },
    {
      field: "totalValue",
      header: "Valor Total",
      sortable: true,
      width: "14%",
      body: (row: any) => (
        <span className="font-semibold text-green-600">
          ${fmt(Number(row.totalValue || 0))}
        </span>
      ),
    },
    {
      field: "percentageOfTotal",
      header: "% del Total",
      sortable: true,
      width: "14%",
      body: (row: any) => {
        const pct = Number(row.percentageOfTotal || 0);
        return (
          <div className="flex align-items-center gap-2">
            <ProgressBar
              value={pct}
              showValue={false}
              style={{ height: 6, width: 60 }}
              color="#3B82F6"
            />
            <span className="text-sm">{pct.toFixed(1)}%</span>
          </div>
        );
      },
    },
    { field: "warehouseName", header: "Almacén", sortable: true, width: "12%" },
  ];

  return (
    <>
      <Toast ref={toast} />

      {/* Filter bar */}
      <Card className="mb-4 shadow-1">
        <div className="flex align-items-end gap-3 flex-wrap">
          {/* Search */}
          <div className="flex flex-column gap-1">
            <label className="text-sm font-medium">Buscar artículo</label>
            <span className="p-input-icon-left">
              <i className="pi pi-search" />
              <InputText
                placeholder="Nombre o SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: "14rem" }}
              />
            </span>
          </div>

          {/* Warehouse */}
          <div className="flex flex-column gap-1">
            <label className="text-sm font-medium">Almacén</label>
            <Dropdown
              options={[
                { label: "Todos los almacenes", value: "" },
                ...warehouses.map((w) => ({ label: w.name, value: w.id })),
              ]}
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.value)}
              placeholder="Todos los almacenes"
              style={{ width: "14rem" }}
            />
          </div>

          {/* Sort */}
          <div className="flex flex-column gap-1">
            <label className="text-sm font-medium">Ordenar por</label>
            <Dropdown
              options={SORT_OPTIONS}
              value={sortBy}
              onChange={(e) => setSortBy(e.value)}
              style={{ width: "16rem" }}
            />
          </div>

          {/* Zero cost toggle */}
          <div className="flex flex-column gap-1">
            <label className="text-sm font-medium">Sin costo</label>
            <ToggleButton
              onLabel="Solo sin costo"
              offLabel="Todos"
              onIcon="pi pi-exclamation-triangle"
              offIcon="pi pi-check-circle"
              checked={zeroCostOnly}
              onChange={(e) => setZeroCostOnly(e.value)}
              style={{ width: "10rem" }}
            />
          </div>

          {/* Reset */}
          {activeFilters > 0 && (
            <div className="flex flex-column gap-1">
              <label className="text-sm font-medium opacity-0">Reset</label>
              <Button
                label={`Limpiar (${activeFilters})`}
                icon="pi pi-filter-slash"
                severity="secondary"
                outlined
                size="small"
                onClick={resetFilters}
              />
            </div>
          )}
        </div>
      </Card>

      {/* KPI Cards */}
      <div className="grid mb-4">
        {loading && !summary
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="col-12 md:col-6 lg:col-3">
                <Skeleton height="88px" />
              </div>
            ))
          : kpiCards.map((card, idx) => (
              <div key={idx} className="col-12 md:col-6 lg:col-3">
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08 }}
                >
                  <Card className="shadow-1 h-full">
                    <div className="flex align-items-center gap-3">
                      <div
                        className="flex align-items-center justify-content-center border-round flex-shrink-0"
                        style={{ width: 48, height: 48, background: card.bg }}
                      >
                        <i
                          className={card.icon}
                          style={{ fontSize: "1.4rem", color: card.iconColor }}
                        />
                      </div>
                      <div>
                        <p className="text-500 text-sm m-0">{card.label}</p>
                        <p
                          className="font-bold text-2xl m-0"
                          style={{ color: card.iconColor }}
                        >
                          {card.value}
                        </p>
                        {card.sub && (
                          <p className="text-400 text-xs m-0 mt-1">
                            {card.sub}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              </div>
            ))}
      </div>

      {/* Warehouse breakdown + Top 5 */}
      {summary && !zeroCostOnly && (
        <div className="grid mb-4">
          {summary.byWarehouse?.length > 0 && (
            <div className="col-12 md:col-6">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.32 }}
              >
                <Card title="Valor por Almacén" className="shadow-1 h-full">
                  <div className="flex flex-column gap-3">
                    {summary.byWarehouse.map((w: any, i: number) => {
                      const pct =
                        summary.totalInventoryValue > 0
                          ? (w.totalValue / summary.totalInventoryValue) * 100
                          : 0;
                      const color = warehouseColors[i % warehouseColors.length];
                      const isSelected = warehouseId === w.warehouseId;
                      return (
                        <div
                          key={w.warehouseId}
                          className={`cursor-pointer border-round p-2 transition-all transition-duration-150 ${
                            isSelected ? "surface-100" : "hover:surface-50"
                          }`}
                          onClick={() =>
                            setWarehouseId(isSelected ? "" : w.warehouseId)
                          }
                          title={
                            isSelected
                              ? "Quitar filtro"
                              : `Filtrar por ${w.warehouseName}`
                          }
                        >
                          <div className="flex justify-content-between align-items-center mb-1">
                            <span className="font-medium text-sm flex align-items-center gap-2">
                              {isSelected && (
                                <i
                                  className="pi pi-filter-fill text-xs"
                                  style={{ color }}
                                />
                              )}
                              {w.warehouseName}
                            </span>
                            <div className="flex align-items-center gap-2">
                              <span className="text-500 text-xs">
                                {pct.toFixed(1)}%
                              </span>
                              <span
                                className="font-semibold text-sm"
                                style={{ color }}
                              >
                                ${fmt(w.totalValue)}
                              </span>
                            </div>
                          </div>
                          <ProgressBar
                            value={pct}
                            showValue={false}
                            style={{ height: 8 }}
                            color={color}
                          />
                          <p className="text-400 text-xs m-0 mt-1">
                            {w.itemCount}{" "}
                            {w.itemCount === 1 ? "artículo" : "artículos"}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </motion.div>
            </div>
          )}

          {summary.top5Items?.length > 0 && (
            <div className="col-12 md:col-6">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card
                  title="Top 5 Artículos por Valor"
                  className="shadow-1 h-full"
                >
                  <div className="flex flex-column gap-3">
                    {summary.top5Items.map((item: any, i: number) => (
                      <div key={i} className="flex align-items-center gap-3">
                        <div
                          className="flex align-items-center justify-content-center border-round-sm font-bold text-white text-sm flex-shrink-0"
                          style={{
                            width: 28,
                            height: 28,
                            background:
                              i === 0
                                ? "#F59E0B"
                                : i === 1
                                ? "#94A3B8"
                                : i === 2
                                ? "#B45309"
                                : "#6B7280",
                          }}
                        >
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm m-0 white-space-nowrap overflow-hidden text-overflow-ellipsis">
                            {item.itemName}
                          </p>
                          <p className="text-400 text-xs m-0">
                            {item.warehouseName}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-green-600 text-sm m-0">
                            ${fmt(item.totalValue)}
                          </p>
                          <Tag
                            value={`${item.percentage}%`}
                            severity="info"
                            style={{ fontSize: "0.7rem" }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            </div>
          )}
        </div>
      )}

      {/* Zero cost alert */}
      {summary?.zeroCostCount > 0 && zeroCostOnly && (
        <div className="flex align-items-center gap-2 p-3 border-round mb-4 surface-100 border-left-3 border-orange-400">
          <i className="pi pi-exclamation-triangle text-orange-500 text-xl" />
          <span className="text-sm">
            Hay <strong>{summary.zeroCostCount}</strong> registros sin costo
            asignado. Estos artículos no contribuyen al valor total del
            inventario.
          </span>
        </div>
      )}

      {/* Main table */}
      <Card title="Detalle de Valoración">
        {loading && items.length === 0 ? (
          <Skeleton height="300px" />
        ) : (
          <ReportsTable
            title="Valoración"
            data={items}
            columns={columns}
            loading={loading}
            totalRecords={totalRecords}
            page={page}
            rows={rows}
            reportType="stock-value"
            onPageChange={(e) => {
              setPage((e.page ?? 0) + 1);
              setRows(e.rows ?? 20);
            }}
            showDateFilter={false}
            showWarehouseFilter={false}
            showSearchFilter={false}
          />
        )}
      </Card>
    </>
  );
};

export default StockValuePage;
