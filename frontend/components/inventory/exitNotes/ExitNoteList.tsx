"use client";
import React, { useEffect, useRef, useState } from "react";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { ProgressSpinner } from "primereact/progressspinner";
import { Menu } from "primereact/menu";
import { MenuItem } from "primereact/menuitem";
import { motion } from "framer-motion";
import { handleFormError } from "@/utils/errorHandlers";
import exitNoteService from "@/app/api/inventory/exitNoteService";
import {
  ExitNote,
  ExitNoteItem,
  ExitNoteStatus,
  EXIT_NOTE_STATUS_CONFIG,
  EXIT_NOTE_TYPE_CONFIG,
} from "@/libs/interfaces/inventory/exitNote.interface";
import itemService, { Item } from "@/app/api/inventory/itemService";
import warehouseService, {
  Warehouse,
} from "@/app/api/inventory/warehouseService";
import ExitNoteForm from "./ExitNoteForm";
import ExitNoteDetailDialog from "./ExitNoteDetailDialog";
import ExitNoteStepper from "./ExitNoteStepper";
import CreateButton from "@/components/common/CreateButton";
import FormActionButtons from "@/components/common/FormActionButtons";
import {
  confirmAction,
  ConfirmActionPopup,
} from "@/components/common/ConfirmAction";

