"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { Column } from "primereact/column";
import { DataTable, DataTablePageEvent } from "primereact/datatable";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import auditLogService, { type AuditLog } from "@/shared/services/auditLog.service";
import {
  ACTION_OPTIONS,
  AuditActionTag,
  AuditChangesView,
  AuditSummary,
  CRITICAL_AUDIT_ACTIONS,
  ENTITY_OPTIONS,
  exportAuditLogsToCsv,
  formatAuditDateTime,
  getAuditActionLabel,
  getAuditEmpresaLabel,
  getAuditEntityLabel,
  getAuditUserLabel,
  stringifyAuditJson,
} from "@/components/audit/AuditTrail";
import { handleFormError } from "@/utils/errorHandlers";

const toStartOfDayIso = (date: Date | null) => {
  if (!date) return undefined;
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy.toISOString();
};

const toEndOfDayIso = (date: Date | null) => {
  if (!date) return undefined;
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy.toISOString();
};

const startOfToday = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const startOfWeek = () => {
  const date = startOfToday();
  const day = date.getDay();
  const diff = day === 0 ? 6 : day - 1;
  date.setDate(date.getDate() - diff);
  return date;
};

interface AuditFilters {
  entity?: string;
  entityId?: string;
  action?: string;
  actions?: string;
  userId?: string;
  createdFrom?: string;
  createdTo?: string;
}

