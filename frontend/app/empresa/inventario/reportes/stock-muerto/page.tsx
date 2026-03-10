"use client";

import { useState, useEffect, useRef } from "react";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import { Tag } from "primereact/tag";
import { Skeleton } from "primereact/skeleton";
import ReportsTable from "@/components/inventory/reports/ReportsTable";
import { getDeadStockReport } from "@/app/api/inventory/reportService";

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
      const response = await getDeadStockReport(page, rows);
      setItems(response.data);
      setTotalRecords(response.pagination.total);
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

  const columns = [
    { field: "itemName", header: "Artículo", sortable: true, width: "25%" },
    { field: "sku", header: "SKU", sortable: true, width: "15%" },
    {
      field: "currentStock",
      header: "Stock Actual",
      sortable: true,
      width: "12%",
      body: (row: any) => <span className="font-semibold">{row.currentStock?.toFixed(0)}</span>,
    },
    {
      field: "lastMovementAt",
      header: "Último Movimiento",
      sortable: true,
      width: "18%",
      body: (row: any) => (
        <span className="text-500 text-sm">
          {row.lastMovementAt
            ? new Date(row.lastMovementAt).toLocaleDateString("es-VE")
            : "Nunca"}
        </span>
      ),
    },
    {
      field: "daysWithoutMovement",
      header: "Días Sin Movimiento",
      sortable: true,
      width: "15%",
      body: (row: any) => (
        <Tag
          value={`${row.daysWithoutMovement}d`}
          severity={row.daysWithoutMovement > 90 ? "danger" : "warning"}
        />
      ),
    },
    { field: "warehouse", header: "Almacén", sortable: true, width: "15%" },
  ];

  return (
    <>
      <Toast ref={toast} />
      <Card title="Artículos Sin Movimiento (Stock Muerto)">
        {loading && items.length === 0 ? (
          <Skeleton height="300px" />
        ) : (
          <ReportsTable
            title="Stock Muerto"
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
      </Card>
    </>
  );
};

export default DeadStockPage;
