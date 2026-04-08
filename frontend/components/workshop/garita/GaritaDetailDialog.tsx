"use client";
import React from "react";
import dynamic from "next/dynamic";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import GaritaStatusBadge, {
  GARITA_TYPE_LABELS,
  GARITA_TYPE_ICON,
} from "./GaritaStatusBadge";
import type { GaritaEvent } from "@/libs/interfaces/workshop";

// Carga dinámica del visor — el PDFViewer de @react-pdf/renderer no puede renderizar en SSR
const GaritaPDFPreview = dynamic(() => import("./GaritaPDFPreview"), {
  ssr: false,
  loading: () => (
    <div className="flex align-items-center justify-content-center p-4 gap-2" style={{ height: 400 }}>
      <i className="pi pi-spin pi-spinner" style={{ fontSize: "1.5rem", color: "#2563eb" }} />
      <span className="text-600">Generando documento...</span>
    </div>
  ),
});

interface Props {
  event: GaritaEvent | null;
  visible: boolean;
  onHide: () => void;
}

const fmt = (d?: string | null) =>
  d
    ? new Date(d).toLocaleString("es-VE", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : "—";

const Field = ({ label, value }: { label: string; value?: React.ReactNode }) => (
  <div className="mb-3">
    <div className="text-500 text-xs font-semibold mb-1 uppercase tracking-wide">{label}</div>
    <div className="text-900">{value ?? "—"}</div>
  </div>
);

export default function GaritaDetailDialog({ event, visible, onHide }: Props) {
  const [pdfDialog, setPdfDialog] = React.useState(false);

  if (!event) return null;

  const eventId = event.id.slice(-8).toUpperCase();

  const header = (
    <div className="flex align-items-center gap-2 flex-wrap">
      <i className={`${GARITA_TYPE_ICON[event.type]} text-primary`} />
      <span className="font-semibold">{GARITA_TYPE_LABELS[event.type]}</span>
      <span className="text-400 text-sm">·</span>
      <span className="text-500 text-sm font-mono">REG-{eventId}</span>
      <div className="ml-auto flex align-items-center gap-2">
        <GaritaStatusBadge status={event.status} />
        {event.hasIrregularity && (
          <span className="text-red-500 text-xs font-semibold">
            <i className="pi pi-exclamation-triangle mr-1" />
            Irregularidad
          </span>
        )}
      </div>
    </div>
  );

  return (
    <Dialog
      visible={visible}
      onHide={() => { setPdfDialog(false); onHide(); }}
      header={header}
      style={{ width: "72rem" }}
      breakpoints={{ "960px": "95vw" }}
      maximizable
      modal
      draggable={false}
    >
      <div className="grid">

        {/* ── Columna izquierda ─────────────────────────────────────────── */}
        <div className="col-12 lg:col-8">

          {/* Datos del vehículo */}
          <div className="card mb-3">
            <div className="flex align-items-center gap-2 mb-3">
              <i className="pi pi-car text-primary" />
              <span className="font-semibold text-900">Datos del Vehículo</span>
            </div>
            <div className="grid">
              <div className="col-6 md:col-3">
                <Field label="Placa" value={<span className="font-bold text-primary">{event.plateNumber ?? "—"}</span>} />
              </div>
              <div className="col-6 md:col-9">
                <Field label="Vehículo" value={event.vehicleDesc} />
              </div>
              {event.kmIn != null && (
                <div className="col-6 md:col-3">
                  <Field label="Km entrada" value={`${event.kmIn.toLocaleString()} km`} />
                </div>
              )}
              {event.kmOut != null && (
                <div className="col-6 md:col-3">
                  <Field label="Km salida" value={`${event.kmOut.toLocaleString()} km`} />
                </div>
              )}
              {event.serialMotor && (
                <div className="col-6">
                  <Field label="Serial de motor" value={<span className="font-mono text-sm">{event.serialMotor}</span>} />
                </div>
              )}
              {event.serialBody && (
                <div className="col-6">
                  <Field label="Serial de carrocería" value={<span className="font-mono text-sm">{event.serialBody}</span>} />
                </div>
              )}
            </div>
          </div>

          {/* Conductor */}
          <div className="card mb-3">
            <div className="flex align-items-center gap-2 mb-3">
              <i className="pi pi-id-card text-primary" />
              <span className="font-semibold text-900">Conductor / Responsable</span>
            </div>
            <div className="grid">
              <div className="col-12 md:col-6">
                <Field label="Nombre" value={event.driverName} />
              </div>
              <div className="col-12 md:col-6">
                <Field label="Cédula" value={event.driverId} />
              </div>
            </div>
          </div>

          {/* Autorización / Pase */}
          {(event.exitPassRef || event.authorizedAt || event.completedAt) && (
            <div className="card mb-3">
              <div className="flex align-items-center gap-2 mb-3">
                <i className="pi pi-verified text-green-500" />
                <span className="font-semibold text-900">Autorización</span>
              </div>
              <div className="grid">
                {event.exitPassRef && (
                  <div className="col-12 md:col-6">
                    <Field
                      label="Pase de salida"
                      value={<span className="font-bold">{event.exitPassRef}</span>}
                    />
                  </div>
                )}
                {event.authorizedAt && (
                  <div className="col-12 md:col-6">
                    <Field label="Fecha autorización" value={fmt(event.authorizedAt)} />
                  </div>
                )}
                {event.completedAt && (
                  <div className="col-12 md:col-6">
                    <Field label="Completado" value={fmt(event.completedAt)} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Irregularidad */}
          {event.hasIrregularity && (
            <div
              className="card mb-3"
              style={{ borderLeft: "4px solid var(--red-500)", background: "var(--red-50)" }}
            >
              <div className="flex align-items-center gap-2 mb-2">
                <i className="pi pi-exclamation-triangle text-red-500 text-xl" />
                <span className="font-bold text-red-700">Irregularidad registrada</span>
              </div>
              <p className="text-red-800 m-0">{event.irregularityNotes ?? "Sin descripción"}</p>
            </div>
          )}

          {/* Notas */}
          {event.notes && (
            <div className="card mb-3">
              <div className="flex align-items-center gap-2 mb-2">
                <i className="pi pi-comment text-primary" />
                <span className="font-semibold text-900">Observaciones</span>
              </div>
              <p className="text-700 m-0">{event.notes}</p>
            </div>
          )}
        </div>

        {/* ── Columna derecha ───────────────────────────────────────────── */}
        <div className="col-12 lg:col-4">

          {/* Info rápida */}
          <div className="card mb-3">
            <div className="flex flex-column gap-3">
              <Field label="Estado" value={<GaritaStatusBadge status={event.status} />} />
              <Field label="Tipo" value={GARITA_TYPE_LABELS[event.type]} />
              <Field label="Fecha / Hora" value={fmt(event.eventAt)} />
              <Field label="Creado" value={fmt(event.createdAt)} />
            </div>
          </div>

          {/* Vinculación */}
          {(event.serviceOrder || event.tot) && (
            <div className="card mb-3">
              <div className="flex align-items-center gap-2 mb-3">
                <i className="pi pi-link text-primary" />
                <span className="font-semibold text-900">Vinculación</span>
              </div>
              {event.serviceOrder ? (
                <div className="flex flex-column gap-2">
                  <div className="text-xs text-500 uppercase">Orden de Trabajo</div>
                  <span className="font-bold text-primary text-lg">{event.serviceOrder.folio}</span>
                  {event.serviceOrder.vehiclePlate && (
                    <span className="text-600 text-sm">
                      <i className="pi pi-car mr-1" />
                      {event.serviceOrder.vehiclePlate}
                      {event.serviceOrder.vehicleDesc && ` · ${event.serviceOrder.vehicleDesc}`}
                    </span>
                  )}
                </div>
              ) : event.tot ? (
                <div className="flex flex-column gap-2">
                  <div className="text-xs text-500 uppercase">T.O.T.</div>
                  <span className="font-bold text-primary">{event.tot.totNumber}</span>
                  <span className="text-600 text-sm">{event.tot.partDescription}</span>
                </div>
              ) : null}
            </div>
          )}

          {/* Imprimir */}
          <div className="card">
            <div className="flex align-items-center gap-2 mb-3">
              <i className="pi pi-print text-primary" />
              <span className="font-semibold text-900">Documento</span>
            </div>
            <Button
              label="Ver / Imprimir PDF"
              icon="pi pi-file-pdf"
              className="w-full"
              outlined
              onClick={() => setPdfDialog(true)}
            />
            <p className="text-500 text-xs mt-2 m-0">
              Genera el pase de movimiento con sección de firmas
            </p>
          </div>
        </div>
      </div>

      {/* ── Modal PDF ─────────────────────────────────────────────────────── */}
      <Dialog
        visible={pdfDialog}
        onHide={() => setPdfDialog(false)}
        header={`Registro REG-${eventId} — ${GARITA_TYPE_LABELS[event.type]}`}
        style={{ width: "90vw", height: "90vh" }}
        maximizable
        modal
        draggable={false}
        contentStyle={{ padding: 0, height: "100%" }}
      >
        <GaritaPDFPreview event={event} />
      </Dialog>
    </Dialog>
  );
}
