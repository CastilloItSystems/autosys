"use client";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Tag } from "primereact/tag";
import { handleFormError } from "@/utils/errorHandlers";
import laborTimeService from "../services/laborTimeService";
import type { LaborTime } from "../interfaces/laborTime.interface";

/**
 * Widget cronómetro vivo para una tarea de tiempo técnico.
 * Muestra tiempo acumulado en tiempo real con botones start/pause/resume/finish.
 */
export default function LaborTimerWidget({
  laborTime,
  onUpdated,
}: {
  laborTime: LaborTime;
  onUpdated?: (lt: LaborTime) => void;
}) {
  const toast = useRef<Toast>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (laborTime.status !== "ACTIVE") return;
    const i = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(i);
  }, [laborTime.status]);

  const elapsedMs = (() => {
    const start = new Date(laborTime.startedAt).getTime();
    const stopTs = laborTime.finishedAt
      ? new Date(laborTime.finishedAt).getTime()
      : laborTime.pausedAt && laborTime.status === "PAUSED"
      ? new Date(laborTime.pausedAt).getTime()
      : Date.now();
    const pausedMs = (laborTime.pausedMinutes ?? 0) * 60_000;
    return Math.max(0, stopTs - start - pausedMs);
    // tick variable forces re-eval
  })();
  void tick;

  const hh = String(Math.floor(elapsedMs / 3_600_000)).padStart(2, "0");
  const mm = String(Math.floor((elapsedMs % 3_600_000) / 60_000)).padStart(2, "0");
  const ss = String(Math.floor((elapsedMs % 60_000) / 1_000)).padStart(2, "0");

  const wrap = async (fn: () => Promise<unknown>, summary: string) => {
    try {
      const res = (await fn()) as { data?: LaborTime } | LaborTime;
      const data = (res as any)?.data ?? res;
      toast.current?.show({ severity: "success", summary, life: 1500 });
      onUpdated?.(data as LaborTime);
    } catch (e) {
      handleFormError(e, toast);
    }
  };

  const statusSeverity =
    laborTime.status === "ACTIVE"
      ? "success"
      : laborTime.status === "PAUSED"
      ? "warning"
      : laborTime.status === "COMPLETED"
      ? "info"
      : "danger";

  const std = laborTime.standardMinutes;
  const real = Math.floor(elapsedMs / 60_000);
  const efficiency =
    std && std > 0 && laborTime.status === "COMPLETED"
      ? ((std / Math.max(1, real)) * 100).toFixed(0)
      : null;

  return (
    <div className="surface-100 p-3 border-round">
      <Toast ref={toast} />
      <div className="flex justify-content-between align-items-center mb-3">
        <div>
          <div className="text-sm text-color-secondary">
            {laborTime.operation?.name ?? "Operación"}
          </div>
          <Tag value={laborTime.status} severity={statusSeverity as any} />
        </div>
        <div
          className="font-bold text-4xl"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {hh}:{mm}:{ss}
        </div>
      </div>

      {std !== null && (
        <div className="text-sm text-color-secondary mb-2">
          Estándar: {std} min · Real: {real} min
          {efficiency && <> · Eficiencia: <strong>{efficiency}%</strong></>}
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {laborTime.status === "ACTIVE" && (
          <>
            <Button
              icon="pi pi-pause"
              label="Pausar"
              size="small"
              severity="warning"
              onClick={() => wrap(() => laborTimeService.pause(laborTime.id), "Pausado")}
            />
            <Button
              icon="pi pi-check"
              label="Finalizar"
              size="small"
              severity="success"
              onClick={() =>
                wrap(() => laborTimeService.finish(laborTime.id), "Finalizado")
              }
            />
          </>
        )}
        {laborTime.status === "PAUSED" && (
          <>
            <Button
              icon="pi pi-play"
              label="Reanudar"
              size="small"
              severity="success"
              onClick={() => wrap(() => laborTimeService.resume(laborTime.id), "Reanudado")}
            />
            <Button
              icon="pi pi-check"
              label="Finalizar"
              size="small"
              outlined
              onClick={() =>
                wrap(() => laborTimeService.finish(laborTime.id), "Finalizado")
              }
            />
          </>
        )}
        {(laborTime.status === "ACTIVE" || laborTime.status === "PAUSED") && (
          <Button
            icon="pi pi-times"
            label="Cancelar"
            size="small"
            severity="danger"
            text
            onClick={() => wrap(() => laborTimeService.cancel(laborTime.id), "Cancelado")}
          />
        )}
      </div>
    </div>
  );
}
