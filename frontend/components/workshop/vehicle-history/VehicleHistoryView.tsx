"use client";
import React, { useState, useRef } from "react";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Timeline } from "primereact/timeline";
import { Card } from "primereact/card";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
import { ProgressSpinner } from "primereact/progressspinner";
import { Message } from "primereact/message";
import { motion } from "framer-motion";
import { vehicleHistoryService } from "@/app/api/workshop";
import type { VehicleHistoryData } from "@/libs/interfaces/workshop";
import { handleFormError } from "@/utils/errorHandlers";

type HistoryEntry = {
  date: string;
  icon: string;
  color: string;
  title: string;
  description?: string;
  status?: string;
  statusSeverity?: "success" | "info" | "warning" | "danger" | "secondary";
};

const buildEntries = (data: VehicleHistoryData): HistoryEntry[] => {
  const entries: HistoryEntry[] = [];

  data.appointments.forEach((a) =>
    entries.push({
      date: a.scheduledDate,
      icon: "pi pi-calendar",
      color: "var(--teal-500)",
      title: `Cita ${a.folio}`,
      description: a.serviceType?.name,
      status: a.status,
      statusSeverity: "info",
    })
  );

  data.receptions.forEach((r) =>
    entries.push({
      date: r.receivedAt,
      icon: "pi pi-inbox",
      color: "var(--blue-500)",
      title: `Recepción ${r.code}`,
      description: `Kilometraje: ${r.mileageIn.toLocaleString("es-MX")} km`,
      status: r.status,
      statusSeverity: "info",
    })
  );

  data.serviceOrders.forEach((so) =>
    entries.push({
      date: so.receivedAt,
      icon: "pi pi-file-edit",
      color: "var(--purple-500)",
      title: `Orden de Trabajo ${so.folio}`,
      description: so.total
        ? `Total: ${so.total.toLocaleString("es-MX", { style: "currency", currency: "MXN" })}`
        : undefined,
      status: so.status,
      statusSeverity:
        so.status === "CLOSED" || so.status === "DELIVERED"
          ? "success"
          : so.status === "CANCELLED"
          ? "danger"
          : "warning",
    })
  );

  data.warranties.forEach((w) =>
    entries.push({
      date: w.createdAt,
      icon: "pi pi-shield",
      color: "var(--orange-500)",
      title: `Garantía ${w.code}`,
      description: `Tipo: ${w.type}`,
      status: w.status,
      statusSeverity: w.status === "CLOSED" ? "success" : "warning",
    })
  );

  return entries.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
};

