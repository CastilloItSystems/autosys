"use client";
import React, { useEffect, useRef, useState } from "react";
import { FilterMatchMode } from "primereact/api";
import { Column } from "primereact/column";
import { DataTable, DataTableFilterMeta } from "primereact/datatable";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Divider } from "primereact/divider";
import { ProgressSpinner } from "primereact/progressspinner";
import { Menu } from "primereact/menu";
import { MenuItem } from "primereact/menuitem";
import { motion } from "framer-motion";
import { handleFormError } from "@/utils/errorHandlers";
import entryNoteService from "@/app/api/inventory/entryNoteService";
import type {
  EntryNote,
  EntryNoteItem,
  EntryNoteStatus,
  EntryType,
} from "@/libs/interfaces/inventory/entryNote.interface";
import {
  ENTRY_NOTE_STATUS_CONFIG,
  ENTRY_TYPE_LABELS,
} from "@/libs/interfaces/inventory/entryNote.interface";
import itemService, { Item } from "@/app/api/inventory/itemService";
import warehouseService, {
  Warehouse,
} from "@/app/api/inventory/warehouseService";
import supplierService, { Supplier } from "@/app/api/inventory/supplierService";
import EntryNoteForm from "./EntryNoteForm";
import FormActionButtons from "@/components/common/FormActionButtons";
import EntryNoteStepper from "./EntryNoteStepper";
import CreateButton from "@/components/common/CreateButton";
import {
  confirmAction,
  ConfirmActionPopup,
} from "@/components/common/ConfirmAction";

