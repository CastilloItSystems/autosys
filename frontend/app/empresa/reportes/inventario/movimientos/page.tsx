"use client";

import { useState, useEffect, useRef } from "react";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import { Skeleton } from "primereact/skeleton";
import ReportsTable from "@/components/inventory/reports/ReportsTable";
import reportService from "@/app/api/inventory/reportService";

const MovementsPage = () => {
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
      const response = await reportService.getMovements(page, rows);
      setItems(response.data);
      setTotalRecords(response.meta.total);
    } catch (error) {
      console.error("Error loading movements report:", error);
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

  const columns = [
    {
      field: "movementDate",
      header: "Fecha",
      sortable: true,
      width: "15%",
      body: (row: any) =>
        new Date(row.movementDate).toLocaleDateString("es-ES"),
    },
    { field: "itemName", header: "Artículo", sortable: true, width: "20%" },
    { field: "sku", header: "SKU", sortable: true, width: "12%" },
    {
      field: "type",
      header: "Tipo de Movimiento",
      sortable: true,
      width: "12%",
      body: (row: any) => {
        const types: { [key: string]: string } = {
          entrada: "Entrada",
          salida: "Salida",
          ajuste: "Ajuste",
          transferencia: "Transferencia",
          devolucion: "Devolución",
        };
        return <span>{types[row.type] || row.type}</span>;
      },
    },
    {
      field: "quantity",
      header: "Cantidad",
      sortable: true,
      width: "10%",
      body: (row: any) => (
        <span
          className={row.type === "salida" ? "text-red-600" : "text-green-600"}
        >
          {row.type === "salida" ? "-" : "+"}
          {row.quantity.toFixed(0)}
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
      field: "reference",
      header: "Referencia",
      sortable: false,
      width: "16%",
      body: (row: any) => (
        <span className="text-sm text-gray-600">{row.reference || "-"}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Toast ref={toast} />

      <Card
        title="Historial de Movimientos de Inventario"
        className="shadow-lg"
      >
        {loading && items.length === 0 ? (
          <Skeleton height="300px" />
        ) : (
          <ReportsTable
            title="Movimientos"
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
      </Card>
    </div>
  );
};

export default MovementsPage;
