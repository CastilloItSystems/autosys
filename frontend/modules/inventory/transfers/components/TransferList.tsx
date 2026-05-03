"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { Tag } from "primereact/tag";
import { Dropdown } from "primereact/dropdown";
import { InputTextarea } from "primereact/inputtextarea";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Menu } from "primereact/menu";
import { MenuItem } from "primereact/menuitem";
import { motion } from "framer-motion";
import {
  Transfer,
  TransferStatus,
  TRANSFER_STATUS_CONFIG,
} from "@/modules/inventory/transfers/interfaces/transfer.interface";
import transferService from "@/modules/inventory/transfers/services/transferService";
import TransferForm from "./TransferForm";
import TransferDetail from "./TransferDetail";
import CreateButton from "@/components/common/CreateButton";
import { Warehouse } from "@/modules/inventory/warehouses/services/warehouseService";
import { handleFormError } from "@/utils/errorHandlers";
import dynamic from "next/dynamic";

const TransferPDFPreview = dynamic(() => import("./TransferPDFPreview"), { ssr: false });

interface TransferListProps {
  warehouseId?: string;
  warehouses: Warehouse[];
}

const STATUS_OPTIONS = [
  { label: "Todos", value: null },
  ...Object.entries(TRANSFER_STATUS_CONFIG).map(([value, config]) => ({
    label: config.label,
    value,
  })),
];