export default function VehicleHistoryView() {
  const [vehicleId, setVehicleId] = useState("");
  const [historyData, setHistoryData] = useState<VehicleHistoryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const toast = useRef<Toast>(null);

  const handleSearch = async () => {
    if (!vehicleId.trim()) return;
    try {
      setLoading(true);
      setNotFound(false);
      setHistoryData(null);
      const res = await vehicleHistoryService.getHistory(vehicleId.trim());
      setHistoryData(res.data);
    } catch (error: any) {
      if (error?.response?.status === 404) {
        setNotFound(true);
      } else {
        handleFormError(error, toast.current!);
      }
    } finally {
      setLoading(false);
    }
  };

  const entries = historyData ? buildEntries(historyData) : [];

  const markerTemplate = (item: HistoryEntry) => (
    <span
      className="flex w-2rem h-2rem align-items-center justify-content-center border-circle"
      style={{ backgroundColor: item.color }}
    >
      <i className={`${item.icon} text-white text-sm`} />
    </span>
  );

  const contentTemplate = (item: HistoryEntry) => (
    <div className="mb-3">
      <div className="flex align-items-center gap-2 mb-1">
        <span className="font-semibold text-900">{item.title}</span>
        {item.status && (
          <Tag
            value={item.status}
            severity={item.statusSeverity ?? "info"}
            rounded
          />
        )}
      </div>
      {item.description && (
        <span className="text-600 text-sm">{item.description}</span>
      )}
      <div className="text-400 text-xs mt-1">
        {new Date(item.date).toLocaleDateString("es-MX", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </div>
    </div>
  );

  return (
    <motion.div
      className="p-3"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Toast ref={toast} />

      {/* Header */}
      <div className="flex align-items-center gap-2 mb-4">
        <i className="pi pi-car text-primary text-2xl" />
        <h2 className="text-2xl font-bold text-900 m-0">Historial de Vehículo</h2>
      </div>

      {/* Search */}
      <Card className="mb-4">
        <div className="flex flex-wrap gap-2 align-items-end">
          <div className="flex flex-column gap-1 flex-1">
            <label className="block text-900 font-medium mb-1">
              ID de Vehículo
            </label>
            <InputText
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              placeholder="Ingrese el ID del vehículo"
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-full"
            />
          </div>
          <Button
            label="Buscar"
            icon="pi pi-search"
            onClick={handleSearch}
            loading={loading}
          />
        </div>
      </Card>

      {/* Loading */}
      {loading && (
        <div className="flex justify-content-center py-6">
          <ProgressSpinner style={{ width: 50, height: 50 }} />
        </div>
      )}

      {/* Not found */}
      {notFound && !loading && (
        <Message
          severity="warn"
          text="No se encontró ningún vehículo con ese ID."
          className="w-full mb-3"
        />
      )}

      {/* Vehicle info card */}
      {historyData && !loading && (
        <>
          <Card className="mb-4" title="Información del Vehículo">
            <div className="grid">
              <div className="col-12 md:col-6 lg:col-3">
                <div className="text-500 text-sm">Placa</div>
                <div className="text-900 font-semibold">
                  {historyData.vehicle.plate}
                </div>
              </div>
              <div className="col-12 md:col-6 lg:col-3">
                <div className="text-500 text-sm">Marca / Modelo</div>
                <div className="text-900 font-semibold">
                  {[
                    historyData.vehicle.brand?.name,
                    historyData.vehicle.vehicleModel?.name,
                    historyData.vehicle.year,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                </div>
              </div>
              <div className="col-12 md:col-6 lg:col-3">
                <div className="text-500 text-sm">Cliente</div>
                <div className="text-900 font-semibold">
                  {historyData.vehicle.customer?.name ?? "—"}
                </div>
              </div>
              <div className="col-12 md:col-6 lg:col-3">
                <div className="text-500 text-sm">Kilometraje actual</div>
                <div className="text-900 font-semibold">
                  {historyData.vehicle.mileage
                    ? `${historyData.vehicle.mileage.toLocaleString("es-MX")} km`
                    : "—"}
                </div>
              </div>
            </div>

            {/* Summary counts */}
            <div className="flex flex-wrap gap-3 mt-3 pt-3 border-top-1 surface-border">
              <Tag
                icon="pi pi-calendar"
                value={`${historyData.appointments.length} cita(s)`}
                severity="info"
                rounded
              />
              <Tag
                icon="pi pi-inbox"
                value={`${historyData.receptions.length} recepción(es)`}
                severity="info"
                rounded
              />
              <Tag
                icon="pi pi-file-edit"
                value={`${historyData.serviceOrders.length} OT(s)`}
                severity="warning"
                rounded
              />
              <Tag
                icon="pi pi-shield"
                value={`${historyData.warranties.length} garantía(s)`}
                severity="secondary"
                rounded
              />
            </div>
          </Card>

          {/* Timeline */}
          {entries.length === 0 ? (
            <Message
              severity="info"
              text="Sin historial registrado para este vehículo."
              className="w-full"
            />
          ) : (
            <Card title="Línea de Tiempo">
              <Timeline
                value={entries}
                align="left"
                marker={markerTemplate}
                content={contentTemplate}
              />
            </Card>
          )}
        </>
      )}
    </motion.div>
  );
}
