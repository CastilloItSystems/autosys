"use client";

import { useState, useEffect, useRef } from "react";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import { Skeleton } from "primereact/skeleton";
import ReportsTable from "@/components/inventory/reports/ReportsTable";
import reportService from "@/app/api/inventory/reportService";

const StockValuePage = () => {
  const toast = useRef<Toast>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [rows, setRows] = useState(20);
  const [totalValue, setTotalValue] = useState(0);

  useEffect(() => {
    loadData();
  }, [page, rows]);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await reportService.getStockValue(page, rows);
      setItems(response.data);
      setTotalRecords(response.meta.total);
      setTotalValue(response.summary?.totalInventoryValue || 0);
    } catch (error) {
      console.error("Error loading stock value report:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar los datos de valoración",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { field: "itemName", header: "Artículo", sortable: true, width: "20%" },
    { field: "sku", header: "SKU", sortable: true, width: "12%" },
    {
      field: "quantity",
      header: "Cantidad",
      sortable: true,
      width: "10%",
      body: (row: any) => (
        <span className="font-semibold">{row.quantity.toFixed(0)}</span>
      ),
    },
    {
      field: "unitPrice",
      header: "Precio Unitario",
      sortable: true,
      width: "12%",
      body: (row: any) => <span>${row.unitPrice.toFixed(2)}</span>,
    },
    {
      field: "totalValue",
      header: "Valor Total",
      sortable: true,
      width: "15%",
      body: (row: any) => (
        <span className="font-semibold text-green-600">
          ${row.totalValue.toFixed(2)}
        </span>
      ),
    },
    {
      field: "percentageOfTotal",
      header: "% del Total",
      sortable: true,
      width: "12%",
      body: (row: any) => <span>{row.percentageOfTotal.toFixed(1)}%</span>,
    },
    {
      field: "warehouse",
      header: "Almacén",
      sortable: true,
      width: "12%",
    },
  ];

  return (
    <div className="space-y-6">
      <Toast ref={toast} />

      {totalValue > 0 && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Valor Total de Inventario
            </p>
            <p className="text-4xl font-bold text-green-600 dark:text-green-400">
              ${totalValue.toFixed(2)}
            </p>
          </div>
        </Card>
      )}

      <Card title="Valoración de Inventario" className="shadow-lg">
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
            showWarehouseFilter={true}
            showSearchFilter={true}
          />
        )}
      </Card>
    </div>
  );
};

export default StockValuePage;
