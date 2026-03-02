"use client";

import React from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Badge } from "primereact/badge";
import { Reconciliation } from "../../../app/api/inventory/reconciliationService";
import {
  RECONCILIATION_STATUS_CONFIG,
  RECONCILIATION_SOURCE_CONFIG,
} from "../../../libs/interfaces/inventory/reconciliation.interface";
import { motion } from "framer-motion";

interface ReconciliationDetailProps {
  reconciliation: Reconciliation;
}

export default function ReconciliationDetail({
  reconciliation,
}: ReconciliationDetailProps) {
  const statusConfig = RECONCILIATION_STATUS_CONFIG[reconciliation.status];
  const sourceConfig = reconciliation.source
    ? RECONCILIATION_SOURCE_CONFIG[reconciliation.source]
    : undefined;

  const differenceRowClass = (rowData: any) => {
    const difference = (rowData.expectedQuantity || 0) - rowData.systemQuantity;
    if (difference === 0) return "";
    if (Math.abs(difference) <= 5) return "bg-yellow-50";
    return "bg-red-50";
  };

  const itemTemplate = (rowData: any) => (
    <div>
      <div className="font-medium">{rowData.itemName}</div>
      <div className="text-sm text-gray-500">{rowData.itemSku}</div>
    </div>
  );

  const systemQuantityTemplate = (rowData: any) => (
    <span className="font-semibold">{rowData.systemQuantity}</span>
  );

  const expectedQuantityTemplate = (rowData: any) => (
    <span className="font-semibold">{rowData.expectedQuantity}</span>
  );

  const differenceTemplate = (rowData: any) => {
    const difference = (rowData.expectedQuantity || 0) - rowData.systemQuantity;
    if (difference === 0) {
      return <Badge value="0" severity="success" />;
    }
    if (difference > 0) {
      return (
        <Badge
          value={`+${difference}`}
          severity={Math.abs(difference) <= 5 ? "warning" : "danger"}
        />
      );
    }
    return (
      <Badge
        value={difference}
        severity={Math.abs(difference) <= 5 ? "warning" : "danger"}
      />
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Header Info */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg bg-gray-50 p-4">
          <p className="mb-2 text-sm font-medium text-gray-600">
            Número de Reconciliación
          </p>
          <p className="text-lg font-bold">
            {reconciliation.reconciliationNumber}
          </p>
        </div>

        <div className="rounded-lg bg-gray-50 p-4">
          <p className="mb-2 text-sm font-medium text-gray-600">Estado</p>
          {statusConfig && (
            <Badge
              value={statusConfig.label}
              severity={statusConfig.severity as any}
            />
          )}
        </div>

        <div className="rounded-lg bg-gray-50 p-4">
          <p className="mb-2 text-sm font-medium text-gray-600">
            Origen de Discrepancia
          </p>
          <p className="font-semibold">
            {sourceConfig?.label || reconciliation.source}
          </p>
        </div>
      </div>

      {/* Warehouse and Dates */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <p className="mb-1 text-sm font-medium text-gray-600">Almacén</p>
          <p className="font-semibold">
            {reconciliation.warehouse?.name || "N/A"}
          </p>
        </div>

        <div>
          <p className="mb-1 text-sm font-medium text-gray-600">Creado</p>
          <p className="text-sm">
            {new Date(reconciliation.createdAt).toLocaleDateString("es-ES", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        {reconciliation.approvedAt && (
          <div>
            <p className="mb-1 text-sm font-medium text-gray-600">Aprobado</p>
            <p className="text-sm">
              {new Date(reconciliation.approvedAt).toLocaleDateString("es-ES", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        )}

        {reconciliation.appliedAt && (
          <div>
            <p className="mb-1 text-sm font-medium text-gray-600">Aplicado</p>
            <p className="text-sm">
              {new Date(reconciliation.appliedAt).toLocaleDateString("es-ES", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        )}
      </div>

      {/* Notes Section */}
      {reconciliation.notes && (
        <div className="rounded-lg bg-blue-50 p-4">
          <p className="mb-2 text-sm font-medium text-gray-700">Notas</p>
          <p className="text-sm text-gray-600">{reconciliation.notes}</p>
        </div>
      )}

      {/* Discrepancy Legend */}
      <div className="rounded-lg bg-gray-50 p-3">
        <p className="mb-2 text-sm font-medium text-gray-600">
          Leyenda de Discrepancias
        </p>
        <div className="flex flex-wrap gap-4 text-xs">
          <span>
            <span className="mr-1 inline-block h-3 w-3 rounded bg-green-200"></span>
            Sin discrepancia
          </span>
          <span>
            <span className="mr-1 inline-block h-3 w-3 rounded bg-yellow-100"></span>
            Discrepancia ±5 unidades
          </span>
          <span>
            <span className="mr-1 inline-block h-3 w-3 rounded bg-red-100"></span>
            Discrepancia &gt;5 unidades
          </span>
        </div>
      </div>

      {/* Items DataTable */}
      <div>
        <h3 className="mb-3 text-lg font-semibold">Artículos</h3>
        <DataTable
          value={reconciliation.items}
          rowClassName={differenceRowClass}
          className="text-sm"
        >
          <Column field="itemName" header="Artículo" body={itemTemplate} />
          <Column
            field="systemQuantity"
            header="Stock Sistema"
            body={systemQuantityTemplate}
            align="right"
          />
          <Column
            field="expectedQuantity"
            header="Stock Esperado"
            body={expectedQuantityTemplate}
            align="right"
          />
          <Column
            header="Discrepancia"
            body={differenceTemplate}
            align="center"
          />
        </DataTable>
      </div>

      {/* Summary */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <p className="text-sm font-semibold text-gray-700">
          Total de artículos: {reconciliation.items.length}
        </p>
      </div>
    </motion.div>
  );
}
