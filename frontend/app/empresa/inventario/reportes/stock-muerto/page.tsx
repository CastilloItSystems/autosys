"use client";

import { useState, useEffect, useRef } from "react";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import { Tag } from "primereact/tag";
import { Skeleton } from "primereact/skeleton";
import ReportsTable from "@/components/inventory/reports/ReportsTable";
import reportService from "@/app/api/inventory/reportService";

const DeadStockPage = () => {
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
      const response = await reportService.getDeadStock(page, rows);
      setItems(response.data);
      setTotalRecords(response.meta.total);
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar los artículos sin movimiento",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const inactiveSeverity = (days: number) => {
    if (days > 365) return "danger";
    if (days > 180) return "warning";
    return "info";
  };

  const inactiveColor = (days: number) => {
    if (days > 365) return "#EF4444";
    if (days > 180) return "#F97316";
    return "#3B82F6";
  };

  const columns = [
    { field: "itemName", header: "Artículo", sortable: true, width: "22%" },
    { field: "itemSKU", header: "SKU", sortable: true, width: "12%" },
    { field: "warehouseName", header: "Almacén", sortable: true, width: "14%" },
    {
      field: "quantity",
      header: "Stock",
      sortable: true,
      width: "10%",
      body: (row: any) => (
        <span className="font-semibold">{row.quantity?.toFixed(0)}</span>
      ),
    },
    {
      field: "value",
      header: "Valor",
      sortable: true,
      width: "12%",
      body: (row: any) => (
        <span className="font-semibold">
          {row.value != null
            ? `$${Number(row.value).toLocaleString("es-VE", {
                minimumFractionDigits: 2,
              })}`
            : "—"}
        </span>
      ),
    },
    {
      field: "lastMovement",
      header: "Último Movimiento",
      sortable: true,
      width: "16%",
      body: (row: any) => (
        <span className="text-500 text-sm">
          {row.lastMovement
            ? new Date(row.lastMovement).toLocaleDateString("es-VE")
            : "Nunca"}
        </span>
      ),
    },
    {
      field: "daysInactive",
      header: "Días Inactivo",
      sortable: true,
      width: "14%",
      body: (row: any) => (
        <Tag
          value={`${row.daysInactive}d`}
          severity={inactiveSeverity(row.daysInactive)}
          style={{ color: inactiveColor(row.daysInactive) }}
        />
      ),
    },
  ];

  return (
    <>
      <Toast ref={toast} />
      {loading && items.length === 0 ? (
        <Card title="Artículos Sin Movimiento (Stock Muerto)">
          <Skeleton height="300px" />
        </Card>
      ) : (
        <ReportsTable
          title="Artículos Sin Movimiento (Stock Muerto)"
          data={items}
          columns={columns}
          loading={loading}
          totalRecords={totalRecords}
          page={page}
          rows={rows}
          reportType="dead-stock"
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

export default DeadStockPage;
