"use client";
import React, { useEffect, useRef, useState } from "react";
import { FilterMatchMode } from "primereact/api";
import { Column } from "primereact/column";
import { DataTable, DataTableFilterMeta } from "primereact/datatable";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Divider } from "primereact/divider";
import { ProgressSpinner } from "primereact/progressspinner";
import { motion } from "framer-motion";
import { handleFormError } from "@/utils/errorHandlers";
import exitNoteService from "@/app/api/inventory/exitNoteService";
import {
  ExitNote,
  ExitNoteItem,
  ExitNoteStatus,
  ExitNoteType,
  EXIT_NOTE_STATUS_CONFIG,
  EXIT_NOTE_TYPE_CONFIG,
} from "@/libs/interfaces/inventory/exitNote.interface";
import itemService, { Item } from "@/app/api/inventory/itemService";
import warehouseService, {
  Warehouse,
} from "@/app/api/inventory/warehouseService";
import ExitNoteForm from "./ExitNoteForm";
import ExitNoteStepper from "./ExitNoteStepper";

const ExitNoteList = () => {
  const [exitNotes, setExitNotes] = useState<ExitNote[]>([]);
  const [selectedExitNote, setSelectedExitNote] = useState<ExitNote | null>(
    null,
  );
  const [filters, setFilters] = useState<DataTableFilterMeta>({});
  const [loading, setLoading] = useState(true);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [detailDialog, setDetailDialog] = useState(false);
  const [formDialog, setFormDialog] = useState(false);
  const [deliverDialog, setDeliverDialog] = useState(false);
  const [cancelDialog, setCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [expandedRows, setExpandedRows] = useState<any>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const dt = useRef(null);
  const toast = useRef<Toast | null>(null);

  useEffect(() => {
    fetchData();
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

  const fetchData = async () => {
    try {
      const res = await exitNoteService.getAll();
      setExitNotes(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error al obtener notas de salida:", error);
    } finally {
      setLoading(false);
    }
  };

  /* ── Actions ── */

  const hideDeleteDialog = () => {
    setSelectedExitNote(null);
    setDeleteDialog(false);
  };

  const handleDelete = async () => {
    try {
      if (selectedExitNote?.id) {
        await exitNoteService.delete(selectedExitNote.id);
        setExitNotes(exitNotes.filter((n) => n.id !== selectedExitNote.id));
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
      const result = await exitNoteService.start(note.id);
      const updated = result.data;
      setExitNotes((prev) =>
        prev.map((n) => (n.id === updated.id ? updated : n)),
      );
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
      const result = await exitNoteService.markReady(note.id);
      const updated = result.data;
      setExitNotes((prev) =>
        prev.map((n) => (n.id === updated.id ? updated : n)),
      );
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
      const result = await exitNoteService.deliver(selectedExitNote.id);
      const updated = result.data;
      setExitNotes((prev) =>
        prev.map((n) => (n.id === updated.id ? updated : n)),
      );
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

  const handleCancel = async () => {
    if (!selectedExitNote) return;
    try {
      const result = await exitNoteService.cancel(
        selectedExitNote.id,
        cancelReason,
      );
      const updated = result.data;
      setExitNotes((prev) =>
        prev.map((n) => (n.id === updated.id ? updated : n)),
      );
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: `Nota ${selectedExitNote.exitNoteNumber} cancelada`,
        life: 3000,
      });
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setSelectedExitNote(null);
      setCancelDialog(false);
      setCancelReason("");
    }
  };

  /* ── Filters ── */

  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFilters({ global: { value, matchMode: FilterMatchMode.CONTAINS } });
    setGlobalFilterValue(value);
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

  /* ── Table header ── */
  const renderHeader = () => (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <span className="p-input-icon-left w-full sm:w-20rem">
        <i className="pi pi-search"></i>
        <InputText
          value={globalFilterValue}
          onChange={onGlobalFilterChange}
          placeholder="Búsqueda Global"
          className="w-full"
        />
      </span>
      <Button
        label="Nueva Nota de Salida"
        icon="pi pi-plus"
        severity="success"
        onClick={() => {
          setSelectedExitNote(null);
          setFormDialog(true);
        }}
      />
    </div>
  );

  /* ── Column templates ── */
  const actionBodyTemplate = (rowData: ExitNote) => {
    const { status } = rowData;

    return (
      <div className="flex gap-1 flex-nowrap">
        {/* PENDING → Iniciar / Editar / Eliminar */}
        {status === ExitNoteStatus.PENDING && (
          <>
            <Button
              icon="pi pi-play"
              className="p-button-rounded p-button-info p-button-sm"
              tooltip="Iniciar Preparación"
              tooltipOptions={{ position: "top" }}
              onClick={() => handleStart(rowData)}
            />
            <Button
              icon="pi pi-pencil"
              className="p-button-rounded p-button-warning p-button-sm"
              tooltip="Editar"
              tooltipOptions={{ position: "top" }}
              onClick={() => {
                setSelectedExitNote(rowData);
                setFormDialog(true);
              }}
            />
            <Button
              icon="pi pi-trash"
              className="p-button-rounded p-button-danger p-button-sm"
              tooltip="Eliminar"
              tooltipOptions={{ position: "top" }}
              onClick={() => {
                setSelectedExitNote(rowData);
                setDeleteDialog(true);
              }}
            />
          </>
        )}

        {/* IN_PROGRESS → Marcar lista / Cancelar */}
        {status === ExitNoteStatus.IN_PROGRESS && (
          <>
            <Button
              icon="pi pi-check"
              className="p-button-rounded p-button-success p-button-sm"
              tooltip="Marcar como Lista"
              tooltipOptions={{ position: "top" }}
              onClick={() => handleReady(rowData)}
            />
            <Button
              icon="pi pi-times"
              className="p-button-rounded p-button-danger p-button-sm"
              tooltip="Cancelar"
              tooltipOptions={{ position: "top" }}
              onClick={() => {
                setSelectedExitNote(rowData);
                setCancelReason("");
                setCancelDialog(true);
              }}
            />
          </>
        )}

        {/* READY → Entregar / Cancelar */}
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
              onClick={() => {
                setSelectedExitNote(rowData);
                setCancelReason("");
                setCancelDialog(true);
              }}
            />
          </>
        )}

        {/* DELIVERED / CANCELLED → Solo ver */}
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
    rowData.warehouse?.name ||
    warehouses.find((w) => w.id === rowData.warehouseId)?.name ||
    "—";

  /* ── Row expansion with stepper ── */
  const rowExpansionTemplate = (data: ExitNote) => {
    const noteItems = data.items || [];

    return (
      <div className="p-3">
        <ExitNoteStepper currentStatus={data.status} />
        {noteItems.length > 0 && (
          <div className="mt-3">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-bottom-1 surface-border">
                  <th className="text-left py-2">Artículo</th>
                  <th className="text-center py-2">Cantidad</th>
                  <th className="text-center py-2">Ubicación</th>
                  <th className="text-center py-2">Lote</th>
                  <th className="text-left py-2">Notas</th>
                </tr>
              </thead>
              <tbody>
                {noteItems.map((line) => (
                  <tr key={line.id} className="border-bottom-1 surface-border">
                    <td className="py-2">
                      {line.item
                        ? `${line.item.sku} — ${line.item.name}`
                        : line.itemId}
                    </td>
                    <td className="text-center py-2 font-semibold">
                      {line.quantity}
                    </td>
                    <td className="text-center py-2">
                      {line.pickedFromLocation || "—"}
                    </td>
                    <td className="text-center py-2">{line.batchId || "—"}</td>
                    <td className="py-2 text-500 text-xs">
                      {line.notes || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

  /* ── Delete dialog footer ── */
  const deleteDialogFooter = (
    <>
      <Button label="No" icon="pi pi-times" text onClick={hideDeleteDialog} />
      <Button label="Sí" icon="pi pi-check" text onClick={handleDelete} />
    </>
  );

  /* ── Detail dialog content ── */
  const renderDetailContent = () => {
    if (!selectedExitNote) return null;
    const noteItems = selectedExitNote.items || [];
    const statusCfg = EXIT_NOTE_STATUS_CONFIG[selectedExitNote.status];
    const typeCfg = EXIT_NOTE_TYPE_CONFIG[selectedExitNote.type];

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
              <div className="flex align-items-center gap-2 font-bold text-900 text-lg mb-1">
                <i className={typeCfg.icon} />
                <span>{typeCfg.label}</span>
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
                <span className="text-500 text-sm font-medium">Almacén</span>
              </div>
              <div className="font-bold text-900 text-lg">
                {selectedExitNote.warehouse?.name ||
                  warehouses.find((w) => w.id === selectedExitNote.warehouseId)
                    ?.name ||
                  "—"}
              </div>
            </div>
          </div>

          <div className="col-12 md:col-6 lg:col-3">
            <div className="surface-100 border-round p-3 h-full">
              <div className="flex align-items-center gap-2 mb-2">
                <i className="pi pi-user text-blue-500 text-lg" />
                <span className="text-500 text-sm font-medium">
                  Destinatario
                </span>
              </div>
              <div className="font-bold text-900 text-lg">
                {selectedExitNote.recipientName || "—"}
              </div>
              {selectedExitNote.recipientPhone && (
                <div className="text-500 text-sm mt-1">
                  <i className="pi pi-phone text-xs mr-1" />
                  {selectedExitNote.recipientPhone}
                </div>
              )}
            </div>
          </div>

          <div className="col-12 md:col-6 lg:col-3">
            <div className="surface-100 border-round p-3 h-full">
              <div className="flex align-items-center gap-2 mb-2">
                <i className="pi pi-list text-green-500 text-lg" />
                <span className="text-500 text-sm font-medium">Artículos</span>
              </div>
              <div className="font-bold text-primary text-xl">
                {noteItems.length}
              </div>
              <div className="text-500 text-sm mt-1">
                {noteItems.length === 1 ? "artículo" : "artículos"} en esta
                salida
              </div>
            </div>
          </div>
        </div>

        {/* ── Additional info ── */}
        <div className="grid">
          {selectedExitNote.reference && (
            <div className="col-12 md:col-6">
              <div className="surface-100 border-round p-3">
                <div className="flex align-items-center gap-2 mb-2">
                  <i className="pi pi-link text-500" />
                  <span className="text-500 text-sm font-medium">
                    Referencia
                  </span>
                </div>
                <div className="text-900">{selectedExitNote.reference}</div>
              </div>
            </div>
          )}
          {selectedExitNote.reason && (
            <div className="col-12 md:col-6">
              <div className="surface-100 border-round p-3">
                <div className="flex align-items-center gap-2 mb-2">
                  <i className="pi pi-info-circle text-500" />
                  <span className="text-500 text-sm font-medium">Motivo</span>
                </div>
                <div className="text-900">{selectedExitNote.reason}</div>
              </div>
            </div>
          )}
        </div>

        {selectedExitNote.notes && (
          <div className="surface-100 border-round p-3">
            <div className="flex align-items-center gap-2 mb-2">
              <i className="pi pi-comment text-500" />
              <span className="text-500 text-sm font-medium">Notas</span>
            </div>
            <div className="text-900">{selectedExitNote.notes}</div>
          </div>
        )}

        {/* ── Items table ── */}
        <Divider align="left">
          <span className="text-500 font-medium text-sm">
            <i className="pi pi-list mr-2" />
            Artículos en la Salida
          </span>
        </Divider>

        {noteItems.length > 0 ? (
          <DataTable
            value={noteItems}
            size="small"
            stripedRows
            showGridlines={false}
            emptyMessage="No hay artículos"
            className="border-round"
            dataKey="id"
          >
            <Column
              header="#"
              body={(_: ExitNoteItem, opts: { rowIndex: number }) =>
                opts.rowIndex + 1
              }
              style={{ width: "3rem" }}
              className="text-center"
            />
            <Column
              header="Artículo"
              body={(item: ExitNoteItem) => (
                <div className="flex flex-column">
                  <span className="font-semibold text-900">
                    {item.item?.name || "Artículo desconocido"}
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
              body={(item: ExitNoteItem) => (
                <Tag
                  value={item.quantity.toString()}
                  severity="info"
                  className="text-sm"
                />
              )}
            />
            <Column
              header="Ubicación"
              className="text-center"
              style={{ width: "9rem" }}
              body={(item: ExitNoteItem) =>
                item.pickedFromLocation ? (
                  <Tag
                    value={item.pickedFromLocation}
                    severity="secondary"
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
              body={(item: ExitNoteItem) =>
                item.batchId ? (
                  <Tag
                    value={item.batchId}
                    severity="info"
                    className="text-xs"
                  />
                ) : (
                  <span className="text-400">—</span>
                )
              }
            />
            <Column
              header="Notas"
              body={(item: ExitNoteItem) =>
                item.notes || <span className="text-400">—</span>
              }
            />
          </DataTable>
        ) : (
          <div className="text-center text-500 p-4">
            <i
              className="pi pi-inbox text-4xl mb-3"
              style={{ display: "block" }}
            />
            No hay artículos en esta nota de salida
          </div>
        )}
      </div>
    );
  };

  /* ── Loading screen ── */
  if (loading) {
    return (
      <div
        className="flex flex-column align-items-center justify-content-center"
        style={{ minHeight: "60vh" }}
      >
        <ProgressSpinner
          style={{ width: "50px", height: "50px" }}
          strokeWidth="4"
          fill="var(--surface-ground)"
          animationDuration=".5s"
        />
        <p className="mt-3 text-600 font-medium">Cargando notas de salida...</p>
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
        <DataTable
          ref={dt}
          value={exitNotes}
          header={renderHeader()}
          paginator
          rows={10}
          responsiveLayout="scroll"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} notas de salida"
          rowsPerPageOptions={[10, 25, 50]}
          filters={filters}
          loading={loading}
          emptyMessage="No hay notas de salida disponibles"
          rowClassName={() => "animated-row"}
          size="small"
          dataKey="id"
          stripedRows
          expandedRows={expandedRows}
          onRowToggle={(e) => setExpandedRows(e.data)}
          rowExpansionTemplate={rowExpansionTemplate}
        >
          <Column expander style={{ width: "3rem" }} />
          <Column body={actionBodyTemplate} style={{ width: "10rem" }} frozen />
          <Column field="exitNoteNumber" header="Nro. Nota Salida" sortable />
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
            field="recipientName"
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
        </DataTable>

        {/* Delete confirmation */}
        <Dialog
          visible={deleteDialog}
          style={{ width: "450px" }}
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
            {selectedExitNote && (
              <span>
                ¿Estás seguro de que deseas eliminar la nota de salida{" "}
                <b>{selectedExitNote.exitNoteNumber}</b>?
              </span>
            )}
          </div>
        </Dialog>

        {/* Detail dialog */}
        <Dialog
          visible={detailDialog}
          style={{ width: "960px" }}
          header={
            <div className="flex align-items-center gap-2">
              <i className="pi pi-external-link text-primary" />
              <span>
                Nota de Salida: {selectedExitNote?.exitNoteNumber || ""}
              </span>
            </div>
          }
          modal
          maximizable
          onHide={() => {
            setSelectedExitNote(null);
            setDetailDialog(false);
          }}
        >
          {renderDetailContent()}
        </Dialog>

        {/* Form dialog */}
        <Dialog
          visible={formDialog}
          style={{ width: "900px" }}
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
          onHide={() => setFormDialog(false)}
        >
          <ExitNoteForm
            exitNote={selectedExitNote}
            exitNotes={exitNotes}
            setExitNotes={setExitNotes}
            hideFormDialog={() => {
              setFormDialog(false);
              fetchData();
            }}
            showToast={(severity, summary, detail) =>
              toast.current?.show({ severity, summary, detail, life: 3000 })
            }
            toast={toast}
            items={items}
            warehouses={warehouses}
          />
        </Dialog>

        {/* Deliver confirmation dialog */}
        <Dialog
          visible={deliverDialog}
          style={{ width: "550px" }}
          header="Confirmar Entrega de Nota de Salida"
          modal
          footer={
            <>
              <Button
                label="Cancelar"
                icon="pi pi-times"
                text
                onClick={() => {
                  setSelectedExitNote(null);
                  setDeliverDialog(false);
                }}
              />
              <Button
                label="Confirmar Entrega"
                icon="pi pi-send"
                severity="success"
                onClick={handleDeliver}
              />
            </>
          }
          onHide={() => {
            setSelectedExitNote(null);
            setDeliverDialog(false);
          }}
        >
          {selectedExitNote && (
            <div className="flex flex-column gap-3">
              <div className="flex align-items-center gap-3 p-2">
                <i
                  className="pi pi-send text-green-500"
                  style={{ fontSize: "2rem" }}
                />
                <div>
                  <p className="m-0">
                    ¿Registrar la entrega de la nota{" "}
                    <b>{selectedExitNote.exitNoteNumber}</b>?
                  </p>
                  <p className="m-0 mt-1 text-500 text-sm">
                    Se descontará el stock del almacén{" "}
                    <b>
                      {selectedExitNote.warehouse?.name ||
                        warehouses.find(
                          (w) => w.id === selectedExitNote.warehouseId,
                        )?.name ||
                        "—"}
                    </b>{" "}
                    con los siguientes artículos:
                  </p>
                </div>
              </div>
              {selectedExitNote.items && selectedExitNote.items.length > 0 && (
                <div className="surface-100 border-round p-3">
                  {selectedExitNote.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-content-between align-items-center py-1 border-bottom-1 surface-border"
                    >
                      <span className="text-sm">
                        {item.item?.name || item.itemId}
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

        {/* Cancel confirmation dialog */}
        <Dialog
          visible={cancelDialog}
          style={{ width: "500px" }}
          header="Confirmar Cancelación"
          modal
          footer={
            <>
              <Button
                label="No"
                icon="pi pi-times"
                text
                onClick={() => {
                  setSelectedExitNote(null);
                  setCancelDialog(false);
                  setCancelReason("");
                }}
              />
              <Button
                label="Sí, Cancelar"
                icon="pi pi-ban"
                severity="danger"
                onClick={handleCancel}
              />
            </>
          }
          onHide={() => {
            setSelectedExitNote(null);
            setCancelDialog(false);
            setCancelReason("");
          }}
        >
          {selectedExitNote && (
            <div className="flex flex-column gap-3 p-2">
              <div className="flex align-items-center gap-3">
                <i
                  className="pi pi-exclamation-triangle text-orange-500"
                  style={{ fontSize: "2rem" }}
                />
                <span>
                  ¿Estás seguro de cancelar la nota de salida{" "}
                  <b>{selectedExitNote.exitNoteNumber}</b>? Esta acción no se
                  puede deshacer.
                </span>
              </div>
              <div className="flex flex-column gap-1">
                <label className="text-sm font-semibold text-600">
                  Motivo (opcional)
                </label>
                <InputTextarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={3}
                  placeholder="Ingresa el motivo de la cancelación..."
                  className="w-full"
                  autoResize
                />
              </div>
            </div>
          )}
        </Dialog>
      </motion.div>
    </>
  );
};

export default ExitNoteList;
