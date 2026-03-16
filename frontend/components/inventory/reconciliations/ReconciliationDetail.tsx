"use client";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { Button } from "primereact/button";
import { Divider } from "primereact/divider";
import { motion } from "framer-motion";

import { Reconciliation } from "../../../app/api/inventory/reconciliationService";
import {
  RECONCILIATION_STATUS_CONFIG,
  RECONCILIATION_SOURCE_CONFIG,
} from "../../../libs/interfaces/inventory/reconciliation.interface";

interface ReconciliationDetailProps {
  reconciliation: Reconciliation;
  onRefresh?: () => void;
}

export default function ReconciliationDetail({
  reconciliation,
  onRefresh,
}: ReconciliationDetailProps) {
  const statusConfig = RECONCILIATION_STATUS_CONFIG[reconciliation.status];
  const sourceConfig = reconciliation.source
    ? RECONCILIATION_SOURCE_CONFIG[reconciliation.source]
    : undefined;

  // ── Helpers ──────────────────────────────────────────────────────────────
  const formatDate = (d?: string | Date | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("es-VE", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const totalItems = reconciliation.items?.length ?? 0;
  const itemsWithDiscrepancy =
    reconciliation.items?.filter((i) => {
      const diff = (i.expectedQuantity ?? 0) - i.systemQuantity;
      return diff !== 0;
    }).length ?? 0;
  const itemsOk = totalItems - itemsWithDiscrepancy;

  // ── Templates de tabla ───────────────────────────────────────────────────
  const itemNameTemplate = (rowData: any) => (
    <div>
      <div className="font-medium text-900">
        {rowData.itemName ?? rowData.item?.name ?? rowData.itemId}
      </div>
      {(rowData.itemSku ?? rowData.item?.sku ?? rowData.item?.code) && (
        <small className="text-500">
          {rowData.itemSku ?? rowData.item?.sku ?? rowData.item?.code}
        </small>
      )}
    </div>
  );

  const differenceTemplate = (rowData: any) => {
    const diff = (rowData.expectedQuantity ?? 0) - rowData.systemQuantity;
    if (diff === 0) return <Tag value="0 — OK" severity="success" />;
    if (diff > 0)
      return (
        <Tag
          value={`+${diff}`}
          severity={Math.abs(diff) <= 5 ? "warning" : "danger"}
        />
      );
    return (
      <Tag
        value={String(diff)}
        severity={Math.abs(diff) <= 5 ? "warning" : "danger"}
      />
    );
  };

  const rowClass = (rowData: any) => {
    const diff = (rowData.expectedQuantity ?? 0) - rowData.systemQuantity;
    if (diff === 0) return "";
    if (Math.abs(diff) <= 5) return "bg-yellow-50";
    return "bg-red-50";
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* ── Encabezado: datos principales ──────────────────────────────── */}
      <div className="grid mb-3">
        <div className="col-12 md:col-4">
          <div className="surface-100 border-round p-3">
            <div className="text-500 text-sm mb-1">Nº Reconciliación</div>
            <div className="text-900 font-bold text-lg">
              {reconciliation.reconciliationNumber}
            </div>
          </div>
        </div>

        <div className="col-12 md:col-4">
          <div className="surface-100 border-round p-3">
            <div className="text-500 text-sm mb-2">Estado</div>
            <div className="flex align-items-center gap-2">
              <i className={statusConfig.icon} />
              <Tag
                value={statusConfig.label}
                severity={statusConfig.severity as any}
              />
            </div>
          </div>
        </div>

        <div className="col-12 md:col-4">
          <div className="surface-100 border-round p-3">
            <div className="text-500 text-sm mb-1">Origen de Discrepancia</div>
            <div className="flex align-items-center gap-2">
              {sourceConfig && (
                <i className={`${sourceConfig.icon} text-500`} />
              )}
              <span className="font-medium text-900">
                {sourceConfig?.label ?? reconciliation.source ?? "—"}
              </span>
            </div>
          </div>
        </div>

        <div className="col-12 md:col-4">
          <div className="surface-100 border-round p-3">
            <div className="text-500 text-sm mb-1">Almacén</div>
            <div className="font-medium text-900">
              {reconciliation.warehouse?.name ?? "—"}
            </div>
          </div>
        </div>

        <div className="col-12 md:col-4">
          <div className="surface-100 border-round p-3">
            <div className="text-500 text-sm mb-1">Creado</div>
            <div className="text-900">
              {formatDate(reconciliation.createdAt)}
            </div>
          </div>
        </div>

        {reconciliation.approvedAt && (
          <div className="col-12 md:col-4">
            <div className="surface-100 border-round p-3">
              <div className="text-500 text-sm mb-1">Aprobado</div>
              <div className="text-900">
                {formatDate(reconciliation.approvedAt)}
              </div>
            </div>
          </div>
        )}

        {reconciliation.appliedAt && (
          <div className="col-12 md:col-4">
            <div className="surface-100 border-round p-3">
              <div className="text-500 text-sm mb-1">Aplicado al stock</div>
              <div className="text-900">
                {formatDate(reconciliation.appliedAt)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Notas ───────────────────────────────────────────────────────── */}
      {reconciliation.notes && (
        <div className="surface-50 border-left-3 border-primary p-3 mb-3 border-round-right">
          <div className="text-500 text-sm mb-1 font-medium">Notas</div>
          <div className="text-700">{reconciliation.notes}</div>
        </div>
      )}

      {/* ── Resumen de discrepancias ─────────────────────────────────────── */}
      <div className="grid mb-3">
        <div className="col-12 md:col-4">
          <div className="surface-100 border-round p-3 text-center">
            <div className="text-2xl font-bold text-900">{totalItems}</div>
            <div className="text-500 text-sm mt-1">Total artículos</div>
          </div>
        </div>
        <div className="col-12 md:col-4">
          <div className="surface-100 border-round p-3 text-center">
            <div className="text-2xl font-bold text-green-600">{itemsOk}</div>
            <div className="text-500 text-sm mt-1">Sin discrepancia</div>
          </div>
        </div>
        <div className="col-12 md:col-4">
          <div className="surface-100 border-round p-3 text-center">
            <div className="text-2xl font-bold text-red-500">
              {itemsWithDiscrepancy}
            </div>
            <div className="text-500 text-sm mt-1">Con discrepancia</div>
          </div>
        </div>
      </div>

      <Divider />

      {/* ── Leyenda ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 mb-3">
        <div className="flex align-items-center gap-2">
          <div className="w-1rem h-1rem border-round bg-green-100 border-1 border-green-300" />
          <span className="text-500 text-sm">Sin discrepancia</span>
        </div>
        <div className="flex align-items-center gap-2">
          <div className="w-1rem h-1rem border-round bg-yellow-50 border-1 border-yellow-300" />
          <span className="text-500 text-sm">Discrepancia ±5 unidades</span>
        </div>
        <div className="flex align-items-center gap-2">
          <div className="w-1rem h-1rem border-round bg-red-50 border-1 border-red-300" />
          <span className="text-500 text-sm">Discrepancia &gt;5 unidades</span>
        </div>
      </div>

      {/* ── Tabla de artículos ───────────────────────────────────────────── */}
      <DataTable
        value={reconciliation.items ?? []}
        rowClassName={rowClass}
        size="small"
        stripedRows
        emptyMessage="Sin artículos registrados"
        responsiveLayout="scroll"
      >
        <Column
          header="Artículo"
          body={itemNameTemplate}
          style={{ minWidth: "180px" }}
        />
        <Column
          header="Stock Sistema"
          field="systemQuantity"
          align="right"
          style={{ width: "130px" }}
          body={(r: any) => (
            <span className="font-medium">{r.systemQuantity}</span>
          )}
        />
        <Column
          header="Stock Real/Contado"
          field="expectedQuantity"
          align="right"
          style={{ width: "150px" }}
          body={(r: any) => (
            <span className="font-medium">{r.expectedQuantity ?? 0}</span>
          )}
        />
        <Column
          header="Discrepancia"
          body={differenceTemplate}
          align="center"
          style={{ width: "130px" }}
        />
      </DataTable>

      {/* ── Acciones ────────────────────────────────────────────────────── */}
      {onRefresh && (
        <div className="flex justify-content-end mt-3">
          <Button
            label="Actualizar"
            icon="pi pi-refresh"
            severity="secondary"
            onClick={onRefresh}
          />
        </div>
      )}
    </motion.div>
  );
}
