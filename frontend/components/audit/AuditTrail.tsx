"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Dialog } from "primereact/dialog";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
import auditLogService, { type AuditLog } from "@/shared/services/auditLog.service";
import { handleFormError } from "@/utils/errorHandlers";

export const ENTITY_OPTIONS = [
  { label: "Todas", value: "" },
  { label: "Orden de compra", value: "PurchaseOrder" },
  { label: "Nota de entrada", value: "EntryNote" },
  { label: "Factura proveedor", value: "SupplierBill" },
  { label: "Orden de venta", value: "Order" },
  { label: "Prefactura", value: "PreInvoice" },
  { label: "Factura", value: "Invoice" },
  { label: "Pago", value: "Payment" },
  { label: "Articulo", value: "Item" },
  { label: "Almacen", value: "Warehouse" },
  { label: "Transferencia", value: "Transfer" },
  { label: "Ajuste", value: "Adjustment" },
  { label: "Proveedor", value: "Supplier" },
  { label: "Cliente", value: "Customer" },
  { label: "Reporte", value: "Report" },
];

export const ACTION_OPTIONS = [
  { label: "Todas", value: "" },
  { label: "Crear", value: "CREATE" },
  { label: "Actualizar", value: "UPDATE" },
  { label: "Eliminar", value: "DELETE" },
  { label: "Crear masivo", value: "CREATEMANY" },
  { label: "Actualizar masivo", value: "UPDATEMANY" },
  { label: "Eliminar masivo", value: "DELETEMANY" },
  { label: "Enviar a aprobacion", value: "SUBMIT" },
  { label: "Aprobar", value: "APPROVE" },
  { label: "Rechazar", value: "REJECT" },
  { label: "Enviar", value: "SEND" },
  { label: "Recepcionar", value: "RECEIVE" },
  { label: "Nota de entrada desde OC", value: "ENTRY_NOTE_CREATED_FROM_PO" },
  { label: "Nota de entrada completada", value: "ENTRY_NOTE_COMPLETED" },
  { label: "OC recibida", value: "PURCHASE_ORDER_RECEIVED" },
  {
    label: "Crear cuenta por pagar desde recepción",
    value: "CREATE_SUPPLIER_BILL_FROM_RECEIPT",
  },
  {
    label: "Actualizar cuenta por pagar desde recepción",
    value: "UPDATE_SUPPLIER_BILL_FROM_RECEIPT",
  },
  { label: "Registrar factura proveedor", value: "REGISTER_SUPPLIER_INVOICE" },
  { label: "Cancelar", value: "CANCEL" },
  { label: "Sugerir transferencias", value: "SUGGEST_TRANSFERS" },
  { label: "Sugerir compras", value: "SUGGEST_PURCHASE_ORDERS" },
  { label: "Resolver reabastecimiento", value: "SUGGEST_REPLENISHMENT" },
  { label: "Exportar", value: "EXPORT" },
];

export const CRITICAL_AUDIT_ACTIONS = [
  "SUBMIT",
  "APPROVE",
  "REJECT",
  "SEND",
  "RECEIVE",
  "ENTRY_NOTE_CREATED_FROM_PO",
  "ENTRY_NOTE_COMPLETED",
  "PURCHASE_ORDER_RECEIVED",
  "CREATE_SUPPLIER_BILL_FROM_RECEIPT",
  "UPDATE_SUPPLIER_BILL_FROM_RECEIPT",
  "REGISTER_SUPPLIER_INVOICE",
  "CANCEL",
  "SUGGEST_TRANSFERS",
  "SUGGEST_PURCHASE_ORDERS",
  "SUGGEST_REPLENISHMENT",
  "DELETE",
  "DELETEMANY",
];

export const ENTITY_LABELS: Record<string, string> = Object.fromEntries(
  ENTITY_OPTIONS.filter((option) => option.value).map((option) => [
    option.value,
    option.label,
  ]),
);

export const ACTION_LABELS: Record<string, string> = Object.fromEntries(
  ACTION_OPTIONS.filter((option) => option.value).map((option) => [
    option.value,
    option.label,
  ]),
);

type TagSeverity = "secondary" | "info" | "warning" | "success" | "danger";

export interface AuditDiffRow {
  field: string;
  before: string;
  after: string;
}

const IGNORED_DIFF_FIELDS = new Set(["updatedAt"]);

export const asAuditRecord = (value: unknown) =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

export const getAuditEntityLabel = (entity: string) =>
  ENTITY_LABELS[entity] || entity;

export const getAuditActionLabel = (action: string) =>
  ACTION_LABELS[action] || action;

