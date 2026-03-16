"use client";

import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import { Tag } from "primereact/tag";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import stockService, { Stock } from "@/app/api/inventory/stockService";
import warehouseService, {
  Warehouse,
} from "@/app/api/inventory/warehouseService";

export default function LowStockPage() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseFilter, setWarehouseFilter] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState(20);
  const [loading, setLoading] = useState(true);
  const toast = useRef<Toast>(null);
  const router = useRouter();

  useEffect(() => {
    loadWarehouses();
  }, []);

  useEffect(() => {
    loadLowStock();
  }, [page, rows, warehouseFilter]);

  const loadWarehouses = async () => {
    try {
      const response = await warehouseService.getActive();
      setWarehouses(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error loading warehouses:", error);
    }
  };

  const loadLowStock = async () => {
    try {
      setLoading(true);
      const response = await stockService.getLowStock(
        warehouseFilter || undefined,
        page + 1,
        rows,
      );
      setStocks(response.data || []);
      setTotalRecords(response.meta?.total || 0);
    } catch (error) {
      console.error("Error loading low stock:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar artículos con stock bajo",
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

  const warehouseOptions = [
    { label: "Todos los almacenes", value: null },
    ...warehouses.map((w) => ({ label: w.name, value: w.id })),
  ];

  const quantityBodyTemplate = (rowData: Stock) => {
    const severity = rowData.quantityAvailable <= 0 ? "danger" : "warning";
    return (
      <Tag value={String(rowData.quantityReal)} severity={severity} rounded />
    );
  };

  const availableBodyTemplate = (rowData: Stock) => {
    const severity = rowData.quantityAvailable <= 0 ? "danger" : "warning";
    return (
      <Tag
        value={String(rowData.quantityAvailable)}
        severity={severity}
        rounded
      />
    );
  };

  const itemBodyTemplate = (rowData: Stock) => (
    <div className="flex flex-column">
      <span className="font-semibold">
        {rowData.item?.name || rowData.itemId}
      </span>
      {rowData.item?.sku && (
        <span className="text-sm text-500">{rowData.item.sku}</span>
      )}
    </div>
  );

  const minStockBodyTemplate = (rowData: Stock) => (
    <span className="font-medium">{rowData.item?.minStock ?? "—"}</span>
  );

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <div className="flex align-items-center gap-2">
        <Button
          icon="pi pi-arrow-left"
          text
          rounded
          onClick={() => router.push("/empresa/inventario/stock")}
        />
        <h4 className="m-0">
          <i className="pi pi-exclamation-triangle text-warning mr-2"></i>
          Stock Bajo
        </h4>
        <span className="text-600 text-sm">({totalRecords} artículos)</span>
      </div>
      <div className="flex gap-2">
        <Dropdown
          value={warehouseFilter}
          options={warehouseOptions}
          onChange={(e) => {
            setWarehouseFilter(e.value);
            setPage(0);
          }}
          placeholder="Almacén"
          className="w-12rem"
        />
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
          emptyMessage="No hay artículos con stock bajo"
          lazy
        >
          <Column
            header="Artículo"
            body={itemBodyTemplate}
            style={{ minWidth: "200px" }}
          />
          <Column
            header="Almacén"
            body={(row: Stock) => row.warehouse?.name || row.warehouseId}
            style={{ minWidth: "150px" }}
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
            header="Stock Mínimo"
            body={minStockBodyTemplate}
            style={{ minWidth: "120px" }}
          />
          <Column
            field="quantityReserved"
            header="Reservado"
            style={{ minWidth: "100px" }}
          />
        </DataTable>
      </div>
    </motion.div>
  );
}
