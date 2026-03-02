"use client";
import React, { useEffect, useRef, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Dropdown } from "primereact/dropdown";
import { Dialog } from "primereact/dialog";
import { motion } from "framer-motion";

import {
  getExitNotes,
  startPreparing,
  markAsReady,
  deliverExitNote,
  cancelExitNote,
} from "@/app/api/inventory/exitNoteService";
import {
  ExitNote,
  ExitNoteStatus,
  ExitNoteType,
  EXIT_NOTE_STATUS_CONFIG,
  EXIT_NOTE_TYPE_CONFIG,
} from "@/libs/interfaces/inventory/exitNote.interface";
import {
  Warehouse,
  getActiveWarehouses,
} from "@/app/api/inventory/warehouseService";
import { Item, getActiveItems } from "@/app/api/inventory/itemService";
import ExitNoteDetailDialog from "./ExitNoteDetailDialog";
import ExitNoteForm from "./ExitNoteForm";
import CreateButton from "@/components/common/CreateButton";

const ExitNoteList = () => {
  // Data
  const [exitNotes, setExitNotes] = useState<ExitNote[]>([]);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [selectedExitNote, setSelectedExitNote] = useState<ExitNote | null>(
    null,
  );
  const [items, setItems] = useState<Item[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  // Filters and pagination
  const [globalFilterValue, setGlobalFilterValue] = useState<string>("");
  const [page, setPage] = useState<number>(0);
  const [rows, setRows] = useState<number>(10);
  const [selectedType, setSelectedType] = useState<ExitNoteType | undefined>(
    undefined,
  );
  const [selectedStatus, setSelectedStatus] = useState<
    ExitNoteStatus | undefined
  >(undefined);

  // UI
  const [loading, setLoading] = useState<boolean>(true);
  const [detailDialogVisible, setDetailDialogVisible] =
    useState<boolean>(false);
  const [formDialog, setFormDialog] = useState<boolean>(false);
  const [deleteDialog, setDeleteDialog] = useState<boolean>(false);
  const [cancelDialog, setCancelDialog] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>("");
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const toast = useRef<Toast>(null);

  // Load items and warehouses on mount
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load exit notes when filters change
  useEffect(() => {
    loadExitNotes();
  }, [page, rows, selectedType, selectedStatus, globalFilterValue]);

  const loadInitialData = async () => {
    try {
      const [whRes, itemRes] = await Promise.all([
        getActiveWarehouses(),
        getActiveItems(),
      ]);
      setWarehouses(whRes.data || []);
      setItems(itemRes.data || []);
    } catch (error) {
      console.error("Error loading initial data:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar datos iniciales",
        life: 3000,
      });
    }
  };

  const loadExitNotes = async () => {
    try {
      setLoading(true);
      const response = await getExitNotes(
        page + 1,
        rows,
        selectedType,
        selectedStatus,
        undefined,
        globalFilterValue,
      );

      const data = response.data || [];
      const meta = response.meta;
      const total = meta?.total || 0;

      setExitNotes(Array.isArray(data) ? data : []);
      setTotalRecords(total);
    } catch (error) {
      console.error("Error loading exit notes:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar notas de salida",
        life: 3000,
      });
      setExitNotes([]);
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

  const handleSearch = (value: string) => {
    setGlobalFilterValue(value);
    setPage(0);
  };

  const openDetail = (note: ExitNote) => {
    setSelectedExitNote(note);
    setDetailDialogVisible(true);
  };

  const openNew = () => {
    setFormDialog(true);
  };

  const handleFormSuccess = () => {
    setFormDialog(false);
    setPage(0);
    loadExitNotes();
  };

  /* ── Workflow handlers ── */
  const handleStart = async (note: ExitNote) => {
    try {
      setActionInProgress(note.id);
      const result = await startPreparing(note.id);
      const updated = result.data || result;
      setExitNotes((prev) =>
        prev.map((n) => (n.id === updated.id ? updated : n)),
      );
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: `Nota ${note.exitNoteNumber} iniciada`,
        life: 3000,
      });
    } catch (error) {
      console.error("Error starting exit note:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo iniciar la nota",
        life: 3000,
      });
    } finally {
      setActionInProgress(null);
    }
  };

  const handleReady = async (note: ExitNote) => {
    try {
      setActionInProgress(note.id);
      const result = await markAsReady(note.id);
      const updated = result.data || result;
      setExitNotes((prev) =>
        prev.map((n) => (n.id === updated.id ? updated : n)),
      );
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: `Nota ${note.exitNoteNumber} lista`,
        life: 3000,
      });
    } catch (error) {
      console.error("Error marking as ready:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo marcar como listo",
        life: 3000,
      });
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDeliver = async (note: ExitNote) => {
    try {
      setActionInProgress(note.id);
      const result = await deliverExitNote(note.id);
      const updated = result.data || result;
      setExitNotes((prev) =>
        prev.map((n) => (n.id === updated.id ? updated : n)),
      );
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: `Nota ${note.exitNoteNumber} entregada`,
        life: 3000,
      });
    } catch (error) {
      console.error("Error delivering:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo entregar",
        life: 3000,
      });
    } finally {
      setActionInProgress(null);
    }
  };

  const handleCancelClick = (note: ExitNote) => {
    setSelectedExitNote(note);
    setCancelReason("");
    setCancelDialog(true);
  };

  const handleCancelConfirm = async () => {
    try {
      if (!selectedExitNote) return;
      setActionInProgress(selectedExitNote.id);
      const result = await cancelExitNote(
        selectedExitNote.id,
        cancelReason || "",
      );
      const updated = result.data || result;
      setExitNotes((prev) =>
        prev.map((n) => (n.id === updated.id ? updated : n)),
      );
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: `Nota ${selectedExitNote.exitNoteNumber} cancelada`,
        life: 3000,
      });
      setCancelDialog(false);
    } catch (error) {
      console.error("Error cancelling:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cancelar",
        life: 3000,
      });
    } finally {
      setActionInProgress(null);
    }
  };

  const getWarehouseName = (warehouseId: string) => {
    return warehouses.find((w) => w.id === warehouseId)?.name || warehouseId;
  };

  const getStatusConfig = (status: ExitNoteStatus) => {
    return EXIT_NOTE_STATUS_CONFIG[status];
  };

  const getTypeLabel = (type: ExitNoteType) => {
    return EXIT_NOTE_TYPE_CONFIG[type].label;
  };

  // Templates
  const statusBodyTemplate = (rowData: ExitNote) => {
    const config = getStatusConfig(rowData.status);
    return <Tag value={config.label} severity={config.severity} rounded />;
  };

  const typeBodyTemplate = (rowData: ExitNote) => (
    <span>{getTypeLabel(rowData.type)}</span>
  );

  const dateBodyTemplate = (rowData: ExitNote) =>
    new Date(rowData.createdAt).toLocaleDateString("es-VE", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const itemsCountBodyTemplate = (rowData: ExitNote) => (
    <span className="font-bold">{rowData.items?.length || 0}</span>
  );

  const warehouseBodyTemplate = (rowData: ExitNote) => (
    <span>{getWarehouseName(rowData.warehouseId)}</span>
  );

  const actionBodyTemplate = (rowData: ExitNote) => {
    const { status } = rowData;
    const isLoading = actionInProgress === rowData.id;

    return (
      <div className="flex gap-1 flex-nowrap">
        {/* PENDING → Iniciar / Editar / Eliminar */}
        {status === "PENDING" && (
          <>
            <Button
              icon="pi pi-play"
              className="p-button-rounded p-button-success p-button-sm"
              tooltip="Iniciar"
              tooltipOptions={{ position: "top" }}
              onClick={() => handleStart(rowData)}
              loading={isLoading}
              disabled={isLoading}
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

        {/* IN_PROGRESS → Marcar como Listo / Cancelar / Ver */}
        {status === "IN_PROGRESS" && (
          <>
            <Button
              icon="pi pi-check"
              className="p-button-rounded p-button-info p-button-sm"
              tooltip="Marcar como Listo"
              tooltipOptions={{ position: "top" }}
              onClick={() => handleReady(rowData)}
              loading={isLoading}
              disabled={isLoading}
            />
            <Button
              icon="pi pi-times"
              className="p-button-rounded p-button-danger p-button-sm"
              tooltip="Cancelar"
              tooltipOptions={{ position: "top" }}
              onClick={() => handleCancelClick(rowData)}
            />
            <Button
              icon="pi pi-eye"
              className="p-button-rounded p-button-secondary p-button-sm"
              tooltip="Ver Detalle"
              tooltipOptions={{ position: "top" }}
              onClick={() => {
                setSelectedExitNote(rowData);
                setDetailDialogVisible(true);
              }}
            />
          </>
        )}

        {/* READY → Entregar / Cancelar / Ver */}
        {status === "READY" && (
          <>
            <Button
              icon="pi pi-send"
              className="p-button-rounded p-button-success p-button-sm"
              tooltip="Entregar"
              tooltipOptions={{ position: "top" }}
              onClick={() => handleDeliver(rowData)}
              loading={isLoading}
              disabled={isLoading}
            />
            <Button
              icon="pi pi-times"
              className="p-button-rounded p-button-danger p-button-sm"
              tooltip="Cancelar"
              tooltipOptions={{ position: "top" }}
              onClick={() => handleCancelClick(rowData)}
            />
            <Button
              icon="pi pi-eye"
              className="p-button-rounded p-button-secondary p-button-sm"
              tooltip="Ver Detalle"
              tooltipOptions={{ position: "top" }}
              onClick={() => {
                setSelectedExitNote(rowData);
                setDetailDialogVisible(true);
              }}
            />
          </>
        )}

        {/* DELIVERED / CANCELLED → Solo Ver */}
        {(status === "DELIVERED" || status === "CANCELLED") && (
          <Button
            icon="pi pi-eye"
            className="p-button-rounded p-button-secondary p-button-sm"
            tooltip="Ver Detalle"
            tooltipOptions={{ position: "top" }}
            onClick={() => {
              setSelectedExitNote(rowData);
              setDetailDialogVisible(true);
            }}
          />
        )}
      </div>
    );
  };

  const typeOptions = Object.values(ExitNoteType).map((t) => ({
    label: EXIT_NOTE_TYPE_CONFIG[t].label,
    value: t,
  }));

  const statusOptions = Object.values(ExitNoteStatus).map((s) => ({
    label: EXIT_NOTE_STATUS_CONFIG[s].label,
    value: s,
  }));

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <div className="flex align-items-center gap-2">
        <h4 className="m-0">Notas de Salida</h4>
        <span className="text-600 text-sm">({totalRecords} total)</span>
      </div>

      <div className="flex flex-wrap gap-2 align-items-center">
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            type="search"
            placeholder="Buscar..."
            value={globalFilterValue}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </span>

        <Dropdown
          value={selectedType}
          options={typeOptions}
          optionLabel="label"
          optionValue="value"
          onChange={(e) => {
            setSelectedType(e.value);
            setPage(0);
          }}
          placeholder="Tipo"
          showClear
          className="w-10rem"
        />

        <Dropdown
          value={selectedStatus}
          options={statusOptions}
          optionLabel="label"
          optionValue="value"
          onChange={(e) => {
            setSelectedStatus(e.value);
            setPage(0);
          }}
          placeholder="Estado"
          showClear
          className="w-10rem"
        />

        <CreateButton label="Nueva Salida" onClick={openNew} />
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
          value={exitNotes}
          lazy
          paginator
          first={page * rows}
          rows={rows}
          totalRecords={totalRecords}
          rowsPerPageOptions={[5, 10, 25, 50]}
          onPage={onPageChange}
          dataKey="id"
          loading={loading}
          header={header}
          emptyMessage="No se encontraron notas de salida"
          stripedRows
          sortMode="multiple"
        >
          <Column
            body={actionBodyTemplate}
            exportable={false}
            style={{ width: "4rem" }}
          />
          <Column field="exitNoteNumber" header="Nro. Nota" sortable />
          <Column header="Tipo" body={typeBodyTemplate} sortable />
          <Column header="Almacén" body={warehouseBodyTemplate} />
          <Column field="recipientName" header="Destinatario" />
          <Column
            header="Fecha"
            body={dateBodyTemplate}
            sortable
            field="createdAt"
          />
          <Column header="Items" body={itemsCountBodyTemplate} align="center" />
          <Column header="Estado" body={statusBodyTemplate} align="center" />
        </DataTable>

        <ExitNoteDetailDialog
          visible={detailDialogVisible}
          onHide={() => setDetailDialogVisible(false)}
          exitNote={selectedExitNote}
          onUpdate={loadExitNotes}
          toast={toast}
          items={items}
          warehouses={warehouses}
        />

        <Dialog
          visible={formDialog}
          style={{ width: "800px" }}
          header={
            <div className="mb-2 text-center md:text-left">
              <div className="border-bottom-2 border-primary pb-2">
                <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                  <i className="pi pi-external-link mr-3 text-primary text-3xl"></i>
                  Nueva Nota de Salida
                </h2>
              </div>
            </div>
          }
          modal
          onHide={() => setFormDialog(false)}
        >
          <ExitNoteForm
            exitNotes={exitNotes}
            setExitNotes={setExitNotes}
            hideFormDialog={() => setFormDialog(false)}
            showToast={(severity, summary, detail) =>
              toast.current?.show({ severity, summary, detail })
            }
            toast={toast}
            items={items}
            warehouses={warehouses}
          />
        </Dialog>

        {/* Delete confirmation */}
        <Dialog
          visible={deleteDialog}
          style={{ width: "450px" }}
          header="Confirmar Eliminación"
          modal
          onHide={() => setDeleteDialog(false)}
          footer={
            <>
              <Button
                label="No"
                icon="pi pi-times"
                text
                onClick={() => setDeleteDialog(false)}
              />
              <Button
                label="Sí, Eliminar"
                icon="pi pi-check"
                text
                severity="danger"
                onClick={async () => {
                  // TODO: Implement delete if needed
                  setDeleteDialog(false);
                }}
              />
            </>
          }
        >
          <div className="flex align-items-center justify-content-center">
            <i
              className="pi pi-exclamation-triangle mr-3"
              style={{ fontSize: "2rem" }}
            />
            {selectedExitNote && (
              <span>
                ¿Estás seguro de que deseas eliminar la nota{" "}
                <b>{selectedExitNote.exitNoteNumber}</b>?
              </span>
            )}
          </div>
        </Dialog>

        {/* Cancel confirmation */}
        <Dialog
          visible={cancelDialog}
          style={{ width: "500px" }}
          header="Cancelar Nota de Salida"
          modal
          onHide={() => setCancelDialog(false)}
          footer={
            <>
              <Button
                label="No"
                icon="pi pi-times"
                text
                onClick={() => setCancelDialog(false)}
              />
              <Button
                label="Sí, Cancelar"
                icon="pi pi-check"
                text
                severity="danger"
                onClick={handleCancelConfirm}
                loading={actionInProgress === selectedExitNote?.id}
              />
            </>
          }
        >
          <div className="mb-3">
            <h5>
              ¿Deseas cancelar la nota {selectedExitNote?.exitNoteNumber}?
            </h5>
            <p className="text-600 text-sm">
              Esta acción no se puede deshacer. Se revertirán los cambios
              realizados.
            </p>
          </div>
          <div>
            <label className="text-sm font-semibold">Motivo (opcional)</label>
            <textarea
              className="w-full p-2 border-1 border-gray-300 rounded"
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Ingresa el motivo de la cancelación..."
            />
          </div>
        </Dialog>
      </div>
    </motion.div>
  );
};

export default ExitNoteList;