const ExitNoteList = () => {
  const [exitNotes, setExitNotes] = useState<ExitNote[]>([]);
  const [selectedExitNote, setSelectedExitNote] = useState<ExitNote | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [page, setPage] = useState<number>(0);
  const [rows, setRows] = useState<number>(10);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [sortField, setSortField] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [detailDialog, setDetailDialog] = useState(false);
  const [formDialog, setFormDialog] = useState(false);
  const [deliverDialog, setDeliverDialog] = useState(false);
  const [expandedRows, setExpandedRows] = useState<any>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionExitNote, setActionExitNote] = useState<ExitNote | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const dt = useRef(null);
  const toast = useRef<Toast | null>(null);
  const menuRef = useRef<Menu>(null);

  // ── Debounced search ──
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(globalFilterValue);
    }, 500);
    return () => clearTimeout(handler);
  }, [globalFilterValue]);

  useEffect(() => {
    loadExitNotes();
  }, [page, rows, sortField, sortOrder, debouncedSearch]);

  useEffect(() => {
    loadFormData();
  }, []);

  const loadFormData = async () => {
    try {
      const [whRes, itemRes] = await Promise.all([
        warehouseService.getActive(),
        itemService.getActive(),
      ]);
      setWarehouses(whRes.data || []);
      setItems(itemRes.data || []);
    } catch (error) {
      console.error("Error loading form data:", error);
    }
  };

  const loadExitNotes = async () => {
    try {
      setLoading(true);
      const res = await exitNoteService.getAll({
        page: page + 1,
        limit: rows,
        search: debouncedSearch || undefined,
      });
      setExitNotes(Array.isArray(res.data) ? res.data : []);
      setTotalRecords(res.meta?.total || 0);
    } catch (error) {
      console.error("Error al obtener notas de salida:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar las notas de salida",
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
    const newField = event.sortField;
    const newOrder = event.sortOrder === 1 ? "asc" : "desc";
    if (newField !== sortField || newOrder !== sortOrder) {
      setSortField(newField);
      setSortOrder(newOrder as "asc" | "desc");
    }
  };

  /* ── Helpers ── */
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

  /* ── Actions ── */
  const openNew = () => {
    setSelectedExitNote(null);
    setFormDialog(true);
  };
  const hideDeleteDialog = () => {
    setSelectedExitNote(null);
    setDeleteDialog(false);
  };

  const handleSave = async () => {
    toast.current?.show({
      severity: "success",
      summary: "Éxito",
      detail: selectedExitNote?.id
        ? "Nota de salida actualizada"
        : "Nota de salida creada",
      life: 3000,
    });
    await loadExitNotes();
    setFormDialog(false);
    setSelectedExitNote(null);
  };

  const handleDelete = async () => {
    try {
      if (selectedExitNote?.id) {
        await exitNoteService.delete(selectedExitNote.id);
        await loadExitNotes();
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Nota de salida eliminada",
          life: 3000,
        });
      }
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      hideDeleteDialog();
    }
  };

  const handleStart = async (note: ExitNote) => {
    try {
      await exitNoteService.start(note.id);
      await loadExitNotes();
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: `Nota ${note.exitNoteNumber} en preparación`,
        life: 3000,
      });
    } catch (error) {
      handleFormError(error, toast);
    }
  };

  const handleReady = async (note: ExitNote) => {
    try {
      await exitNoteService.markReady(note.id);
      await loadExitNotes();
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: `Nota ${note.exitNoteNumber} lista para entrega`,
        life: 3000,
      });
    } catch (error) {
      handleFormError(error, toast);
    }
  };

  const handleDeliver = async () => {
    if (!selectedExitNote) return;
    try {
      await exitNoteService.deliver(selectedExitNote.id);
      await loadExitNotes();
      toast.current?.show({
        severity: "success",
        summary: "Entregada",
        detail: `Nota ${selectedExitNote.exitNoteNumber} entregada — Stock descontado`,
        life: 4000,
      });
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setSelectedExitNote(null);
      setDeliverDialog(false);
    }
  };

  const handleCancel = async (note: ExitNote) => {
    try {
      await exitNoteService.cancel(note.id, "Cancelada por el usuario");
      await loadExitNotes();
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: `Nota ${note.exitNoteNumber} cancelada`,
        life: 3000,
      });
    } catch (error) {
      handleFormError(error, toast);
    }
  };

  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGlobalFilterValue(e.target.value);
    setPage(0);
  };

  /* ── Table header (same pattern as EntryNoteList) ── */
  const renderHeader = () => (
    <div className="flex flex-wrap gap-3 align-items-center justify-content-between">
      <div className="flex align-items-center gap-2">
        <h4 className="m-0 font-bold text-900">Notas de Salida</h4>
        <span className="text-600 text-sm">({totalRecords} total)</span>
      </div>
      <div className="flex flex-wrap gap-2 align-items-center w-full sm:w-auto">
        <span className="p-input-icon-left w-full sm:w-20rem">
          <i className="pi pi-search" />
          <InputText
            value={globalFilterValue}
            onChange={onGlobalFilterChange}
            placeholder="Buscar nota (nro, tipo, destinatario...)"
            className="w-full"
          />
        </span>
        <CreateButton
          label="Nueva Nota"
          onClick={openNew}
          tooltip="Crear nueva nota de salida"
          className="w-full sm:w-auto"
        />
      </div>
    </div>
  );

  /* ── Column: Status-transition actions (Proceso) ── */
  const actionBodyTemplate = (rowData: ExitNote) => {
    const { status } = rowData;
    return (
      <div className="flex gap-1 flex-nowrap">
        {status === ExitNoteStatus.PENDING && (
          <Button
            icon="pi pi-play"
            className="p-button-rounded p-button-info p-button-sm"
            tooltip="Iniciar Preparación"
            tooltipOptions={{ position: "top" }}
            onClick={(e) =>
              confirmAction({
                target: e.currentTarget as EventTarget & HTMLElement,
                message: `¿Iniciar preparación de ${rowData.exitNoteNumber}?`,
                icon: "pi pi-play",
                iconClass: "text-blue-500",
                acceptLabel: "Iniciar",
                acceptSeverity: "info",
                onAccept: () => handleStart(rowData),
              })
            }
          />
        )}
        {status === ExitNoteStatus.IN_PROGRESS && (
          <>
            <Button
              icon="pi pi-check"
              className="p-button-rounded p-button-success p-button-sm"
              tooltip="Marcar como Lista"
              tooltipOptions={{ position: "top" }}
              onClick={(e) =>
                confirmAction({
                  target: e.currentTarget as EventTarget & HTMLElement,
                  message: `¿Marcar ${rowData.exitNoteNumber} como lista para entrega?`,
                  icon: "pi pi-check",
                  iconClass: "text-green-500",
                  acceptLabel: "Marcar Lista",
                  acceptSeverity: "success",
                  onAccept: () => handleReady(rowData),
                })
              }
            />
            <Button
              icon="pi pi-times"
              className="p-button-rounded p-button-danger p-button-sm"
              tooltip="Cancelar"
              tooltipOptions={{ position: "top" }}
              onClick={(e) =>
                confirmAction({
                  target: e.currentTarget as EventTarget & HTMLElement,
                  message: `¿Cancelar la nota ${rowData.exitNoteNumber}? Se liberarán las reservas.`,
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
        {status === ExitNoteStatus.READY && (
          <>
            <Button
              icon="pi pi-send"
              className="p-button-rounded p-button-success p-button-sm"
              tooltip="Registrar Entrega"
              tooltipOptions={{ position: "top" }}
              onClick={() => {
                setSelectedExitNote(rowData);
                setDeliverDialog(true);
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
                  message: `¿Cancelar la nota ${rowData.exitNoteNumber}? Se liberarán las reservas.`,
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
        {(status === ExitNoteStatus.DELIVERED ||
          status === ExitNoteStatus.CANCELLED) && (
          <Button
            icon="pi pi-eye"
            className="p-button-rounded p-button-secondary p-button-sm"
            tooltip="Ver detalle"
            tooltipOptions={{ position: "top" }}
            onClick={() => {
              setSelectedExitNote(rowData);
              setDetailDialog(true);
            }}
          />
        )}
      </div>
    );
  };

  /* ── Column: CRUD actions (cog menu - only PENDING) ── */
  const getMenuItems = (note: ExitNote | null): MenuItem[] => {
    if (!note || note.status !== ExitNoteStatus.PENDING) return [];
    return [
      {
        label: "Editar",
        icon: "pi pi-pencil",
        command: () => {
          setSelectedExitNote(note);
          setFormDialog(true);
        },
      },
      { separator: true },
      {
        label: "Eliminar",
        icon: "pi pi-trash",
        className: "p-menuitem-danger",
        command: () => {
          setSelectedExitNote(note);
          setDeleteDialog(true);
        },
      },
    ];
  };

  const crudBodyTemplate = (rowData: ExitNote) => {
    if (rowData.status !== ExitNoteStatus.PENDING) return null;
    return (
      <Button
        icon="pi pi-cog"
        rounded
        text
        onClick={(e) => {
          setActionExitNote(rowData);
          menuRef.current?.toggle(e);
        }}
        aria-controls="exit-note-menu"
        aria-haspopup
      />
    );
  };

  /* ── Column templates ── */
  const statusBodyTemplate = (rowData: ExitNote) => {
    const cfg = EXIT_NOTE_STATUS_CONFIG[rowData.status];
    return (
      <Tag
        value={cfg.label}
        severity={cfg.severity}
        icon={cfg.icon}
        className="text-xs"
      />
    );
  };

  const typeBodyTemplate = (rowData: ExitNote) => {
    const cfg = EXIT_NOTE_TYPE_CONFIG[rowData.type];
    return (
      <div className="flex align-items-center gap-1 text-sm">
        <i className={cfg.icon} />
        <span>{cfg.label}</span>
      </div>
    );
  };

  const dateBodyTemplate = (rowData: ExitNote) => formatDate(rowData.createdAt);

  const itemsCountBodyTemplate = (rowData: ExitNote) => {
    const count = rowData.items?.length || 0;
    return (
      <Tag
        value={`${count} ${count === 1 ? "artículo" : "artículos"}`}
        severity={count > 0 ? "info" : "warning"}
        className="text-xs"
      />
    );
  };

  const warehouseBodyTemplate = (rowData: ExitNote) =>
    rowData.warehouse?.name || "—";

  /* ── Row expansion with stepper + styled table ── */
  const rowExpansionTemplate = (data: ExitNote) => {
    const noteItems = data.items || [];
    return (
      <div className="p-3">
        <ExitNoteStepper currentStatus={data.status} />
        {noteItems.length > 0 && (
          <div className="mt-3">
            <div
              style={{
                border: "1px solid var(--surface-300)",
                borderRadius: "6px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 8px",
                  backgroundColor: "var(--surface-100)",
                  borderBottom: "2px solid var(--surface-300)",
                }}
              >
                {[
                  { label: "Artículo", style: { flex: "1 1 0", minWidth: 0 } },
                  {
                    label: "Cant.",
                    style: { width: "5rem", textAlign: "center" as const },
                  },
                  {
                    label: "Ubicación",
                    style: { width: "6rem", textAlign: "center" as const },
                  },
                  {
                    label: "Lote",
                    style: { width: "6rem", textAlign: "center" as const },
                  },
                  { label: "Notas", style: { width: "10rem" } },
                ].map((col, i) => (
                  <div
                    key={i}
                    style={{
                      ...col.style,
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                      color: "var(--text-color-secondary)",
                      userSelect: "none",
                      flexShrink: 0,
                    }}
                  >
                    {col.label}
                  </div>
                ))}
              </div>
              {noteItems.map((line) => (
                <div
                  key={line.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "4px 8px",
                    borderBottom: "1px solid var(--surface-200)",
                  }}
                >
                  <div style={{ flex: "1 1 0", minWidth: 0 }}>
                    <div
                      className="font-medium text-900"
                      style={{ fontSize: "0.8rem" }}
                    >
                      {line.item?.sku || "—"}
                    </div>
                    <div
                      className="text-500"
                      style={{
                        fontSize: "0.7rem",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      title={line.itemName || line.item?.name || ""}
                    >
                      {line.itemName || line.item?.name || "Sin nombre"}
                    </div>
                  </div>
                  <div
                    style={{
                      width: "5rem",
                      textAlign: "center",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    {line.quantity}
                  </div>
                  <div
                    style={{
                      width: "6rem",
                      textAlign: "center",
                      fontSize: "0.8rem",
                      flexShrink: 0,
                    }}
                  >
                    {line.pickedFromLocation || (
                      <span className="text-400">—</span>
                    )}
                  </div>
                  <div
                    style={{
                      width: "6rem",
                      textAlign: "center",
                      fontSize: "0.8rem",
                      flexShrink: 0,
                    }}
                  >
                    {line.batchId || <span className="text-400">—</span>}
                  </div>
                  <div
                    style={{
                      width: "10rem",
                      fontSize: "0.75rem",
                      flexShrink: 0,
                    }}
                    className="text-500"
                  >
                    {line.notes || "—"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {noteItems.length === 0 && (
          <div className="text-center text-500 p-3 mt-2">
            <i className="pi pi-inbox mr-2" />
            No hay artículos en esta nota
          </div>
        )}
      </div>
    );
  };

  /* ── Render ── */
  return (
    <>
      <Toast ref={toast} />
      <ConfirmActionPopup />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 40, filter: "blur(8px)" }}
        animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="card"
      >
        <DataTable
          ref={dt}
          value={exitNotes}
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
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} notas de salida"
          rowsPerPageOptions={[5, 10, 25, 50]}
          loading={loading}
          emptyMessage="No hay notas de salida disponibles"
          rowClassName={() => "animated-row"}
          size="small"
          dataKey="id"
          expandedRows={expandedRows}
          onRowToggle={(e) => setExpandedRows(e.data)}
          rowExpansionTemplate={rowExpansionTemplate}
          scrollable
          tableStyle={{ minWidth: "70rem" }}
        >
          <Column expander style={{ width: "3rem" }} />
          <Column
            header="Proceso"
            body={actionBodyTemplate}
            style={{ width: "7rem", textAlign: "center" }}
            headerStyle={{ textAlign: "center" }}
          />
          <Column field="exitNoteNumber" header="Nro. Nota" sortable />
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
          <Column header="Almacén" body={warehouseBodyTemplate} />
          <Column
            header="Destinatario"
            body={(rowData: ExitNote) => rowData.recipientName || "—"}
          />
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
            header="Acciones"
            body={crudBodyTemplate}
            exportable={false}
            frozen
            alignFrozen="right"
            style={{ width: "5rem", textAlign: "center" }}
            headerStyle={{ textAlign: "center" }}
          />
        </DataTable>

        {/* Delete confirmation */}
        <Dialog
          visible={deleteDialog}
          style={{ width: "450px" }}
          breakpoints={{ "1400px": "450px", "900px": "60vw", "600px": "90vw" }}
          maximizable
          header="Confirmar Eliminación"
          modal
          footer={
            <div className="flex w-full gap-2 mb-4">
              <Button
                label="No"
                icon="pi pi-times"
                severity="secondary"
                onClick={hideDeleteDialog}
                type="button"
                className="flex-1"
              />
              <Button
                label="Sí, Eliminar"
                icon="pi pi-trash"
                severity="danger"
                onClick={handleDelete}
                type="button"
                className="flex-1"
              />
            </div>
          }
          onHide={hideDeleteDialog}
        >
          <div className="flex align-items-center gap-3 p-2">
            <i
              className="pi pi-exclamation-triangle text-orange-500"
              style={{ fontSize: "2rem" }}
            />
            {selectedExitNote && (
              <span>
                ¿Estás seguro de que deseas eliminar la nota de salida{" "}
                <b>{selectedExitNote.exitNoteNumber}</b>?
              </span>
            )}
          </div>
        </Dialog>

        {/* Detail dialog */}
        <ExitNoteDetailDialog
          visible={detailDialog}
          onHide={() => {
            setSelectedExitNote(null);
            setDetailDialog(false);
          }}
          exitNote={selectedExitNote}
          onUpdate={async () => {
            await loadExitNotes();
          }}
          toast={toast}
          warehouses={warehouses}
        />

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
                  <i className="pi pi-external-link mr-3 text-primary text-3xl"></i>
                  {selectedExitNote
                    ? "Editar Nota de Salida"
                    : "Nueva Nota de Salida"}
                </h2>
              </div>
            </div>
          }
          modal
          onHide={() => {
            setFormDialog(false);
            setSelectedExitNote(null);
          }}
          footer={
            <FormActionButtons
              formId="exit-note-form"
              isUpdate={!!selectedExitNote?.id}
              onCancel={() => {
                setFormDialog(false);
                setSelectedExitNote(null);
              }}
              isSubmitting={isSubmitting}
            />
          }
        >
          <ExitNoteForm
            exitNote={selectedExitNote}
            formId="exit-note-form"
            onSave={handleSave}
            onSubmittingChange={setIsSubmitting}
            toast={toast}
            items={items}
            warehouses={warehouses}
          />
        </Dialog>

        {/* Deliver confirmation dialog */}
        <Dialog
          visible={deliverDialog}
          style={{ width: "550px" }}
          header={
            <div className="mb-2 text-center md:text-left">
              <div className="border-bottom-2 border-primary pb-2">
                <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                  <i className="pi pi-send mr-3 text-primary text-3xl"></i>
                  Confirmar Entrega
                </h2>
              </div>
            </div>
          }
          modal
          footer={
            <div className="flex w-full gap-2 mb-4">
              <Button
                label="Cancelar"
                icon="pi pi-times"
                severity="secondary"
                onClick={() => {
                  setSelectedExitNote(null);
                  setDeliverDialog(false);
                }}
                type="button"
                className="flex-1"
              />
              <Button
                label="Confirmar Entrega"
                icon="pi pi-send"
                onClick={handleDeliver}
                type="button"
                className="flex-1"
              />
            </div>
          }
          onHide={() => {
            setSelectedExitNote(null);
            setDeliverDialog(false);
          }}
        >
          {selectedExitNote && (
            <div className="flex flex-column gap-3">
              <div className="flex align-items-center gap-3 p-2 surface-100 border-round">
                <i className="pi pi-exclamation-triangle text-orange-500 text-2xl" />
                <div>
                  <div className="font-semibold text-900">
                    Nota <b>{selectedExitNote.exitNoteNumber}</b>
                  </div>
                  <div className="text-500 text-sm mt-1">
                    Se descontará el stock del almacén{" "}
                    <b>{selectedExitNote.warehouse?.name || "—"}</b>.
                  </div>
                </div>
              </div>
              {selectedExitNote.items && selectedExitNote.items.length > 0 && (
                <div className="surface-50 border-round p-3">
                  {selectedExitNote.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-content-between align-items-center py-1 border-bottom-1 surface-border"
                    >
                      <span className="text-sm">
                        {item.itemName || item.item?.name || item.itemId}
                      </span>
                      <Tag
                        value={`-${item.quantity}`}
                        severity="danger"
                        className="text-xs"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Dialog>

        <Menu
          model={getMenuItems(actionExitNote)}
          popup
          ref={menuRef}
          id="exit-note-menu"
        />
      </motion.div>
    </>
  );
};

export default ExitNoteList;
