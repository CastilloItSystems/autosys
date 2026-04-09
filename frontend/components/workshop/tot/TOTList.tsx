"use client";
import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Menu } from "primereact/menu";
import { MenuItem } from "primereact/menuitem";
import { InputText } from "primereact/inputtext";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { Dropdown } from "primereact/dropdown";
import { motion } from "framer-motion";
import CreateButton from "@/components/common/CreateButton";
import FormActionButtons from "@/components/common/FormActionButtons";
import DeleteConfirmDialog from "@/components/common/DeleteConfirmDialog";
import {
  confirmAction,
  ConfirmActionPopup,
} from "@/components/common/ConfirmAction";
import { handleFormError } from "@/utils/errorHandlers";
import { totService } from "@/app/api/workshop";
import type {
  WorkshopTOT,
  TOTStatus,
  TOTDocumentType,
} from "@/libs/interfaces/workshop";
import TOTStatusBadge, { TOT_STATUS_LABELS } from "./TOTStatusBadge";
import TOTForm from "./TOTForm";
import TOTStepper from "./TOTStepper";

interface Props {
  serviceOrderId?: string;
  embedded?: boolean;
}

const STATUS_OPTIONS = Object.entries(TOT_STATUS_LABELS).map(
  ([value, label]) => ({ label, value }),
);

const VALID_TRANSITIONS: Record<TOTStatus, TOTStatus[]> = {
  REQUESTED: ["APPROVED", "CANCELLED"],
  APPROVED: ["DEPARTED", "CANCELLED"],
  DEPARTED: ["IN_PROGRESS", "RETURNED"],
  IN_PROGRESS: ["RETURNED", "CANCELLED"],
  RETURNED: ["INVOICED"],
  INVOICED: [],
  CANCELLED: [],
};

