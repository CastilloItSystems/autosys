"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Tag } from "primereact/tag";
import { Skeleton } from "primereact/skeleton";
import { motion } from "framer-motion";
import stockService, { Stock } from "@/app/api/inventory/stockService";

export default function StockItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const itemId = params.id as string;

  const [stocks, setStocks] = useState<Stock[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState(20);
  const [loading, setLoading] = useState(true);
  const toast = useRef<Toast>(null);

  useEffect(() => {
    if (itemId) loadItemStock();
  }, [itemId, page, rows]);

  const loadItemStock = async () => {
    try {
      setLoading(true);
      const response = await stockService.getByItem(itemId, page + 1, rows);
      setStocks(response.data || []);
      setTotalRecords(response.meta?.total || 0);
    } catch (error) {
      console.error("Error loading item stock:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar el stock del artículo",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const onPageChange = (event: any) => {
    const newPage =
      event.page !== undefined
        ? event.page
        : Math.floor(event.first / event.rows);
    setPage(newPage);
    setRows(event.rows);
  };

  // Deduce item name from first stock record
  const itemName = stocks[0]?.item?.name || itemId;
  const itemSku = stocks[0]?.item?.sku || "";

  // Calculate totals
  const totalReal = stocks.reduce((sum, s) => sum + s.quantityReal, 0);
  const totalAvailable = stocks.reduce(
    (sum, s) => sum + s.quantityAvailable,
    0,
  );
  const totalReserved = stocks.reduce((sum, s) => sum + s.quantityReserved, 0);
  const avgCost =
    stocks.length > 0
      ? stocks.reduce((sum, s) => sum + s.averageCost, 0) / stocks.length
      : 0;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);

  const quantityBodyTemplate = (rowData: Stock) => {
    const minStock = rowData.item?.minStock ?? 5;
    let severity: "success" | "warning" | "danger" = "success";
    if (rowData.quantityAvailable <= 0) severity = "danger";
    else if (rowData.quantityAvailable <= minStock) severity = "warning";
    return (
      <Tag value={String(rowData.quantityReal)} severity={severity} rounded />
    );
  };

  const availableBodyTemplate = (rowData: Stock) => {
    const minStock = rowData.item?.minStock ?? 5;
    let severity: "success" | "warning" | "danger" = "success";
    if (rowData.quantityAvailable <= 0) severity = "danger";
    else if (rowData.quantityAvailable <= minStock) severity = "warning";
    return (
      <Tag
        value={String(rowData.quantityAvailable)}
        severity={severity}
        rounded
      />
    );
  };

  const costBodyTemplate = (rowData: Stock) => (
    <span>{formatCurrency(rowData.averageCost)}</span>
  );

  const lastMovementBodyTemplate = (rowData: Stock) => {
    if (!rowData.lastMovementAt) return <span className="text-400">—</span>;
    return (
      <span className="text-sm">
        {new Date(rowData.lastMovementAt).toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}
      </span>
    );
  };

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <div className="flex align-items-center gap-2">
        <Button
          icon="pi pi-arrow-left"
          text
          rounded
          onClick={() => router.push("/empresa/inventario/stock")}
        />
        <div>
          <h4 className="m-0">
            <i className="pi pi-box mr-2 text-primary"></i>
            {loading ? <Skeleton width="200px" height="1.5rem" /> : itemName}
          </h4>
          {itemSku && <span className="text-500 text-sm">{itemSku}</span>}
        </div>
        <span className="text-600 text-sm ml-2">
          ({totalRecords} almacenes)
        </span>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Toast ref={toast} />

      {/* Summary Cards */}
      {!loading && stocks.length > 0 && (
        <div className="grid mb-3">
          <div className="col-6 md:col-3">
            <div className="card mb-0 text-center">
              <span className="text-500 text-sm block mb-1">
                Cantidad Total
              </span>
              <span className="text-900 font-bold text-2xl">{totalReal}</span>
            </div>
          </div>
          <div className="col-6 md:col-3">
            <div className="card mb-0 text-center">
              <span className="text-500 text-sm block mb-1">Disponible</span>
              <span className="text-primary font-bold text-2xl">
                {totalAvailable}
              </span>
            </div>
          </div>
          <div className="col-6 md:col-3">
            <div className="card mb-0 text-center">
              <span className="text-500 text-sm block mb-1">Reservado</span>
              <span className="text-orange-500 font-bold text-2xl">
                {totalReserved}
              </span>
            </div>
          </div>
          <div className="col-6 md:col-3">
            <div className="card mb-0 text-center">
              <span className="text-500 text-sm block mb-1">
                Costo Promedio
              </span>
              <span className="text-green-500 font-bold text-2xl">
                {formatCurrency(avgCost)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Stock by warehouse table */}
      <div className="card">
        <DataTable
          value={stocks}
          paginator
          first={page * rows}
          rows={rows}
          totalRecords={totalRecords}
          rowsPerPageOptions={[10, 20, 50]}
          onPage={onPageChange}
          dataKey="id"
          loading={loading}
          header={header}
          emptyMessage="No hay stock registrado para este artículo"
          lazy
        >
          <Column
            header="Almacén"
            body={(row: Stock) => (
              <div className="flex flex-column">
                <span className="font-semibold">
                  {row.warehouse?.name || row.warehouseId}
                </span>
                {row.warehouse?.code && (
                  <span className="text-sm text-500">{row.warehouse.code}</span>
                )}
              </div>
            )}
            style={{ minWidth: "200px" }}
          />
          <Column
            field="quantityReal"
            header="Cantidad Real"
            body={quantityBodyTemplate}
            style={{ minWidth: "120px" }}
          />
          <Column
            field="quantityAvailable"
            header="Disponible"
            body={availableBodyTemplate}
            style={{ minWidth: "120px" }}
          />
          <Column
            field="quantityReserved"
            header="Reservado"
            style={{ minWidth: "100px" }}
          />
          <Column
            field="averageCost"
            header="Costo Promedio"
            body={costBodyTemplate}
            style={{ minWidth: "130px" }}
          />
          <Column
            field="lastMovementAt"
            header="Último Mov."
            body={lastMovementBodyTemplate}
            style={{ minWidth: "120px" }}
          />
        </DataTable>
      </div>
    </motion.div>
  );
}