export const getAuditActionSeverity = (action: string): TagSeverity => {
  if (
    [
      "CREATE",
      "CREATEMANY",
      "APPROVE",
      "RECEIVE",
      "ENTRY_NOTE_COMPLETED",
      "PURCHASE_ORDER_RECEIVED",
      "CREATE_SUPPLIER_BILL_FROM_RECEIPT",
      "REGISTER_SUPPLIER_INVOICE",
    ].includes(action)
  ) {
    return "success";
  }
  if (
    [
      "UPDATE",
      "UPDATEMANY",
      "SEND",
      "SUBMIT",
      "SUGGEST_TRANSFERS",
      "SUGGEST_PURCHASE_ORDERS",
      "SUGGEST_REPLENISHMENT",
      "EXPORT",
      "ENTRY_NOTE_CREATED_FROM_PO",
      "UPDATE_SUPPLIER_BILL_FROM_RECEIPT",
    ].includes(action)
  ) {
    return "info";
  }
  if (["REJECT", "CANCEL", "DELETE", "DELETEMANY"].includes(action)) {
    return "danger";
  }
  return "secondary";
};

export const formatAuditDateTime = (value?: string | null) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("es-VE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const getAuditUserLabel = (log: AuditLog) =>
  log.user?.nombre || log.user?.correo || log.userId || "Sistema";

export const getAuditEmpresaLabel = (log: AuditLog) =>
  log.empresa?.nombre || log.empresaId || "-";

const humanizeField = (field: string) =>
  field
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const stringifyValue = (value: unknown): string => {
  if (value === undefined || value === null || value === "") return "-";
  if (typeof value === "boolean") return value ? "Si" : "No";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const extractBeforeAfter = (log: AuditLog) => {
  const changes = asAuditRecord(log.changes);
  const before = asAuditRecord(changes?.before);
  const afterRaw = asAuditRecord(changes?.after);
  const bulkData = asAuditRecord(afterRaw?.data);
  const after = bulkData || afterRaw;
  return { changes, before, after };
};

export const getAuditDiffRows = (log: AuditLog): AuditDiffRow[] => {
  const { changes, before, after } = extractBeforeAfter(log);

  if (before || after) {
    const keys = new Set([
      ...Object.keys(before || {}),
      ...Object.keys(after || {}),
    ]);

    return [...keys]
      .filter((key) => !IGNORED_DIFF_FIELDS.has(key))
      .map((key) => ({
        field: humanizeField(key),
        before: stringifyValue(before?.[key]),
        after: stringifyValue(after?.[key]),
      }))
      .filter((row) => row.before !== row.after || log.action !== "UPDATE");
  }

  if (!changes) return [];

  return Object.entries(changes).map(([key, value]) => ({
    field: humanizeField(key),
    before: "-",
    after: stringifyValue(value),
  }));
};

export const getAuditSummaryText = (log: AuditLog) => {
  const { before, after, changes } = extractBeforeAfter(log);
  const metadata = asAuditRecord(log.metadata);
  const beforeStatus = before?.status;
  const afterStatus = after?.status;
  const reason = metadata?.rejectionReason || after?.rejectionReason;

  if (typeof reason === "string" && reason.trim()) return reason;

  if (typeof beforeStatus === "string" || typeof afterStatus === "string") {
    return `${typeof beforeStatus === "string" ? beforeStatus : "-"} -> ${
      typeof afterStatus === "string" ? afterStatus : "-"
    }`;
  }

  const diffRows = getAuditDiffRows(log);
  if (diffRows.length > 0) {
    const firstFields = diffRows
      .slice(0, 3)
      .map((row) => row.field)
      .join(", ");
    return `${diffRows.length} cambio${diffRows.length === 1 ? "" : "s"}: ${firstFields}`;
  }

  if (typeof metadata?.path === "string") return metadata.path;
  if (changes) return "Cambios registrados";
  return "Evento registrado";
};

export const stringifyAuditJson = (value: unknown) => {
  if (value == null) return "-";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

export function AuditActionTag({ action }: { action: string }) {
  return (
    <Tag
      value={getAuditActionLabel(action)}
      severity={getAuditActionSeverity(action)}
      className="text-xs"
    />
  );
}

export function AuditChangesView({ log }: { log: AuditLog }) {
  const rows = useMemo(() => getAuditDiffRows(log), [log]);

  if (rows.length === 0) {
    return (
      <pre className="surface-100 p-3 border-round overflow-auto text-sm">
        {stringifyAuditJson(log.changes)}
      </pre>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="surface-100">
            <th className="text-left p-2 text-sm">Campo</th>
            <th className="text-left p-2 text-sm">Antes</th>
            <th className="text-left p-2 text-sm">Despues</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.field} className="border-bottom-1 surface-border">
              <td className="p-2 text-sm font-medium text-900">{row.field}</td>
              <td className="p-2 text-sm text-600">{row.before}</td>
              <td className="p-2 text-sm text-900">{row.after}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AuditSummary({ log }: { log: AuditLog }) {
  return <span className="text-700">{getAuditSummaryText(log)}</span>;
}

const csvEscape = (value: unknown) => {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
};

export const exportAuditLogsToCsv = (
  logs: AuditLog[],
  filename = "auditoria.csv",
) => {
  if (typeof window === "undefined") return;

  const headers = [
    "Fecha",
    "Empresa",
    "Entidad",
    "Entity ID",
    "Accion",
    "Usuario",
    "Resumen",
  ];

  const lines = logs.map((log) =>
    [
      formatAuditDateTime(log.createdAt),
      getAuditEmpresaLabel(log),
      getAuditEntityLabel(log.entity),
      log.entityId,
      getAuditActionLabel(log.action),
      getAuditUserLabel(log),
      getAuditSummaryText(log),
    ]
      .map(csvEscape)
      .join(","),
  );

  const csv = [headers.map(csvEscape).join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

interface AuditTrailDialogProps {
  visible: boolean;
  onHide: () => void;
  entity: string;
  entityId?: string | null;
  title?: string;
  subtitle?: string;
  toast?: React.RefObject<Toast | null> | null;
  limit?: number;
}

export function AuditTrailDialog({
  visible,
  onHide,
  entity,
  entityId,
  title,
  subtitle,
  toast,
  limit = 50,
}: AuditTrailDialogProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const loadLogs = useCallback(async () => {
    if (!entityId) {
      setLogs([]);
      return;
    }
    setLoading(true);
    try {
      const response = await auditLogService.getAll({
        entity,
        entityId,
        limit,
      });
      setLogs(response.data || []);
    } catch (error) {
      handleFormError(error, toast || null);
    } finally {
      setLoading(false);
    }
  }, [entity, entityId, limit, toast]);

  useEffect(() => {
    if (!visible) return;
    setSelectedLog(null);
    loadLogs();
  }, [loadLogs, visible]);

  const header = (
    <div className="flex flex-wrap align-items-center justify-content-between gap-2">
      <div>
        <div className="font-semibold text-900">
          {title || `Historial de ${getAuditEntityLabel(entity)}`}
        </div>
        {subtitle && <div className="text-sm text-600">{subtitle}</div>}
      </div>
      <Button
        icon="pi pi-refresh"
        severity="secondary"
        outlined
        rounded
        loading={loading}
        onClick={loadLogs}
        tooltip="Actualizar historial"
      />
    </div>
  );

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={header}
      modal
      style={{ width: "70vw" }}
      breakpoints={{ "1200px": "82vw", "800px": "95vw" }}
    >
      <DataTable
        value={logs}
        loading={loading}
        size="small"
        dataKey="id"
        responsiveLayout="scroll"
        emptyMessage="No hay auditoria para este registro"
        tableStyle={{ minWidth: "58rem" }}
      >
        <Column
          header="Fecha"
          body={(row: AuditLog) => formatAuditDateTime(row.createdAt)}
          style={{ width: "12rem" }}
        />
        <Column
          header="Accion"
          body={(row: AuditLog) => <AuditActionTag action={row.action} />}
          style={{ width: "13rem" }}
        />
        <Column
          header="Usuario"
          body={(row: AuditLog) => getAuditUserLabel(row)}
          style={{ width: "14rem" }}
        />
        <Column
          header="Resumen"
          body={(row: AuditLog) => <AuditSummary log={row} />}
        />
        <Column
          header="Detalle"
          body={(row: AuditLog) => (
            <Button
              icon="pi pi-eye"
              text
              rounded
              onClick={() => setSelectedLog(row)}
              tooltip="Ver cambios"
            />
          )}
          style={{ width: "6rem", textAlign: "center" }}
          headerStyle={{ textAlign: "center" }}
        />
      </DataTable>

      {selectedLog && (
        <div className="border-top-1 surface-border mt-3 pt-3">
          <div className="flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
            <div>
              <div className="text-sm text-600">
                {formatAuditDateTime(selectedLog.createdAt)} -{" "}
                {getAuditUserLabel(selectedLog)}
              </div>
              <div className="font-medium text-900">
                {getAuditActionLabel(selectedLog.action)}
              </div>
            </div>
            <Button
              icon="pi pi-times"
              text
              rounded
              severity="secondary"
              onClick={() => setSelectedLog(null)}
              tooltip="Ocultar detalle"
            />
          </div>
          <AuditChangesView log={selectedLog} />
          <div className="mt-3">
            <div className="text-sm text-600 mb-2">Metadata</div>
            <pre className="surface-100 p-3 border-round overflow-auto text-sm">
              {stringifyAuditJson(selectedLog.metadata)}
            </pre>
          </div>
        </div>
      )}
    </Dialog>
  );
}
