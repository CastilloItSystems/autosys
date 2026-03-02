"use client";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable, DataTablePageEvent } from "primereact/datatable";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { Dropdown, DropdownChangeEvent } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Tag } from "primereact/tag";
import { ProgressSpinner } from "primereact/progressspinner";
import { motion } from "framer-motion";
import { Skeleton } from "primereact/skeleton";
import {
  getMovements,
  getMovement,
  MOVEMENT_TYPE_LABELS,
  MOVEMENT_TYPE_SEVERITY,
  Movement,
  MovementType,
} from "@/app/api/inventory/movementService";
import {
  getActiveWarehouses,
  Warehouse,
} from "@/app/api/inventory/warehouseService";
import { getActiveItems, Item } from "@/app/api/inventory/itemService";
import MovementDetailForm from "./MovementDetailForm";

const MOVEMENT_TYPES: { label: string; value: MovementType | null }[] = [
  { label: "Todos", value: null },
  { label: "Compra", value: "PURCHASE" },
  { label: "Venta", value: "SALE" },
  { label: "Ajuste Entrada", value: "ADJUSTMENT_IN" },
  { label: "Ajuste Salida", value: "ADJUSTMENT_OUT" },
  { label: "Transferencia", value: "TRANSFER" },
  { label: "Retorno a Proveedor", value: "SUPPLIER_RETURN" },
  { label: "Retorno de Taller", value: "WORKSHOP_RETURN" },
  { label: "Liberación de Reserva", value: "RESERVATION_RELEASE" },
  { label: "Préstamo Salida", value: "LOAN_OUT" },
  { label: "Préstamo Devolución", value: "LOAN_RETURN" },
];