export default function AuditLogsPage() {
  const toast = useRef<Toast | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [entity, setEntity] = useState("");
  const [entityId, setEntityId] = useState("");
  const [action, setAction] = useState("");
  const [userId, setUserId] = useState("");
  const [createdFrom, setCreatedFrom] = useState<Date | null>(null);
  const [createdTo, setCreatedTo] = useState<Date | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<AuditFilters>({});
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const draftFilters = useMemo<AuditFilters>(
    () => ({
      entity: entity || undefined,
      entityId: entityId.trim() || undefined,
      action: action || undefined,
      userId: userId.trim() || undefined,
      createdFrom: toStartOfDayIso(createdFrom),
      createdTo: toEndOfDayIso(createdTo),
    }),
    [action, createdFrom, createdTo, entity, entityId, userId],
  );

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await auditLogService.getAll({
        ...appliedFilters,
        page: page + 1,
        limit: rows,
      });
      setLogs(Array.isArray(response.data) ? response.data : []);
      setTotalRecords(response.meta?.total || 0);
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, page, rows]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const applyResolvedFilters = (filters: AuditFilters) => {
    setPage(0);
    setAppliedFilters(filters);
  };

  const handlePage = (event: DataTablePageEvent) => {
    setPage(event.page ?? 0);
    setRows(event.rows);
  };

  const clearFilters = () => {
    setEntity("");
    setEntityId("");
    setAction("");
    setUserId("");
    setCreatedFrom(null);
    setCreatedTo(null);
    applyResolvedFilters({});
  };

  const applyFilters = () => {
    applyResolvedFilters(draftFilters);
  };

  const applyToday = () => {
    const from = startOfToday();
    const to = new Date();
    setCreatedFrom(from);
    setCreatedTo(to);
    applyResolvedFilters({
      ...draftFilters,
      createdFrom: toStartOfDayIso(from),
      createdTo: toEndOfDayIso(to),
    });
  };

  const applyThisWeek = () => {
    const from = startOfWeek();
    const to = new Date();
    setCreatedFrom(from);
    setCreatedTo(to);
    applyResolvedFilters({
      ...draftFilters,
      createdFrom: toStartOfDayIso(from),
      createdTo: toEndOfDayIso(to),
    });
  };

  const applyCriticalActions = () => {
    setAction("");
    applyResolvedFilters({
      ...draftFilters,
      action: undefined,
      actions: CRITICAL_AUDIT_ACTIONS.join(","),
    });
  };

  const applyPurchaseOrders = () => {
    setEntity("PurchaseOrder");
    applyResolvedFilters({
      ...draftFilters,
      entity: "PurchaseOrder",
    });
  };

  const exportFiltered = async () => {
    setExporting(true);
    try {
      const response = await auditLogService.getAll({
        ...appliedFilters,
        page: 1,
        limit: 200,
      });
      exportAuditLogsToCsv(
        response.data || [],
        `auditoria-${new Date().toISOString().slice(0, 10)}.csv`,
      );
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setExporting(false);
    }
  };

  const entityTemplate = (row: AuditLog) => (
    <div className="flex flex-column gap-1">
      <span className="font-medium text-900">
        {getAuditEntityLabel(row.entity)}
      </span>
      <span className="text-xs text-500">{row.entityId}</span>
    </div>
  );

  const detailFooter = (
    <div className="flex justify-content-end">
      <Button
        label="Cerrar"
        icon="pi pi-times"
        severity="secondary"
        onClick={() => setSelectedLog(null)}
      />
    </div>
  );

  return (
    <>
      <Toast ref={toast} />

      <div className="card">
        <div className="flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
          <div>
            <h2 className="m-0 text-900">Auditoria</h2>
            <span className="text-600 text-sm">{totalRecords} eventos</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              icon="pi pi-refresh"
              label="Actualizar"
              severity="secondary"
              outlined
              onClick={loadLogs}
              loading={loading}
            />
            <Button
              icon="pi pi-file-export"
              label="Exportar"
              severity="secondary"
              outlined
              onClick={exportFiltered}
              loading={exporting}
              disabled={logs.length === 0}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            label="Hoy"
            icon="pi pi-calendar"
            severity="secondary"
            outlined
            size="small"
            onClick={applyToday}
          />
          <Button
            label="Esta semana"
            icon="pi pi-calendar-clock"
            severity="secondary"
            outlined
            size="small"
            onClick={applyThisWeek}
          />
          <Button
            label="Acciones criticas"
            icon="pi pi-shield"
            severity="warning"
            outlined
            size="small"
            onClick={applyCriticalActions}
          />
          <Button
            label="Compras"
            icon="pi pi-shopping-cart"
            severity="secondary"
            outlined
            size="small"
            onClick={applyPurchaseOrders}
          />
        </div>

        <div className="grid formgrid row-gap-2 mb-4">
          <div className="field col-12 md:col-3">
            <label className="block text-900 font-medium mb-2">Entidad</label>
            <Dropdown
              value={entity}
              options={ENTITY_OPTIONS}
              onChange={(event) => setEntity(event.value)}
              className="w-full"
            />
          </div>

          <div className="field col-12 md:col-3">
            <label className="block text-900 font-medium mb-2">Accion</label>
            <Dropdown
              value={action}
              options={ACTION_OPTIONS}
              onChange={(event) => setAction(event.value)}
              className="w-full"
            />
          </div>

          <div className="field col-12 md:col-3">
            <label className="block text-900 font-medium mb-2">Desde</label>
            <Calendar
              value={createdFrom}
              onChange={(event) => setCreatedFrom(event.value as Date | null)}
              dateFormat="dd/mm/yy"
              showIcon
              className="w-full"
            />
          </div>

          <div className="field col-12 md:col-3">
            <label className="block text-900 font-medium mb-2">Hasta</label>
            <Calendar
              value={createdTo}
              onChange={(event) => setCreatedTo(event.value as Date | null)}
              dateFormat="dd/mm/yy"
              showIcon
              className="w-full"
            />
          </div>

          <div className="field col-12 md:col-4">
            <label className="block text-900 font-medium mb-2">Entity ID</label>
            <InputText
              value={entityId}
              onChange={(event) => setEntityId(event.target.value)}
              placeholder="ID del registro"
              className="w-full"
            />
          </div>

          <div className="field col-12 md:col-4">
            <label className="block text-900 font-medium mb-2">Usuario ID</label>
            <InputText
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              placeholder="ID del usuario"
              className="w-full"
            />
          </div>

          <div className="field col-12 md:col-4 flex align-items-end gap-2">
            <Button
              label="Filtrar"
              icon="pi pi-filter"
              onClick={applyFilters}
              className="flex-1"
            />
            <Button
              icon="pi pi-times"
              severity="secondary"
              outlined
              onClick={clearFilters}
              tooltip="Limpiar filtros"
            />
          </div>
        </div>

        <DataTable
          value={logs}
          lazy
          paginator
          first={page * rows}
          rows={rows}
          totalRecords={totalRecords}
          onPage={handlePage}
          rowsPerPageOptions={[10, 25, 50, 100]}
          loading={loading}
          size="small"
          dataKey="id"
          responsiveLayout="scroll"
          emptyMessage="No hay eventos de auditoria"
          tableStyle={{ minWidth: "82rem" }}
        >
          <Column
            header="Fecha"
            body={(row: AuditLog) => formatAuditDateTime(row.createdAt)}
            style={{ width: "12rem" }}
          />
          <Column header="Entidad" body={entityTemplate} />
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
            header="Empresa"
            body={(row: AuditLog) => getAuditEmpresaLabel(row)}
            style={{ width: "12rem" }}
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
                tooltip="Ver detalle"
              />
            )}
            style={{ width: "6rem", textAlign: "center" }}
            headerStyle={{ textAlign: "center" }}
          />
        </DataTable>
      </div>

      <Dialog
        visible={!!selectedLog}
        onHide={() => setSelectedLog(null)}
        header={
          selectedLog
            ? `${getAuditEntityLabel(selectedLog.entity)} - ${getAuditActionLabel(
                selectedLog.action,
              )}`
            : "Detalle"
        }
        footer={detailFooter}
        modal
        style={{ width: "70vw" }}
        breakpoints={{ "1200px": "80vw", "800px": "95vw" }}
      >
        {selectedLog && (
          <div className="grid row-gap-3">
            <div className="col-12 md:col-4">
              <span className="text-500 text-sm">Fecha</span>
              <div className="font-medium">
                {formatAuditDateTime(selectedLog.createdAt)}
              </div>
            </div>
            <div className="col-12 md:col-4">
              <span className="text-500 text-sm">Usuario</span>
              <div className="font-medium">{getAuditUserLabel(selectedLog)}</div>
            </div>
            <div className="col-12 md:col-4">
              <span className="text-500 text-sm">Empresa</span>
              <div className="font-medium">
                {getAuditEmpresaLabel(selectedLog)}
              </div>
            </div>
            <div className="col-12 md:col-6">
              <span className="text-500 text-sm">Entidad</span>
              <div className="font-medium">
                {getAuditEntityLabel(selectedLog.entity)}
              </div>
            </div>
            <div className="col-12 md:col-6">
              <span className="text-500 text-sm">Entity ID</span>
              <div className="font-medium">{selectedLog.entityId}</div>
            </div>
            <div className="col-12">
              <span className="text-500 text-sm">Cambios</span>
              <AuditChangesView log={selectedLog} />
            </div>
            <div className="col-12">
              <span className="text-500 text-sm">Metadata</span>
              <pre className="surface-100 p-3 border-round overflow-auto text-sm">
                {stringifyAuditJson(selectedLog.metadata)}
              </pre>
            </div>
          </div>
        )}
      </Dialog>
    </>
  );
}
