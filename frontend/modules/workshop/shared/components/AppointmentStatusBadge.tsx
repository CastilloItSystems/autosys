"use client";
import React from "react";
import { Tag } from "primereact/tag";
import type { AppointmentStatus } from '@/modules/workshop/appointments/interfaces/appointment.interface';;

type TagSeverity = "info" | "success" | "warning" | "danger" | "secondary" | "contrast" | undefined;

export const APPT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  SCHEDULED: "Programada",
  CONFIRMED: "Confirmada",
  ARRIVED: "Llegó",
  COMPLETED: "Completada",
  NO_SHOW: "No se presentó",
  CANCELLED: "Cancelada",
  RESCHEDULED: "Reprogramada",
  WAITING: "En espera",
};

export const APPT_STATUS_SEVERITY: Record<AppointmentStatus, TagSeverity> = {
  SCHEDULED: "info",
  CONFIRMED: "success",
  ARRIVED: "warning",
  COMPLETED: "success",
  NO_SHOW: "danger",
  CANCELLED: "secondary",
  RESCHEDULED: "info",
  WAITING: "warning",
};

interface AppointmentStatusBadgeProps {
  status: AppointmentStatus;
  rounded?: boolean;
}

export function AppointmentStatusBadge({ status, rounded = true }: AppointmentStatusBadgeProps) {
  return (
    <Tag
      value={APPT_STATUS_LABELS[status] ?? status}
      severity={APPT_STATUS_SEVERITY[status]}
      rounded={rounded}
    />
  );
}

export const APPT_STATUS_OPTIONS = (Object.keys(APPT_STATUS_LABELS) as AppointmentStatus[]).map((v) => ({
  label: APPT_STATUS_LABELS[v],
  value: v,
}));

export default AppointmentStatusBadge;
