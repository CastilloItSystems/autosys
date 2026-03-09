"use client";

import React from "react";
import {
  Transfer,
  TransferStatus,
  TRANSFER_STATUS_CONFIG,
} from "../../../libs/interfaces/inventory/transfer.interface";
import { Badge } from "primereact/badge";
import { Divider } from "primereact/divider";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Message } from "primereact/message";

interface TransferDetailProps {
  transfer: Transfer;
}

export default function TransferDetail({ transfer }: TransferDetailProps) {
  const statusConfig = TRANSFER_STATUS_CONFIG[transfer.status];

  return (
    <div className="flex flex-column gap-4">
      {/* Header Info */}
      <div className="grid">
        <div className="col-12 md:col-4">
          <span className="text-500 font-medium block mb-2">
            # Transferencia
          </span>
          <span className="text-900 text-xl font-bold">
            {transfer.transferNumber}
          </span>
        </div>
        <div className="col-12 md:col-4">
          <span className="text-500 font-medium block mb-2">Estado</span>
          <Badge
            value={statusConfig.label}
            severity={statusConfig.severity}
            size="large"
          />
        </div>
        <div className="col-12 md:col-4">
          <span className="text-500 font-medium block mb-2">
            Fecha de Creación
          </span>
          <span className="text-900 text-lg">
            {new Date(transfer.createdAt).toLocaleDateString("es-ES")}
          </span>
        </div>
      </div>

      <Divider className="my-0" />

      {/* Warehouses Info */}
      <div className="grid">
        <div className="col-12 md:col-6">
          <div className="p-3 surface-50 border-round h-full border-left-3 border-blue-500">
            <div className="flex align-items-center gap-2 mb-2">
              <i className="pi pi-box text-blue-500 text-xl" />
              <span className="text-700 font-bold">Almacén Origen</span>
            </div>
            <div className="text-900 text-xl font-medium ml-5">
              {transfer.fromWarehouse?.name || "—"}
            </div>
          </div>
        </div>
        <div className="col-12 md:col-6">
          <div className="p-3 surface-50 border-round h-full border-left-3 border-green-500">
            <div className="flex align-items-center gap-2 mb-2">
              <i className="pi pi-home text-green-500 text-xl" />
              <span className="text-700 font-bold">Almacén Destino</span>
            </div>
            <div className="text-900 text-xl font-medium ml-5">
              {transfer.toWarehouse?.name || "—"}
            </div>
          </div>
        </div>
      </div>

      {/* Approval info */}
      {transfer.approvedAt && (
        <div className="surface-50 p-3 border-round flex align-items-center justify-content-between flex-wrap gap-3 border-left-3 border-orange-500">
          <div className="flex align-items-center gap-2">
            <i className="pi pi-check-circle text-orange-500 text-xl" />
            <div>
              <span className="text-700 font-bold block">Aprobado por</span>
              <span className="text-900">{transfer.approvedBy || "—"}</span>
            </div>
          </div>
          <div>
            <span className="text-700 font-bold block text-right">
              Fecha de Aprobación
            </span>
            <div className="text-900">
              <i className="pi pi-calendar mr-2 text-500" />
              {new Date(transfer.approvedAt).toLocaleDateString("es-ES", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        </div>
      )}

      {/* Rejection info */}
      {transfer.status === TransferStatus.REJECTED && (
        <Message
          severity="error"
          className="w-full"
          content={
            <div className="flex flex-column gap-2">
              <span className="font-semibold">
                Rechazada por: {transfer.rejectedBy || "—"}
              </span>
              {transfer.rejectedAt && (
                <small>
                  {new Date(transfer.rejectedAt).toLocaleDateString("es-ES", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </small>
              )}
              {transfer.rejectionReason && (
                <p className="mt-1">
                  <strong>Razón:</strong> {transfer.rejectionReason}
                </p>
              )}
            </div>
          }
        />
      )}

      {/* Documentos Asociados y Estado de Tránsito */}
      {(transfer.exitNote || transfer.entryNote) && (
        <>
          <Divider />
          <div>
            <h3 className="mb-3 text-lg font-semibold">
              Flujo de Transferencia
            </h3>

            {/* Transit status banner */}
            {(() => {
              const exitDelivered = transfer.exitNote?.status === "DELIVERED";
              const entryCompleted = transfer.entryNote?.status === "COMPLETED";
              const exitCancelled = transfer.exitNote?.status === "CANCELLED";
              const entryCancelled = transfer.entryNote?.status === "CANCELLED";

              if (exitCancelled || entryCancelled) return null;
              if (exitDelivered && !entryCompleted) {
                return (
                  <Message
                    severity="warn"
                    className="w-full mb-3"
                    content={
                      <div className="flex align-items-center gap-2">
                        <i className="pi pi-truck text-xl" />
                        <div>
                          <span className="font-semibold">
                            Productos en tránsito
                          </span>
                          <p className="m-0 text-sm mt-1">
                            La mercancía salió del almacén origen pero aún no ha
                            sido recibida en el almacén destino.
                          </p>
                        </div>
                      </div>
                    }
                  />
                );
              }
              if (exitDelivered && entryCompleted) {
                return (
                  <Message
                    severity="success"
                    className="w-full mb-3"
                    content={
                      <div className="flex align-items-center gap-2">
                        <i className="pi pi-check-circle text-xl" />
                        <span className="font-semibold">
                          Transferencia completada — mercancía recibida en
                          destino
                        </span>
                      </div>
                    }
                  />
                );
              }
              if (!exitDelivered && !entryCompleted) {
                return (
                  <Message
                    severity="info"
                    className="w-full mb-3"
                    content={
                      <div className="flex align-items-center gap-2">
                        <i className="pi pi-info-circle text-xl" />
                        <span className="font-semibold">
                          Pendiente — primero debe realizarse la salida desde el
                          almacén origen
                        </span>
                      </div>
                    }
                  />
                );
              }
              return null;
            })()}

            {/* Step indicators */}
            <div className="flex align-items-center justify-content-center gap-2 mb-4">
              {/* Step 1: Nota de Salida */}
              <div
                className={`text-center p-3 border-round flex-1 ${
                  transfer.exitNote?.status === "DELIVERED"
                    ? "bg-green-50 border-green-200 border-1"
                    : "surface-100 border-1 surface-border"
                }`}
              >
                <i
                  className={`pi pi-upload text-2xl mb-2 block ${
                    transfer.exitNote?.status === "DELIVERED"
                      ? "text-green-600"
                      : "text-500"
                  }`}
                />
                <p className="font-semibold m-0 text-sm">1. Salida</p>
                <p className="text-xs text-500 m-0 mt-1">Almacén origen</p>
              </div>

              <i
                className={`pi pi-arrow-right text-xl ${
                  transfer.exitNote?.status === "DELIVERED"
                    ? "text-green-600"
                    : "text-300"
                }`}
              />

              {/* Step 2: En Tránsito */}
              <div
                className={`text-center p-3 border-round flex-1 ${
                  transfer.exitNote?.status === "DELIVERED" &&
                  transfer.entryNote?.status !== "COMPLETED"
                    ? "bg-yellow-50 border-yellow-200 border-1"
                    : transfer.entryNote?.status === "COMPLETED"
                    ? "bg-green-50 border-green-200 border-1"
                    : "surface-100 border-1 surface-border"
                }`}
              >
                <i
                  className={`pi pi-truck text-2xl mb-2 block ${
                    transfer.exitNote?.status === "DELIVERED" &&
                    transfer.entryNote?.status !== "COMPLETED"
                      ? "text-yellow-600"
                      : transfer.entryNote?.status === "COMPLETED"
                      ? "text-green-600"
                      : "text-300"
                  }`}
                />
                <p className="font-semibold m-0 text-sm">2. Tránsito</p>
                <p className="text-xs text-500 m-0 mt-1">En camino</p>
              </div>

              <i
                className={`pi pi-arrow-right text-xl ${
                  transfer.entryNote?.status === "COMPLETED"
                    ? "text-green-600"
                    : "text-300"
                }`}
              />

              {/* Step 3: Recepción */}
              <div
                className={`text-center p-3 border-round flex-1 ${
                  transfer.entryNote?.status === "COMPLETED"
                    ? "bg-green-50 border-green-200 border-1"
                    : "surface-100 border-1 surface-border"
                }`}
              >
                <i
                  className={`pi pi-download text-2xl mb-2 block ${
                    transfer.entryNote?.status === "COMPLETED"
                      ? "text-green-600"
                      : "text-500"
                  }`}
                />
                <p className="font-semibold m-0 text-sm">3. Recepción</p>
                <p className="text-xs text-500 m-0 mt-1">Almacén destino</p>
              </div>
            </div>

            {/* Document cards */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {transfer.exitNote && (
                <div className="surface-100 border-round p-3">
                  <div className="flex align-items-center justify-content-between mb-2">
                    <span className="font-semibold text-primary">
                      <i className="pi pi-upload mr-2" />
                      Nota de Salida
                    </span>
                    <Badge
                      value={
                        {
                          PENDING: "Pendiente",
                          IN_PROGRESS: "En Proceso",
                          READY: "Lista",
                          DELIVERED: "Entregada",
                          CANCELLED: "Cancelada",
                        }[transfer.exitNote.status] || transfer.exitNote.status
                      }
                      severity={
                        transfer.exitNote.status === "DELIVERED"
                          ? "success"
                          : transfer.exitNote.status === "CANCELLED"
                          ? "danger"
                          : "warning"
                      }
                    />
                  </div>
                  <p className="m-0 text-sm">
                    {transfer.exitNote.exitNoteNumber}
                  </p>
                  <a
                    href="/empresa/inventario/notas-salida"
                    className="text-primary text-sm mt-2 inline-block hover:underline"
                  >
                    Ver en Notas de Salida →
                  </a>
                </div>
              )}
              {transfer.entryNote && (
                <div className="surface-100 border-round p-3">
                  <div className="flex align-items-center justify-content-between mb-2">
                    <span className="font-semibold text-primary">
                      <i className="pi pi-download mr-2" />
                      Nota de Entrada
                    </span>
                    <Badge
                      value={
                        {
                          PENDING: "Pendiente",
                          IN_PROGRESS: "En Proceso",
                          COMPLETED: "Completada",
                          CANCELLED: "Cancelada",
                        }[transfer.entryNote.status] ||
                        transfer.entryNote.status
                      }
                      severity={
                        transfer.entryNote.status === "COMPLETED"
                          ? "success"
                          : transfer.entryNote.status === "CANCELLED"
                          ? "danger"
                          : "warning"
                      }
                    />
                  </div>
                  <p className="m-0 text-sm">
                    {transfer.entryNote.entryNoteNumber}
                  </p>
                  <a
                    href="/empresa/inventario/recepciones"
                    className="text-primary text-sm mt-2 inline-block hover:underline"
                  >
                    Ver en Recepciones →
                  </a>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <Divider />

      <div>
        <h3 className="mb-3 text-lg font-semibold">Artículos</h3>
        <DataTable value={transfer.items} className="w-full">
          <Column
            field="item.name"
            header="Artículo"
            body={(rowData: any) => rowData.item?.name || "—"}
          />
          <Column
            field="item.sku"
            header="SKU"
            body={(rowData: any) => rowData.item?.sku || "—"}
            style={{ width: "100px" }}
          />
          <Column
            field="quantity"
            header="Cantidad"
            style={{ width: "80px" }}
          />
          <Column
            field="unitCost"
            header="Costo Unitario"
            style={{ width: "120px" }}
            body={(rowData: any) =>
              `$${Number(rowData.unitCost || 0).toFixed(2)}`
            }
          />
        </DataTable>
      </div>

      {transfer.notes && (
        <>
          <Divider />
          <div>
            <label className="text-sm font-semibold text-gray-600">Notas</label>
            <p className="mt-2 text-gray-700">{transfer.notes}</p>
          </div>
        </>
      )}
    </div>
  );
}
