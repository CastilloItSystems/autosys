"use client";
import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { Menu } from "primereact/menu";
import { Tag } from "primereact/tag";
import { motion } from "framer-motion";
import FormActionButtons from "@/components/common/FormActionButtons";
import CreateButton from "@/components/common/CreateButton";
import {
  confirmAction,
  ConfirmActionPopup,
} from "@/components/common/ConfirmAction";
import { handleFormError } from "@/utils/errorHandlers";
import { quotationService } from "@/app/api/workshop";
import type {
  WorkshopQuotation,
  QuotationStatus,
} from "@/libs/interfaces/workshop";
import {
  QuotationStatusBadge,
  QUOTATION_STATUS_OPTIONS,
  QUOTATION_ITEM_TYPE_LABELS,
  APPROVAL_TYPE_LABELS,
  APPROVAL_CHANNEL_LABELS,
} from "./QuotationStatusBadge";
import QuotationForm from "./QuotationForm";
import QuotationApprovalDialog from "./QuotationApprovalDialog";
import QuotationStepper from "./QuotationStepper";

const fmt = (v?: number | null) =>
  v != null
    ? `$ ${v.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`
    : "—";

// Estados que permiten editar la cotización
const EDITABLE_STATUSES: QuotationStatus[] = ["DRAFT", "ISSUED", "SENT"];
// Estados donde se puede registrar aprobación / rechazo
const APPROVABLE_STATUSES: QuotationStatus[] = [
  "ISSUED",
  "SENT",
  "PENDING_APPROVAL",
];
// Estados desde los que se puede emitir (cambiar a ISSUED)
const ISSUABLE_STATUSES: QuotationStatus[] = ["DRAFT"];
// Estados desde los que se puede enviar (cambiar a SENT)
const SENDABLE_STATUSES: QuotationStatus[] = ["ISSUED"];
// Estados desde los que se puede convertir en OS
const CONVERTIBLE_STATUSES: QuotationStatus[] = [
  "APPROVED_TOTAL",
  "APPROVED_PARTIAL",
];

