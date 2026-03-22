"use client";

import { useState, useRef, useEffect } from "react";
import { Card } from "primereact/card";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { AutoComplete, AutoCompleteCompleteEvent } from "primereact/autocomplete";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
import { Skeleton } from "primereact/skeleton";
import { Divider } from "primereact/divider";
import reportService, { KardexEntry } from "@/app/api/inventory/reportService";
import itemService, { Item } from "@/app/api/inventory/itemService";
import warehouseService from "@/app/api/inventory/warehouseService";

const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  PURCHASE: "Compra",
  SALE: "Venta",
  ADJUSTMENT_IN: "Ajuste Entrada",
  ADJUSTMENT_OUT: "Ajuste Salida",
  TRANSFER: "Transferencia",
  SUPPLIER_RETURN: "Dev. Proveedor",
  WORKSHOP_RETURN: "Dev. Taller",
  RESERVATION_RELEASE: "Lib. Reserva",
  LOAN_OUT: "Préstamo Salida",
  LOAN_RETURN: "Préstamo Retorno",
};

const IN_TYPES = new Set(["PURCHASE", "ADJUSTMENT_IN", "LOAN_RETURN", "WORKSHOP_RETURN", "RESERVATION_RELEASE"]);

const KardexReport = () => {
  const toast = useRef<Toast>(null);

  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [itemSuggestions, setItemSuggestions] = useState<Item[]>([]);
  const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);

  const [entries, setEntries] = useState<KardexEntry[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState(50);

  useEffect(() => {
    loadWarehouses();
  }, []);

  useEffect(() => {
    if (selectedItem?.id) {
      loadKardex();
    }
  }, [selectedItem, selectedWarehouse, dateFrom, dateTo, page, rows]);

  const loadWarehouses = async () => {
    try {
      const res = await warehouseService.getActive();
      setWarehouses((res.data ?? []).map((w: any) => ({ id: w.id, name: w.name })));
    } catch {
      // non-critical
    }
  };

  const searchItems = async (event: AutoCompleteCompleteEvent) => {
    try {
      const res = await itemService.search(event.query);
      setItemSuggestions((res.data ?? []) as Item[]);
    } catch {
      setItemSuggestions([]);
    }
  };

  const loadKardex = async () => {
    if (!selectedItem) return;
    setLoading(true);
    try {
      const result = await reportService.getKardex({
        itemId: selectedItem.id,
        warehouseId: selectedWarehouse ?? undefined,
        dateFrom: dateFrom ? dateFrom.toISOString().split("T")[0] : undefined,
        dateTo: dateTo ? dateTo.toISOString().split("T")[0] : undefined,
        page,
        limit: rows,
      });
      setEntries(result.data);
      setMeta(result.meta);
    } catch (error: any) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error?.message ?? "No se pudo cargar el Kardex",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const typeSeverity = (type: string) => {
    if (IN_TYPES.has(type)) return "success";
    if (type.includes("OUT") || type === "SALE" || type.includes("ADJUSTMENT_OUT")) return "danger";
    return "info";
  };

  const quantityBody = (row: KardexEntry, field: "quantityIn" | "quantityOut") => {
    const val = row[field];
    if (val === 0) return <span className="text-300">—</span>;
    const color = field === "quantityIn" ? "#22C55E" : "#EF4444";
    return <span className="font-semibold" style={{ color }}>{val.toLocaleString()}</span>;
  };

  const balanceBody = (row: KardexEntry) => {
    const color = row.balance > 0 ? "#3B82F6" : "#EF4444";
    return <span className="font-bold" style={{ color }}>{row.balance.toLocaleString()}</span>;
  };

  const costBody = (val: number) =>
    val ? `$${Number(val).toLocaleString("es-VE", { minimumFractionDigits: 2 })}` : "—";

  return (
    <>
      <Toast ref={toast} />

      {/* Selector panel */}
      <Card title="Kardex de Inventario" className="mb-4">
        <div className="flex flex-wrap gap-3 align-items-end">
          <div className="flex flex-column gap-1" style={{ minWidth: 280 }}>
            <label className="text-sm font-medium">Artículo *</label>
            <AutoComplete
              value={searchQuery}
              suggestions={itemSuggestions}
              completeMethod={searchItems}
              field="name"
              placeholder="Buscar artículo..."
              onSelect={(e) => {
                setSelectedItem(e.value as Item);
                setSearchQuery(e.value.name);
                setPage(1);
              }}
              onChange={(e) => setSearchQuery(e.value)}
              itemTemplate={(item: Item) => (
                <div>
                  <p className="font-medium m-0">{item.name}</p>
                  <p className="text-sm text-500 m-0">
                    {item.sku ?? "—"} {item.code ? `/ ${item.code}` : ""}
                  </p>
                </div>
              )}
              style={{ width: "100%" }}
            />
          </div>

          <div className="flex flex-column gap-1">
            <label className="text-sm font-medium">Almacén</label>
            <Dropdown
              value={selectedWarehouse}
              options={[
                { label: "Todos los almacenes", value: null },
                ...warehouses.map((w) => ({ label: w.name, value: w.id })),
              ]}
              onChange={(e) => { setSelectedWarehouse(e.value); setPage(1); }}
              placeholder="Todos"
              style={{ minWidth: 200 }}
            />
          </div>

          <div className="flex flex-column gap-1">
            <label className="text-sm font-medium">Desde</label>
            <Calendar
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.value as Date | null); setPage(1); }}
              dateFormat="dd/mm/yy"
              showIcon
              placeholder="Fecha inicio"
            />
          </div>

          <div className="flex flex-column gap-1">
            <label className="text-sm font-medium">Hasta</label>
            <Calendar
              value={dateTo}
              onChange={(e) => { setDateTo(e.value as Date | null); setPage(1); }}
              dateFormat="dd/mm/yy"
              showIcon
              placeholder="Fecha fin"
            />
          </div>

          <Button
            icon="pi pi-times"
            label="Limpiar"
            severity="secondary"
            outlined
            onClick={() => {
              setSelectedItem(null);
              setSearchQuery("");
              setSelectedWarehouse(null);
              setDateFrom(null);
              setDateTo(null);
              setEntries([]);
              setMeta(null);
            }}
          />
        </div>

        {/* Item + summary info */}
        {meta && (
          <>
            <Divider />
            <div className="flex flex-wrap gap-4 align-items-center">
              <div>
                <p className="text-500 text-xs m-0">Artículo</p>
                <p className="font-bold m-0">{meta.itemName}</p>
                <p className="text-500 text-sm m-0">{meta.itemSKU}</p>
              </div>
              {meta.warehouseName && (
                <div>
                  <p className="text-500 text-xs m-0">Almacén</p>
                  <p className="font-semibold m-0">{meta.warehouseName}</p>
                </div>
              )}
              <div>
                <p className="text-500 text-xs m-0">Total Movimientos</p>
                <p className="font-bold text-xl m-0 text-blue-500">{meta.total}</p>
              </div>
              <div>
                <p className="text-500 text-xs m-0">Balance Cierre</p>
                <p
                  className="font-bold text-xl m-0"
                  style={{ color: meta.closingBalance >= 0 ? "#22C55E" : "#EF4444" }}
                >
                  {meta.closingBalance}
                </p>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Kardex table */}
      {selectedItem ? (
        <Card>
          {loading && entries.length === 0 ? (
            <Skeleton height="300px" />
          ) : (
            <DataTable
              value={entries}
              loading={loading}
              paginator
              rows={rows}
              rowsPerPageOptions={[20, 50, 100]}
              totalRecords={meta?.total ?? 0}
              lazy
              first={(page - 1) * rows}
              onPage={(e) => {
                setPage((e.page ?? 0) + 1);
                setRows(e.rows ?? 50);
              }}
              stripedRows
              size="small"
              scrollable
              emptyMessage="No hay movimientos para el artículo seleccionado"
            >
              <Column
                field="date"
                header="Fecha"
                body={(row) => new Date(row.date).toLocaleDateString("es-VE")}
                style={{ width: "10%" }}
                sortable
              />
              <Column
                field="movementNumber"
                header="Nro."
                style={{ width: "12%" }}
              />
              <Column
                field="type"
                header="Tipo"
                style={{ width: "13%" }}
                body={(row) => (
                  <Tag
                    value={MOVEMENT_TYPE_LABELS[row.type] ?? row.type}
                    severity={typeSeverity(row.type)}
                  />
                )}
              />
              <Column field="reference" header="Referencia" style={{ width: "12%" }} />
              <Column
                field="warehouseName"
                header="Almacén"
                style={{ width: "13%" }}
              />
              <Column
                field="quantityIn"
                header="Entrada"
                style={{ width: "8%" }}
                body={(row) => quantityBody(row, "quantityIn")}
              />
              <Column
                field="quantityOut"
                header="Salida"
                style={{ width: "8%" }}
                body={(row) => quantityBody(row, "quantityOut")}
              />
              <Column
                field="balance"
                header="Saldo"
                style={{ width: "8%" }}
                body={balanceBody}
              />
              <Column
                field="unitCost"
                header="Costo Unit."
                style={{ width: "10%" }}
                body={(row) => costBody(row.unitCost)}
              />
              <Column
                field="totalCost"
                header="Costo Total"
                style={{ width: "10%" }}
                body={(row) => costBody(row.totalCost)}
              />
            </DataTable>
          )}
        </Card>
      ) : (
        <Card>
          <div className="flex flex-column align-items-center justify-content-center py-6 text-500 gap-2">
            <i className="pi pi-search text-4xl" />
            <p className="text-lg m-0">Selecciona un artículo para ver su Kardex</p>
            <p className="text-sm m-0">
              El Kardex muestra el historial cronológico de movimientos con saldo acumulado
            </p>
          </div>
        </Card>
      )}
    </>
  );
};

export default KardexReport;