const MovementList = () => {
  // State
  const [movements, setMovements] = useState<Movement[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  // Detail modal
  const [selectedMovement, setSelectedMovement] = useState<Movement | null>(
    null,
  );
  const [detailDialog, setDetailDialog] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalRecords, setTotalRecords] = useState(0);

  // Filters
  const [filterType, setFilterType] = useState<MovementType | null>(null);
  const [filterWarehouse, setFilterWarehouse] = useState<string | null>(null);
  const [filterItemId, setFilterItemId] = useState<string | null>(null);
  const [filterDateFrom, setFilterDateFrom] = useState<Date | null>(null);
  const [filterDateTo, setFilterDateTo] = useState<Date | null>(null);

  const toast = useRef<Toast | null>(null);

  // Fetch data on mount and when filters/pagination change
  useEffect(() => {
    fetchMovements();
  }, [
    page,
    limit,
    filterType,
    filterWarehouse,
    filterItemId,
    filterDateFrom,
    filterDateTo,
  ]);

  const fetchMovements = async () => {
    try {
      setLoading(true);
      const response = await getMovements(page, limit, {
        type: filterType || undefined,
        warehouseToId: filterWarehouse || undefined,
        warehouseFromId: filterWarehouse || undefined,
        itemId: filterItemId || undefined,
        dateFrom: filterDateFrom
          ? filterDateFrom.toISOString().split("T")[0]
          : undefined,
        dateTo: filterDateTo
          ? filterDateTo.toISOString().split("T")[0]
          : undefined,
      });

      setMovements(response.data);
      setTotalRecords(response.meta.total);
    } catch (error) {
      console.error("Error fetching movements:", error);
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

  // Fetch warehouses on mount
  useEffect(() => {
    fetchWarehouses();
    fetchItems();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const response = await getActiveWarehouses();
      setWarehouses(response.data);
    } catch (error) {
      console.error("Error fetching warehouses:", error);
    }
  };

  const fetchItems = async () => {
    try {
      const response = await getActiveItems();
      setItems(response.data);
    } catch (error) {
      console.error("Error fetching items:", error);
    }
  };

  // Handlers
  const handlePageChange = (event: DataTablePageEvent) => {
    setPage((event.first ?? 0) / (event.rows ?? 20) + 1);
    setLimit(event.rows ?? 20);
  };

  // Template functions
  const typeBodyTemplate = (rowData: Movement) => {
    const severity = MOVEMENT_TYPE_SEVERITY[rowData.type];
    const label = MOVEMENT_TYPE_LABELS[rowData.type];
    return <Tag value={label} severity={severity} />;
  };

  const itemBodyTemplate = (rowData: Movement) => {
    if (!rowData.item) return <Skeleton width="80px" />;
    return (
      <div className="flex flex-column">
        <span className="font-semibold">{rowData.item.name}</span>
        <span className="text-sm text-gray-500">{rowData.item.sku}</span>
      </div>
    );
  };

  const quantityBodyTemplate = (rowData: Movement) => {
    return (
      <span className="font-semibold">{rowData.quantity.toLocaleString()}</span>
    );
  };

  const priceBodyTemplate = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "-";
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
    }).format(value);
  };

  const warehouseBodyTemplate = (rowData: Movement, field: "from" | "to") => {
    const warehouse =
      field === "from" ? rowData.warehouseFrom : rowData.warehouseTo;
    if (!warehouse) return "-";
    return (
      <div className="flex flex-column">
        <span className="font-semibold">{warehouse.name}</span>
        <span className="text-sm text-gray-500">{warehouse.code}</span>
      </div>
    );
  };

  const dateBodyTemplate = (rowData: Movement) => {
    if (!rowData.movementDate) return "-";
    return new Date(rowData.movementDate).toLocaleDateString("es-CL", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const actionBodyTemplate = (rowData: Movement) => (
    <Button
      icon="pi pi-eye"
      rounded
      text
      severity="info"
      onClick={() => openDetail(rowData.id)}
    />
  );

  // Detail modal handlers
  const openDetail = async (id: string) => {
    setDetailLoading(true);
    setDetailDialog(true);
    try {
      const res = await getMovement(id);
      setSelectedMovement(res.data);
    } catch {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar el movimiento",
        life: 3000,
      });
      setDetailDialog(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetailDialog(false);
    setSelectedMovement(null);
  };

  const handleDetailSave = (updatedMovement: Movement) => {
    setSelectedMovement(updatedMovement);
    closeDetail();
    fetchMovements();
  };

  const renderFilters = () => (
    <div className="grid gap-3 mb-4">
      <div className="flex flex-wrap gap-3 align-items-end">
        <div className="flex-grow-1" style={{ minWidth: "200px" }}>
          <label className="block text-sm font-semibold mb-2">
            Tipo de Movimiento
          </label>
          <Dropdown
            value={filterType}
            onChange={(e: DropdownChangeEvent) => {
              setFilterType(e.value);
              setPage(1);
            }}
            options={MOVEMENT_TYPES}
            optionLabel="label"
            optionValue="value"
            placeholder="Seleccionar tipo"
            className="w-full"
          />
        </div>

        <div className="flex-grow-1" style={{ minWidth: "200px" }}>
          <label className="block text-sm font-semibold mb-2">Almacén</label>
          <Dropdown
            value={filterWarehouse}
            onChange={(e: DropdownChangeEvent) => {
              setFilterWarehouse(e.value);
              setPage(1);
            }}
            options={warehouses}
            optionLabel="name"
            optionValue="id"
            placeholder="Seleccionar almacén"
            className="w-full"
            showClear
          />
        </div>

        <div className="flex-grow-1" style={{ minWidth: "200px" }}>
          <label className="block text-sm font-semibold mb-2">Artículo</label>
          <Dropdown
            value={filterItemId}
            onChange={(e: DropdownChangeEvent) => {
              setFilterItemId(e.value);
              setPage(1);
            }}
            options={items}
            optionLabel="name"
            optionValue="id"
            placeholder="Seleccionar artículo"
            filter
            showClear
            className="w-full"
          />
        </div>

        <div className="flex-grow-1" style={{ minWidth: "180px" }}>
          <label className="block text-sm font-semibold mb-2">Desde</label>
          <Calendar
            value={filterDateFrom}
            onChange={(e) => {
              setFilterDateFrom(e.value || null);
              setPage(1);
            }}
            dateFormat="dd/mm/yy"
            showIcon
            className="w-full"
          />
        </div>

        <div className="flex-grow-1" style={{ minWidth: "180px" }}>
          <label className="block text-sm font-semibold mb-2">Hasta</label>
          <Calendar
            value={filterDateTo}
            onChange={(e) => {
              setFilterDateTo(e.value || null);
              setPage(1);
            }}
            dateFormat="dd/mm/yy"
            showIcon
            className="w-full"
          />
        </div>
      </div>
    </div>
  );

  if (loading && movements.length === 0) {
    return (
      <div
        className="flex justify-content-center align-items-center"
        style={{ height: "400px" }}
      >
        <ProgressSpinner />
      </div>
    );
  }

  return (
    <>
      <Toast ref={toast} />
      <motion.div
        initial={{
          opacity: 0,
          scale: 0.95,
          y: 40,
          filter: "blur(8px)",
        }}
        animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="card"
      >
        {renderFilters()}

        <DataTable
          value={movements}
          paginator
          lazy
          first={(page - 1) * limit}
          rows={limit}
          totalRecords={totalRecords}
          onPage={handlePageChange}
          loading={loading}
          responsiveLayout="scroll"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} movimientos"
          rowsPerPageOptions={[10, 20, 50]}
          emptyMessage="No hay movimientos disponibles"
          size="small"
          rowClassName={() => "animated-row"}
        >
          <Column
            field="movementNumber"
            header="# Movimiento"
            sortable
            style={{ width: "100px" }}
          />
          <Column
            header="Tipo"
            body={typeBodyTemplate}
            style={{ width: "120px" }}
          />
          <Column
            header="Artículo"
            body={itemBodyTemplate}
            style={{ width: "150px" }}
          />
          <Column
            field="quantity"
            header="Cantidad"
            body={quantityBodyTemplate}
            sortable
            style={{ width: "100px" }}
          />
          <Column
            field="unitCost"
            header="Costo Unit."
            body={(rowData) => priceBodyTemplate(rowData.unitCost)}
            sortable
            style={{ width: "120px" }}
          />
          <Column
            field="totalCost"
            header="Costo Total"
            body={(rowData) => priceBodyTemplate(rowData.totalCost)}
            sortable
            style={{ width: "120px" }}
          />
          <Column
            header="Almacén Origen"
            body={(rowData) => warehouseBodyTemplate(rowData, "from")}
            style={{ width: "130px" }}
          />
          <Column
            header="Almacén Destino"
            body={(rowData) => warehouseBodyTemplate(rowData, "to")}
            style={{ width: "130px" }}
          />
          <Column
            field="reference"
            header="Referencia"
            sortable
            style={{ width: "120px" }}
          />
          <Column
            field="movementDate"
            header="Fecha"
            body={dateBodyTemplate}
            sortable
            style={{ width: "100px" }}
          />
          <Column
            field="notes"
            header="Notas"
            body={(rowData) => (
              <span className="text-truncate" title={rowData.notes}>
                {rowData.notes || "-"}
              </span>
            )}
            style={{ width: "150px" }}
          />
          <Column
            body={actionBodyTemplate}
            style={{ width: "60px" }}
            exportable={false}
            frozen
            alignFrozen="right"
          />
        </DataTable>

        {/* ── Detail Modal ──────────────────────────────────── */}
        <Dialog
          visible={detailDialog}
          style={{ width: "720px" }}
          header={
            selectedMovement ? (
              <div className="flex align-items-center gap-2">
                <span>Movimiento #{selectedMovement.movementNumber}</span>
                <Tag
                  value={MOVEMENT_TYPE_LABELS[selectedMovement.type]}
                  severity={MOVEMENT_TYPE_SEVERITY[selectedMovement.type]}
                  className="text-xs"
                />
              </div>
            ) : (
              "Detalle de Movimiento"
            )
          }
          modal
          onHide={closeDetail}
        >
          <MovementDetailForm
            movement={selectedMovement}
            isLoading={detailLoading}
            onCancel={closeDetail}
            onSave={handleDetailSave}
            toast={toast}
          />
        </Dialog>
      </motion.div>
    </>
  );
};

export default MovementList;