export default function TOTList({ serviceOrderId, embedded }: Props) {
  const [items, setItems] = useState<WorkshopTOT[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selected, setSelected] = useState<WorkshopTOT | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TOTStatus | undefined>();
  const [supplierId] = useState<string | undefined>();
  const [page, setPage] = useState(0);
  const [rows] = useState(20);
  const [loading, setLoading] = useState(true);
  const [formDialog, setFormDialog] = useState(false);
  const [editItem, setEditItem] = useState<WorkshopTOT | null>(null);
  const [statusDialog, setStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState<TOTStatus | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionItem, setActionItem] = useState<WorkshopTOT | null>(null);
  const [expandedRows, setExpandedRows] = useState<any>(null);
  const [documentDialog, setDocumentDialog] = useState(false);
  const [documentItem, setDocumentItem] = useState<WorkshopTOT | null>(null);
  const [documentType, setDocumentType] = useState<TOTDocumentType | null>(
    null,
  );
  const [documentUrl, setDocumentUrl] = useState("");
  const [documentDescription, setDocumentDescription] = useState("");
  const [isAddingDocument, setIsAddingDocument] = useState(false);
  const menuRef = useRef<Menu>(null);
  const toast = useRef<Toast>(null);

  const loadItems = async () => {
    try {
      setLoading(true);
      const res = await totService.getAll({
        serviceOrderId: serviceOrderId || undefined,
        status: statusFilter,
        supplierId: supplierId || undefined,
        search: searchQuery || undefined,
        page: page + 1,
        limit: rows,
      });
      setItems(res.data ?? []);
      setTotalRecords(res.meta?.total ?? 0);
    } catch (error) {
      handleFormError(error, toast);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (embedded && !serviceOrderId) return;
    setPage(0);
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceOrderId, statusFilter, searchQuery, embedded]);

  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleSaved = () => {
    toast.current?.show({
      severity: "success",
      summary: "Éxito",
      detail: editItem ? "T.O.T. actualizado" : "T.O.T. creado",
      life: 3000,
    });
    loadItems();
    setFormDialog(false);
    setEditItem(null);
  };

  const openEdit = (item: WorkshopTOT) => {
    setEditItem(item);
    setFormDialog(true);
  };

  const openStatusChange = (item: WorkshopTOT) => {
    setSelected(item);
    setNewStatus(undefined);
    setStatusDialog(true);
  };

  const handleStatusChange = async () => {
    if (!selected || !newStatus) return;
    setIsSubmitting(true);
    try {
      await totService.updateStatus(selected.id, newStatus);
      toast.current?.show({
        severity: "success",
        summary: "Estado actualizado",
        life: 3000,
      });
      loadItems();
      setStatusDialog(false);
      setSelected(null);
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setIsDeleting(true);
    try {
      await totService.remove(selected.id);
      toast.current?.show({
        severity: "success",
        summary: "T.O.T. eliminado",
        life: 3000,
      });
      loadItems();
      setDeleteDialog(false);
      setSelected(null);
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmDeleteItem = (item: WorkshopTOT) => {
    setSelected(item);
    setDeleteDialog(true);
  };

  const handleStatusTransition = async (
    item: WorkshopTOT,
    newStatus: TOTStatus,
  ) => {
    try {
      await totService.updateStatus(item.id, newStatus);
      toast.current?.show({
        severity: "success",
        summary: "Estado actualizado",
        detail: `T.O.T. ${item.totNumber} actualizado`,
        life: 3000,
      });
      await loadItems();
    } catch (error) {
      handleFormError(error, toast);
    }
  };

  const openDocumentDialog = (item: WorkshopTOT) => {
    setDocumentItem(item);
    setDocumentType(null);
    setDocumentUrl("");
    setDocumentDescription("");
    setDocumentDialog(true);
  };

  const handleAddDocument = async () => {
    if (!documentItem || !documentType || !documentUrl) return;
    setIsAddingDocument(true);
    try {
      await totService.addDocument(documentItem.id, {
        type: documentType,
        url: documentUrl,
        description: documentDescription || null,
      });
      toast.current?.show({
        severity: "success",
        summary: "Documento agregado",
        detail: "El documento se agregó exitosamente",
        life: 3000,
      });
      setDocumentDialog(false);
      loadItems();
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setIsAddingDocument(false);
    }
  };

  // ── Column Templates ────────────────────────────────────────────────────────

  const numberTemplate = (row: WorkshopTOT) => (
    <span className="font-bold text-primary">{row.totNumber}</span>
  );

  const statusTemplate = (row: WorkshopTOT) => (
    <TOTStatusBadge status={row.status} />
  );

  const orderTemplate = (row: WorkshopTOT) =>
    row.serviceOrder ? (
      <span className="font-semibold">{row.serviceOrder.folio}</span>
    ) : (
      <span className="text-500 text-sm">
        {row.serviceOrderId.slice(0, 8)}…
      </span>
    );

  const providerTemplate = (row: WorkshopTOT) =>
    row.supplier?.name ??
    row.providerName ?? (
      <span className="text-500 text-sm italic">Sin proveedor</span>
    );

  const costTemplate = (row: WorkshopTOT) =>
    row.finalCost != null ? (
      <span className="font-semibold">
        {Number(row.finalCost).toLocaleString("es-VE", {
          style: "currency",
          currency: "USD",
        })}
      </span>
    ) : row.providerQuote != null ? (
      <span className="text-500">
        ~
        {Number(row.providerQuote).toLocaleString("es-VE", {
          style: "currency",
          currency: "USD",
        })}
      </span>
    ) : (
      <span className="text-500 text-sm">—</span>
    );

  const transitionBodyTemplate = (rowData: WorkshopTOT) => {
    const { status } = rowData;

    return (
      <div className="flex gap-1 flex-nowrap">
        {status === "REQUESTED" && (
          <>
            <Button
              icon="pi pi-check"
              className="p-button-rounded p-button-success p-button-sm"
              tooltip="Aprobar"
              tooltipOptions={{ position: "top" }}
              onClick={(e) =>
                confirmAction({
                  target: e.currentTarget as EventTarget & HTMLElement,
                  message: `¿Aprobar T.O.T. ${rowData.totNumber}?`,
                  icon: "pi pi-check",
                  iconClass: "text-green-500",
                  acceptLabel: "Aprobar",
                  acceptSeverity: "success",
                  onAccept: () => handleStatusTransition(rowData, "APPROVED"),
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
                  message: `¿Cancelar T.O.T. ${rowData.totNumber}?`,
                  icon: "pi pi-ban",
                  iconClass: "text-red-500",
                  acceptLabel: "Cancelar",
                  acceptSeverity: "danger",
                  onAccept: () => handleStatusTransition(rowData, "CANCELLED"),
                })
              }
            />
          </>
        )}
        {status === "APPROVED" && (
          <>
            <Button
              icon="pi pi-arrow-right"
              className="p-button-rounded p-button-info p-button-sm"
              tooltip="Enviar"
              tooltipOptions={{ position: "top" }}
              onClick={(e) =>
                confirmAction({
                  target: e.currentTarget as EventTarget & HTMLElement,
                  message: `¿Enviar T.O.T. ${rowData.totNumber}?`,
                  icon: "pi pi-arrow-right",
                  iconClass: "text-blue-500",
                  acceptLabel: "Enviar",
                  acceptSeverity: "info",
                  onAccept: () => handleStatusTransition(rowData, "DEPARTED"),
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
                  message: `¿Cancelar T.O.T. ${rowData.totNumber}?`,
                  icon: "pi pi-ban",
                  iconClass: "text-red-500",
                  acceptLabel: "Cancelar",
                  acceptSeverity: "danger",
                  onAccept: () => handleStatusTransition(rowData, "CANCELLED"),
                })
              }
            />
          </>
        )}
        {status === "DEPARTED" && (
          <>
            <Button
              icon="pi pi-play"
              className="p-button-rounded p-button-success p-button-sm"
              tooltip="En Progreso"
              tooltipOptions={{ position: "top" }}
              onClick={(e) =>
                confirmAction({
                  target: e.currentTarget as EventTarget & HTMLElement,
                  message: `¿Iniciar trabajo en T.O.T. ${rowData.totNumber}?`,
                  icon: "pi pi-play",
                  iconClass: "text-green-500",
                  acceptLabel: "Iniciar",
                  acceptSeverity: "success",
                  onAccept: () =>
                    handleStatusTransition(rowData, "IN_PROGRESS"),
                })
              }
            />
            <Button
              icon="pi pi-arrow-left"
              className="p-button-rounded p-button-warning p-button-sm"
              tooltip="Retornado"
              tooltipOptions={{ position: "top" }}
              onClick={(e) =>
                confirmAction({
                  target: e.currentTarget as EventTarget & HTMLElement,
                  message: `¿Marcar como retornado T.O.T. ${rowData.totNumber}?`,
                  icon: "pi pi-arrow-left",
                  iconClass: "text-orange-500",
                  acceptLabel: "Retornar",
                  acceptSeverity: "warning",
                  onAccept: () => handleStatusTransition(rowData, "RETURNED"),
                })
              }
            />
          </>
        )}
        {status === "IN_PROGRESS" && (
          <>
            <Button
              icon="pi pi-arrow-left"
              className="p-button-rounded p-button-warning p-button-sm"
              tooltip="Retornado"
              tooltipOptions={{ position: "top" }}
              onClick={(e) =>
                confirmAction({
                  target: e.currentTarget as EventTarget & HTMLElement,
                  message: `¿Marcar como retornado T.O.T. ${rowData.totNumber}?`,
                  icon: "pi pi-arrow-left",
                  iconClass: "text-orange-500",
                  acceptLabel: "Retornar",
                  acceptSeverity: "warning",
                  onAccept: () => handleStatusTransition(rowData, "RETURNED"),
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
                  message: `¿Cancelar T.O.T. ${rowData.totNumber}?`,
                  icon: "pi pi-ban",
                  iconClass: "text-red-500",
                  acceptLabel: "Cancelar",
                  acceptSeverity: "danger",
                  onAccept: () => handleStatusTransition(rowData, "CANCELLED"),
                })
              }
            />
          </>
        )}
        {status === "RETURNED" && (
          <Button
            icon="pi pi-file"
            className="p-button-rounded p-button-info p-button-sm"
            tooltip="Facturar"
            tooltipOptions={{ position: "top" }}
            onClick={(e) =>
              confirmAction({
                target: e.currentTarget as EventTarget & HTMLElement,
                message: `¿Facturar T.O.T. ${rowData.totNumber}?`,
                icon: "pi pi-file",
                iconClass: "text-blue-500",
                acceptLabel: "Facturar",
                acceptSeverity: "info",
                onAccept: () => handleStatusTransition(rowData, "INVOICED"),
              })
            }
          />
        )}
      </div>
    );
  };

  const getMenuItems = (item: WorkshopTOT | null): MenuItem[] => {
    if (!item) return [];
    const nextStatuses = VALID_TRANSITIONS[item.status];
    const items: MenuItem[] = [];

    if (nextStatuses.length > 0) {
      items.push({
        label: "Cambiar estado",
        icon: "pi pi-sync",
        command: () => openStatusChange(item),
      });
    }

    if (["REQUESTED"].includes(item.status)) {
      items.push({
        label: "Editar",
        icon: "pi pi-pencil",
        command: () => openEdit(item),
      });
    }

    if (["REQUESTED", "CANCELLED"].includes(item.status)) {
      if (items.length > 0) items.push({ separator: true });
      items.push({
        label: "Eliminar",
        icon: "pi pi-trash",
        className: "p-menuitem-danger",
        command: () => confirmDeleteItem(item),
      });
    }

    return items;
  };

  const actionsTemplate = (row: WorkshopTOT) => {
    return (
      <Button
        icon="pi pi-cog"
        rounded
        text
        onClick={(e) => {
          setActionItem(row);
          menuRef.current?.toggle(e);
        }}
        aria-controls="item-menu"
        aria-haspopup
        tooltip="Opciones"
        tooltipOptions={{ position: "left" }}
      />
    );
  };

  const rowExpansionTemplate = (data: WorkshopTOT) => {
    return (
      <div className="p-3 space-y-3">
        <TOTStepper currentStatus={data.status} />

        {/* Timeline de fechas importantes */}
        <div className="flex gap-3 justify-content-center my-3 flex-wrap">
          {data.departedAt && (
            <div className="flex align-items-center gap-2 px-3 py-2 border-round bg-blue-50 border-1 border-blue-200">
              <i className="pi pi-arrow-right text-blue-500" />
              <div>
                <span className="text-xs font-bold text-500">Salida</span>
                <div className="text-sm font-semibold text-900">
                  {new Date(data.departedAt).toLocaleDateString("es-VE", {
                    day: "2-digit",
                    month: "short",
                    year: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          )}
          {data.returnedAt && (
            <div className="flex align-items-center gap-2 px-3 py-2 border-round bg-green-50 border-1 border-green-200">
              <i className="pi pi-arrow-left text-green-500" />
              <div>
                <span className="text-xs font-bold text-500">Retorno</span>
                <div className="text-sm font-semibold text-900">
                  {new Date(data.returnedAt).toLocaleDateString("es-VE", {
                    day: "2-digit",
                    month: "short",
                    year: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          )}
          {data.estimatedReturnAt && !data.returnedAt && (
            <div className="flex align-items-center gap-2 px-3 py-2 border-round bg-orange-50 border-1 border-orange-200">
              <i className="pi pi-calendar text-orange-500" />
              <div>
                <span className="text-xs font-bold text-500">Estimado</span>
                <div className="text-sm font-semibold text-900">
                  {new Date(data.estimatedReturnAt).toLocaleDateString(
                    "es-VE",
                    {
                      day: "2-digit",
                      month: "short",
                      year: "2-digit",
                    },
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Grid de información */}
        <div className="grid gap-2 grid-cols-2 md:grid-cols-4">
          {data.partSerial && (
            <div className="p-2 border-round bg-surface-50 border-1 border-surface-200">
              <span className="text-xs font-bold text-500 block">Serial</span>
              <span className="text-sm font-semibold text-900 block truncate">
                {data.partSerial}
              </span>
            </div>
          )}
          {data.providerQuote && (
            <div className="p-2 border-round bg-surface-50 border-1 border-surface-200">
              <span className="text-xs font-bold text-500 block">
                Presupuesto
              </span>
              <span className="text-sm font-semibold text-900 block">
                ${Number(data.providerQuote).toLocaleString("es-VE")}
              </span>
            </div>
          )}
          {data.finalCost && (
            <div className="p-2 border-round bg-green-50 border-1 border-green-200">
              <span className="text-xs font-bold text-500 block">
                Costo Final
              </span>
              <span className="text-sm font-semibold text-green-700 block">
                ${Number(data.finalCost).toLocaleString("es-VE")}
              </span>
            </div>
          )}
          {data.departureRef && (
            <div className="p-2 border-round bg-surface-50 border-1 border-surface-200">
              <span className="text-xs font-bold text-500 block">
                Ref. Envío
              </span>
              <span className="text-sm font-semibold text-900 block truncate">
                {data.departureRef}
              </span>
            </div>
          )}
          {data.providerInvoiceRef && (
            <div className="p-2 border-round bg-surface-50 border-1 border-surface-200">
              <span className="text-xs font-bold text-500 block">
                Factura Prov.
              </span>
              <span className="text-sm font-semibold text-900 block truncate">
                {data.providerInvoiceRef}
              </span>
            </div>
          )}
        </div>

        {/* Detalles del Proveedor */}
        {(data.supplier || data.providerName) && (
          <div className="p-3 border-round bg-blue-50 border-1 border-blue-200">
            <div className="text-xs font-bold text-500 uppercase mb-2">
              Proveedor
            </div>
            <div className="grid gap-2 grid-cols-2 md:grid-cols-4">
              <div>
                <div className="text-xs text-500">Nombre</div>
                <div className="font-semibold text-900">
                  {data.supplier?.name || data.providerName}
                </div>
              </div>
              {data.supplier?.code && (
                <div>
                  <div className="text-xs text-500">Código</div>
                  <div className="font-semibold text-900">
                    {data.supplier.code}
                  </div>
                </div>
              )}
              {data.supplier?.specialty && (
                <div>
                  <div className="text-xs text-500">Especialidad</div>
                  <div className="font-semibold text-900">
                    {data.supplier.specialty}
                  </div>
                </div>
              )}
              {data.supplier?.phone && (
                <div>
                  <div className="text-xs text-500">Teléfono</div>
                  <a
                    href={`tel:${data.supplier.phone}`}
                    className="font-semibold text-primary hover:text-primary-600"
                  >
                    {data.supplier.phone}
                  </a>
                </div>
              )}
              {data.supplier?.email && (
                <div>
                  <div className="text-xs text-500">Email</div>
                  <a
                    href={`mailto:${data.supplier.email}`}
                    className="font-semibold text-primary hover:text-primary-600 block truncate"
                  >
                    {data.supplier.email}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Fotos */}
        {data.photoUrls && data.photoUrls.length > 0 && (
          <div className="p-3 border-round bg-surface-50 border-1 border-surface-200">
            <div className="text-xs font-bold text-500 uppercase mb-2 flex align-items-center gap-2">
              <i className="pi pi-images" />
              Fotos ({data.photoUrls.length})
            </div>
            <div className="flex gap-2 flex-wrap">
              {data.photoUrls.map((url, idx) => (
                <a
                  key={idx}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block"
                >
                  <img
                    src={url}
                    alt={`Foto ${idx + 1}`}
                    style={{
                      maxWidth: "150px",
                      maxHeight: "120px",
                      objectFit: "cover",
                      borderRadius: "6px",
                      cursor: "pointer",
                      border: "1px solid var(--surface-300)",
                    }}
                  />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Documentos */}
        <div className="p-3 border-round bg-surface-50 border-1 border-surface-200">
          <div className="flex justify-between align-items-center mb-3">
            <div className="text-xs font-bold text-500 uppercase flex align-items-center gap-2">
              <i className="pi pi-paperclip" />
              Documentos{" "}
              {data.documents &&
                data.documents.length > 0 &&
                `(${data.documents.length})`}
            </div>
            <Button
              icon="pi pi-plus"
              size="small"
              className="p-button-sm p-button-text"
              onClick={() => openDocumentDialog(data)}
              tooltip="Agregar documento"
            />
          </div>
          {data.documents && data.documents.length > 0 ? (
            <div className="flex gap-2 flex-wrap">
              {data.documents.map((doc) => (
                <a
                  key={doc.id}
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 border-round bg-white border-1 border-surface-300 text-primary hover:bg-primary-50 font-semibold text-sm flex align-items-center gap-2 transition-colors"
                >
                  <i className="pi pi-file" />
                  <span className="uppercase text-xs">
                    {doc.type.replace(/_/g, " ")}
                  </span>
                </a>
              ))}
            </div>
          ) : (
            <p className="text-500 text-sm m-0">
              No hay documentos registrados
            </p>
          )}
        </div>

        {data.technicalInstruction && (
          <div className="p-2 bg-blue-50 border-round border-1 border-blue-100">
            <span className="text-xs font-bold text-500 uppercase">
              Instrucción técnica:{" "}
            </span>
            <span className="text-sm">{data.technicalInstruction}</span>
          </div>
        )}
        {data.notes && (
          <div className="p-2 bg-gray-50 border-round border-1 border-gray-200">
            <span className="text-xs font-bold text-500 uppercase">
              Notas:{" "}
            </span>
            <span className="text-sm">{data.notes}</span>
          </div>
        )}
      </div>
    );
  };

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <div className="flex align-items-center gap-2">
        <h4 className="m-0">Servicios Externos (T.O.T.)</h4>
        <span className="text-600 text-sm">({totalRecords} total)</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {!embedded && (
          <>
            <span className="p-input-icon-left">
              <i className="pi pi-search" />
              <InputText
                type="search"
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(0);
                }}
                style={{ width: "14rem" }}
              />
            </span>
            <Dropdown
              value={statusFilter}
              options={STATUS_OPTIONS}
              onChange={(e) => {
                setStatusFilter(e.value);
                setPage(0);
              }}
              placeholder="Todos los estados"
              showClear
              style={{ width: "12rem" }}
            />
          </>
        )}
        <CreateButton
          label="Nuevo T.O.T."
          onClick={() => {
            setEditItem(null);
            setFormDialog(true);
          }}
          tooltip="Registrar nuevo T.O.T."
        />
      </div>
    </div>
  );

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Toast ref={toast} />
      <ConfirmActionPopup />

      <div className="card">
        {/* Table */}
        <DataTable
          value={items}
          loading={loading}
          paginator
          lazy
          scrollable
          sortMode="multiple"
          rows={rows}
          rowsPerPageOptions={[5, 10, 25, 50]}
          totalRecords={totalRecords}
          first={page * rows}
          onPage={(e) => setPage(e.page ?? 0)}
          emptyMessage="No hay T.O.T. registrados"
          header={header}
          stripedRows
          size="small"
          className="p-datatable-sm"
          expandedRows={expandedRows}
          onRowToggle={(e) => setExpandedRows(e.data)}
          rowExpansionTemplate={rowExpansionTemplate}
        >
          <Column expander style={{ width: "3rem" }} />
          <Column
            header="Proceso"
            body={transitionBodyTemplate}
            style={{ minWidth: "140px", textAlign: "center" }}
            headerStyle={{ textAlign: "center" }}
          />
          <Column
            body={numberTemplate}
            header="Número"
            style={{ width: "8rem" }}
          />
          {!embedded && (
            <Column body={orderTemplate} header="Orden de Servicio" />
          )}
          <Column body={providerTemplate} header="Proveedor" />
          <Column
            field="partDescription"
            header="Pieza"
            style={{ maxWidth: "16rem" }}
          />
          <Column
            body={statusTemplate}
            header="Estado"
            style={{ width: "9rem" }}
          />
          <Column
            body={costTemplate}
            header="Costo"
            style={{ width: "9rem" }}
          />
          <Column
            header="Acciones"
            body={actionsTemplate}
            exportable={false}
            frozen={true}
            alignFrozen="right"
            style={{ width: "6rem", textAlign: "center" }}
            headerStyle={{ textAlign: "center" }}
          />
        </DataTable>
      </div>

      {/* Form Dialog */}
      <Dialog
        header={
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-wrench mr-3 text-primary text-3xl"></i>
                {editItem ? "Editar T.O.T." : "Nuevo T.O.T."}
              </h2>
            </div>
          </div>
        }
        visible={formDialog}
        onHide={() => {
          setFormDialog(false);
          setEditItem(null);
        }}
        style={{ width: "60rem" }}
        breakpoints={{ "1400px": "75vw", "900px": "85vw", "600px": "95vw" }}
        maximizable
        modal
        draggable={false}
        footer={
          <FormActionButtons
            formId="tot-form"
            isUpdate={!!editItem}
            isSubmitting={isSubmitting}
            onCancel={() => {
              setFormDialog(false);
              setEditItem(null);
            }}
          />
        }
      >
        <TOTForm
          item={editItem}
          serviceOrderId={serviceOrderId}
          formId="tot-form"
          toast={toast}
          onSaved={handleSaved}
          onSubmittingChange={setIsSubmitting}
        />
      </Dialog>

      {/* Status Change Dialog */}
      <Dialog
        header={`Cambiar estado: ${selected?.totNumber}`}
        visible={statusDialog}
        onHide={() => setStatusDialog(false)}
        style={{ width: "28rem" }}
        modal
        draggable={false}
      >
        {selected && (
          <div className="flex flex-column gap-4 p-2">
            <p className="text-600 m-0">
              Estado actual: <TOTStatusBadge status={selected.status} />
            </p>
            <Dropdown
              value={newStatus}
              options={VALID_TRANSITIONS[selected.status].map((s) => ({
                label: TOT_STATUS_LABELS[s],
                value: s,
              }))}
              onChange={(e) => setNewStatus(e.value)}
              placeholder="Seleccionar nuevo estado"
              className="w-full"
            />
            <div className="flex gap-2 justify-content-end">
              <Button
                label="Cancelar"
                severity="secondary"
                outlined
                onClick={() => setStatusDialog(false)}
              />
              <Button
                label="Guardar"
                disabled={!newStatus || isSubmitting}
                loading={isSubmitting}
                onClick={handleStatusChange}
              />
            </div>
          </div>
        )}
      </Dialog>

      <DeleteConfirmDialog
        visible={deleteDialog}
        onHide={() => {
          setDeleteDialog(false);
          setSelected(null);
        }}
        onConfirm={handleDelete}
        itemName={selected?.totNumber}
        isDeleting={isDeleting}
      />

      {/* Add Document Dialog */}
      <Dialog
        header={`Agregar Documento - ${documentItem?.totNumber}`}
        visible={documentDialog}
        onHide={() => setDocumentDialog(false)}
        style={{ width: "32rem" }}
        modal
        draggable={false}
      >
        <div className="flex flex-column gap-4 p-2">
          <div>
            <label className="text-sm font-semibold block mb-2">
              Tipo de Documento <span className="text-red-500">*</span>
            </label>
            <Dropdown
              value={documentType}
              options={[
                { label: "Presupuesto Proveedor", value: "PROVIDER_QUOTE" },
                { label: "Acta de Entrega", value: "DELIVERY_ACT" },
                { label: "Acta de Retorno", value: "RETURN_ACT" },
                { label: "Factura Proveedor", value: "PROVIDER_INVOICE" },
                { label: "Otro", value: "OTHER" },
              ]}
              onChange={(e) => setDocumentType(e.value)}
              placeholder="Seleccionar tipo"
              className="w-full"
            />
          </div>
          <div>
            <label className="text-sm font-semibold block mb-2">
              URL del Documento <span className="text-red-500">*</span>
            </label>
            <InputText
              value={documentUrl}
              onChange={(e) => setDocumentUrl(e.target.value)}
              placeholder="https://ejemplo.com/documento.pdf"
              className="w-full"
            />
          </div>
          <div>
            <label className="text-sm font-semibold block mb-2">
              Descripción (opcional)
            </label>
            <InputText
              value={documentDescription}
              onChange={(e) => setDocumentDescription(e.target.value)}
              placeholder="Notas sobre este documento"
              className="w-full"
            />
          </div>
          <div className="flex gap-2 justify-content-end">
            <Button
              label="Cancelar"
              severity="secondary"
              outlined
              onClick={() => setDocumentDialog(false)}
            />
            <Button
              label="Agregar"
              disabled={!documentType || !documentUrl || isAddingDocument}
              loading={isAddingDocument}
              onClick={handleAddDocument}
            />
          </div>
        </div>
      </Dialog>

      <Menu
        model={getMenuItems(actionItem)}
        popup
        ref={menuRef}
        id="item-menu"
      />
    </motion.div>
  );
}
