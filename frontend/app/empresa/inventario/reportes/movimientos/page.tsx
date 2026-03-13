"use client";

import { useState, useEffect, useRef } from "react";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import { Tag } from "primereact/tag";
import { Skeleton } from "primereact/skeleton";
import ReportsTable from "@/components/inventory/reports/ReportsTable";
import { getMovementsReport } from "@/app/api/inventory/reportService";

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
      width: "12%",
      body: (row: any) =>
        new Date(row.movementDate).toLocaleDateString("es-VE"),
    },
    { field: "itemName", header: "Artículo", sortable: true, width: "20%" },
    { field: "sku", header: "SKU", sortable: true, width: "12%" },
    {
      field: "type",
      header: "Tipo",
      sortable: true,
      width: "14%",
      body: (row: any) => (
        <Tag
          value={MOVEMENT_TYPE_LABELS[row.type] || row.type}
          severity={
            row.type?.includes("salida") ||
            row.type?.includes("OUT") ||
            row.type?.includes("SALE")
              ? "danger"
              : "success"
          }
        />
      ),
    },
    {
      field: "quantity",
      header: "Cantidad",
      sortable: true,
      width: "10%",
      body: (row: any) => {
        const isOut =
          row.type?.includes("salida") ||
          row.type?.includes("OUT") ||
          row.type?.includes("SALE");
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
    { field: "warehouse", header: "Almacén", sortable: true, width: "15%" },
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
      <Card title="Historial de Movimientos de Inventario">
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
    </>
  );
};

export default MovementsPage;
