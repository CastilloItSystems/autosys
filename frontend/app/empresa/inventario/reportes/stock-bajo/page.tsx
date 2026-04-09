"use client";

import { useState, useEffect, useRef } from "react";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import { Tag } from "primereact/tag";
import { Skeleton } from "primereact/skeleton";
import ReportsTable from "@/components/inventory/reports/ReportsTable";
import reportService from "@/app/api/inventory/reportService";

const LowStockPage = () => {
  const toast = useRef<Toast>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [rows, setRows] = useState(20);

  useEffect(() => {
    loadData();
  }, [page, rows]);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await reportService.getLowStock(page, rows);
      setItems(response.data);
      setTotalRecords(response.meta.total);
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar los artículos con stock bajo",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  /** Returns row-level CSS class for severity highlighting */
  const rowClass = (row: any) => {
    if (row.currentStock === 0) return "surface-50"; // out of stock
    const pct = row.currentStock / (row.minimumStock || 1);
    if (pct <= 0.5) return ""; // critical — handled by tag color
    return "";
  };

  const stockSeverity = (row: any) => {
    if (row.currentStock === 0) return "danger";
    const pct = row.currentStock / (row.minimumStock || 1);
    if (pct <= 0.5) return "danger";
    if (pct <= 0.75) return "warning";
    return "info";
  };

  const columns = [
    { field: "itemName", header: "Artículo", sortable: true, width: "22%" },
    { field: "itemSKU", header: "SKU", sortable: true, width: "12%" },
    { field: "warehouseName", header: "Almacén", sortable: true, width: "15%" },
    {
      field: "currentStock",
      header: "Stock Actual",
      sortable: true,
      width: "12%",
      body: (row: any) => (
        <Tag
          value={row.currentStock?.toFixed(0)}
          severity={stockSeverity(row)}
        />
      ),
    },
    {
      field: "minimumStock",
      header: "Stock Mínimo",
      sortable: true,
      width: "12%",
      body: (row: any) => (
        <span className="text-500">{row.minimumStock?.toFixed(0)}</span>
      ),
    },
    {
      field: "shortage",
      header: "Faltante",
      sortable: true,
      width: "12%",
      body: (row: any) => (
        <span
          className="font-semibold"
          style={{ color: row.shortage > 0 ? "#EF4444" : "#22C55E" }}
        >
          {row.shortage > 0 ? `-${row.shortage?.toFixed(0)}` : "OK"}
        </span>
      ),
    },
    {
      field: "lastMovement",
      header: "Último Movimiento",
      sortable: true,
      width: "15%",
      body: (row: any) =>
        row.lastMovement
          ? new Date(row.lastMovement).toLocaleDateString("es-VE")
          : "—",
    },
  ];

  return (
    <>
      <Toast ref={toast} />
      {loading && items.length === 0 ? (
        <Card title="Artículos con Stock Bajo">
          <Skeleton height="300px" />
        </Card>
      ) : (
        <ReportsTable
          title="Artículos con Stock Bajo"
          data={items}
          columns={columns}
          loading={loading}
          totalRecords={totalRecords}
          page={page}
          rows={rows}
          reportType="low-stock"
          onPageChange={(e) => {
            setPage((e.page ?? 0) + 1);
            setRows(e.rows ?? 20);
          }}
          showDateFilter={false}
          showWarehouseFilter={true}
          showSearchFilter={true}
        />
      )}
    </>
  );
};

export default LowStockPage;