const EntryNoteList = () => {
  const [entryNotes, setEntryNotes] = useState<EntryNote[]>([]);
  const [selectedEntryNote, setSelectedEntryNote] = useState<EntryNote | null>(
    null,
  );
  const [filters, setFilters] = useState<DataTableFilterMeta>({});
  const [loading, setLoading] = useState(true);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [page, setPage] = useState<number>(0);
  const [rows, setRows] = useState<number>(10);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [sortField, setSortField] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [completeDialog, setCompleteDialog] = useState(false);
  const [detailDialog, setDetailDialog] = useState(false);
  const [formDialog, setFormDialog] = useState(false);
  const [expandedRows, setExpandedRows] = useState<any>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionEntryNote, setActionEntryNote] = useState<EntryNote | null>(
    null,
  );
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const dt = useRef(null);
  const toast = useRef<Toast | null>(null);
  const menuRef = useRef<Menu>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(globalFilterValue);
    }, 500);
    return () => clearTimeout(handler);
  }, [globalFilterValue]);

  useEffect(() => {
    loadEntryNotes();
  }, [page, rows, sortField, sortOrder, debouncedSearch]);

  useEffect(() => {
    loadFormData();
  }, []);

  const loadFormData = async () => {
    try {
      const [whRes, itemRes, supRes] = await Promise.all([
        warehouseService.getActive(),
        itemService.getActive(),
        supplierService.getActive(),
      ]);
      setWarehouses(whRes.data || []);
      setItems(itemRes.data || []);
      setSuppliers(supRes.data || []);
    } catch (error) {
      console.error("Error loading form data:", error);
    }
  };

  const loadEntryNotes = async () => {
    try {
      setLoading(true);
      const res = await entryNoteService.getAll({
        page: page + 1,
        limit: rows,
        sortBy: sortField,
        sortOrder: sortOrder,
        search: debouncedSearch || undefined,
      });
      setEntryNotes(Array.isArray(res.data) ? res.data : []);
      setTotalRecords(res.meta?.total || 0);
    } catch (error) {
      console.error("Error al obtener notas de entrada:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar las notas de entrada",
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

  const onSort = (event: any) => {
    setSortField(event.sortField);
    setSortOrder(event.sortOrder === 1 ? "asc" : "desc");
  };

  const hideDeleteDialog = () => {
    setSelectedEntryNote(null);
    setDeleteDialog(false);
  };
  const openNew = () => {
    setSelectedEntryNote(null);
    setFormDialog(true);
  };

  const handleDelete = async () => {
    try {
      if (selectedEntryNote?.id) {
        await entryNoteService.delete(selectedEntryNote.id);
        await loadEntryNotes();
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Nota de entrada eliminada",
          life: 3000,
        });
      }
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      hideDeleteDialog();
    }
  };

  const handleStart = async (note: EntryNote) => {
    try {
      await entryNoteService.start(note.id);
      await loadEntryNotes();
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: `Nota ${note.entryNoteNumber} en proceso`,
        life: 3000,
      });
    } catch (error) {
      handleFormError(error, toast);
    }
  };

  const handleComplete = async (note: EntryNote) => {
    try {
      await entryNoteService.complete(note.id);
      await loadEntryNotes();
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: `Nota ${note.entryNoteNumber} completada — Stock actualizado`,
        life: 4000,
      });
    } catch (error) {
      handleFormError(error, toast);
    }
  };

  const handleCancel = async (note: EntryNote) => {
    try {
      await entryNoteService.cancel(note.id);
      await loadEntryNotes();
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: `Nota ${note.entryNoteNumber} cancelada`,
        life: 3000,
      });
    } catch (error) {
      handleFormError(error, toast);
    }
  };

  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setGlobalFilterValue(value);
    setPage(0); // Reset page on search
  };

  /* ── Helpers ── */
  const formatCurrency = (value: number | string) =>
    `$${Number(value || 0).toLocaleString("es-VE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("es-VE", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  /* ── Table header ── */
  const renderHeader = () => (
    <div className="flex flex-wrap gap-3 align-items-center justify-content-between">
      <div className="flex align-items-center gap-2">
        <h4 className="m-0 font-bold text-900">Notas de Entrada</h4>
        <span className="text-600 text-sm">({totalRecords} total)</span>
      </div>
      <div className="flex flex-wrap gap-2 align-items-center w-full sm:w-auto">
        <span className="p-input-icon-left w-full sm:w-20rem">
          <i className="pi pi-search" />
          <InputText
            value={globalFilterValue}
            onChange={onGlobalFilterChange}
            placeholder="Buscar nota (nro, tipo, proveedor...)"
            className="w-full"
          />
        </span>
        <CreateButton
          label="Nueva Nota"
          onClick={openNew}
          tooltip="Crear nueva nota de entrada"
          className="w-full sm:w-auto"
        />
      </div>
    </div>
  );

  /* ── Column templates ── */

  /* Status-transition actions: Iniciar / Completar / Cancelar / Ver */
  const actionBodyTemplate = (rowData: EntryNote) => {
    const { status } = rowData;
    return (
      <div className="flex gap-1 flex-nowrap">
        {status === "PENDING" && (
          <Button
            icon="pi pi-play"
            className="p-button-rounded p-button-info p-button-sm"
            tooltip="Iniciar Proceso"
            tooltipOptions={{ position: "top" }}
            onClick={(e) =>
              confirmAction({
                target: e.currentTarget as EventTarget & HTMLElement,
                message: `¿Iniciar el proceso de la nota ${rowData.entryNoteNumber}?`,
                icon: "pi pi-play",
                iconClass: "text-blue-500",
                acceptLabel: "Iniciar",
                acceptSeverity: "info",
                onAccept: () => handleStart(rowData),
              })
            }
          />
        )}
        {status === "IN_PROGRESS" && (
          <>
            <Button
              icon="pi pi-check"
              className="p-button-rounded p-button-success p-button-sm"
              tooltip="Completar"
              tooltipOptions={{ position: "top" }}
              onClick={() => {
                setSelectedEntryNote(rowData);
                setCompleteDialog(true);
              }}
            />
            <Button
              icon="pi pi-times"
              className="p-button-rounded p-button-danger p-button-sm"
              tooltip="Cancelar"
              tooltipOptions={{ position: "top" }}
              onClick={(e) =>
                confirmAction({
                  target: e.currentTarget as EventTarget & HTMLElement,
                  message: `¿Cancelar la nota ${rowData.entryNoteNumber}? Esta acción no se puede deshacer.`,
                  icon: "pi pi-ban",
                  iconClass: "text-red-500",
                  acceptLabel: "Sí, Cancelar",
                  acceptSeverity: "danger",
                  onAccept: () => handleCancel(rowData),
                })
              }
            />
          </>
        )}
        {(status === "COMPLETED" || status === "CANCELLED") && (
          <Button
            icon="pi pi-eye"
            className="p-button-rounded p-button-secondary p-button-sm"
            tooltip="Ver detalle"
            tooltipOptions={{ position: "top" }}
            onClick={() => {
              setSelectedEntryNote(rowData);
              setDetailDialog(true);
            }}
          />
        )}
      </div>
    );
  };

  /* CRUD actions (Edit / Delete) — cog menu, solo disponible cuando PENDING */
  const getMenuItems = (note: EntryNote | null): MenuItem[] => {
    if (!note || note.status !== "PENDING") return [];
    return [
      {
        label: "Editar",
        icon: "pi pi-pencil",
        command: () => {
          setSelectedEntryNote(note);
          setFormDialog(true);
        },
      },
      { separator: true },
      {
        label: "Eliminar",
        icon: "pi pi-trash",
        className: "p-menuitem-danger",
        command: () => {
          setSelectedEntryNote(note);
          setDeleteDialog(true);
        },
      },
    ];
  };

  const crudBodyTemplate = (rowData: EntryNote) => {
    if (rowData.status !== "PENDING") return null;
    return (
      <Button
        icon="pi pi-cog"
        rounded
        text
        onClick={(e) => {
          setActionEntryNote(rowData);
          menuRef.current?.toggle(e);
        }}
        aria-controls="entry-note-menu"
        aria-haspopup
      />
    );
  };

  const statusBodyTemplate = (rowData: EntryNote) => {
    const cfg = ENTRY_NOTE_STATUS_CONFIG[rowData.status];
    return (
      <Tag
        value={cfg.label}
        severity={cfg.severity}
        icon={cfg.icon}
        className="text-xs"
      />
    );
  };

  const typeBodyTemplate = (rowData: EntryNote) => (
    <span className="text-sm">
      {ENTRY_TYPE_LABELS[rowData.type] || rowData.type}
    </span>
  );

  const dateBodyTemplate = (rowData: EntryNote) =>
    formatDate(rowData.createdAt);

  const itemsCountBodyTemplate = (rowData: EntryNote) => {
    const count = rowData.items?.length || 0;
    return (
      <Tag
        value={`${count} ${count === 1 ? "artículo" : "artículos"}`}
        severity={count > 0 ? "info" : "warning"}
        className="text-xs"
      />
    );
  };

  const supplierBodyTemplate = (rowData: EntryNote) =>
    rowData.supplierName ||
    rowData.catalogSupplier?.name ||
    rowData.purchaseOrder?.supplier?.name ||
    "—";

  const warehouseBodyTemplate = (rowData: EntryNote) =>
    rowData.warehouse?.name || "—";

  const receivedByBodyTemplate = (rowData: EntryNote) =>
    rowData.receivedByName || rowData.receivedBy || "—";

  const totalBodyTemplate = (rowData: EntryNote) => {
    const total = (rowData.items || []).reduce(
      (sum, it) => sum + Number(it.unitCost || 0) * (it.quantityReceived || 0),
      0,
    );
    return <span className="font-semibold">{formatCurrency(total)}</span>;
  };

  /* ── Row expansion with stepper ── */
  const rowExpansionTemplate = (data: EntryNote) => {
    const items = data.items || [];
    console.log(items);
    const total = items.reduce(
      (sum, it) => sum + Number(it.unitCost || 0) * (it.quantityReceived || 0),
      0,
    );

    return (
      <div className="p-3">
        <EntryNoteStepper currentStatus={data.status} />
        {items.length > 0 && (
          <div className="mt-3">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-bottom-1 surface-border">
                  <th className="text-left py-2">SKU</th>
                  <th className="text-left py-2">Artículo</th>
                  <th className="text-center py-2">Cantidad</th>
                  <th className="text-right py-2">Costo Unit.</th>
                  <th className="text-right py-2">Subtotal</th>
                  <th className="text-center py-2">Ubicación</th>
                  <th className="text-center py-2">Lote</th>
                </tr>
              </thead>
              <tbody>
                {items.map((line) => (
                  <tr key={line.id} className="border-bottom-1 surface-border">
                    <td className="py-2">
                      {line.item ? `${line.item.sku} ` : line.itemId}
                    </td>
                    <td className="py-2">
                      {line.itemName ||
                        (line.item
                          ? `${line.item.sku} — ${line.item.name}`
                          : line.itemId)}
                    </td>
                    <td className="text-center py-2 font-semibold">
                      {line.quantityReceived}
                    </td>
                    <td className="text-right py-2">
                      {formatCurrency(line.unitCost)}
                    </td>
                    <td className="text-right py-2">
                      {formatCurrency(
                        Number(line.unitCost || 0) *
                          (line.quantityReceived || 0),
                      )}
                    </td>
                    <td className="text-center py-2">
                      {line.storedToLocation || "—"}
                    </td>
                    <td className="text-center py-2">
                      {line.batchNumber || line.batch?.batchNumber || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-top-2 surface-border">
                  <td colSpan={3} className="text-right py-2 font-bold">
                    Total:
                  </td>
                  <td className="text-right py-2 font-bold text-primary">
                    {formatCurrency(total)}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
        {items.length === 0 && (
          <div className="text-center text-500 p-3 mt-2">
            <i className="pi pi-inbox mr-2" />
            No hay artículos en esta nota
          </div>
        )}
      </div>
    );
  };

  /* ── Delete dialog footer ── */
  const deleteDialogFooter = (
    <>
      <Button label="No" icon="pi pi-times" text onClick={hideDeleteDialog} />
      <Button label="Sí" icon="pi pi-check" text onClick={handleDelete} />
    </>
  );

  /* ── Detail dialog content ── */
  const renderDetailContent = () => {
    if (!selectedEntryNote) return null;
    const items = selectedEntryNote.items || [];
    const total = items.reduce(
      (sum, it) => sum + Number(it.unitCost || 0) * (it.quantityReceived || 0),
      0,
    );
    const statusCfg = ENTRY_NOTE_STATUS_CONFIG[selectedEntryNote.status];

    return (
      <div className="flex flex-column gap-3">
        {/* ── Header info cards ── */}
        <div className="grid">
          <div className="col-12 md:col-6 lg:col-3">
            <div className="surface-100 border-round p-3 h-full">
              <div className="flex align-items-center gap-2 mb-2">
                <i className="pi pi-tag text-primary text-lg" />
                <span className="text-500 text-sm font-medium">Tipo</span>
              </div>
              <div className="font-bold text-900 text-lg">
                {ENTRY_TYPE_LABELS[selectedEntryNote.type]}
              </div>
              <div className="mt-1">
                <Tag
                  value={statusCfg.label}
                  severity={statusCfg.severity}
                  icon={statusCfg.icon}
                />
              </div>
            </div>
          </div>

          <div className="col-12 md:col-6 lg:col-3">
            <div className="surface-100 border-round p-3 h-full">
              <div className="flex align-items-center gap-2 mb-2">
                <i className="pi pi-building text-orange-500 text-lg" />
                <span className="text-500 text-sm font-medium">
                  Proveedor / Origen
                </span>
              </div>
              <div className="font-bold text-900 text-lg">
                {selectedEntryNote.purchaseOrder?.supplier?.name ||
                  selectedEntryNote.supplierName ||
                  "—"}
              </div>
              {selectedEntryNote.purchaseOrder?.orderNumber && (
                <div className="text-500 text-sm mt-1">
                  <i className="pi pi-shopping-cart text-xs mr-1" />
                  OC: {selectedEntryNote.purchaseOrder.orderNumber}
                </div>
              )}
            </div>
          </div>

          <div className="col-12 md:col-6 lg:col-3">
            <div className="surface-100 border-round p-3 h-full">
              <div className="flex align-items-center gap-2 mb-2">
                <i className="pi pi-box text-green-500 text-lg" />
                <span className="text-500 text-sm font-medium">Almacén</span>
              </div>
              <div className="font-bold text-900 text-lg">
                {selectedEntryNote.warehouse?.name || "—"}
              </div>
              {selectedEntryNote.warehouse?.code && (
                <div className="text-500 text-sm mt-1">
                  Código: {selectedEntryNote.warehouse.code}
                </div>
              )}
            </div>
          </div>

          <div className="col-12 md:col-6 lg:col-3">
            <div className="surface-100 border-round p-3 h-full">
              <div className="flex align-items-center gap-2 mb-2">
                <i className="pi pi-dollar text-purple-500 text-lg" />
                <span className="text-500 text-sm font-medium">
                  Total Recepción
                </span>
              </div>
              <div className="font-bold text-primary text-xl">
                {formatCurrency(total)}
              </div>
              <div className="text-500 text-sm mt-1">
                {items.length} {items.length === 1 ? "artículo" : "artículos"}
              </div>
            </div>
          </div>
        </div>

        {/* ── Additional info ── */}
        <div className="grid">
          <div className="col-12 md:col-6">
            <div className="surface-100 border-round p-3">
              <div className="flex align-items-center gap-2 mb-2">
                <i className="pi pi-user text-500" />
                <span className="text-500 text-sm font-medium">
                  Recibido Por
                </span>
              </div>
              <div className="text-900">
                {selectedEntryNote.receivedByName ||
                  selectedEntryNote.receivedBy ||
                  "—"}
              </div>
              <div className="text-500 text-sm mt-1">
                {formatDate(selectedEntryNote.receivedAt)}
              </div>
            </div>
          </div>
          {selectedEntryNote.reference && (
            <div className="col-12 md:col-6">
              <div className="surface-100 border-round p-3">
                <div className="flex align-items-center gap-2 mb-2">
                  <i className="pi pi-link text-500" />
                  <span className="text-500 text-sm font-medium">
                    Referencia
                  </span>
                </div>
                <div className="text-900">{selectedEntryNote.reference}</div>
              </div>
            </div>
          )}
        </div>

        {/* ── Notes ── */}
        {selectedEntryNote.notes && (
          <div className="surface-100 border-round p-3">
            <div className="flex align-items-center gap-2 mb-2">
              <i className="pi pi-comment text-500" />
              <span className="text-500 text-sm font-medium">Notas</span>
            </div>
            <div className="text-900">{selectedEntryNote.notes}</div>
          </div>
        )}

        {selectedEntryNote.reason && (
          <div className="surface-100 border-round p-3">
            <div className="flex align-items-center gap-2 mb-2">
              <i className="pi pi-info-circle text-500" />
              <span className="text-500 text-sm font-medium">Razón</span>
            </div>
            <div className="text-900">{selectedEntryNote.reason}</div>
          </div>
        )}

        {/* ── Items table ── */}
        <Divider align="left">
          <span className="text-500 font-medium text-sm">
            <i className="pi pi-list mr-2" />
            Artículos Recibidos
          </span>
        </Divider>

        {items.length > 0 ? (
          <DataTable
            value={items}
            size="small"
            stripedRows
            showGridlines={false}
            emptyMessage="No hay artículos"
            className="border-round"
            dataKey="id"
          >
            <Column
              header="#"
              body={(_: EntryNoteItem, opts: { rowIndex: number }) =>
                opts.rowIndex + 1
              }
              style={{ width: "3rem" }}
              className="text-center"
            />
            <Column
              header="Artículo"
              body={(item: EntryNoteItem) => (
                <div className="flex flex-column">
                  <span className="font-semibold text-900">
                    {item.itemName || item.item?.name || "Artículo desconocido"}
                  </span>
                  {item.item?.sku && (
                    <span className="text-500 text-xs">
                      SKU: {item.item.sku}
                    </span>
                  )}
                </div>
              )}
            />
            <Column
              header="Cantidad"
              className="text-center"
              style={{ width: "8rem" }}
              body={(item: EntryNoteItem) => (
                <Tag
                  value={item.quantityReceived.toString()}
                  severity="success"
                  className="text-sm"
                />
              )}
            />
            <Column
              header="Costo Unit."
              className="text-right"
              style={{ width: "9rem" }}
              body={(item: EntryNoteItem) => formatCurrency(item.unitCost)}
            />
            <Column
              header="Subtotal"
              className="text-right font-semibold"
              style={{ width: "9rem" }}
              body={(item: EntryNoteItem) =>
                formatCurrency(
                  Number(item.unitCost || 0) * (item.quantityReceived || 0),
                )
              }
            />
            <Column
              header="Ubicación"
              className="text-center"
              style={{ width: "8rem" }}
              body={(item: EntryNoteItem) =>
                item.storedToLocation ? (
                  <Tag
                    value={item.storedToLocation}
                    severity="info"
                    className="text-xs"
                  />
                ) : (
                  <span className="text-400">—</span>
                )
              }
            />
            <Column
              header="Lote"
              className="text-center"
              style={{ width: "8rem" }}
              body={(item: EntryNoteItem) =>
                item.batchNumber || item.batch?.batchNumber ? (
                  <Tag
                    value={item.batchNumber || item.batch?.batchNumber || ""}
                    severity="info"
                    className="text-xs"
                  />
                ) : (
                  <span className="text-400">—</span>
                )
              }
            />
            <Column
              header="Vencimiento"
              className="text-center"
              style={{ width: "9rem" }}
              body={(item: EntryNoteItem) =>
                item.expiryDate
                  ? new Date(item.expiryDate).toLocaleDateString("es-VE")
                  : "—"
              }
            />
          </DataTable>
        ) : (
          <div className="text-center text-500 p-4">
            <i
              className="pi pi-inbox text-4xl mb-3"
              style={{ display: "block" }}
            />
            No hay artículos en esta nota de entrada
          </div>
        )}

        {/* ── Footer total ── */}
        {items.length > 0 && (
          <div className="flex justify-content-end">
            <div className="surface-100 border-round px-4 py-2">
              <span className="text-500 mr-3">Total:</span>
              <span className="font-bold text-primary text-xl">
                {formatCurrency(total)}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (detailDialog) {
    // No-op to avoid showing spinner when dialog is open but it's not the case
  }

  return (
    <>
      <Toast ref={toast} />
      <ConfirmActionPopup />
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
        <DataTable
          ref={dt}
          value={entryNotes}
          header={renderHeader()}
          paginator
          lazy
          first={page * rows}
          rows={rows}
          totalRecords={totalRecords}
          onPage={onPageChange}
          onSort={onSort}
          sortField={sortField}
          sortOrder={sortOrder === "asc" ? 1 : -1}
          responsiveLayout="scroll"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} notas de entrada"
          rowsPerPageOptions={[10, 25, 50]}
          loading={loading}
          emptyMessage="No hay notas de entrada disponibles"
          rowClassName={() => "animated-row"}
          size="small"
          dataKey="id"
          stripedRows
          expandedRows={expandedRows}
          onRowToggle={(e) => setExpandedRows(e.data)}
          rowExpansionTemplate={rowExpansionTemplate}
          scrollable
          tableStyle={{ minWidth: "75rem" }}
        >
          <Column expander style={{ width: "3rem" }} />
          <Column
            header="Proceso"
            body={actionBodyTemplate}
            style={{ width: "7rem", textAlign: "center" }}
            headerStyle={{ textAlign: "center" }}
          />

          <Column field="entryNoteNumber" header="Nro. Nota Entrada" sortable />
          <Column
            header="Tipo"
            body={typeBodyTemplate}
            sortable
            sortField="type"
          />
          <Column
            header="Estado"
            body={statusBodyTemplate}
            sortable
            sortField="status"
          />
          <Column
            header="Orden de Compra"
            sortable
            sortField="purchaseOrder.orderNumber"
            body={(rowData: EntryNote) =>
              rowData.purchaseOrder?.orderNumber || "—"
            }
          />
          <Column header="Proveedor" body={supplierBodyTemplate} />
          <Column header="Almacén" body={warehouseBodyTemplate} />
          <Column
            header="Fecha"
            body={dateBodyTemplate}
            sortable
            sortField="createdAt"
          />
          <Column
            header="Artículos"
            body={itemsCountBodyTemplate}
            style={{ width: "8rem" }}
            className="text-center"
          />
          <Column
            header="Total"
            body={totalBodyTemplate}
            style={{ width: "9rem" }}
            className="text-right"
          />
          <Column header="Recibido Por" body={receivedByBodyTemplate} />
          <Column
            header="Acciones"
            body={crudBodyTemplate}
            exportable={false}
            frozen
            alignFrozen="right"
            style={{ width: "5rem", textAlign: "center" }}
            headerStyle={{ textAlign: "center" }}
          />
        </DataTable>

        {/* Complete confirmation dialog */}
        <Dialog
          visible={completeDialog}
          style={{ width: "680px" }}
          header={
            <div className="mb-2 text-center md:text-left">
              <div className="border-bottom-2 border-primary pb-2">
                <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                  <i className="pi pi-check-circle mr-3 text-green-500 text-3xl"></i>
                  Confirmar Recepción
                </h2>
              </div>
            </div>
          }
          modal
          maximizable
          onHide={() => {
            setCompleteDialog(false);
            setSelectedEntryNote(null);
          }}
          footer={
            <div className="flex w-full gap-2 mb-4">
              <Button
                label="Cancelar"
                icon="pi pi-times"
                severity="secondary"
                type="button"
                className="flex-1"
                onClick={() => {
                  setCompleteDialog(false);
                  setSelectedEntryNote(null);
                }}
              />
              <Button
                label="Completar Recepción"
                icon="pi pi-check"
                severity="success"
                type="button"
                className="flex-1"
                onClick={async () => {
                  if (selectedEntryNote) {
                    setCompleteDialog(false);
                    await handleComplete(selectedEntryNote);
                    setSelectedEntryNote(null);
                  }
                }}
              />
            </div>
          }
        >
          {selectedEntryNote &&
            (() => {
              const noteItems = selectedEntryNote.items || [];
              const total = noteItems.reduce(
                (sum, it) =>
                  sum + Number(it.unitCost || 0) * (it.quantityReceived || 0),
                0,
              );
              return (
                <div className="flex flex-column gap-3">
                  <div className="flex align-items-center gap-3 p-2 surface-100 border-round">
                    <i className="pi pi-exclamation-triangle text-orange-500 text-2xl" />
                    <div>
                      <div className="font-semibold text-900">
                        Nota <b>{selectedEntryNote.entryNoteNumber}</b> —{" "}
                        {ENTRY_TYPE_LABELS[selectedEntryNote.type]}
                      </div>
                      <div className="text-500 text-sm mt-1">
                        Al completar, se actualizará el stock en{" "}
                        <b>
                          {selectedEntryNote.warehouse?.name || "el almacén"}
                        </b>
                        .
                      </div>
                    </div>
                  </div>

                  <DataTable
                    value={noteItems}
                    size="small"
                    stripedRows
                    showGridlines={false}
                    emptyMessage="Sin artículos"
                    dataKey="id"
                  >
                    <Column
                      header="Artículo"
                      body={(item: EntryNoteItem) => (
                        <div className="flex flex-column">
                          <span className="font-semibold">
                            {item.item?.name || item.itemId}
                          </span>
                          {item.item?.sku && (
                            <span className="text-500 text-xs">
                              SKU: {item.item.sku}
                            </span>
                          )}
                        </div>
                      )}
                    />
                    <Column
                      header="Cantidad"
                      className="text-center"
                      style={{ width: "7rem" }}
                      body={(item: EntryNoteItem) => (
                        <Tag
                          value={item.quantityReceived.toString()}
                          severity="success"
                        />
                      )}
                    />
                    <Column
                      header="Costo Unit."
                      className="text-right"
                      style={{ width: "8rem" }}
                      body={(item: EntryNoteItem) =>
                        formatCurrency(item.unitCost)
                      }
                    />
                    <Column
                      header="Subtotal"
                      className="text-right font-semibold"
                      style={{ width: "8rem" }}
                      body={(item: EntryNoteItem) =>
                        formatCurrency(
                          Number(item.unitCost || 0) *
                            (item.quantityReceived || 0),
                        )
                      }
                    />
                    <Column
                      header="Ubicación"
                      className="text-center"
                      style={{ width: "7rem" }}
                      body={(item: EntryNoteItem) =>
                        item.storedToLocation ? (
                          <Tag
                            value={item.storedToLocation}
                            severity="info"
                            className="text-xs"
                          />
                        ) : (
                          <span className="text-400">—</span>
                        )
                      }
                    />
                  </DataTable>

                  <div className="flex justify-content-end">
                    <div className="surface-100 border-round px-4 py-2">
                      <span className="text-500 mr-3">Total:</span>
                      <span className="font-bold text-primary text-lg">
                        {formatCurrency(total)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}
        </Dialog>

        {/* Delete confirmation */}
        <Dialog
          visible={deleteDialog}
          style={{ width: "75vw" }}
          breakpoints={{ "1400px": "75vw", "900px": "60vw", "600px": "90vw" }}
          maximizable
          header="Confirmar Eliminación"
          modal
          footer={deleteDialogFooter}
          onHide={hideDeleteDialog}
        >
          <div className="flex align-items-center gap-3 p-2">
            <i
              className="pi pi-exclamation-triangle text-orange-500"
              style={{ fontSize: "2rem" }}
            />
            {selectedEntryNote && (
              <span>
                ¿Estás seguro de que deseas eliminar la nota de entrada{" "}
                <b>{selectedEntryNote.entryNoteNumber}</b>?
              </span>
            )}
          </div>
        </Dialog>

        {/* Detail dialog */}
        <Dialog
          visible={detailDialog}
          style={{ width: "960px" }}
          header={
            <div className="mb-2 text-center md:text-left">
              <div className="border-bottom-2 border-primary pb-2">
                <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                  <i className="pi pi-inbox mr-3 text-primary text-3xl"></i>
                  Nota de Entrada: {selectedEntryNote?.entryNoteNumber || ""}
                </h2>
              </div>
            </div>
          }
          modal
          maximizable
          onHide={() => {
            setSelectedEntryNote(null);
            setDetailDialog(false);
          }}
        >
          {renderDetailContent()}
        </Dialog>

        {/* Form dialog */}
        <Dialog
          visible={formDialog}
          style={{ width: "75vw" }}
          breakpoints={{ "1400px": "75vw", "900px": "85vw", "600px": "95vw" }}
          maximizable
          header={
            <div className="mb-2 text-center md:text-left">
              <div className="border-bottom-2 border-primary pb-2">
                <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                  <i className="pi pi-inbox mr-3 text-primary text-3xl"></i>
                  {selectedEntryNote
                    ? "Editar Nota de Entrada"
                    : "Nueva Nota de Entrada"}
                </h2>
              </div>
            </div>
          }
          modal
          onHide={() => setFormDialog(false)}
          footer={
            <FormActionButtons
              formId="entry-note-form"
              isUpdate={!!selectedEntryNote?.id}
              onCancel={() => {
                setFormDialog(false);
                setSelectedEntryNote(null);
              }}
              isSubmitting={isSubmitting}
            />
          }
        >
          <EntryNoteForm
            entryNote={selectedEntryNote}
            formId="entry-note-form"
            onSave={async () => {
              await loadEntryNotes();
              toast.current?.show({
                severity: "success",
                summary: "Éxito",
                detail: selectedEntryNote?.id
                  ? "Nota de Entrada actualizada"
                  : "Nota de Entrada creada",
                life: 3000,
              });
              setFormDialog(false);
              setSelectedEntryNote(null);
            }}
            onSubmittingChange={setIsSubmitting}
            toast={toast}
            items={items}
            warehouses={warehouses}
            suppliers={suppliers}
          />
        </Dialog>

        <Menu
          model={getMenuItems(actionEntryNote)}
          popup
          ref={menuRef}
          id="entry-note-menu"
        />
      </motion.div>
    </>
  );
};

export default EntryNoteList;
