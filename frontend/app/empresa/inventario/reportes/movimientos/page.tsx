"use client";

import { useState, useEffect, useRef } from "react";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import { Tag } from "primereact/tag";
import { Skeleton } from "primereact/skeleton";
import ReportsTable from "@/components/inventory/reports/ReportsTable";
import reportService from "@/app/api/inventory/reportService";

const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  entrada: "Entrada",
  salida: "Salida",
  ajuste: "Ajuste",
  transferencia: "Transferencia",
  devolucion: "Devolución",
  PURCHASE: "Compra",
  SALE: "Venta",
  ADJUSTMENT_IN: "Ajuste Entrada",
  ADJUSTMENT_OUT: "Ajuste Salida",
  TRANSFER: "Transferencia",
  SUPPLIER_RETURN: "Dev. Proveedor",
  LOAN_OUT: "Préstamo Salida",
  LOAN_RETURN: "Préstamo Retorno",
};

const IN_TYPES = new Set([
  "PURCHASE",
  "ADJUSTMENT_IN",
  "LOAN_RETURN",
  "entrada",
]);
const OUT_TYPES = new Set([
  "SALE",
  "ADJUSTMENT_OUT",
  "LOAN_OUT",
  "salida",
  "OUT",
]);

const MovementsPage = () => {
  const toast = useRef<Toast>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [rows, setRows] = useState(20);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [page, rows]);

  useEffect(() => {
    loadSummary();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await reportService.getMovements(page, rows);
      setItems(response.data);
      setTotalRecords(response.meta.total);
    } catch (error) {
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

  const loadSummary = async () => {
    setSummaryLoading(true);
    try {
      const response = await reportService.getMovementsSummary();
      setSummary((response as any).data ?? response);
    } catch {
      // summary is optional, don't block the page
    } finally {
      setSummaryLoading(false);
    }
  };

  // Compute total in/out quantities from byType
  const totalIn = summary?.byType
    ? Object.entries(summary.byType as Record<string, number>)
        .filter(
          ([type]) =>
            IN_TYPES.has(type) ||
            type.includes("IN") ||
            type.includes("entrada"),
        )
        .reduce((sum, [, count]) => sum + count, 0)
    : null;

  const totalOut = summary?.byType
    ? Object.entries(summary.byType as Record<string, number>)
        .filter(
          ([type]) =>
            OUT_TYPES.has(type) ||
            type.includes("OUT") ||
            type.includes("salida"),
        )
        .reduce((sum, [, count]) => sum + count, 0)
    : null;

  const summaryCards = [
    {
      label: "Total Movimientos",
      value: summary?.totalMovements,
      icon: "pi pi-arrow-right-arrow-left",
      iconColor: "#3B82F6",
      bg: "#EFF6FF",
      format: (v: number) => v.toLocaleString(),
    },
    {
      label: "Cantidad Movida",
      value: summary?.totalQuantityMoved,
      icon: "pi pi-box",
      iconColor: "#8B5CF6",
      bg: "#F5F3FF",
      format: (v: number) => v.toLocaleString(),
    },
    {
      label: "Entradas",
      value: totalIn,
      icon: "pi pi-arrow-down",
      iconColor: "#22C55E",
      bg: "#F0FDF4",
      format: (v: number) => v.toLocaleString(),
    },
    {
      label: "Salidas",
      value: totalOut,
      icon: "pi pi-arrow-up",
      iconColor: "#EF4444",
      bg: "#FEF2F2",
      format: (v: number) => v.toLocaleString(),
    },
    {
      label: "Valor Total",
      value: summary?.totalCostValue,
      icon: "pi pi-dollar",
      iconColor: "#F59E0B",
      bg: "#FFFBEB",
      format: (v: number) =>
        `$${v.toLocaleString("es-VE", { minimumFractionDigits: 2 })}`,
    },
  ];

  const columns = [
    {
      field: "movementDate",
      header: "Fecha",
      sortable: true,
      width: "12%",
      body: (row: any) =>
        new Date(row.movementDate).toLocaleDateString("es-VE"),
    },
    { field: "itemName", header: "Artículo", sortable: true, width: "20%" },
    { field: "itemSKU", header: "SKU", sortable: true, width: "12%" },
    {
      field: "type",
      header: "Tipo",
      sortable: true,
      width: "14%",
      body: (row: any) => {
        const isOut =
          OUT_TYPES.has(row.type) ||
          row.type?.includes("OUT") ||
          row.type?.includes("salida");
        return (
          <Tag
            value={MOVEMENT_TYPE_LABELS[row.type] || row.type}
            severity={isOut ? "danger" : "success"}
          />
        );
      },
    },
    {
      field: "quantity",
      header: "Cantidad",
      sortable: true,
      width: "10%",
      body: (row: any) => {
        const isOut =
          OUT_TYPES.has(row.type) ||
          row.type?.includes("OUT") ||
          row.type?.includes("salida");
        return (
          <span
            className={`font-semibold ${
              isOut ? "text-red-500" : "text-green-600"
            }`}
          >
            {isOut ? "-" : "+"}
            {row.quantity?.toFixed(0)}
          </span>
        );
      },
    },
    {
      field: "warehouseFromName",
      header: "Almacén Origen",
      sortable: true,
      width: "15%",
      body: (row: any) => (
        <span className="text-500 text-sm">
          {row.warehouseFromName !== "N/A" ? row.warehouseFromName : "—"}
        </span>
      ),
    },
    {
      field: "reference",
      header: "Referencia",
      sortable: false,
      width: "17%",
      body: (row: any) => (
        <span className="text-500 text-sm">{row.reference || "—"}</span>
      ),
    },
  ];

  return (
    <>
      <Toast ref={toast} />

      {/* Summary strip */}
      <div className="flex flex-wrap gap-3 mb-4">
        {summaryCards.map((card, idx) => (
          <div
            key={idx}
            className="flex align-items-center gap-2 border-round p-3 shadow-1"
            style={{ background: card.bg, minWidth: 160, flex: "1 1 150px" }}
          >
            <i
              className={card.icon}
              style={{ fontSize: "1.3rem", color: card.iconColor }}
            />
            <div>
              <p className="text-500 text-xs m-0 mb-1">{card.label}</p>
              {summaryLoading ? (
                <Skeleton width="4rem" height="1.2rem" />
              ) : (
                <p
                  className="font-bold text-lg m-0"
                  style={{ color: card.iconColor }}
                >
                  {card.value != null ? card.format(card.value) : "—"}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {loading && items.length === 0 ? (
        <Card title="Historial de Movimientos de Inventario">
          <Skeleton height="300px" />
        </Card>
      ) : (
        <ReportsTable
          title="Historial de Movimientos de Inventario"
          data={items}
          columns={columns}
          loading={loading}
          totalRecords={totalRecords}
          page={page}
          rows={rows}
          reportType="movements"
          onPageChange={(e) => {
            setPage((e.page ?? 0) + 1);
            setRows(e.rows ?? 20);
          }}
          showDateFilter={true}
          showWarehouseFilter={true}
          showSearchFilter={true}
        />
      )}
    </>
  );
};

export default MovementsPage;
