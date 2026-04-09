"use client";
import { Tag } from "primereact/tag";
import type { GaritaEventStatus, GaritaEventType } from "@/libs/interfaces/workshop";

type TagSeverity = "info" | "success" | "warning" | "danger" | "secondary" | "contrast" | undefined;

export const GARITA_STATUS_LABELS: Record<GaritaEventStatus, string> = {
  PENDING:    "Pendiente",
  AUTHORIZED: "Autorizado",
  COMPLETED:  "Completado",
  FLAGGED:    "Irregularidad",
  CANCELLED:  "Cancelado",
};

export const GARITA_STATUS_SEVERITY: Record<GaritaEventStatus, TagSeverity> = {
  PENDING:    "warning",
  AUTHORIZED: "info",
  COMPLETED:  "success",
  FLAGGED:    "danger",
  CANCELLED:  "secondary",
};

export const GARITA_TYPE_LABELS: Record<GaritaEventType, string> = {
  VEHICLE_IN:    "Ingreso vehículo",
  VEHICLE_OUT:   "Egreso vehículo",
  PART_OUT:      "Salida pieza",
  PART_IN:       "Reingreso pieza",
  ROAD_TEST_OUT: "Prueba carretera (salida)",
  ROAD_TEST_IN:  "Prueba carretera (regreso)",
  OTHER:         "Otro",
};

export const GARITA_TYPE_ICON: Record<GaritaEventType, string> = {
  VEHICLE_IN:    "pi pi-sign-in",
  VEHICLE_OUT:   "pi pi-sign-out",
  PART_OUT:      "pi pi-send",
  PART_IN:       "pi pi-download",
  ROAD_TEST_OUT: "pi pi-car",
  ROAD_TEST_IN:  "pi pi-car",
  OTHER:         "pi pi-ellipsis-h",
};

export const GARITA_VALID_TRANSITIONS: Record<GaritaEventStatus, GaritaEventStatus[]> = {
  PENDING:    ["AUTHORIZED", "FLAGGED", "CANCELLED"],
  AUTHORIZED: ["COMPLETED", "FLAGGED", "CANCELLED"],
  COMPLETED:  [],
  FLAGGED:    ["AUTHORIZED", "CANCELLED"],
  CANCELLED:  [],
};

interface Props {
  status: GaritaEventStatus;
}

export default function GaritaStatusBadge({ status }: Props) {
  return (
    <Tag
      value={GARITA_STATUS_LABELS[status]}
      severity={GARITA_STATUS_SEVERITY[status]}
      rounded
    />
  );
}
