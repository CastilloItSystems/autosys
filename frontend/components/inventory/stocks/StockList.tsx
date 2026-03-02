"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { Tag } from "primereact/tag";
import { Dropdown } from "primereact/dropdown";
import { motion } from "framer-motion";
import {
  getStocks,
  getLowStock,
  getOutOfStock,
  Stock,
} from "@/app/api/inventory/stockService";
import {
  getActiveWarehouses,
  Warehouse,
} from "@/app/api/inventory/warehouseService";
import StockForm from "./StockForm";
import StockAdjustDialog from "./StockAdjustDialog";
import CreateButton from "@/components/common/CreateButton";

type StockFilter = "all" | "lowStock" | "outOfStock";

export default function StockList() {
  const router = useRouter();

  // Datos
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  // Filtros y paginación
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState<number>(0);
  const [rows, setRows] = useState<number>(10);
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [warehouseFilter, setWarehouseFilter] = useState<string | null>(null);

  // UI
  const [loading, setLoading] = useState<boolean>(true);
  const [formDialog, setFormDialog] = useState<boolean>(false);
  const [adjustDialog, setAdjustDialog] = useState<boolean>(false);
  const toast = useRef<Toast>(null);

  // Cargar almacenes para el filtro
  useEffect(() => {
    loadWarehouses();
  }, []);

  // Cargar stocks cuando cambien los filtros
  useEffect(() => {
    loadStocks();
  }, [page, rows, stockFilter, warehouseFilter]);

  const loadWarehouses = async () => {
    try {
      const response = await getActiveWarehouses();
      const data = response.data || [];
      setWarehouses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading warehouses:", error);
    }
  };

  const loadStocks = async () => {
    try {
      setLoading(true);

      let response;
      if (stockFilter === "lowStock") {
        response = await getLowStock(
          warehouseFilter || undefined,
          page + 1,
          rows,
        );
      } else if (stockFilter === "outOfStock") {
        response = await getOutOfStock(
          warehouseFilter || undefined,
          page + 1,
          rows,
        );
      } else {
        response = await getStocks(page + 1, rows, {
          warehouseId: warehouseFilter || undefined,
        });
      }

      const stocksData = response.data || [];
      const total = response.meta?.total || 0;

      setStocks(Array.isArray(stocksData) ? stocksData : []);
      setTotalRecords(total);
    } catch (error) {
      console.error("Error loading stocks:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar el stock",
        life: 3000,
      });
      setStocks([]);
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

  const openNew = () => {
    setSelectedStock(null);
    setFormDialog(true);
  };

  const editStock = (stock: Stock) => {
    setSelectedStock({ ...stock });
    setFormDialog(true);
  };

  const openAdjust = (stock: Stock) => {
    setSelectedStock({ ...stock });
    setAdjustDialog(true);
  };

  const handleSave = () => {
    toast.current?.show({
      severity: "success",
      summary: "Éxito",
      detail: selectedStock?.id
        ? "Stock actualizado correctamente"
        : "Stock creado correctamente",
      life: 3000,
    });
    loadStocks();
    setFormDialog(false);
  };

  const handleAdjustSave = () => {
    toast.current?.show({
      severity: "success",
      summary: "Éxito",
      detail: "Ajuste de stock realizado correctamente",
      life: 3000,
    });
    loadStocks();
    setAdjustDialog(false);
  };

  // ── Templates ──────────────────────────────────────────────────────────

  const actionBodyTemplate = (rowData: Stock) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-eye"
          rounded
          severity="success"
          text
          onClick={() =>
            router.push(`/empresa/inventario/stock/item/${rowData.itemId}`)
          }
          tooltip="Ver stock por almacén"
        />
        <Button
          icon="pi pi-pencil"
          rounded
          severity="info"
          text
          onClick={() => editStock(rowData)}
          tooltip="Editar"
        />
        <Button
          icon="pi pi-sliders-h"
          rounded
          severity="warning"
          text
          onClick={() => openAdjust(rowData)}
          tooltip="Ajustar Stock"
        />
      </div>
    );
  };

  const quantityBodyTemplate = (rowData: Stock) => {
    const { quantityAvailable, quantityReal } = rowData;
    // Obtener minStock del item si está disponible
    const minStock = rowData.item?.minStock ?? 5;
    let severity: "success" | "warning" | "danger" = "success";
    if (quantityAvailable <= 0) severity = "danger";
    else if (quantityAvailable <= minStock) severity = "warning";

    return (
      <Tag
        value={String(quantityReal)}
        severity={severity}
        rounded
        className="text-sm"
      />
    );
  };

  const availableBodyTemplate = (rowData: Stock) => {
    const { quantityAvailable } = rowData;
    const minStock = rowData.item?.minStock ?? 5;
    let severity: "success" | "warning" | "danger" = "success";
    if (quantityAvailable <= 0) severity = "danger";
    else if (quantityAvailable <= minStock) severity = "warning";

    return (
      <Tag
        value={String(quantityAvailable)}
        severity={severity}
        rounded
        className="text-sm"
      />
    );
  };

  const costBodyTemplate = (rowData: Stock) => {
    return (
      <span>
        {new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(rowData.averageCost)}
      </span>
    );
  };

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

  const itemBodyTemplate = (rowData: Stock) => {
    return (
      <div className="flex flex-column">
        <span className="font-semibold">
          {rowData.item?.name || rowData.itemId}
        </span>
        {rowData.item?.sku && (
          <span className="text-sm text-500">{rowData.item.sku}</span>
        )}
      </div>
    );
  };

  const warehouseBodyTemplate = (rowData: Stock) => {
    return <span>{rowData.warehouse?.name || rowData.warehouseId}</span>;
  };

  // Opciones del dropdown de almacén
  const warehouseOptions = [
    { label: "Todos los almacenes", value: null },
    ...warehouses.map((w) => ({ label: w.name, value: w.id })),
  ];

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <div className="flex align-items-center gap-2">
        <h4 className="m-0">Stock</h4>
        <span className="text-600 text-sm">({totalRecords} registros)</span>
      </div>
      <div className="flex flex-wrap gap-2 align-items-center">
        {/* Filtro por estado de stock */}
        <div className="flex gap-1">
          <Button
            label="Todos"
            size="small"
            severity={stockFilter === "all" ? undefined : "secondary"}
            outlined={stockFilter !== "all"}
            onClick={() => {
              setStockFilter("all");
              setPage(0);
            }}
          />
          <Button
            label="Stock Bajo"
            size="small"
            severity={stockFilter === "lowStock" ? "warning" : "secondary"}
            outlined={stockFilter !== "lowStock"}
            icon="pi pi-exclamation-triangle"
            onClick={() => {
              setStockFilter("lowStock");
              setPage(0);
            }}
          />
          <Button
            label="Agotado"
            size="small"
            severity={stockFilter === "outOfStock" ? "danger" : "secondary"}
            outlined={stockFilter !== "outOfStock"}
            icon="pi pi-times-circle"
            onClick={() => {
              setStockFilter("outOfStock");
              setPage(0);
            }}
          />
        </div>

        {/* Filtro por almacén */}
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

        <CreateButton label="Nuevo Stock" onClick={openNew} />
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
          rowsPerPageOptions={[5, 10, 25, 50]}
          onPage={onPageChange}
          dataKey="id"
          loading={loading}
          header={header}
          emptyMessage="No hay registros de stock"
          sortMode="multiple"
          lazy
        >
          <Column
            header="Artículo"
            body={itemBodyTemplate}
            sortable
            sortField="item.name"
            style={{ minWidth: "200px" }}
          />
          <Column
            header="Almacén"
            body={warehouseBodyTemplate}
            sortable
            sortField="warehouse.name"
            style={{ minWidth: "150px" }}
          />
          <Column
            field="quantityReal"
            header="Cantidad Real"
            body={quantityBodyTemplate}
            sortable
            style={{ minWidth: "120px" }}
          />
          <Column
            field="quantityAvailable"
            header="Disponible"
            body={availableBodyTemplate}
            sortable
            style={{ minWidth: "120px" }}
          />
          <Column
            field="quantityReserved"
            header="Reservado"
            sortable
            style={{ minWidth: "100px" }}
          />
          <Column
            field="averageCost"
            header="Costo Promedio"
            body={costBodyTemplate}
            sortable
            style={{ minWidth: "130px" }}
          />
          <Column
            field="lastMovementAt"
            header="Último Mov."
            body={lastMovementBodyTemplate}
            sortable
            style={{ minWidth: "120px" }}
          />
          <Column
            body={actionBodyTemplate}
            exportable={false}
            style={{ minWidth: "100px" }}
          />
        </DataTable>
      </div>

      {/* Form Dialog */}
      <Dialog
        visible={formDialog}
        style={{ width: "600px" }}
        header={
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-chart-bar mr-3 text-primary text-3xl"></i>
                {selectedStock?.id ? "Modificar Stock" : "Crear Stock"}
              </h2>
            </div>
          </div>
        }
        modal
        className="p-fluid"
        onHide={() => setFormDialog(false)}
      >
        <StockForm
          stock={selectedStock}
          onSave={handleSave}
          onCancel={() => setFormDialog(false)}
          toast={toast}
        />
      </Dialog>

      {/* Adjust Dialog */}
      <StockAdjustDialog
        visible={adjustDialog}
        stock={selectedStock}
        onSave={handleAdjustSave}
        onCancel={() => setAdjustDialog(false)}
        toast={toast}
      />
    </motion.div>
  );
}