export default function TransferList({
  warehouseId,
  warehouses,
}: TransferListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preInvoiceFilter = searchParams.get("preInvoiceId") || "";
  const contextualSearchFilter = searchParams.get("search") || "";

  // Datos
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(
    null,
  );

  // Filtros y paginación
  const [searchQuery, setSearchQuery] = useState<string>(
    contextualSearchFilter,
  );
  const [filterStatus, setFilterStatus] = useState<TransferStatus | null>(null);
  const [page, setPage] = useState<number>(0);
  const [rows, setRows] = useState<number>(10);

  // UI
  const [loading, setLoading] = useState<boolean>(true);
  const [formDialog, setFormDialog] = useState<boolean>(false);
  const [detailDialog, setDetailDialog] = useState<boolean>(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [actionTransfer, setActionTransfer] = useState<Transfer | null>(null);

  // Rejection dialog state
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectingTransfer, setRejectingTransfer] = useState<Transfer | null>(
    null,
  );
  const [rejectionReason, setRejectionReason] = useState("");
  const [pdfItem, setPdfItem] = useState<Transfer | null>(null);

  const toast = useRef<Toast>(null);
  const menuRef = useRef<Menu>(null);

  // Cargar transferencias cuando cambien los filtros
  useEffect(() => {
    loadTransfers();
  }, [page, rows, searchQuery, filterStatus, warehouseId, preInvoiceFilter]);

  useEffect(() => {
    setSearchQuery(contextualSearchFilter);
    setPage(0);
  }, [contextualSearchFilter]);

  const loadTransfers = async () => {
    try {
      setLoading(true);
      const response = await transferService.getAll(page + 1, rows, {
        status: filterStatus || undefined,
        fromWarehouseId: warehouseId || undefined,
        preInvoiceId: preInvoiceFilter || undefined,
        search: searchQuery || undefined,
      });
      setTransfers(response.data || []);
      setTotalRecords(response.meta?.total || 0);
    } catch (error) {
      console.error("Error loading transfers:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar transferencias",
        life: 3000,
      });
      setTransfers([]);
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
    setSearchQuery(value);
    setPage(0);
  };

  const openNew = () => {
    setSelectedTransfer(null);
    setFormDialog(true);
  };

  const fetchFullTransfer = async (id: string) => {
    try {
      setLoading(true);
      const res = await transferService.getById(id);
      return res.data;
    } catch (error) {
      console.error("Error fetching transfer details:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar los detalles de la transferencia",
        life: 3000,
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const editTransfer = async (transfer: Transfer) => {
    const fullData = await fetchFullTransfer(transfer.id);
    if (fullData) {
      setSelectedTransfer(fullData);
      setFormDialog(true);
    }
  };

  const viewDetail = async (transfer: Transfer) => {
    const fullData = await fetchFullTransfer(transfer.id);
    if (fullData) {
      setSelectedTransfer(fullData);
      setDetailDialog(true);
    }
  };

  // ─── Action helpers ─────────────────────────────────────────────

  const withAction = async (
    transferId: string,
    action: () => Promise<void>,
  ) => {
    setActionInProgress(transferId);
    try {
      await action();
      loadTransfers();
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleSubmitForApproval = (transfer: Transfer) => {
    confirmDialog({
      message: `¿Enviar la transferencia ${transfer.transferNumber} para aprobación?`,
      header: "Confirmar Envío",
      icon: "pi pi-send",
      acceptLabel: "Enviar",
      rejectLabel: "Cancelar",
      accept: () =>
        withAction(transfer.id, async () => {
          await transferService.submit(transfer.id);
          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: "Transferencia enviada para aprobación",
            life: 3000,
          });
        }),
    });
  };

  const handleApprove = (transfer: Transfer) => {
    confirmDialog({
      message: `¿Aprobar la transferencia ${transfer.transferNumber}?`,
      header: "Confirmar Aprobación",
      icon: "pi pi-check",
      acceptLabel: "Aprobar",
      rejectLabel: "Cancelar",
      accept: () =>
        withAction(transfer.id, async () => {
          await transferService.approve(transfer.id);
          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: "Transferencia aprobada",
            life: 3000,
          });
        }),
    });
  };

  const handleSend = (transfer: Transfer) => {
    confirmDialog({
      message: `¿Enviar la transferencia ${transfer.transferNumber} a tránsito?`,
      header: "Confirmar Envío a Tránsito",
      icon: "pi pi-truck",
      acceptLabel: "Enviar",
      rejectLabel: "Cancelar",
      accept: () =>
        withAction(transfer.id, async () => {
          await transferService.send(transfer.id);
          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: "Transferencia enviada a tránsito",
            life: 3000,
          });
        }),
    });
  };

  const handleReceive = (transfer: Transfer) => {
    confirmDialog({
      message: `¿Confirmar recepción de la transferencia ${transfer.transferNumber}?`,
      header: "Confirmar Recepción",
      icon: "pi pi-download",
      acceptLabel: "Recibir",
      rejectLabel: "Cancelar",
      accept: () =>
        withAction(transfer.id, async () => {
          await transferService.receive(transfer.id);
          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: "Transferencia recibida correctamente",
            life: 3000,
          });
        }),
    });
  };

  const handleRejectOpen = (transfer: Transfer) => {
    setRejectingTransfer(transfer);
    setRejectionReason("");
    setShowRejectDialog(true);
  };

  const handleRejectConfirm = async () => {
    if (!rejectingTransfer || !rejectionReason.trim()) return;
    setShowRejectDialog(false);
    await withAction(rejectingTransfer.id, async () => {
      await transferService.reject(rejectingTransfer.id, {
        reason: rejectionReason.trim(),
      });
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Transferencia rechazada",
        life: 3000,
      });
    });
    setRejectingTransfer(null);
  };

  const handleCancel = (transfer: Transfer) => {
    confirmDialog({
      message: `¿Cancelar la transferencia ${transfer.transferNumber}?${
        transfer.status === TransferStatus.APPROVED
          ? " Se cancelarán las notas de salida/entrada asociadas y se revertirá la reserva de stock."
          : ""
      }`,
      header: "Confirmar Cancelación",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Cancelar Transferencia",
      rejectLabel: "Volver",
      acceptClassName: "p-button-danger",
      accept: () =>
        withAction(transfer.id, async () => {
          await transferService.cancel(transfer.id);
          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: "Transferencia cancelada correctamente",
            life: 3000,
          });
        }),
    });
  };

  const handleDeleteTransfer = (transfer: Transfer) => {
    confirmDialog({
      message: `¿Eliminar la transferencia ${transfer.transferNumber}? Esta acción no se puede deshacer.`,
      header: "Confirmar Eliminación",
      icon: "pi pi-trash",
      acceptLabel: "Eliminar",
      rejectLabel: "Cancelar",
      acceptClassName: "p-button-danger",
      accept: () =>
        withAction(transfer.id, async () => {
          await transferService.delete(transfer.id);
          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: "Transferencia eliminada correctamente",
            life: 3000,
          });
        }),
    });
  };

  const handleSave = () => {
    toast.current?.show({
      severity: "success",
      summary: "Éxito",
      detail: selectedTransfer?.id
        ? "Transferencia actualizada correctamente"
        : "Transferencia creada correctamente",
      life: 3000,
    });
    loadTransfers();
    setFormDialog(false);
  };

  // ─── Templates ──────────────────────────────────────────────────

  const transferNumberTemplate = (rowData: Transfer) => {
    return (
      <span className="font-bold text-primary">{rowData.transferNumber}</span>
    );
  };

  const statusTemplate = (rowData: Transfer) => {
    const config = TRANSFER_STATUS_CONFIG[rowData.status];
    return (
      <Tag
        value={config.label}
        severity={config.severity as any}
        icon={config.icon}
        rounded
      />
    );
  };

  const warehouseTemplate = (
    rowData: Transfer,
    field: "fromWarehouse" | "toWarehouse",
  ) => {
    const value = rowData[field];
    if (typeof value === "string") return value;
    return value?.name || "—";
  };

  const itemsCountTemplate = (rowData: Transfer) => {
    return rowData.items?.length ?? 0;
  };

  const dateTemplate = (rowData: Transfer) => {
    return new Date(rowData.createdAt).toLocaleDateString("es-ES");
  };

  const actionBodyTemplate = (rowData: Transfer) => {
    const isLoading = actionInProgress === rowData.id;
    const canCancel = [
      TransferStatus.DRAFT,
      TransferStatus.PENDING_APPROVAL,
      TransferStatus.APPROVED,
      TransferStatus.IN_TRANSIT,
    ].includes(rowData.status);

    return (
      <div className="flex gap-1 flex-nowrap">
        {rowData.status === TransferStatus.DRAFT && (
          <Button
            icon="pi pi-send"
            className="p-button-rounded p-button-warning p-button-sm"
            onClick={() => handleSubmitForApproval(rowData)}
            tooltip="Enviar para aprobación"
            loading={isLoading}
          />
        )}

        {rowData.status === TransferStatus.PENDING_APPROVAL && (
          <>
            <Button
              icon="pi pi-check"
              className="p-button-rounded p-button-success p-button-sm"
              onClick={() => handleApprove(rowData)}
              tooltip="Aprobar"
              loading={isLoading}
            />
            <Button
              icon="pi pi-ban"
              className="p-button-rounded p-button-danger p-button-sm"
              onClick={() => handleRejectOpen(rowData)}
              tooltip="Rechazar"
              loading={isLoading}
            />
          </>
        )}

        {rowData.status === TransferStatus.APPROVED && (
          <Button
            icon="pi pi-truck"
            className="p-button-rounded p-button-warning p-button-sm"
            onClick={() => handleSend(rowData)}
            tooltip="Enviar a tránsito"
            loading={isLoading}
          />
        )}

        {rowData.status === TransferStatus.IN_TRANSIT && (
          <Button
            icon="pi pi-download"
            className="p-button-rounded p-button-success p-button-sm"
            onClick={() => handleReceive(rowData)}
            tooltip="Recibir en destino"
            loading={isLoading}
          />
        )}

        {canCancel && (
          <Button
            icon="pi pi-times"
            className="p-button-rounded p-button-danger p-button-sm"
            onClick={() => handleCancel(rowData)}
            tooltip="Cancelar transferencia"
            loading={isLoading}
          />
        )}
      </div>
    );
  };

  const getMenuItems = (transfer: Transfer | null): MenuItem[] => {
    if (!transfer) {
      return [];
    }
    const items: MenuItem[] = [
      {
        label: "Imprimir PDF",
        icon: "pi pi-print",
        command: () => setPdfItem(transfer),
      },
      { separator: true },
      {
        label: "Ver detalle",
        icon: "pi pi-eye",
        command: () => {
          viewDetail(transfer);
        },
      },
      { separator: true },
      {
        label: "Ver detalle",
        icon: "pi pi-eye",
        command: () => {
          viewDetail(transfer);
        },
      },
      { separator: true },
      {
        label: "Ver detalle",
        icon: "pi pi-eye",
        command: () => {
          viewDetail(transfer);
        },
      },
    ];

    if (transfer.status === TransferStatus.DRAFT) {
      items.push(
        {
          label: "Editar",
          icon: "pi pi-pencil",
          command: () => {
            editTransfer(transfer);
          },
        },
        { separator: true },
        {
          label: "Eliminar",
          icon: "pi pi-trash",
          className: "p-menuitem-danger",
          command: () => {
            handleDeleteTransfer(transfer);
          },
        },
      );
    }

    return items;
  };

  const crudBodyTemplate = (rowData: Transfer) => {
    const isLoading = actionInProgress === rowData.id;

    return (
      <Button
        icon="pi pi-cog"
        rounded
        text
        onClick={(e) => {
          setActionTransfer(rowData);
          menuRef.current?.toggle(e);
        }}
        aria-controls="transfer-menu"
        aria-haspopup
        tooltip="Opciones"
        tooltipOptions={{ position: "left" }}
        disabled={isLoading}
      />
    );
  };

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <div className="flex align-items-center gap-2">
        <h4 className="m-0">Transferencias Entre Almacenes</h4>
        <span className="text-600 text-sm">({totalRecords} total)</span>
        {preInvoiceFilter && (
          <Tag
            value={`Pre-factura: ${preInvoiceFilter}`}
            severity="info"
            rounded
          />
        )}
      </div>
      <div className="flex gap-2">
        <Dropdown
          value={filterStatus}
          options={STATUS_OPTIONS}
          onChange={(e) => {
            setFilterStatus(e.value);
            setPage(0);
          }}
          placeholder="Filtrar por estado"
          className="w-15rem"
        />
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            type="search"
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </span>
        {preInvoiceFilter && (
          <Button
            label="Limpiar filtro"
            icon="pi pi-filter-slash"
            outlined
            onClick={() => router.push("/empresa/inventario/transferencias")}
          />
        )}
        <CreateButton label="Nueva Transferencia" onClick={openNew} />
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
      <ConfirmDialog />

      <div className="card">
        <DataTable
          value={transfers}
          paginator
          first={page * rows}
          rows={rows}
          totalRecords={totalRecords}
          rowsPerPageOptions={[5, 10, 25, 50]}
          onPage={onPageChange}
          dataKey="id"
          loading={loading}
          header={header}
          emptyMessage="No se encontraron transferencias"
          sortMode="multiple"
          lazy
          stripedRows
          scrollable
        >
          <Column
            header="Proceso"
            body={actionBodyTemplate}
            style={{ width: "7rem", textAlign: "center" }}
            headerStyle={{ textAlign: "center" }}
          />
          <Column
            field="transferNumber"
            header="Número"
            sortable
            body={transferNumberTemplate}
            style={{ minWidth: "140px" }}
          />
          <Column
            field="preInvoiceNumber"
            header="Pre-factura"
            body={(rowData: Transfer) => rowData.preInvoiceNumber ?? "—"}
            style={{ minWidth: "130px" }}
          />
          <Column
            header="Origen"
            body={(row) => warehouseTemplate(row, "fromWarehouse")}
            style={{ minWidth: "150px" }}
          />
          <Column
            header="Destino"
            body={(row) => warehouseTemplate(row, "toWarehouse")}
            style={{ minWidth: "150px" }}
          />
          <Column
            header="Items"
            body={itemsCountTemplate}
            style={{ minWidth: "80px" }}
          />
          <Column
            field="status"
            header="Estado"
            body={statusTemplate}
            sortable
            style={{ minWidth: "140px" }}
          />
          <Column
            header="Nota Salida"
            body={(rowData: Transfer) => {
              if (!rowData.exitNote) return "—";
              const statusMap: Record<
                string,
                { label: string; severity: string }
              > = {
                PENDING: { label: "Pendiente", severity: "warning" },
                IN_PROGRESS: { label: "En Proceso", severity: "info" },
                READY: { label: "Lista", severity: "info" },
                DELIVERED: { label: "Entregada", severity: "success" },
                CANCELLED: { label: "Cancelada", severity: "danger" },
              };
              const s = statusMap[rowData.exitNote.status] || {
                label: rowData.exitNote.status,
                severity: "info",
              };
              return (
                <div className="flex flex-column gap-1">
                  <span className="text-xs text-500">
                    {rowData.exitNote.exitNoteNumber}
                  </span>
                  <Tag
                    value={s.label}
                    severity={s.severity as any}
                    rounded
                    style={{ fontSize: "0.7rem" }}
                  />
                </div>
              );
            }}
            style={{ minWidth: "130px" }}
          />
          <Column
            header="Nota Entrada"
            body={(rowData: Transfer) => {
              if (!rowData.entryNote) return "—";
              const statusMap: Record<
                string,
                { label: string; severity: string }
              > = {
                PENDING: { label: "Pendiente", severity: "warning" },
                IN_PROGRESS: { label: "En Proceso", severity: "info" },
                COMPLETED: { label: "Completada", severity: "success" },
                CANCELLED: { label: "Cancelada", severity: "danger" },
              };
              const s = statusMap[rowData.entryNote.status] || {
                label: rowData.entryNote.status,
                severity: "info",
              };
              return (
                <div className="flex flex-column gap-1">
                  <span className="text-xs text-500">
                    {rowData.entryNote.entryNoteNumber}
                  </span>
                  <Tag
                    value={s.label}
                    severity={s.severity as any}
                    rounded
                    style={{ fontSize: "0.7rem" }}
                  />
                </div>
              );
            }}
            style={{ minWidth: "130px" }}
          />
          <Column
            header="Tránsito"
            body={(rowData: Transfer) => {
              if (!rowData.exitNote || !rowData.entryNote) return "—";
              const exitDelivered = rowData.exitNote.status === "DELIVERED";
              const entryCompleted = rowData.entryNote.status === "COMPLETED";
              const cancelled =
                rowData.exitNote.status === "CANCELLED" ||
                rowData.entryNote.status === "CANCELLED";
              if (cancelled)
                return (
                  <Tag
                    value="Cancelada"
                    severity="danger"
                    rounded
                    style={{ fontSize: "0.7rem" }}
                  />
                );
              if (exitDelivered && entryCompleted)
                return (
                  <Tag
                    value="Completada"
                    severity="success"
                    rounded
                    style={{ fontSize: "0.7rem" }}
                  />
                );
              if (exitDelivered && !entryCompleted)
                return (
                  <Tag
                    icon="pi pi-truck"
                    value="En Tránsito"
                    severity="warning"
                    rounded
                    style={{ fontSize: "0.7rem" }}
                  />
                );
              return (
                <Tag
                  value="Pendiente"
                  severity="info"
                  rounded
                  style={{ fontSize: "0.7rem" }}
                />
              );
            }}
            style={{ minWidth: "120px" }}
          />
          <Column
            field="createdAt"
            header="Fecha Creación"
            body={dateTemplate}
            sortable
            style={{ minWidth: "120px" }}
          />
          <Column
            header="Acciones"
            body={crudBodyTemplate}
            exportable={false}
            frozen
            alignFrozen="right"
            style={{ width: "6rem", textAlign: "center" }}
            headerStyle={{ textAlign: "center" }}
          />
        </DataTable>
      </div>

      {/* Dialog Crear / Editar */}
      <Dialog
        visible={formDialog}
        style={{ width: "90vw", maxWidth: "800px" }}
        header={
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-arrow-right-arrow-left mr-3 text-primary text-3xl"></i>
                {selectedTransfer?.id
                  ? "Modificar Transferencia"
                  : "Crear Transferencia"}
              </h2>
            </div>
          </div>
        }
        modal
        className="p-fluid"
        onHide={() => setFormDialog(false)}
      >
        <TransferForm
          transfer={selectedTransfer}
          warehouses={warehouses}
          onSave={handleSave}
          onCancel={() => setFormDialog(false)}
          toast={toast}
        />
      </Dialog>

      {/* Dialog Detalle */}
      {selectedTransfer && (
        <Dialog
          visible={detailDialog}
          style={{ width: "90vw", maxWidth: "900px" }}
          header={
            <div className="mb-2 text-center md:text-left">
              <div className="border-bottom-2 border-primary pb-2">
                <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                  <i className="pi pi-eye mr-3 text-primary text-3xl"></i>
                  Transferencia: {selectedTransfer.transferNumber}
                </h2>
              </div>
            </div>
          }
          modal
          onHide={() => {
            setDetailDialog(false);
            setSelectedTransfer(null);
          }}
        >
          <TransferDetail transfer={selectedTransfer} />
        </Dialog>
      )}

      {/* Dialog Rechazo */}
      <Dialog
        visible={showRejectDialog}
        style={{ width: "450px" }}
        breakpoints={{ "1400px": "450px", "900px": "60vw", "600px": "90vw" }}
        maximizable
        header="Rechazar Transferencia"
        modal
        footer={
          <>
            <Button
              label="No"
              icon="pi pi-times"
              outlined
              onClick={() => {
                setShowRejectDialog(false);
                setRejectingTransfer(null);
              }}
            />
            <Button
              label="Rechazar"
              icon="pi pi-ban"
              severity="danger"
              onClick={handleRejectConfirm}
              disabled={!rejectionReason.trim()}
            />
          </>
        }
        onHide={() => {
          setShowRejectDialog(false);
          setRejectingTransfer(null);
        }}
      >
        <div className="confirmation-content flex flex-column gap-3">
          <div className="flex align-items-center gap-3">
            <i
              className="pi pi-exclamation-triangle"
              style={{ fontSize: "2rem", color: "var(--red-500)" }}
            />
            <span>
              Indique la razón del rechazo para{" "}
              <b>{rejectingTransfer?.transferNumber}</b>:
            </span>
          </div>
          <InputTextarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={4}
            placeholder="Razón del rechazo..."
            className="w-full"
            maxLength={500}
          />
          <small className="text-600">
            {rejectionReason.length}/500 caracteres
          </small>
        </div>
      </Dialog>

      <Menu
        model={getMenuItems(actionTransfer)}
        popup
        ref={menuRef}
        id="transfer-menu"
      />

      {/* PDF Preview Dialog */}
      {pdfItem && (
        <Dialog
          visible
          onHide={() => setPdfItem(null)}
          header="Vista Previa — Transferencia"
          style={{ width: "85%", height: "90vh" }}
          contentStyle={{ padding: 0, height: "100%" }}
          modal
        >
          <TransferPDFPreview data={pdfItem} />
        </Dialog>
      )}
    </motion.div>
  );
}