export default function QuotationList() {
  const [items, setItems] = useState<WorkshopQuotation[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selected, setSelected] = useState<WorkshopQuotation | null>(null);
  const [actionItem, setActionItem] = useState<WorkshopQuotation | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<QuotationStatus | "">("");
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState(20);

  const [loading, setLoading] = useState(true);
  const [formDialog, setFormDialog] = useState(false);
  const [approvalDialog, setApprovalDialog] = useState(false);
  const [convertLoading, setConvertLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedRows, setExpandedRows] = useState<any>(null);

  const toast = useRef<Toast>(null);
  const menuRef = useRef<Menu | null>(null);

  useEffect(() => {
    loadItems();
  }, [page, rows, searchQuery, statusFilter]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const res = await quotationService.getAll({
        page: page + 1,
        limit: rows,
        search: searchQuery || undefined,
        status: statusFilter || undefined,
        sortBy: "createdAt",
        sortOrder: "desc",
      });
      setItems(res.data ?? []);
      setTotalRecords(res.meta?.total ?? 0);
    } catch (err) {
      handleFormError(err, toast);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const openNew = () => {
    setSelected(null);
    setFormDialog(true);
  };
  const editItem = (item: WorkshopQuotation) => {
    setSelected({ ...item });
    setFormDialog(true);
  };
  const openApprovalDialog = (item: WorkshopQuotation) => {
    setSelected({ ...item });
    setApprovalDialog(true);
  };

  const handleIssue = async (item: WorkshopQuotation) => {
    try {
      await quotationService.updateStatus(item.id, "ISSUED");
      toast.current?.show({
        severity: "success",
        summary: "Listo",
        detail: "Cotización emitida correctamente",
        life: 3000,
      });
      await loadItems();
    } catch (err) {
      handleFormError(err, toast);
    }
  };

  const handleSend = async (item: WorkshopQuotation) => {
    try {
      await quotationService.updateStatus(item.id, "SENT");
      toast.current?.show({
        severity: "success",
        summary: "Listo",
        detail: "Cotización marcada como enviada",
        life: 3000,
      });
      await loadItems();
    } catch (err) {
      handleFormError(err, toast);
    }
  };

  const handleConvert = async (item: WorkshopQuotation) => {
    setConvertLoading(true);
    try {
      await quotationService.convertToSO(item.id);
      toast.current?.show({
        severity: "success",
        summary: "Convertida",
        detail: "Orden de servicio creada exitosamente",
        life: 4000,
      });
      await loadItems();
    } catch (err) {
      handleFormError(err, toast);
    } finally {
      setConvertLoading(false);
    }
  };

  const handleSaved = async () => {
    toast.current?.show({
      severity: "success",
      summary: "Éxito",
      detail: selected?.id ? "Cotización actualizada" : "Cotización creada",
      life: 3000,
    });
    await loadItems();
    setFormDialog(false);
    setSelected(null);
  };

  const handleApprovalSaved = async () => {
    toast.current?.show({
      severity: "success",
      summary: "Registrado",
      detail: "Respuesta del cliente guardada",
      life: 3000,
    });
    await loadItems();
    setApprovalDialog(false);
    setSelected(null);
  };

  // ── Column templates ────────────────────────────────────────────────────────

  const numberTemplate = (row: WorkshopQuotation) => (
    <div>
      <span className="font-bold text-primary">{row.quotationNumber}</span>
      {row.isSupplementary && (
        <Tag
          value="Suplementaria"
          severity="warning"
          rounded
          className="ml-2 text-xs"
        />
      )}
      {row.version > 1 && (
        <span className="text-xs text-500 ml-1">v{row.version}</span>
      )}
    </div>
  );

  const statusTemplate = (row: WorkshopQuotation) => (
    <QuotationStatusBadge status={row.status} />
  );

  const customerTemplate = (row: WorkshopQuotation) => (
    <div>
      <div className="font-semibold">{row.customer?.name ?? "—"}</div>
      <div className="text-xs text-500">{row.customer?.code}</div>
    </div>
  );

  const vehicleTemplate = (row: WorkshopQuotation) =>
    row.customerVehicle?.plate ? (
      <span className="font-mono">{row.customerVehicle.plate}</span>
    ) : (
      <span className="text-500">—</span>
    );

  const totalTemplate = (row: WorkshopQuotation) => (
    <span className="font-bold">{fmt(row.total)}</span>
  );

  const dateTemplate = (row: WorkshopQuotation) =>
    new Date(row.createdAt).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const soTemplate = (row: WorkshopQuotation) =>
    row.serviceOrder ? (
      <span className="font-semibold text-green-600">
        {row.serviceOrder.folio}
      </span>
    ) : (
      <span className="text-500">—</span>
    );

  const transitionBodyTemplate = (rowData: WorkshopQuotation) => {
    const { status } = rowData;

    return (
      <div className="flex gap-1 flex-nowrap justify-content-center">
        {ISSUABLE_STATUSES.includes(status) && (
          <Button
            icon="pi pi-file-export"
            className="p-button-rounded p-button-secondary p-button-sm"
            tooltip="Emitir cotización"
            tooltipOptions={{ position: "top" }}
            onClick={(e) =>
              confirmAction({
                target: e.currentTarget as EventTarget & HTMLElement,
                message: `¿Deseas emitir la cotización ${rowData.quotationNumber}?`,
                icon: "pi pi-file-export",
                iconClass: "text-gray-500",
                acceptLabel: "Emitir",
                acceptSeverity: "secondary",
                onAccept: () => handleIssue(rowData),
              })
            }
          />
        )}
        {SENDABLE_STATUSES.includes(status) && (
          <Button
            icon="pi pi-send"
            className="p-button-rounded p-button-info p-button-sm"
            tooltip="Marcar como enviada"
            tooltipOptions={{ position: "top" }}
            onClick={(e) =>
              confirmAction({
                target: e.currentTarget as EventTarget & HTMLElement,
                message: `¿Marcar la cotización ${rowData.quotationNumber} como enviada?`,
                icon: "pi pi-send",
                iconClass: "text-blue-500",
                acceptLabel: "Enviar",
                acceptSeverity: "info",
                onAccept: () => handleSend(rowData),
              })
            }
          />
        )}
        {APPROVABLE_STATUSES.includes(status) && (
          <Button
            icon="pi pi-check-circle"
            className="p-button-rounded p-button-success p-button-sm"
            tooltip="Registrar respuesta del cliente"
            tooltipOptions={{ position: "top" }}
            onClick={() => openApprovalDialog(rowData)}
          />
        )}
        {CONVERTIBLE_STATUSES.includes(status) && !rowData.serviceOrderId && (
          <Button
            icon="pi pi-arrow-right"
            className="p-button-rounded p-button-warning p-button-sm"
            tooltip="Convertir en Orden de Servicio"
            tooltipOptions={{ position: "top" }}
            onClick={(e) =>
              confirmAction({
                target: e.currentTarget as EventTarget & HTMLElement,
                message: `¿Convertir la cotización ${rowData.quotationNumber} en Orden de Servicio?`,
                icon: "pi pi-arrow-right",
                iconClass: "text-orange-500",
                acceptLabel: "Convertir",
                acceptSeverity: "warning",
                onAccept: () => handleConvert(rowData),
              })
            }
          />
        )}
      </div>
    );
  };

  const rowExpansionTemplate = (data: WorkshopQuotation) => {
    return (
      <div className="p-3">
        <QuotationStepper currentStatus={data.status} />

        {data.items && data.items.length > 0 && (
          <div className="mt-4">
            <h5 className="mb-2 text-900 font-bold">Resumen de Ítems</h5>
            <div className="border-1 border-round border-300 overflow-hidden shadow-1">
              <table
                className="w-full border-collapse"
                style={{ fontSize: "0.85rem" }}
              >
                <thead>
                  <tr className="bg-gray-100 border-bottom-1 border-300">
                    <th className="p-2 text-left text-700">Tipo</th>
                    <th className="p-2 text-left text-700">Descripción</th>
                    <th className="p-2 text-center text-700">Cant.</th>
                    <th className="p-2 text-right text-700">Precio Unit.</th>
                    <th className="p-2 text-right text-700">Total</th>
                    <th className="p-2 text-center text-700">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item, idx) => (
                    <tr key={idx} className="border-bottom-1 border-200">
                      <td className="p-2">
                        <Tag
                          value={QUOTATION_ITEM_TYPE_LABELS[item.type]}
                          severity="info"
                          className="text-xs"
                        />
                      </td>
                      <td className="p-2">{item.description}</td>
                      <td className="p-2 text-center">{item.quantity}</td>
                      <td className="p-2 text-right">{fmt(item.unitPrice)}</td>
                      <td className="p-2 text-right font-semibold">
                        {fmt(item.total)}
                      </td>
                      <td className="p-2 text-center">
                        {item.approved ? (
                          <i
                            className="pi pi-check-circle text-green-500"
                            title="Aprobado"
                          />
                        ) : (
                          <i
                            className="pi pi-times-circle text-red-500"
                            title="Pendiente/Rechazado"
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 font-bold">
                    <td colSpan={4} className="p-2 text-right">
                      TOTAL
                    </td>
                    <td className="p-2 text-right text-primary">
                      {fmt(data.total)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {data.notes && (
          <div className="mt-3 p-2 border-round bg-gray-50 border-1 border-200">
            <span className="block font-bold text-700 mb-1">
              Notas al cliente:
            </span>
            <p className="m-0 text-sm text-600 italic">"{data.notes}"</p>
          </div>
        )}

        {data.approvals && data.approvals.length > 0 && (
          <div className="mt-4">
            <h5 className="mb-2 text-900 font-bold">
              Historial de Respuestas / Aprobaciones
            </h5>
            <div className="grid">
              {data.approvals.map((app, idx) => (
                <div key={idx} className="col-12 md:col-6 lg:col-4">
                  <div
                    className={`p-3 border-round border-1 h-full ${
                      app.type === "REJECTION"
                        ? "bg-red-50 border-red-200"
                        : "bg-green-50 border-green-200"
                    }`}
                  >
                    <div className="flex justify-content-between align-items-start mb-2">
                      <Tag
                        value={APPROVAL_TYPE_LABELS[app.type]}
                        severity={
                          app.type === "REJECTION" ? "danger" : "success"
                        }
                      />
                      <span className="text-xs text-600">
                        {new Date(app.approvedAt).toLocaleDateString("es-MX", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <div className="mb-1 text-sm">
                      <span className="font-bold">Por:</span>{" "}
                      {app.approvedByName}
                    </div>
                    <div className="mb-2 text-sm">
                      <span className="font-bold">Canal:</span>{" "}
                      {APPROVAL_CHANNEL_LABELS[app.channel]}
                    </div>

                    {app.rejectionReason && (
                      <div className="mt-2 text-xs text-red-700">
                        <span className="font-bold">Motivo Rechazo:</span>{" "}
                        {app.rejectionReason}
                      </div>
                    )}

                    {app.notes && (
                      <div className="mt-2 text-xs text-700">
                        <span className="font-bold">Observaciones:</span>{" "}
                        {app.notes}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const actionBodyTemplate = (rowData: WorkshopQuotation) => (
    <Button
      icon="pi pi-cog"
      rounded
      text
      onClick={(e) => {
        setActionItem(rowData);
        menuRef.current?.toggle(e);
      }}
      tooltip="Opciones"
      tooltipOptions={{ position: "left" }}
    />
  );

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <div className="flex align-items-center gap-2">
        <h4 className="m-0">Cotizaciones de Taller</h4>
        <span className="text-600 text-sm">({totalRecords} total)</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            type="search"
            placeholder="Número, cliente..."
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
          options={[
            { label: "Todos los estados", value: "" },
            ...QUOTATION_STATUS_OPTIONS,
          ]}
          onChange={(e) => {
            setStatusFilter(e.value);
            setPage(0);
          }}
          placeholder="Estado"
          style={{ width: "13rem" }}
        />
        <CreateButton
          label="Nueva cotización"
          onClick={openNew}
          tooltip="Crear cotización"
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
      <ConfirmActionPopup />

      <div className="card">
        <DataTable
          value={items}
          paginator
          lazy
          first={page * rows}
          rows={rows}
          totalRecords={totalRecords}
          rowsPerPageOptions={[10, 20, 50]}
          onPage={(e) => {
            setPage(e.page ?? Math.floor(e.first / e.rows));
            setRows(e.rows);
          }}
          dataKey="id"
          loading={loading}
          header={header}
          emptyMessage="No se encontraron cotizaciones"
          scrollable
          size="small"
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
            header="Número"
            body={numberTemplate}
            style={{ minWidth: "150px" }}
          />
          <Column
            header="Estado"
            body={statusTemplate}
            style={{ minWidth: "160px" }}
          />
          <Column
            header="Cliente"
            body={customerTemplate}
            style={{ minWidth: "180px" }}
          />
          <Column
            header="Vehículo"
            body={vehicleTemplate}
            style={{ minWidth: "110px" }}
          />
          <Column
            header="Total"
            body={totalTemplate}
            style={{ minWidth: "120px" }}
          />
          <Column
            header="OS generada"
            body={soTemplate}
            style={{ minWidth: "120px" }}
          />
          <Column
            header="Fecha"
            body={dateTemplate}
            style={{ minWidth: "130px" }}
          />

          <Column
            header="Acciones"
            body={actionBodyTemplate}
            exportable={false}
            frozen
            alignFrozen="right"
            style={{ width: "5rem", textAlign: "center" }}
            headerStyle={{ textAlign: "center" }}
          />
        </DataTable>
      </div>

      {/* Form Dialog */}
      <Dialog
        visible={formDialog}
        style={{ width: "75vw" }}
        breakpoints={{ "1400px": "75vw", "900px": "85vw", "600px": "95vw" }}
        maximizable
        header={
          <div className="border-bottom-2 border-primary pb-2">
            <h2 className="text-xl font-bold text-900 m-0 flex align-items-center gap-2">
              <i className="pi pi-file-edit text-primary text-2xl" />
              {selected?.id
                ? `Editar ${selected.quotationNumber}`
                : "Nueva Cotización"}
            </h2>
          </div>
        }
        modal
        className="p-fluid"
        onHide={() => {
          setFormDialog(false);
          setSelected(null);
        }}
        footer={
          <FormActionButtons
            formId="quotation-form"
            isUpdate={!!selected?.id}
            onCancel={() => {
              setFormDialog(false);
              setSelected(null);
            }}
            isSubmitting={isSubmitting}
          />
        }
      >
        <QuotationForm
          quotation={selected}
          formId="quotation-form"
          onSave={handleSaved}
          onSubmittingChange={setIsSubmitting}
          toast={toast}
        />
      </Dialog>

      {/* Approval Dialog */}
      <QuotationApprovalDialog
        visible={approvalDialog}
        quotation={selected}
        onHide={() => {
          setApprovalDialog(false);
          setSelected(null);
        }}
        onSaved={handleApprovalSaved}
        toast={toast}
      />

      {/* Context Menu */}
      <Menu
        model={
          actionItem
            ? [
                {
                  label: "Editar",
                  icon: "pi pi-pencil",
                  disabled: !EDITABLE_STATUSES.includes(actionItem.status),
                  command: () => editItem(actionItem),
                },
              ]
            : []
        }
        popup
        ref={menuRef}
        id="quotation-menu"
      />
    </motion.div>
  );
}
