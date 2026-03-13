"use client";

import { useState, useEffect, useRef } from "react";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
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
      console.error("Error loading low stock items:", error);
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

  const columns = [
    { field: "itemName", header: "Artículo", sortable: true, width: "25%" },
    { field: "sku", header: "SKU", sortable: true, width: "15%" },
    {
      field: "currentStock",
      header: "Stock Actual",
      sortable: true,
      width: "12%",
      body: (row: any) => (
        <span className="font-semibold">{row.currentStock.toFixed(0)}</span>
      ),
    },
    {
      field: "minimumStock",
      header: "Stock Mínimo",
      sortable: true,
      width: "12%",
      body: (row: any) => <span>{row.minimumStock.toFixed(0)}</span>,
    },
    {
      field: "difference",
      header: "Diferencia",
      sortable: true,
      width: "12%",
      body: (row: any) => (
        <span className="text-red-600 font-semibold">
          {row.difference.toFixed(0)}
        </span>
      ),
    },
    {
      field: "warehouse",
      header: "Almacén",
      sortable: true,
      width: "15%",
    },
    {
      field: "daysUntilStockout",
      header: "Días hasta Agotamiento",
      sortable: true,
      width: "15%",
      body: (row: any) => (
        <span
          className={row.daysUntilStockout <= 7 ? "text-red-600 font-bold" : ""}
        >
          {row.daysUntilStockout}d
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Toast ref={toast} />

      <Card title="Artículos con Stock Bajo" className="shadow-lg">
        {loading && items.length === 0 ? (
          <Skeleton height="300px" />
        ) : (
          <ReportsTable
            title="Stock Bajo"
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
      </Card>
    </div>
  );
};

export default LowStockPage;
