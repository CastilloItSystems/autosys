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
      setTotalRecords(response.meta?.total || (response as any).pagination?.total || 0);
      setTotalValue(response.summary?.totalInventoryValue || 0);
    } catch (error) {
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
    { field: "itemSKU", header: "SKU", sortable: true, width: "12%" },
    {
      field: "quantity",
      header: "Cantidad",
      sortable: true,
      width: "10%",
      body: (row: any) => (
        <span className="font-semibold">{Number(row.quantity || 0).toFixed(0)}</span>
      ),
    },
    {
      field: "unitPrice",
      header: "Precio Unitario",
      sortable: true,
      width: "12%",
      body: (row: any) => <span>${Number(row.unitPrice || 0).toFixed(2)}</span>,
    },
    {
      field: "totalValue",
      header: "Valor Total",
      sortable: true,
      width: "15%",
      body: (row: any) => (
        <span className="font-semibold text-green-600">
          ${Number(row.totalValue || 0).toFixed(2)}
        </span>
      ),
    },
    {
      field: "percentageOfTotal",
      header: "% del Total",
      sortable: true,
      width: "12%",
      body: (row: any) => <span>{Number(row.percentageOfTotal || 0).toFixed(1)}%</span>,
    },
    { field: "warehouseName", header: "Almacén", sortable: true, width: "12%" },
  ];

  return (
    <>
      <Toast ref={toast} />

      {totalValue > 0 && (
        <div className="surface-100 border-round p-4 mb-3 text-center">
          <div className="text-500 text-sm mb-1">Valor Total de Inventario</div>
          <div className="text-4xl font-bold text-green-600">
            ${totalValue.toFixed(2)}
          </div>
        </div>
      )}

      <Card title="Valoración de Inventario">
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
    </>
  );
};

export default StockValuePage;
